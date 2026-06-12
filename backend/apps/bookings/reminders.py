from django.utils import timezone

from apps.notifications.tasks import send_email_task
from apps.notifications.utils import notify_user

from .models import Booking


def overdue_reminder_message(booking: Booking) -> str:
    today = timezone.now().date()
    days_late = (today - booking.end_date).days
    return (
        f"Your booking for '{booking.asset.name}' (×{booking.quantity}) "
        f"was due on {booking.end_date.strftime('%d %b %Y')} "
        f"and is now {days_late} day(s) overdue. "
        f"Please return it as soon as possible."
    )


def send_overdue_reminder(booking: Booking) -> None:
    """Send in-app + email overdue reminder to the booking user."""
    message = overdue_reminder_message(booking)
    notify_user(
        booking.user,
        title=f"Overdue: {booking.asset.name}",
        body=message,
    )
    send_email_task.delay(
        subject=f"[AssetHub] Overdue return: {booking.asset.name}",
        message=message,
        recipient_list=[booking.user.email],
    )
