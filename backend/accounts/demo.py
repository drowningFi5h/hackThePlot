import secrets

from django.conf import settings
from django.contrib.auth import login
from django.db import transaction
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect
from drf_spectacular.utils import extend_schema
from rest_framework.exceptions import NotFound, Throttled
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from competition.models import Event

from .models import User
from .security import limit
from .serializers import AccountOutput
from .views import account


@method_decorator(csrf_protect, name="dispatch")
class DemoView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(request=None, responses=AccountOutput)
    def post(self, request):
        if not settings.DEMO_MODE:
            raise NotFound()
        if request.user.is_authenticated and not request.user.is_staff:
            return Response(account(request.user))
        limit("demo-guests", "global", 30)
        with transaction.atomic():
            Event.objects.select_for_update().get(pk=1)
            if User.objects.filter(email__endswith="@demo.invalid").count() >= 500:
                raise Throttled(
                    detail="This demo has reached its guest limit. Please contact the organizer."
                )
            code = secrets.token_hex(6)
            user = User.objects.create_user(f"{code}@demo.invalid", username=f"Guest {code[:6]}")
        login(request, user, backend="django.contrib.auth.backends.ModelBackend")
        return Response(account(user))
