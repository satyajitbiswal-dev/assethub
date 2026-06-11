from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FeedbackCampaignViewSet, FeedbackResponseViewSet

router = DefaultRouter()
router.register("campaigns", FeedbackCampaignViewSet, basename="feedback-campaign")
router.register("responses", FeedbackResponseViewSet, basename="feedback-response")

urlpatterns = [
    path("", include(router.urls)),
]