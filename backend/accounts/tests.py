from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from test_support import ApiTestCase, User, setup_event


class AccountTests(ApiTestCase):
    def test_csrf_and_login_and_logout(self):
        payload = {"email": "team@example.test", "password": "Strong-pass-123!"}
        self.assertEqual(self.client.post("/api/v1/auth/login/", payload).status_code, 403)
        csrf = self.client.get("/api/v1/auth/csrf/").json()["csrfToken"]
        self.assertEqual(
            self.client.post("/api/v1/auth/login/", payload, HTTP_X_CSRFTOKEN=csrf).status_code, 200
        )
        self.assertEqual(self.client.get("/api/v1/auth/me/").status_code, 200)
        csrf = self.client.get("/api/v1/auth/csrf/").json()["csrfToken"]
        self.assertEqual(
            self.client.post("/api/v1/auth/logout/", HTTP_X_CSRFTOKEN=csrf).status_code, 200
        )
        self.assertEqual(self.client.get("/api/v1/auth/me/").status_code, 403)

    def test_invalid_login_and_rate_limit(self):
        csrf = self.client.get("/api/v1/auth/csrf/").json()["csrfToken"]
        for _ in range(10):
            self.assertEqual(
                self.client.post(
                    "/api/v1/auth/login/",
                    {"email": "team@example.test", "password": "wrong"},
                    HTTP_X_CSRFTOKEN=csrf,
                ).status_code,
                400,
            )
        self.assertEqual(
            self.client.post(
                "/api/v1/auth/login/",
                {"email": "team@example.test", "password": "wrong"},
                HTTP_X_CSRFTOKEN=csrf,
            ).status_code,
            429,
        )

    def test_session_expiry(self):
        self.signed_in()
        session = self.client.session
        session.set_expiry(-1)
        session.save()
        self.assertEqual(self.client.get("/api/v1/auth/me/").status_code, 403)

    def test_import_preview_commit_and_explicit_reset(self):
        self.signed_in()
        url = "/api/v1/admin/teams/import/"
        payload = {"rows": [{"username": "Comma, Team", "email": "new@example.test"}]}
        self.assertEqual(self.client.post(url, payload, format="json").status_code, 403)
        self.signed_in(self.admin)
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertFalse(User.objects.filter(email="new@example.test").exists())
        payload["dry_run"] = False
        response = self.client.post(url, payload, format="json")
        password = response.json()["rows"][0]["password"]
        self.assertTrue(User.objects.get(email="new@example.test").check_password(password))
        self.assertNotIn(
            "password", self.client.post(url, payload, format="json").json()["rows"][0]
        )
        payload["reset_existing"] = True
        self.assertNotEqual(
            self.client.post(url, payload, format="json").json()["rows"][0]["password"], password
        )

    def test_import_errors_do_not_partially_create(self):
        self.signed_in(self.admin)
        url = "/api/v1/admin/teams/import/"
        payload = {
            "dry_run": False,
            "rows": [
                {"username": "New", "email": "new@example.test"},
                {"username": "Admin", "email": self.admin.email},
            ],
        }
        self.assertEqual(self.client.post(url, payload, format="json").status_code, 400)
        self.assertFalse(User.objects.filter(email="new@example.test").exists())
        payload["rows"] = [
            {"username": "A", "email": "same@example.test"},
            {"username": "B", "email": "SAME@example.test"},
        ]
        self.assertEqual(self.client.post(url, payload, format="json").status_code, 400)
        payload["rows"] = [{"username": "A", "email": "invalid"}]
        self.assertEqual(self.client.post(url, payload, format="json").status_code, 400)


class DemoTests(TestCase):
    def setUp(self):
        setup_event()
        self.client = APIClient(enforce_csrf_checks=True)

    def test_demo_disabled_by_default(self):
        token = self.client.get("/api/v1/auth/csrf/").json()["csrfToken"]
        self.assertEqual(
            self.client.post("/api/v1/auth/demo/", HTTP_X_CSRFTOKEN=token).status_code, 404
        )

    @override_settings(DEMO_MODE=True)
    def test_demo_guest_is_private_and_not_staff(self):
        self.assertEqual(self.client.post("/api/v1/auth/demo/").status_code, 403)
        token = self.client.get("/api/v1/auth/csrf/").json()["csrfToken"]
        response = self.client.post("/api/v1/auth/demo/", HTTP_X_CSRFTOKEN=token)
        self.assertEqual(response.status_code, 200)
        user = User.objects.get(pk=response.json()["id"])
        self.assertFalse(user.is_staff)
        self.assertFalse(user.has_usable_password())
        self.assertTrue(user.email.endswith("@demo.invalid"))
        token = self.client.get("/api/v1/auth/csrf/").json()["csrfToken"]
        again = self.client.post("/api/v1/auth/demo/", HTTP_X_CSRFTOKEN=token)
        self.assertEqual(again.json()["id"], str(user.pk))
