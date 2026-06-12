import random
import string

from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Q
from rest_framework import generics, permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer
from .models import User
from .serializers import RegisterSerializer, UserSerializer, UserUpdateSerializer, ChangePasswordSerializer
from apps.core.permissions import IsAdminUser
from apps.notifications.tasks import send_email_task


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        if not self.user.is_active:
            raise ValidationError({"message": "Your account has been blocked. Contact your administrator."})
        data["user"] = UserSerializer(self.user).data
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class CustomTokenRefreshSerializer(TokenRefreshSerializer):
    def validate(self, attrs):
        refresh = self.token_class(attrs["refresh"])
        user_id = refresh.payload.get("user_id")
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            raise ValidationError({"message": "Invalid token."})
        if not user.is_active:
            raise ValidationError(
                {"message": "Your account has been blocked. Contact your administrator."}
            )
        return super().validate(attrs)


class CustomTokenRefreshView(TokenRefreshView):
    serializer_class = CustomTokenRefreshSerializer


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {"success": True, "message": "Account created.", "user": UserSerializer(user).data},
            status=status.HTTP_201_CREATED,
        )


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return UserUpdateSerializer
        return UserSerializer

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", True)
        instance = self.get_object()
        serializer = UserUpdateSerializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(instance).data)


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save()
        return Response({"success": True, "message": "Password updated."})


class ForgotPasswordView(APIView):
    """
    POST /api/auth/forgot-password/
    Accepts { "email": "..." }.
    Generates a temporary password (first 5 chars of email prefix + 5 random
    alphanumeric chars), sets it on the account, and emails it to the user.
    Always returns a generic success message so valid emails cannot be enumerated.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get("email", "").strip().lower()
        if not email:
            return Response(
                {"success": False, "message": "Email is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        GENERIC_OK = {
            "success": True,
            "message": "If that email is registered, you'll receive a temporary password shortly.",
        }

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Return the same response regardless — don't reveal whether the email exists
            return Response(GENERIC_OK)

        # Build temp password: e.g. alice + xK3mP  →  alicexK3mP
        email_prefix = email.split("@")[0][:5]
        random_suffix = "".join(
            random.choices(string.ascii_letters + string.digits, k=5)
        )
        temp_password = email_prefix + random_suffix

        user.set_password(temp_password)
        user.save(update_fields=["password"])

        send_email_task.delay(
            subject="[AssetHub] Your temporary password",
            message=(
                f"Hi {user.first_name or user.email},\n\n"
                f"Your temporary password is:\n\n"
                f"    {temp_password}\n\n"
                f"Use it to sign in at AssetHub. You can keep using it as long as you like —"
                f" there's no requirement to change it.\n\n"
                f"If you'd like to set your own password, go to Profile → Change Password"
                f" after signing in.\n\n"
                f"If you didn't request this, you can safely ignore this email.\n\n"
                f"— The AssetHub team"
            ),
            recipient_list=[user.email],
        )

        return Response(GENERIC_OK)


class UserListView(generics.ListAPIView):
    """Admin: list all users."""
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        qs = User.objects.all().order_by("-created_at")
        search = self.request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(email__icontains=search)
                | Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(enrollment_no__icontains=search)
                | Q(department__icontains=search)
            )
        status_filter = self.request.query_params.get("status")
        if status_filter == "blocked":
            qs = qs.filter(is_active=False)
        elif status_filter == "active":
            qs = qs.filter(is_active=True)
        return qs


class UserStatusView(APIView):
    """Admin: block or unblock a user."""
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        if user == request.user:
            return Response(
                {"detail": "You cannot change your own account status."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        is_active = request.data.get("is_active")
        if is_active is None:
            return Response(
                {"detail": "is_active field is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.is_active = bool(is_active)
        user.save(update_fields=["is_active"])
        action = "unblocked" if user.is_active else "blocked"
        return Response(
            {
                "success": True,
                "message": f"User {action} successfully.",
                "user": UserSerializer(user).data,
            }
        )