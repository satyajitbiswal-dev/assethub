from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AssetViewSet, CategoryViewSet

router = DefaultRouter()
router.register("categories", CategoryViewSet, basename="category")
router.register("", AssetViewSet, basename="asset")

urlpatterns = [
    path("", include(router.urls)),
]
