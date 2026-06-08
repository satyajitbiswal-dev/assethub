from django.urls import path
from .views import summary, top_assets, overdue_bookings, utilisation_by_category, recent_activity

urlpatterns = [
    path("summary/", summary, name="analytics-summary"),
    path("top-assets/", top_assets, name="analytics-top-assets"),
    path("overdue/", overdue_bookings, name="analytics-overdue"),
    path("utilisation/", utilisation_by_category, name="analytics-utilisation"),
    path("recent-activity/", recent_activity, name="analytics-recent-activity"),
]
