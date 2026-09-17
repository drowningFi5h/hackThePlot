from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from competition.models import Challenge, Event

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


class ApiTestCase(TestCase):
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
