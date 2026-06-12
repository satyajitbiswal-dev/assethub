from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BookingViewSet, AuditLogListView, ReviewViewSet

router = DefaultRouter()
router.register("reviews", ReviewViewSet, basename="review")
router.register("", BookingViewSet, basename="booking")

urlpatterns = [
    path("audit-logs/", AuditLogListView.as_view(), name="audit-logs"),
    path("", include(router.urls)),
]
