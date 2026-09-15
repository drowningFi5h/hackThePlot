from datetime import timedelta

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from competition.models import Asset, Challenge, Event


class Command(BaseCommand):
    help = "Initialize a fresh portfolio demo once. Does not create public staff credentials."

    @transaction.atomic
    def handle(self, *args, **options):
        if not settings.DEMO_MODE:
            raise CommandError("Set DEMO_MODE=1 only on a dedicated demo database.")
        Event.objects.select_for_update().get(pk=1)
        if Challenge.objects.exists():
            self.stdout.write("Existing challenges preserved.")
            return
        Event.objects.filter(pk=1).update(
            name="TechHunt Â· Portfolio Demo",
            starts_at=timezone.now() - timedelta(minutes=1),
            ends_at=timezone.now() + timedelta(days=14),
        )
        for no, title, question, flag, score in [
            (
                0,
                "A letter on the desk",
                "A folded note reads: Every story starts somewhere.\n\nThis practice flag is flag{first_clue}. Submit it below to unlock the next chapter.",
                "flag{first_clue}",
                100,
            ),
            (
                2,
                "The encoded message",
                "The next note is encoded in Base64:\n\nZmxhZ3tmb2xsb3dfdGhlX3RyYWlsfQ==\n\nDecode the message to reveal the flag.",
                "flag{follow_the_trail}",
                200,
            ),
            (
                7,
                "The final reveal",
                "The last clue is written backwards:\n\n}laever_lanif{galf\n\nReverse it to finish this practice hunt.",
                "flag{final_reveal}",
                300,
            ),
        ]:
            challenge = Challenge(no=no, title=title, question=question, score=score)
            challenge.set_flag(flag)
            challenge.save()
        first = Challenge.objects.get(no=0)
        base = settings.FRONTEND_URL
        if base.startswith("https://"):
            transcript = Asset.objects.create(
                challenge=first,
                name="Signal transcript",
                type="srt",
                url=base + "/demo/clue.srt",
                downloadable=True,
            )
            Asset.objects.create(
                challenge=first,
                name="Practice signal",
                type="audio",
                url=base + "/demo/clue.wav",
                downloadable=False,
                transcript=transcript,
            )
        self.stdout.write("Portfolio practice challenges created; guest entry is enabled.")
