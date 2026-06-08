def notify_user(user, title: str, body: str):
    """Create an in-app notification for a user."""
    from .models import Notification
    Notification.objects.create(recipient=user, title=title, body=body)
