from django.conf import settings
from django.shortcuts import get_object_or_404
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.security import limit

from .models import Challenge, Event, Submission
from .serializers import ChallengeOutput, EventOutput, LeaderboardOutput, SubmitInput, SubmitOutput
from .services import can_access, leaderboard, next_challenge, require_live, submit


def challenge_data(challenge, solved, unlocked):
    return {
        "id": str(challenge.id),
        "no": challenge.no,
        "title": challenge.title,
        "question": challenge.question if unlocked else "",
        "score": challenge.score,
        "solved": solved,
        "unlocked": unlocked,
        "assets": [
            {
                "id": str(a.id),
                "name": a.name,
                "type": a.type,
                "url": a.url,
                "downloadable": a.downloadable,
                "transcript_url": a.transcript.url if a.transcript else None,
            }
            for a in challenge.assets.all()
        ]
        if unlocked
        else [],
    }


class EventView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(responses=EventOutput)
    def get(self, request):
        event = Event.objects.get(pk=1)
        return Response(
            {
                "name": event.name,
                "demo_mode": settings.DEMO_MODE,
                "starts_at": event.starts_at,
                "ends_at": event.ends_at,
                "status": event.status,
                "server_time": timezone.now(),
            }
        )


class ChallengesView(APIView):
    @extend_schema(responses=ChallengeOutput(many=True))
    def get(self, request):
        if not request.user.is_staff:
            require_live()
        solved = set(
            Submission.objects.filter(team=request.user).values_list("challenge_id", flat=True)
        )
        current = next_challenge(request.user)
        challenges = Challenge.objects.prefetch_related("assets__transcript")
        return Response(
            [
                challenge_data(
                    c, c.id in solved, request.user.is_staff or c.id in solved or c == current
                )
                for c in challenges
            ]
        )


class ChallengeView(APIView):
    @extend_schema(responses=ChallengeOutput)
    def get(self, request, no):
        challenge = get_object_or_404(
            Challenge.objects.prefetch_related("assets__transcript"), no=no
        )
        if not can_access(request.user, challenge):
            raise PermissionDenied("Solve the current challenge first.")
        return Response(
            challenge_data(
                challenge,
                Submission.objects.filter(team=request.user, challenge=challenge).exists(),
                True,
            )
        )


class SubmitView(APIView):
    @extend_schema(request=SubmitInput, responses=SubmitOutput)
    def post(self, request, challenge_id):
        limit("submit", request.user.pk, 20)
        data = SubmitInput(data=request.data)
        data.is_valid(raise_exception=True)
        get_object_or_404(Challenge, pk=challenge_id)
        return Response(submit(request.user, challenge_id, data.validated_data["flag"]))


class LeaderboardView(APIView):
    @extend_schema(responses=LeaderboardOutput)
    def get(self, request):
        return Response(leaderboard())
