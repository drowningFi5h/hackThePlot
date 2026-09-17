from django.test import TestCase


class HealthTests(TestCase):
    def test_health(self):
        self.assertEqual(self.client.get("/health/ready/").status_code, 200)
        self.assertEqual(self.client.get("/health/live/").status_code, 200)
