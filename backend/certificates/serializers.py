from rest_framework import serializers


class IssueInput(serializers.Serializer):
    team_id = serializers.UUIDField()


class CertificateOutput(serializers.Serializer):
    id = serializers.UUIDField()
    team_name = serializers.CharField()
    event_name = serializers.CharField()
    rank = serializers.IntegerField()
    score = serializers.FloatField()
    issued_at = serializers.DateTimeField()


class IssueOutput(serializers.Serializer):
    url = serializers.URLField()
    certificate = CertificateOutput()
