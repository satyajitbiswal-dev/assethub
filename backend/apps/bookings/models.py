import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone


class Booking(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        ISSUED = "issued", "Issued"
        RETURNED = "returned", "Returned"
        CANCELLED = "cancelled", "Cancelled"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="bookings"
    )
    asset = models.ForeignKey(
        "assets.Asset", on_delete=models.PROTECT, related_name="bookings"
    )
    quantity = models.PositiveIntegerField(default=1)
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.PENDING)
    reason = models.TextField(blank=True)
    rejection_reason = models.TextField(blank=True)

    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="reviewed_bookings"
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    issued_at = models.DateTimeField(null=True, blank=True)
    returned_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "bookings"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.email} → {self.asset.name} [{self.status}]"

    @property
    def is_overdue(self):
        if self.status == self.Status.ISSUED:
            return timezone.now().date() > self.end_date
        return False


class AuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name="audit_logs"
    )
    action = models.CharField(max_length=100)
    target_type = models.CharField(max_length=50)
    target_id = models.CharField(max_length=50)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "audit_logs"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.actor} | {self.action} | {self.target_type}:{self.target_id}"

    @classmethod
    def log(cls, actor, action, target, metadata=None):
        from .audit_utils import booking_audit_metadata

        meta = dict(metadata or {})
        if isinstance(target, Booking):
            for key, value in booking_audit_metadata(target).items():
                meta.setdefault(key, value)
        cls.objects.create(
            actor=actor,
            action=action,
            target_type=type(target).__name__,
            target_id=str(target.pk),
            metadata=meta,
        )


class Review(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name="review")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reviews")
    asset = models.ForeignKey("assets.Asset", on_delete=models.CASCADE, related_name="reviews")
    text = models.CharField(max_length=200)
    rating = models.PositiveSmallIntegerField(default=5)
    is_seen = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "reviews"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.email} → {self.asset.name} ({self.rating}★)"