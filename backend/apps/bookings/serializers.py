from rest_framework import serializers
from django.utils import timezone
from .models import Booking, AuditLog, Review
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
    actor_name = serializers.SerializerMethodField()
    action_label = serializers.SerializerMethodField()
    summary = serializers.SerializerMethodField()
    target_label = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = [
            "id", "actor_name", "action", "action_label",
            "summary", "target_label", "created_at",
        ]

    def get_actor_name(self, obj):
        return obj.actor.full_name if obj.actor else "System"

    def get_action_label(self, obj):
        from .audit_utils import build_audit_display
        return build_audit_display(obj)["action_label"]

    def get_summary(self, obj):
        from .audit_utils import build_audit_display
        return build_audit_display(obj)["summary"]

    def get_target_label(self, obj):
        from .audit_utils import build_audit_display
        return build_audit_display(obj)["target_label"]


class ReviewSerializer(serializers.ModelSerializer):
    user_detail = UserSerializer(source="user", read_only=True)
    asset_name = serializers.CharField(source="asset.name", read_only=True)
 
    class Meta:
        model = Review
        fields = ["id", "booking", "user", "user_detail", "asset", "asset_name", "text", "rating", "is_seen", "created_at"]
        read_only_fields = ["id", "user", "asset", "is_seen", "created_at"]
 
    def validate_text(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Review cannot be empty.")
        if len(value.split()) > 30:
            raise serializers.ValidationError("Review must be 30 words or fewer.")
        return value
 
    def validate_rating(self, value):
        if not (1 <= value <= 5):
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value
 
    def validate_booking(self, booking):
        request = self.context["request"]
        if booking.user_id != request.user.id:
            raise serializers.ValidationError("You can only review your own bookings.")
        if booking.status != Booking.Status.RETURNED:
            raise serializers.ValidationError("You can only review returned bookings.")
        if hasattr(booking, "review"):
            raise serializers.ValidationError("You have already reviewed this booking.")
        return booking
 
    def create(self, validated_data):
        request = self.context["request"]
        booking = validated_data["booking"]
        return Review.objects.create(
            booking=booking,
            user=request.user,
            asset=booking.asset,
            text=validated_data["text"],
            rating=validated_data.get("rating", 5),
        )
 