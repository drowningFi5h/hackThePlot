from rest_framework import serializers


class LoginInput(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(trim_whitespace=False, write_only=True, max_length=1024)


class AccountOutput(serializers.Serializer):
    id = serializers.UUIDField()
    username = serializers.CharField()
    email = serializers.EmailField()
    role = serializers.ChoiceField(choices=["participant", "admin"])


class DetailOutput(serializers.Serializer):
    detail = serializers.CharField()


class CsrfOutput(serializers.Serializer):
    csrfToken = serializers.CharField()


class ImportRow(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()


class ImportInput(serializers.Serializer):
    rows = ImportRow(many=True, allow_empty=False)
    dry_run = serializers.BooleanField(default=True)
    reset_existing = serializers.BooleanField(default=False)

    def validate_rows(self, rows):
        if len(rows) > 500:
            raise serializers.ValidationError("Import at most 500 teams at a time.")
        emails = [row["email"].lower() for row in rows]
        if len(set(emails)) != len(emails):
            raise serializers.ValidationError("Duplicate emails in import.")
        return rows


class ImportResultRow(serializers.Serializer):
    email = serializers.EmailField()
    username = serializers.CharField()
    action = serializers.CharField()
    password = serializers.CharField(required=False)


class ImportOutput(serializers.Serializer):
    dry_run = serializers.BooleanField()
    rows = ImportResultRow(many=True)
