from datetime import timedelta

from django.utils import timezone
from rest_framework.test import APIClient

from certificates.models import Certificate
from certificates.views import token_for
from competition.models import Event
from test_support import ApiTestCase


class CertificateTests(ApiTestCase):
    def test_certificate_access_tampering_revocation_and_not_a_session(self):
        self.signed_in()
        url = "/api/v1/admin/certificates/"
        self.assertEqual(
            self.client.post(url, {"team_id": str(self.team.pk)}, format="json").status_code, 403
        )
        self.signed_in(self.admin)
        self.assertEqual(
            self.client.post(url, {"team_id": str(self.team.pk)}, format="json").status_code, 400
        )
        Event.objects.filter(pk=1).update(ends_at=timezone.now() - timedelta(seconds=1))
        response = self.client.post(url, {"team_id": str(self.team.pk)}, format="json")
        self.assertEqual(response.status_code, 200)
        certificate = Certificate.objects.get(team=self.team)
        token = token_for(certificate)
        anonymous = APIClient()
        self.assertEqual(anonymous.get(f"/api/v1/certificates/{token}/").status_code, 200)
        self.assertEqual(anonymous.get(f"/api/v1/certificates/{token}x/").status_code, 404)
        anonymous.cookies["sessionid"] = token
        self.assertEqual(anonymous.get("/api/v1/auth/me/").status_code, 403)
        self.assertEqual(
            self.client.post(f"/api/v1/admin/certificates/{certificate.pk}/revoke/").status_code,
            200,
        )
        self.assertEqual(anonymous.get(f"/api/v1/certificates/{token}/").status_code, 404)
