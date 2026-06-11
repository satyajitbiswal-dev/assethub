from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail



@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def send_email_task(self, subject, message, recipient_list, html_message=None):
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=recipient_list,
            html_message=html_message,
            fail_silently=False,
        )
    except Exception as exc:
        raise self.retry(exc=exc)