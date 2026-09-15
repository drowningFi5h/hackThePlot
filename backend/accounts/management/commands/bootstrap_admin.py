import os

from django.core.management.base import BaseCommand, CommandError

from accounts.models import User


class Command(BaseCommand):
    help = "Create the initial organizer once; never reset an existing account."

    def handle(self, *args, **options):
        email = os.environ.get("BOOTSTRAP_ADMIN_EMAIL")
        password = os.environ.get("BOOTSTRAP_ADMIN_PASSWORD")
        if not email and not password:
            return
        if not email or not password or len(password) < 16:
            raise CommandError(
                "Bootstrap requires an email and a password of at least 16 characters."
            )
        if not User.objects.filter(email=email.lower()).exists():
            User.objects.create_superuser(email, password, username="TechHunt Organizer")
            self.stdout.write(
                "Organizer created. Remove bootstrap credentials from the environment."
            )
