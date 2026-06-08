from django.contrib import admin
from .models import Asset, Category


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "description", "created_at"]
    search_fields = ["name"]


@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    list_display = ["name", "category", "total_qty", "available_qty", "status", "condition", "location"]
    list_filter = ["status", "condition", "category"]
    search_fields = ["name", "serial_number", "location"]
    readonly_fields = ["created_by", "created_at", "updated_at"]
