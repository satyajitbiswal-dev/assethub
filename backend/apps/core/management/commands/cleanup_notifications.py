from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from apps.notifications.utils import cleanup_user_notifications

User = get_user_model()


class Command(BaseCommand):
    help = "Remove notifications older than 30 days and cap each user at 100."

    def handle(self, *args, **options):
        total_deleted = 0
        for user in User.objects.iterator():
            total_deleted += cleanup_user_notifications(user)
        self.stdout.write(
            self.style.SUCCESS(f"Cleanup complete. Removed {total_deleted} notification(s).")
        )
