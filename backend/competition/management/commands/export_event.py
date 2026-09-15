import json

from django.core.management.base import BaseCommand

from certificates.models import Certificate
from certificates.serializers import CertificateOutput
from competition.services import leaderboard


class Command(BaseCommand):
    help = "Write final standings and certificate records to stdout (no flags or passwords)."

    def handle(self, *args, **options):
        certificates = [
            {
                **CertificateOutput(c).data,
                "revoked_at": c.revoked_at.isoformat() if c.revoked_at else None,
            }
            for c in Certificate.objects.all()
        ]
        self.stdout.write(
            json.dumps({"standings": leaderboard(), "certificates": certificates}, indent=2)
        )
