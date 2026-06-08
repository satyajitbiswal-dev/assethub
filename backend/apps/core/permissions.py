from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminUser(BasePermission):
    """Only admin role users."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "admin")


class IsAdminOrReadOnly(BasePermission):
    """Admins can write; everyone authenticated can read."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        return request.user.role == "admin"


class IsOwnerOrAdmin(BasePermission):
    """Object-level: owner or admin can access."""
    def has_object_permission(self, request, view, obj):
        if request.user.role == "admin":
            return True
        # Works for Booking (obj.user) and Notification (obj.recipient)
        owner = getattr(obj, "user", None) or getattr(obj, "recipient", None)
        return owner == request.user
