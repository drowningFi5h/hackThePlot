import hashlib
import time

from django.db import transaction
from rest_framework.exceptions import Throttled

from .models import RateBucket


def limit(scope, identity, maximum, seconds=60):
    key = hashlib.sha256(f"{scope}:{identity}".encode()).hexdigest()
    window = int(time.time()) // seconds
    with transaction.atomic():
        RateBucket.objects.get_or_create(key=key, defaults={"window": window})
        bucket = RateBucket.objects.select_for_update().get(pk=key)
        if bucket.window != window:
            bucket.window, bucket.count = window, 0
        if bucket.count >= maximum:
            raise Throttled(wait=seconds - int(time.time()) % seconds)
        bucket.count += 1
        bucket.save(update_fields=["window", "count"])
