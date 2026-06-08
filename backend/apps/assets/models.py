import uuid
from django.db import models
from django.conf import settings


class Category(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "asset_categories"
        verbose_name_plural = "categories"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Asset(models.Model):
    class Status(models.TextChoices):
        AVAILABLE = "available", "Available"
        MAINTENANCE = "maintenance", "Under Maintenance"
        RETIRED = "retired", "Retired"

    class Condition(models.TextChoices):
        GOOD = "good", "Good"
        FAIR = "fair", "Fair"
        DAMAGED = "damaged", "Damaged"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="assets")
    description = models.TextField(blank=True)
    total_qty = models.PositiveIntegerField(default=1)
    available_qty = models.PositiveIntegerField(default=1)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.AVAILABLE)
    condition = models.CharField(max_length=10, choices=Condition.choices, default=Condition.GOOD)
    location = models.CharField(max_length=200, blank=True, help_text="Physical location, e.g. Lab-3, Shelf-B")
    serial_number = models.CharField(max_length=100, blank=True)
    purchase_date = models.DateField(null=True, blank=True)
    maintenance_notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name="created_assets"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "assets"
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.available_qty}/{self.total_qty})"

    @property
    def utilisation_rate(self):
        if self.total_qty == 0:
            return 0
        borrowed = self.total_qty - self.available_qty
        return round((borrowed / self.total_qty) * 100, 1)
