from rest_framework import serializers
from .models import Asset, Category


class CategorySerializer(serializers.ModelSerializer):
    asset_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ["id", "name", "description", "asset_count", "created_at"]
        read_only_fields = ["id", "created_at"]

    def get_asset_count(self, obj):
        return obj.assets.count()


class AssetSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    utilisation_rate = serializers.ReadOnlyField()
    created_by_name = serializers.CharField(source="created_by.full_name", read_only=True)

    class Meta:
        model = Asset
        fields = [
            "id", "name", "category", "category_name", "description",
            "total_qty", "available_qty", "status", "condition",
            "location", "serial_number", "purchase_date",
            "maintenance_notes", "utilisation_rate",
            "created_by", "created_by_name", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "available_qty", "created_by", "created_at", "updated_at"]

    def validate(self, attrs):
        # On create: available_qty = total_qty
        if not self.instance:
            attrs["available_qty"] = attrs.get("total_qty", 1)
        else:
            # On update: if total_qty changes, adjust available by the delta
            old_total = self.instance.total_qty
            new_total = attrs.get("total_qty", old_total)
            delta = new_total - old_total
            new_available = self.instance.available_qty + delta
            if new_available < 0:
                raise serializers.ValidationError(
                    {"total_qty": "Cannot reduce total below currently borrowed quantity."}
                )
            attrs["available_qty"] = new_available
        return attrs

    def create(self, validated_data):
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)


class AssetListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = Asset
        fields = [
            "id", "name", "category", "category_name",
            "total_qty", "available_qty", "status", "condition", "location",
        ]
