from django.contrib import admin
from django.db import connection
from django.http import JsonResponse
from django.urls import path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from accounts.demo import DemoView
from accounts.views import CsrfView, ImportView, LoginView, LogoutView, MeView
from certificates.views import IssueView, RevokeView, VerifyView
from competition.views import ChallengesView, ChallengeView, EventView, LeaderboardView, SubmitView


def live(request):
    return JsonResponse({"status": "ok"})


def ready(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1 FROM competition_event WHERE id=1")
            if cursor.fetchone() is None:
                raise RuntimeError("Missing event")
        return JsonResponse({"status": "ready"})
    except Exception:
        return JsonResponse({"status": "unavailable"}, status=503)


urlpatterns = [
    path("api/v1/auth/demo/", DemoView.as_view()),
    path("admin/", admin.site.urls),
    path("health/live/", live),
    path("health/ready/", ready),
    path("api/v1/auth/csrf/", CsrfView.as_view()),
    path("api/v1/auth/login/", LoginView.as_view()),
    path("api/v1/auth/logout/", LogoutView.as_view()),
    path("api/v1/auth/me/", MeView.as_view()),
    path("api/v1/event/", EventView.as_view()),
    path("api/v1/challenges/", ChallengesView.as_view()),
    path("api/v1/challenges/<int:no>/", ChallengeView.as_view()),
    path("api/v1/challenges/<uuid:challenge_id>/submit/", SubmitView.as_view()),
    path("api/v1/leaderboard/", LeaderboardView.as_view()),
    path("api/v1/admin/teams/import/", ImportView.as_view()),
    path("api/v1/admin/certificates/", IssueView.as_view()),
    path("api/v1/admin/certificates/<uuid:certificate_id>/revoke/", RevokeView.as_view()),
    path("api/v1/certificates/<str:token>/", VerifyView.as_view()),
    path("api/schema/", SpectacularAPIView.as_view()),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="docs"),
]
urlpatterns[-2].name = "schema"
