from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from accounts.models import User
from certificates.models import Certificate
from competition.models import Asset, Challenge


class Command(BaseCommand):
    help = "Add synthetic media and certificate records for browser tests only."

    def handle(self, *args, **options):
        if not settings.DEBUG:
            raise CommandError("Browser fixtures are development-only.")
        challenge = Challenge.objects.get(no=0)
        transcript, _ = Asset.objects.get_or_create(
            challenge=challenge,
            name="Signal transcript",
            defaults={
                "type": "srt",
                "url": "https://media.example.test/clue.srt",
                "downloadable": True,
            },
        )
        Asset.objects.get_or_create(
            challenge=challenge,
            name="Practice signal",
            defaults={
                "type": "audio",
                "url": "https://media.example.test/clue.wav",
                "downloadable": False,
                "transcript": transcript,
            },
        )
        Certificate.objects.get_or_create(
            id="00000000-0000-4000-8000-000000000001",
            defaults={
                "team": User.objects.get(email="team3@example.test"),
                "team_name": "Practice Team 3",
                "event_name": "TechHunt Practice Certificate",
                "rank": 1,
                "score": 0,
            },
        )
