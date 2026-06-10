from datetime import timedelta

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.conf import settings
from django.utils import timezone

from .models import Notification

RETENTION_DAYS = getattr(settings, "NOTIFICATION_RETENTION_DAYS", 30)
MAX_PER_USER = getattr(settings, "NOTIFICATION_MAX_PER_USER", 100)


def serialize_notification(notification: Notification) -> dict:
    return {
        "id": str(notification.id),
        "title": notification.title,
        "body": notification.body,
        "is_read": notification.is_read,
        "created_at": notification.created_at.isoformat(),
    }


def unread_count_for(user) -> int:
    return Notification.objects.filter(recipient=user, is_read=False).count()


def broadcast_to_user(user_id, payload: dict) -> None:
    """Push a real-time event to all WebSocket connections for a user."""
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return
    async_to_sync(channel_layer.group_send)(
        f"notifications_{user_id}",
        {"type": "notification.event", "payload": payload},
    )


def cleanup_user_notifications(user) -> int:
    """
    Apply retention policy for a single user:
    - Remove notifications older than RETENTION_DAYS
    - Keep only the MAX_PER_USER most recent notifications
    Returns the number of deleted rows.
    """
    qs = Notification.objects.filter(recipient=user)
    deleted = 0

    cutoff = timezone.now() - timedelta(days=RETENTION_DAYS)
    old_deleted, _ = qs.filter(created_at__lt=cutoff).delete()
    deleted += old_deleted

    keep_ids = list(
        Notification.objects.filter(recipient=user)
        .order_by("-created_at")
        .values_list("id", flat=True)[:MAX_PER_USER]
    )
    if keep_ids:
        excess_deleted, _ = (
            Notification.objects.filter(recipient=user)
            .exclude(id__in=keep_ids)
            .delete()
        )
        deleted += excess_deleted

    return deleted


def notify_user(user, title: str, body: str) -> Notification:
    """Create a persisted notification and push it to online clients."""
    notification = Notification.objects.create(
        recipient=user, title=title, body=body
    )
    unread = unread_count_for(user)

    broadcast_to_user(
        user.id,
        {
            "type": "notification.new",
            "notification": serialize_notification(notification),
            "unread_count": unread,
        },
    )

    # Run cleanup after broadcast so delivery is never blocked by retention.
    cleanup_user_notifications(user)

    return notification
