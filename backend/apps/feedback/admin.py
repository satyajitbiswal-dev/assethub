from django.contrib import admin
from .models import FeedbackCampaign, FeedbackResponse

# Register your models here.
@admin.register(FeedbackCampaign)
class FeedbackCampaignAdmin(admin.ModelAdmin):
    list_display = ("title", "is_active", "created_by", "created_at", "deactivated_at")
    list_filter = ("is_active", "created_by")
    search_fields = ("title", "description", "created_by__email")
    readonly_fields = ("created_at", "deactivated_at")