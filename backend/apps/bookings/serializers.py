from rest_framework import serializers
from django.utils import timezone
from .models import Booking, AuditLog
from apps.assets.serializers import AssetListSerializer
from apps.users.serializers import UserSerializer


class BookingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ["asset", "quantity", "start_date", "end_date", "reason"]

    def validate(self, attrs):
        asset = attrs["asset"]
        quantity = attrs.get("quantity", 1)
        start_date = attrs["start_date"]
        end_date = attrs["end_date"]

        if end_date < start_date:
            raise serializers.ValidationError({"end_date": "End date must be after start date."})

        if start_date < timezone.now().date():
            raise serializers.ValidationError({"start_date": "Start date cannot be in the past."})

        if asset.status != "available":
            raise serializers.ValidationError({"asset": f"Asset is currently {asset.status}."})

        if asset.available_qty < quantity:
            raise serializers.ValidationError(
                {"quantity": f"Only {asset.available_qty} unit(s) available."}
            )
        return attrs

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class BookingSerializer(serializers.ModelSerializer):
    asset_detail = AssetListSerializer(source="asset", read_only=True)
    user_detail = UserSerializer(source="user", read_only=True)
    reviewed_by_name = serializers.CharField(source="reviewed_by.full_name", read_only=True)
    is_overdue = serializers.ReadOnlyField()

    class Meta:
        model = Booking
        fields = [
            "id", "user", "user_detail", "asset", "asset_detail",
            "quantity", "start_date", "end_date", "status",
            "reason", "rejection_reason", "is_overdue",
            "reviewed_by", "reviewed_by_name", "reviewed_at",
            "issued_at", "returned_at", "created_at", "updated_at",
        ]
        read_only_fields = fields


class RejectSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True)


class AuditLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source="actor.full_name", read_only=True)

    class Meta:
        model = AuditLog
        fields = ["id", "actor", "actor_name", "action", "target_type", "target_id", "metadata", "created_at"]
