from django.urls import path

from .views import NotificationListView, clear_all, mark_all_read, mark_read

urlpatterns = [
    path("", NotificationListView.as_view(), name="notification-list"),
    path("<uuid:pk>/read/", mark_read, name="notification-read"),
    path("read-all/", mark_all_read, name="notification-read-all"),
    path("clear-all/", clear_all, name="notification-clear-all"),
]
