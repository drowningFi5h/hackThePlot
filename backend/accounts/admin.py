from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import AdminUserCreationForm, UserChangeForm

from .models import User


class CreateTeamForm(AdminUserCreationForm):
    class Meta(AdminUserCreationForm.Meta):
        model = User
        fields = ("email", "username")


class ChangeTeamForm(UserChangeForm):
    class Meta(UserChangeForm.Meta):
        model = User
        fields = "__all__"


@admin.register(User)
class TeamAdmin(UserAdmin):
    add_form = CreateTeamForm
    form = ChangeTeamForm
    ordering = ("email",)
    list_display = ("username", "email", "is_staff", "is_active")
    search_fields = ("username", "email")
    fieldsets = (
        (None, {"fields": ("email", "username", "password")}),
        (
            "Access",
            {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")},
        ),
    )

    def save_model(self, request, obj, form, change):
        obj.full_clean()
        super().save_model(request, obj, form, change)

    add_fieldsets = ((None, {"fields": ("email", "username", "password1", "password2")}),)
