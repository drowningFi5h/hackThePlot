import os
from datetime import timedelta

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from accounts.models import User
from competition.models import Challenge, Event, Submission


class Command(BaseCommand):
    help = "Seed clearly marked synthetic data into a development database only."

    def add_arguments(self, parser):
        parser.add_argument("--teams", type=int, default=3)

    @transaction.atomic
    def handle(self, *args, **options):
        if not settings.DEBUG:
            raise CommandError("Demo data is forbidden when DEBUG is false.")
        if Submission.objects.exists():
            raise CommandError("Refusing to change a database containing submissions.")
        password = os.environ.get("DEMO_PASSWORD", "Demo-only-password-2026!")
        Event.objects.update_or_create(
            pk=1,
            defaults={
                "name": "TechHunt · Practice",
                "starts_at": timezone.now() - timedelta(hours=1),
                "ends_at": timezone.now() + timedelta(days=14),
            },
        )
        for no, title, text, score in [
            (0, "The first clue", "A practice flag: flag{first_clue}", 100),
            (2, "Follow the trail", "A practice flag: flag{follow_the_trail}", 200),
            (7, "The final reveal", "A practice flag: flag{final_reveal}", 300),
        ]:
            challenge, _ = Challenge.objects.get_or_create(
                no=no, defaults={"title": title, "question": text, "score": score}
            )
            challenge.set_flag(
                ["flag{first_clue}", "flag{follow_the_trail}", "flag{final_reveal}"][
                    [0, 2, 7].index(no)
                ]
            )
            challenge.save()
        for n in range(1, options["teams"] + 1):
            email = f"team{n}@example.test"
            if not User.objects.filter(email=email).exists():
                User.objects.create_user(email, password, username=f"Practice Team {n}")
        if not User.objects.filter(email="organizer@example.test").exists():
            User.objects.create_superuser(
                "organizer@example.test", password, username="Practice Organizer"
            )
        self.stdout.write(
            f"Seeded {options['teams']} practice teams. See README for development credentials."
        )
