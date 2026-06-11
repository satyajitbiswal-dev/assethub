from rest_framework import serializers
from .models import FeedbackCampaign, FeedbackResponse
from apps.users.serializers import UserSerializer


class FeedbackCampaignSerializer(serializers.ModelSerializer):
    response_count = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(source="created_by.full_name", read_only=True)

    class Meta:
        model = FeedbackCampaign
        fields = [
            "id", "title", "description", "is_active",
            "created_by", "created_by_name", "created_at",
            "deactivated_at", "response_count",
        ]
        read_only_fields = ["id", "created_by", "created_at", "deactivated_at", "response_count"]

    def get_response_count(self, obj):
        return obj.responses.count()


class FeedbackResponseSerializer(serializers.ModelSerializer):
    user_detail = UserSerializer(source="user", read_only=True)
    campaign_title = serializers.CharField(source="campaign.title", read_only=True)

    class Meta:
        model = FeedbackResponse
        fields = [
            "id", "campaign", "campaign_title",
            "user", "user_detail",
            "product_suggestions", "improvement_suggestions",
            "submitted_at",
        ]
        read_only_fields = ["id", "user", "submitted_at"]

    def validate(self, attrs):
        request = self.context["request"]
        campaign = attrs["campaign"]

        if not campaign.is_active:
            raise serializers.ValidationError(
                {"campaign": "This feedback campaign is no longer active."}
            )

        if FeedbackResponse.objects.filter(campaign=campaign, user=request.user).exists():
            raise serializers.ValidationError(
                {"campaign": "You have already submitted feedback for this campaign."}
            )

        return attrs

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)