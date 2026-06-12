"""
python manage.py send_overdue_reminders
Run daily (cron or Celery beat) to notify users with overdue bookings.
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.bookings.models import Booking
from apps.bookings.reminders import send_overdue_reminder


class Command(BaseCommand):
    help = 'Send email + in-app reminders for overdue bookings'

    def handle(self, *args, **kwargs):
        today = timezone.now().date()
        overdue = Booking.objects.filter(
            status='issued', end_date__lt=today
        ).select_related('user', 'asset')

        count = 0
        for booking in overdue:
            send_overdue_reminder(booking)
            count += 1

        self.stdout.write(
            self.style.SUCCESS(f'Sent {count} overdue reminder(s).')
        )