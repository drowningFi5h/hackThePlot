from django.contrib import admin
from django.utils import timezone

from .models import Certificate


@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ["team_name", "event_name", "rank", "issued_at", "revoked_at"]
    readonly_fields = [
        "id",
        "team",
        "team_name",
        "event_name",
        "rank",
        "score",
        "issued_at",
        "revoked_at",
    ]
    actions = ["revoke"]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    @admin.action(description="Revoke selected certificates")
    def revoke(self, request, queryset):
        for certificate in queryset:
            certificate.revoked_at = timezone.now()
            certificate.save(update_fields=["revoked_at"])
            self.log_change(request, certificate, "Revoked certificate")
