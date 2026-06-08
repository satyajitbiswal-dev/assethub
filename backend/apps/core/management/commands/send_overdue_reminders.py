"""
python manage.py send_overdue_reminders
Run daily (cron or Celery beat) to notify users with overdue bookings.
"""
from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from apps.bookings.models import Booking
from apps.notifications.utils import notify_user


class Command(BaseCommand):
    help = 'Send email + in-app reminders for overdue bookings'

    def handle(self, *args, **kwargs):
        today = timezone.now().date()
        overdue = Booking.objects.filter(
            status='issued', end_date__lt=today
        ).select_related('user', 'asset')

        count = 0
        for booking in overdue:
            days_late = (today - booking.end_date).days
            message = (
                f"Your booking for '{booking.asset.name}' (×{booking.quantity}) "
                f"was due on {booking.end_date.strftime('%d %b %Y')} "
                f"and is now {days_late} day(s) overdue. "
                f"Please return it as soon as possible."
            )
            # In-app notification
            notify_user(
                booking.user,
                title=f"⚠ Overdue: {booking.asset.name}",
                body=message,
            )
            # Email
            try:
                send_mail(
                    subject=f"[AssetHub] Overdue return: {booking.asset.name}",
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[booking.user.email],
                    fail_silently=True,
                )
            except Exception:
                pass
            count += 1

        self.stdout.write(
            self.style.SUCCESS(f'Sent {count} overdue reminder(s).')
        )
