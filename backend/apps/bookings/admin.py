from django.contrib import admin
from .models import Booking, AuditLog


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ["user", "asset", "quantity", "start_date", "end_date", "status", "created_at"]
    list_filter = ["status"]
    search_fields = ["user__email", "asset__name"]
    readonly_fields = ["created_at", "updated_at", "issued_at", "returned_at", "reviewed_at"]


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ["actor", "action", "target_type", "target_id", "created_at"]
    list_filter = ["action", "target_type"]
    readonly_fields = ["actor", "action", "target_type", "target_id", "metadata", "created_at"]
