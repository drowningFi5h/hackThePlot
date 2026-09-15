from rest_framework import serializers


class EventOutput(serializers.Serializer):
    demo_mode = serializers.BooleanField()
    name = serializers.CharField()
    starts_at = serializers.DateTimeField(allow_null=True)
    ends_at = serializers.DateTimeField(allow_null=True)
    status = serializers.ChoiceField(choices=["unconfigured", "upcoming", "live", "ended"])
    server_time = serializers.DateTimeField()


class AssetOutput(serializers.Serializer):
    id = serializers.UUIDField()
    name = serializers.CharField()
    type = serializers.ChoiceField(choices=["audio", "video", "image", "zip", "pdf", "srt", "url"])
    url = serializers.URLField()
    downloadable = serializers.BooleanField()
    transcript_url = serializers.URLField(allow_null=True)


class ChallengeOutput(serializers.Serializer):
    id = serializers.UUIDField()
    no = serializers.IntegerField()
    title = serializers.CharField()
    question = serializers.CharField()
    score = serializers.IntegerField()
    solved = serializers.BooleanField()
    unlocked = serializers.BooleanField()
    assets = AssetOutput(many=True)


class SubmitInput(serializers.Serializer):
    flag = serializers.CharField(max_length=1024, trim_whitespace=False)


class SubmitOutput(serializers.Serializer):
    detail = serializers.CharField()
    already_solved = serializers.BooleanField()


class StandingOutput(serializers.Serializer):
    id = serializers.UUIDField()
    username = serializers.CharField()
    rank = serializers.IntegerField()
    score = serializers.FloatField()
    solved = serializers.IntegerField()


class PointOutput(serializers.Serializer):
    time = serializers.DateTimeField()
    score = serializers.FloatField()


class SeriesOutput(serializers.Serializer):
    id = serializers.UUIDField()
    name = serializers.CharField()
    points = PointOutput(many=True)


class LeaderboardOutput(serializers.Serializer):
    teams = StandingOutput(many=True)
    series = SeriesOutput(many=True)
    generated_at = serializers.DateTimeField()
