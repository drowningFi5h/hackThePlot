from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta
from threading import Barrier

from django.contrib.auth import get_user_model
from django.db import close_old_connections, connections
from django.test import TestCase, TransactionTestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import RateBucket
from certificates.models import Certificate
from certificates.views import token_for

from .models import Asset, Challenge, Event, Submission
from .services import leaderboard, submit

User = get_user_model()


def setup_event():
    Event.objects.update_or_create(
        pk=1,
        defaults={
            "starts_at": timezone.now() - timedelta(hours=1),
            "ends_at": timezone.now() + timedelta(hours=1),
        },
    )
    first = Challenge.objects.create(no=0, title="First", question="Private prompt", score=100)
    first.set_flag(" flag{exact} ")
    first.save()
    second = Challenge.objects.create(
        no=7, title="Last", question="Secret second prompt", score=300
    )
    second.set_flag("flag{last}")
    second.save()
    return first, second


class ApiTests(TestCase):
    def setUp(self):
        self.first, self.second = setup_event()
        self.team = User.objects.create_user(
            "team@example.test", "Strong-pass-123!", username="Team"
        )
        self.other = User.objects.create_user(
            "other@example.test", "Strong-pass-123!", username="Other"
        )
        self.admin = User.objects.create_superuser(
            "admin@example.test", "Strong-pass-123!", username="Organizer"
        )
        self.client = APIClient(enforce_csrf_checks=True)

    def signed_in(self, user=None):
        self.client.force_login(user or self.team)
        token = self.client.get("/api/v1/auth/csrf/").json()["csrfToken"]
        self.client.credentials(HTTP_X_CSRFTOKEN=token)

    def post_flag(self, challenge, flag):
        return self.client.post(
            f"/api/v1/challenges/{challenge.pk}/submit/", {"flag": flag}, format="json"
        )

    def test_csrf_and_login_and_logout(self):
        payload = {"email": "team@example.test", "password": "Strong-pass-123!"}
        self.assertEqual(self.client.post("/api/v1/auth/login/", payload).status_code, 403)
        csrf = self.client.get("/api/v1/auth/csrf/").json()["csrfToken"]
        self.assertEqual(
            self.client.post("/api/v1/auth/login/", payload, HTTP_X_CSRFTOKEN=csrf).status_code, 200
        )
        self.assertEqual(self.client.get("/api/v1/auth/me/").status_code, 200)
        csrf = self.client.get("/api/v1/auth/csrf/").json()["csrfToken"]
        self.assertEqual(
            self.client.post("/api/v1/auth/logout/", HTTP_X_CSRFTOKEN=csrf).status_code, 200
        )
        self.assertEqual(self.client.get("/api/v1/auth/me/").status_code, 403)

    def test_invalid_login_and_rate_limit(self):
        csrf = self.client.get("/api/v1/auth/csrf/").json()["csrfToken"]
        for _ in range(10):
            self.assertEqual(
                self.client.post(
                    "/api/v1/auth/login/",
                    {"email": "team@example.test", "password": "wrong"},
                    HTTP_X_CSRFTOKEN=csrf,
                ).status_code,
                400,
            )
        self.assertEqual(
            self.client.post(
                "/api/v1/auth/login/",
                {"email": "team@example.test", "password": "wrong"},
                HTTP_X_CSRFTOKEN=csrf,
            ).status_code,
            429,
        )

    def test_session_expiry(self):
        self.signed_in()
        session = self.client.session
        session.set_expiry(-1)
        session.save()
        self.assertEqual(self.client.get("/api/v1/auth/me/").status_code, 403)

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

    def test_import_preview_commit_and_explicit_reset(self):
        self.signed_in()
        url = "/api/v1/admin/teams/import/"
        payload = {"rows": [{"username": "Comma, Team", "email": "new@example.test"}]}
        self.assertEqual(self.client.post(url, payload, format="json").status_code, 403)
        self.signed_in(self.admin)
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertFalse(User.objects.filter(email="new@example.test").exists())
        payload["dry_run"] = False
        response = self.client.post(url, payload, format="json")
        password = response.json()["rows"][0]["password"]
        self.assertTrue(User.objects.get(email="new@example.test").check_password(password))
        self.assertNotIn(
            "password", self.client.post(url, payload, format="json").json()["rows"][0]
        )
        payload["reset_existing"] = True
        self.assertNotEqual(
            self.client.post(url, payload, format="json").json()["rows"][0]["password"], password
        )

    def test_import_errors_do_not_partially_create(self):
        self.signed_in(self.admin)
        url = "/api/v1/admin/teams/import/"
        payload = {
            "dry_run": False,
            "rows": [
                {"username": "New", "email": "new@example.test"},
                {"username": "Admin", "email": self.admin.email},
            ],
        }
        self.assertEqual(self.client.post(url, payload, format="json").status_code, 400)
        self.assertFalse(User.objects.filter(email="new@example.test").exists())
        payload["rows"] = [
            {"username": "A", "email": "same@example.test"},
            {"username": "B", "email": "SAME@example.test"},
        ]
        self.assertEqual(self.client.post(url, payload, format="json").status_code, 400)
        payload["rows"] = [{"username": "A", "email": "invalid"}]
        self.assertEqual(self.client.post(url, payload, format="json").status_code, 400)

    def test_certificate_access_tampering_revocation_and_not_a_session(self):
        self.signed_in()
        url = "/api/v1/admin/certificates/"
        self.assertEqual(
            self.client.post(url, {"team_id": str(self.team.pk)}, format="json").status_code, 403
        )
        self.signed_in(self.admin)
        self.assertEqual(
            self.client.post(url, {"team_id": str(self.team.pk)}, format="json").status_code, 400
        )
        Event.objects.filter(pk=1).update(ends_at=timezone.now() - timedelta(seconds=1))
        response = self.client.post(url, {"team_id": str(self.team.pk)}, format="json")
        self.assertEqual(response.status_code, 200)
        certificate = Certificate.objects.get(team=self.team)
        token = token_for(certificate)
        anonymous = APIClient()
        self.assertEqual(anonymous.get(f"/api/v1/certificates/{token}/").status_code, 200)
        self.assertEqual(anonymous.get(f"/api/v1/certificates/{token}x/").status_code, 404)
        anonymous.cookies["sessionid"] = token
        self.assertEqual(anonymous.get("/api/v1/auth/me/").status_code, 403)
        self.assertEqual(
            self.client.post(f"/api/v1/admin/certificates/{certificate.pk}/revoke/").status_code,
            200,
        )
        self.assertEqual(anonymous.get(f"/api/v1/certificates/{token}/").status_code, 404)

    def test_health(self):
        self.assertEqual(self.client.get("/health/ready/").status_code, 200)
        self.assertEqual(self.client.get("/health/live/").status_code, 200)


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


