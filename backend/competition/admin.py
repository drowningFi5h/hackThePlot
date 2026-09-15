from django import forms
from django.contrib import admin

from .models import Asset, Challenge, Event, Submission


class ChallengeForm(forms.ModelForm):
    flag = forms.CharField(
        required=False,
        strip=False,
        widget=forms.PasswordInput,
        help_text="Exact flag; leave blank to preserve an existing flag.",
    )

    class Meta:
        model = Challenge
        fields = ["no", "title", "question", "score", "flag"]

    def clean_flag(self):
        flag = self.cleaned_data.get("flag", "")
        if not self.instance.pk or not self.instance.flag_hash:
            if not flag:
                raise forms.ValidationError("A new challenge needs a flag.")
        if len(flag) > 1024:
            raise forms.ValidationError("Flags must be at most 1024 characters.")
        return flag

    def save(self, commit=True):
        obj = super().save(commit=False)
        if self.cleaned_data.get("flag"):
            obj.set_flag(self.cleaned_data["flag"])
        if commit:
            obj.save()
        return obj


class AssetInline(admin.TabularInline):
    model = Asset
    extra = 0


@admin.register(Challenge)
class ChallengeAdmin(admin.ModelAdmin):
    form = ChallengeForm
    inlines = [AssetInline]
    list_display = ["no", "title", "score"]

    def has_delete_permission(self, request, obj=None):
        return not Submission.objects.exists() and super().has_delete_permission(request, obj)

    def has_change_permission(self, request, obj=None):
        # Competition definitions are frozen after the first solve.
        return not Submission.objects.exists() and super().has_change_permission(request, obj)

    def has_add_permission(self, request):
        return not Submission.objects.exists() and super().has_add_permission(request)


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    def has_add_permission(self, request):
        return not Event.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ["team", "challenge", "position", "time"]
    readonly_fields = ["team", "challenge", "position", "time"]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
