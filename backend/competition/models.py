import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, URLValidator
from django.db import models
from django.utils import timezone
from django.utils.crypto import constant_time_compare, salted_hmac


class Event(models.Model):
    id = models.PositiveSmallIntegerField(primary_key=True, default=1, editable=False)
    name = models.CharField(max_length=150, default="TechHunt · IIIT Vadodara")
    starts_at = models.DateTimeField(null=True, blank=True)
    ends_at = models.DateTimeField(null=True, blank=True)

    def clean(self):
        if self.starts_at and self.ends_at and self.ends_at <= self.starts_at:
            raise ValidationError("End time must follow start time.")

    @property
    def status(self):
        now = timezone.now()
        if not self.starts_at or not self.ends_at:
            return "unconfigured"
        if now < self.starts_at:
            return "upcoming"
        return "ended" if now >= self.ends_at else "live"

    class Meta:
        constraints = [models.CheckConstraint(condition=models.Q(id=1), name="singleton_event")]

    def __str__(self):
        return self.name


class Challenge(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    no = models.PositiveIntegerField(unique=True)
    title = models.CharField(max_length=200)
    question = models.TextField(blank=True)
    score = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    flag_hash = models.CharField(max_length=256, editable=False)

    class Meta:
        ordering = ["no"]

    def set_flag(self, flag):
        self.flag_hash = salted_hmac("techhunt.flag.v1", flag, algorithm="sha256").hexdigest()

    def matches(self, flag):
        return constant_time_compare(
            self.flag_hash, salted_hmac("techhunt.flag.v1", flag, algorithm="sha256").hexdigest()
        )

    def __str__(self):
        return f"{self.no}. {self.title}"


class Asset(models.Model):
    TYPES = [(t, t) for t in ("audio", "video", "image", "zip", "pdf", "srt", "url")]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    challenge = models.ForeignKey(Challenge, on_delete=models.CASCADE, related_name="assets")
    name = models.CharField(max_length=200)
    url = models.URLField(max_length=2000, validators=[URLValidator(schemes=["https"])])
    type = models.CharField(max_length=10, choices=TYPES)
    downloadable = models.BooleanField(default=True)
    transcript = models.ForeignKey("self", null=True, blank=True, on_delete=models.SET_NULL)

    def clean(self):
        if self.transcript_id:
            if (
                self.type != "audio"
                or self.transcript.type != "srt"
                or self.transcript.challenge_id != self.challenge_id
            ):
                raise ValidationError(
                    "Audio and its SRT transcript must belong to the same challenge."
                )


class Submission(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    team = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    challenge = models.ForeignKey(Challenge, on_delete=models.PROTECT, related_name="submissions")
    position = models.PositiveIntegerField()
    time = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["time", "id"]
        constraints = [
            models.UniqueConstraint(fields=["team", "challenge"], name="unique_team_solve"),
            models.UniqueConstraint(fields=["challenge", "position"], name="unique_solve_position"),
            models.CheckConstraint(
                condition=models.Q(position__gte=1), name="positive_solve_position"
            ),
        ]
