import logging
from collections import Counter
from decimal import Decimal, localcontext

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError

from accounts.models import User

from .models import Challenge, Event, Submission


def require_live():
    if Event.objects.get(pk=1).status != "live":
        raise PermissionDenied("Challenges are available only while the event is live.")


def next_challenge(team):
    solved = Submission.objects.filter(team=team).values_list("challenge_id", flat=True)
    return Challenge.objects.exclude(pk__in=solved).first()


def can_access(team, challenge):
    if team.is_staff:
        return True
    require_live()
    return (
        Submission.objects.filter(team=team, challenge=challenge).exists()
        or next_challenge(team) == challenge
    )


def submit(team, challenge_id, flag):
    if team.is_staff:
        raise PermissionDenied("Staff accounts do not compete.")
    with transaction.atomic():
        # Consistent lock order: team, then challenge. Challenge lock serializes solve ranks.
        team = User.objects.select_for_update().get(pk=team.pk)
        challenge = Challenge.objects.select_for_update().get(pk=challenge_id)
        require_live()
        if Submission.objects.filter(team=team, challenge=challenge).exists():
            return {"detail": "Already solved.", "already_solved": True}
        if next_challenge(team) != challenge:
            raise PermissionDenied("Solve the current challenge first.")
        if not challenge.matches(flag):
            raise ValidationError({"detail": "Wrong flag. Try again."})
        # Check the deadline again before recording the solve.
        require_live()
        position = Submission.objects.filter(challenge=challenge).count() + 1
        Submission.objects.create(team=team, challenge=challenge, position=position)
    logging.getLogger("audit").info(
        "solve team=%s challenge=%s position=%s", team.pk, challenge.pk, position
    )
    return {"detail": "Correct flag!", "already_solved": False}


def leaderboard():
    teams = list(User.objects.filter(is_staff=False, is_active=True).order_by("id"))
    # Retain ranks and solver counts even if an account is deactivated later.
    submissions = list(Submission.objects.select_related("challenge").order_by("time", "id"))
    counts = Counter(s.challenge_id for s in submissions)
    with localcontext() as ctx:
        ctx.prec = 32
        harmonic = {
            key: sum((Decimal(1) / i for i in range(1, n + 1)), Decimal(0))
            for key, n in counts.items()
        }
        totals = {t.id: Decimal(0) for t in teams}
        solves = Counter()
        last = {}
        points = {t.id: [] for t in teams}
        for solve in submissions:
            if solve.team_id not in totals:
                continue
            value = Decimal(solve.challenge.score) / (
                Decimal(solve.position) * harmonic[solve.challenge_id]
            )
            totals[solve.team_id] += value
            solves[solve.team_id] += 1
            last[solve.team_id] = solve.time
            points[solve.team_id].append(
                {"time": solve.time.isoformat(), "score": float(totals[solve.team_id])}
            )
        far_future = timezone.datetime.max.replace(tzinfo=timezone.get_current_timezone())
        teams.sort(key=lambda t: (-totals[t.id], last.get(t.id, far_future), str(t.id)))
        return {
            "teams": [
                {
                    "id": str(t.id),
                    "username": t.username,
                    "rank": rank,
                    "score": float(totals[t.id]),
                    "solved": solves[t.id],
                }
                for rank, t in enumerate(teams, 1)
            ],
            "series": [
                {"id": str(t.id), "name": t.username, "points": points[t.id]} for t in teams[:10]
            ],
            "generated_at": timezone.now().isoformat(),
        }
