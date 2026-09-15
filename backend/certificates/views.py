import logging

from django.conf import settings
from django.core import signing
from django.shortcuts import get_object_or_404
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from accounts.serializers import DetailOutput
from competition.models import Event
from competition.services import leaderboard

from .models import Certificate
from .serializers import CertificateOutput, IssueInput, IssueOutput


def token_for(certificate):
    return signing.Signer(
        key=settings.CERTIFICATE_SIGNING_KEY, salt="techhunt.certificate.v1", fallback_keys=[]
    ).sign(str(certificate.pk))


class IssueView(APIView):
    permission_classes = [IsAdminUser]

    @extend_schema(request=IssueInput, responses=IssueOutput)
    def post(self, request):
        data = IssueInput(data=request.data)
        data.is_valid(raise_exception=True)
        event = Event.objects.get(pk=1)
        if event.status != "ended":
            raise ValidationError("Certificates can be issued after the event ends.")
        team = get_object_or_404(
            User, pk=data.validated_data["team_id"], is_staff=False, is_active=True
        )
        row = next(row for row in leaderboard()["teams"] if row["id"] == str(team.pk))
        certificate, _ = Certificate.objects.get_or_create(
            team=team,
            defaults={
                "team_name": team.username,
                "event_name": event.name,
                "rank": row["rank"],
                "score": row["score"],
            },
        )
        if certificate.revoked_at:
            raise ValidationError("This certificate has been revoked.")
        logging.getLogger("audit").info(
            "certificate_issue actor=%s certificate=%s", request.user.pk, certificate.pk
        )
        return Response(
            {
                "url": f"{settings.FRONTEND_URL}/certificate/{token_for(certificate)}",
                "certificate": CertificateOutput(certificate).data,
            }
        )


class VerifyView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(responses=CertificateOutput)
    def get(self, request, token):
        try:
            certificate_id = signing.Signer(
                key=settings.CERTIFICATE_SIGNING_KEY,
                salt="techhunt.certificate.v1",
                fallback_keys=[],
            ).unsign(token)
            certificate = Certificate.objects.get(pk=certificate_id, revoked_at__isnull=True)
        except (signing.BadSignature, Certificate.DoesNotExist, ValueError):
            raise NotFound("Invalid or revoked certificate.") from None
        return Response(CertificateOutput(certificate).data)


class RevokeView(APIView):
    permission_classes = [IsAdminUser]

    @extend_schema(request=None, responses=DetailOutput)
    def post(self, request, certificate_id):
        certificate = get_object_or_404(Certificate, pk=certificate_id)
        certificate.revoked_at = timezone.now()
        certificate.save(update_fields=["revoked_at"])
        logging.getLogger("audit").info(
            "certificate_revoke actor=%s certificate=%s", request.user.pk, certificate.pk
        )
        return Response({"detail": "Certificate revoked."})
