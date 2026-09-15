import uuid

from django.conf import settings
from django.db import models


class Certificate(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    team = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    team_name = models.CharField(max_length=150)
    event_name = models.CharField(max_length=150)
    rank = models.PositiveIntegerField()
    score = models.FloatField()
    issued_at = models.DateTimeField(auto_now_add=True)
    revoked_at = models.DateTimeField(null=True, blank=True)
