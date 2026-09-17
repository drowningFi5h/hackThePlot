from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta
from threading import Barrier

from django.db import close_old_connections, connections
from django.test import TransactionTestCase
from django.utils import timezone

from accounts.models import RateBucket
from competition.models import Asset, Event, Submission
from competition.services import leaderboard, submit
from test_support import ApiTestCase, User, setup_event


class CompetitionTests(ApiTestCase):
    def test_exact_flags_gap_progress_and_idempotency(self):
        self.signed_in()
        self.assertEqual(self.post_flag(self.second, "flag{last}").status_code, 403)
        self.assertEqual(self.post_flag(self.first, "flag{exact}").status_code, 400)
        self.assertEqual(self.post_flag(self.first, " flag{exact} ").status_code, 200)
        self.assertTrue(self.post_flag(self.first, " flag{exact} ").json()["already_solved"])
        self.assertEqual(self.post_flag(self.second, "flag{last}").status_code, 200)
        self.assertEqual(Submission.objects.filter(team=self.team).count(), 2)
        self.assertTrue(all(q["solved"] for q in self.client.get("/api/v1/challenges/").json()))

    def test_asset_and_sensitive_data_isolation(self):
        Asset.objects.create(
            challenge=self.second, name="Hidden", url="https://example.com/private.zip", type="zip"
        )
        self.signed_in()
        rows = self.client.get("/api/v1/challenges/").json()
        self.assertEqual(rows[1]["assets"], [])
        self.assertEqual(rows[1]["question"], "")
        self.assertNotIn("flag", rows[0])
        self.assertNotIn("flag_hash", rows[0])
        self.assertEqual(self.client.get("/api/v1/challenges/7/").status_code, 403)
        board = self.client.get("/api/v1/leaderboard/").json()
        self.assertNotIn("email", board["teams"][0])
        self.assertNotIn(str(self.admin.pk), [t["id"] for t in board["teams"]])

    def test_event_boundaries_and_staff_preview(self):
        event = Event.objects.get(pk=1)
        event.starts_at = timezone.now() + timedelta(minutes=10)
        event.save()
        self.signed_in()
        self.assertEqual(self.client.get("/api/v1/challenges/").status_code, 403)
        self.assertEqual(self.post_flag(self.first, " flag{exact} ").status_code, 403)
        event.starts_at = timezone.now() - timedelta(hours=1)
        event.ends_at = timezone.now()
        event.save()
        self.assertEqual(self.post_flag(self.first, " flag{exact} ").status_code, 403)
        self.signed_in(self.admin)
        self.assertEqual(self.client.get("/api/v1/challenges/7/").status_code, 200)
        self.assertEqual(self.post_flag(self.first, " flag{exact} ").status_code, 403)

    def test_submission_rate_limit(self):
        self.signed_in()
        for _ in range(20):
            self.assertEqual(self.post_flag(self.first, "wrong").status_code, 400)
        self.assertEqual(self.post_flag(self.first, "wrong").status_code, 429)
        self.assertTrue(RateBucket.objects.exists())

    def test_harmonic_scoring_and_chart_final_points(self):
        submit(self.team, self.first.pk, " flag{exact} ")
        self.assertEqual(leaderboard()["teams"][0]["score"], 100)
        submit(self.other, self.first.pk, " flag{exact} ")
        board = leaderboard()
        self.assertAlmostEqual(board["teams"][0]["score"], 100 / 1.5)
        self.assertAlmostEqual(board["teams"][1]["score"], 100 / 3)
        for series in board["series"]:
            standing = next(t for t in board["teams"] if t["id"] == series["id"])
            self.assertAlmostEqual(series["points"][-1]["score"], standing["score"])

    def test_zero_score_ties_are_stable(self):
        ids = [t["id"] for t in leaderboard()["teams"]]
        self.assertEqual(ids, sorted(ids))


class ConcurrencyTests(TransactionTestCase):
    reset_sequences = True

    def setUp(self):
        self.first, _ = setup_event()

    def run_race(self, users):
        barrier = Barrier(len(users))

        def worker(user):
            close_old_connections()
            try:
                barrier.wait(timeout=10)
                return submit(user, self.first.pk, " flag{exact} ")
            finally:
                connections.close_all()

        with ThreadPoolExecutor(max_workers=len(users)) as pool:
            return list(pool.map(worker, users))

    def test_simultaneous_teams_get_unique_positions(self):
        teams = [
            User.objects.create_user(f"t{i}@example.test", "test", username=f"T{i}")
            for i in range(5)
        ]
        self.run_race(teams)
        self.assertEqual(
            sorted(Submission.objects.values_list("position", flat=True)), [1, 2, 3, 4, 5]
        )

    def test_simultaneous_retries_only_solve_once(self):
        team = User.objects.create_user("t@example.test", "test", username="T")
        results = self.run_race([team] * 4)
        self.assertEqual(Submission.objects.count(), 1)
        self.assertEqual(sum(not r["already_solved"] for r in results), 1)
