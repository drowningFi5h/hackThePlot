import logging
import secrets

from django.contrib.auth import authenticate, login, logout
from django.db import transaction
from django.middleware.csrf import get_token
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect
from drf_spectacular.utils import extend_schema
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import User
from .security import limit
from .serializers import (
    AccountOutput,
    CsrfOutput,
    DetailOutput,
    ImportInput,
    ImportOutput,
    LoginInput,
)


def account(user):
    return {
        "id": str(user.id),
        "username": user.username,
        "email": user.email,
        "role": "admin" if user.is_staff else "participant",
    }


class CsrfView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(responses=CsrfOutput)
    def get(self, request):
        return Response({"csrfToken": get_token(request)})


@method_decorator(csrf_protect, name="dispatch")
class LoginView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(request=LoginInput, responses=AccountOutput)
    def post(self, request):
        data = LoginInput(data=request.data)
        data.is_valid(raise_exception=True)
        email = data.validated_data["email"].lower()
        limit("login", email, 10, 300)
        limit("login-global", "all", 500, 60)
        user = authenticate(request, email=email, password=data.validated_data["password"])
        if not user:
            return Response({"detail": "Invalid email or password."}, status=400)
        login(request, user)
        logging.getLogger("audit").info("login user=%s", user.pk)
        return Response(account(user))


class LogoutView(APIView):
    @extend_schema(request=None, responses=DetailOutput)
    def post(self, request):
        logout(request)
        return Response({"detail": "Signed out."})


class MeView(APIView):
    @extend_schema(responses=AccountOutput)
    def get(self, request):
        return Response(account(request.user))


class ImportView(APIView):
    permission_classes = [IsAdminUser]

    @extend_schema(request=ImportInput, responses=ImportOutput)
    def post(self, request):
        serializer = ImportInput(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        output = []
        with transaction.atomic():
            # Serialize organizer imports without holding locks during preview.
            if not data["dry_run"]:
                from competition.models import Event

                Event.objects.select_for_update().get(pk=1)
            for row in data["rows"]:
                email = row["email"].lower()
                existing = User.objects.filter(email=email).first()
                if existing and existing.is_staff:
                    return Response({"detail": "Staff accounts cannot be imported."}, status=400)
            for row in data["rows"]:
                email = row["email"].lower()
                existing = User.objects.filter(email=email).first()
                action = (
                    "create"
                    if existing is None
                    else ("reset" if data["reset_existing"] else "unchanged")
                )
                result = {"email": email, "username": row["username"], "action": action}
                if not data["dry_run"] and action != "unchanged":
                    password = secrets.token_urlsafe(18)
                    if existing:
                        existing.set_password(password)
                        existing.save(update_fields=["password"])
                        # Existing sessions will also fail Django's session password-hash check.
                    else:
                        User.objects.create_user(email, password, username=row["username"])
                    result["password"] = password
                output.append(result)
        logging.getLogger("audit").info(
            "team_import actor=%s dry_run=%s count=%s",
            request.user.pk,
            data["dry_run"],
            len(output),
        )
        return Response({"dry_run": data["dry_run"], "rows": output})