class DemoTests(TestCase):
    def setUp(self):
        setup_event()
        self.client = APIClient(enforce_csrf_checks=True)

    def test_demo_disabled_by_default(self):
        token = self.client.get("/api/v1/auth/csrf/").json()["csrfToken"]
        self.assertEqual(
            self.client.post("/api/v1/auth/demo/", HTTP_X_CSRFTOKEN=token).status_code, 404
        )

    @override_settings(DEMO_MODE=True)
    def test_demo_guest_is_private_and_not_staff(self):
        self.assertEqual(self.client.post("/api/v1/auth/demo/").status_code, 403)
        token = self.client.get("/api/v1/auth/csrf/").json()["csrfToken"]
        response = self.client.post("/api/v1/auth/demo/", HTTP_X_CSRFTOKEN=token)
        self.assertEqual(response.status_code, 200)
        user = User.objects.get(pk=response.json()["id"])
        self.assertFalse(user.is_staff)
        self.assertFalse(user.has_usable_password())
        self.assertTrue(user.email.endswith("@demo.invalid"))
        token = self.client.get("/api/v1/auth/csrf/").json()["csrfToken"]
        again = self.client.post("/api/v1/auth/demo/", HTTP_X_CSRFTOKEN=token)
        self.assertEqual(again.json()["id"], str(user.pk))
