import io
import qrcode
from django.http import HttpResponse
from django.db.models import Q
from rest_framework import viewsets, generics, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Asset, Category
from .serializers import AssetSerializer, AssetListSerializer, CategorySerializer
from apps.core.permissions import IsAdminOrReadOnly, IsAdminUser


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]


class AssetViewSet(viewsets.ModelViewSet):
    queryset = Asset.objects.select_related("category", "created_by").all()
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "description", "serial_number", "location"]
    ordering_fields = ["name", "created_at", "available_qty", "total_qty"]
    ordering = ["name"]

    def get_serializer_class(self):
        if self.action == "list":
            return AssetListSerializer
        return AssetSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        category = self.request.query_params.get("category")
        status = self.request.query_params.get("status")
        condition = self.request.query_params.get("condition")
        available_only = self.request.query_params.get("available_only")

        if category:
            qs = qs.filter(category__id=category)
        if status:
            qs = qs.filter(status=status)
        if condition:
            qs = qs.filter(condition=condition)
        if available_only == "true":
            qs = qs.filter(status="available", available_qty__gt=0)
        return qs

    @action(detail=True, methods=["get"], url_path="qr")
    def qr_code(self, request, pk=None):
        """Generate and return a QR code PNG for this asset."""
        asset = self.get_object()
        # Encode a simple JSON payload the scan page can parse
        payload = f"asset:{asset.id}:{asset.name}"
        img = qrcode.make(payload)
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        buf.seek(0)
        return HttpResponse(buf.getvalue(), content_type="image/png")
