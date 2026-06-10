from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, label="Confirm password")
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    enrollment_no = serializers.CharField(
        required=True, min_length=8, max_length=8
    )

    class Meta:
        model = User
        fields = [
            "enrollment_no", "email", "password", "password2",
            "first_name", "last_name", "phone", "department",
        ]

    def validate_enrollment_no(self, value):
        if not value.isdigit():
            raise serializers.ValidationError("Enrollment number must contain only digits.")
        if User.objects.filter(enrollment_no=value).exists():
            raise serializers.ValidationError("This enrollment number is already registered.")
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs.pop("password2"):
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = [
            "id", "enrollment_no", "email", "first_name", "last_name", "full_name",
            "role", "phone", "department", "is_active", "created_at",
        ]
        read_only_fields = ["id", "role", "created_at"]


class UserUpdateSerializer(serializers.ModelSerializer):
    enrollment_no = serializers.CharField(required=True, min_length=8, max_length=8)

    class Meta:
        model = User
        fields = ["first_name", "last_name", "enrollment_no", "phone", "department"]

    def validate_enrollment_no(self, value):
        if not value.isdigit():
            raise serializers.ValidationError("Enrollment number must contain only digits.")
        qs = User.objects.filter(enrollment_no=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("This enrollment number is already registered.")
        return value


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value
