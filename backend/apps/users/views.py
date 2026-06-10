from django.db.models import Q
from rest_framework import generics, permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User
from .serializers import RegisterSerializer, UserSerializer, UserUpdateSerializer, ChangePasswordSerializer
from apps.core.permissions import IsAdminUser


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        if not self.user.is_active:
            raise ValidationError({"message": "Your account has been blocked. Contact your administrator."})
        data["user"] = UserSerializer(self.user).data
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


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
