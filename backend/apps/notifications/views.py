from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import serializers

from .models import Notification
from .utils import broadcast_to_user, serialize_notification, unread_count_for


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "title", "body", "is_read", "created_at"]
        read_only_fields = fields


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        unread_count = qs.filter(is_read=False).count()
        data = NotificationSerializer(qs, many=True).data
        return Response({"unread_count": unread_count, "results": data})


@api_view(["PATCH"])
@permission_classes([permissions.IsAuthenticated])
def mark_read(request, pk):
    try:
        n = Notification.objects.get(pk=pk, recipient=request.user)
        n.is_read = True
        n.save()
        unread = unread_count_for(request.user)
        broadcast_to_user(
            request.user.id,
            {
                "type": "notification.read",
                "notification_id": str(n.id),
                "unread_count": unread,
            },
        )
        return Response({"success": True, "unread_count": unread})
    except Notification.DoesNotExist:
        return Response(
            {"success": False, "message": "Not found."},
            status=status.HTTP_404_NOT_FOUND,
        )


@api_view(["PATCH"])
@permission_classes([permissions.IsAuthenticated])
def mark_all_read(request):
    Notification.objects.filter(recipient=request.user, is_read=False).update(
        is_read=True
    )
    broadcast_to_user(
        request.user.id,
        {"type": "notifications.read_all", "unread_count": 0},
    )
    return Response(
        {"success": True, "message": "All notifications marked as read.", "unread_count": 0}
    )


@api_view(["DELETE"])
@permission_classes([permissions.IsAuthenticated])
def clear_all(request):
    Notification.objects.filter(recipient=request.user).delete()
    broadcast_to_user(
        request.user.id,
        {"type": "notifications.cleared", "unread_count": 0},
    )
    return Response({"success": True, "message": "All notifications cleared."})
