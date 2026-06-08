from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BookingViewSet, AuditLogListView

router = DefaultRouter()
router.register("", BookingViewSet, basename="booking")

urlpatterns = [
    path("", include(router.urls)),
    path("audit-logs/", AuditLogListView.as_view(), name="audit-logs"),
]
