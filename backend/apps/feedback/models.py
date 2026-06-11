import uuid
from django.db import models
from django.conf import settings


class FeedbackCampaign(models.Model):
    """
    Admin creates a campaign to collect feedback.
    Only one campaign can be active at a time (enforced in the view).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, help_text="Optional context shown to users on the form.")
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name="feedback_campaigns"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    deactivated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "feedback_campaigns"
        ordering = ["-created_at"]

    def __str__(self):
        status = "active" if self.is_active else "closed"
        return f"{self.title} [{status}]"


class FeedbackResponse(models.Model):
    """
    One response per user per campaign.
    Enforced by unique_together on (campaign, user).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    campaign = models.ForeignKey(
        FeedbackCampaign, on_delete=models.CASCADE, related_name="responses"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="feedback_responses"
    )
    product_suggestions = models.TextField(
        blank=True,
        help_text="New products or assets the user wants added."
    )
    improvement_suggestions = models.TextField(
        blank=True,
        help_text="Improvements to existing assets, processes, or the platform."
    )
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "feedback_responses"
        ordering = ["-submitted_at"]
        unique_together = [("campaign", "user")]

    def __str__(self):
        return f"{self.user.email} → {self.campaign.title}"