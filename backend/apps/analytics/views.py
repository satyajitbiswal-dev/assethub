from django.utils import timezone
from django.db.models import Count, Q, Sum, F
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from apps.core.permissions import IsAdminUser
from apps.assets.models import Asset, Category
from apps.bookings.models import Booking, AuditLog
from apps.bookings.serializers import BookingSerializer, AuditLogSerializer


@api_view(["GET"])
@permission_classes([IsAdminUser])
def summary(request):
    today = timezone.now().date()
    total_assets = Asset.objects.count()
    total_qty = Asset.objects.aggregate(t=Sum("total_qty"))["t"] or 0
    available_qty = Asset.objects.aggregate(a=Sum("available_qty"))["a"] or 0
    borrowed_qty = total_qty - available_qty

    active_bookings = Booking.objects.filter(status__in=["approved", "issued"]).count()
    pending_bookings = Booking.objects.filter(status="pending").count()
    overdue_bookings = Booking.objects.filter(status="issued", end_date__lt=today).count()

    utilisation = round((borrowed_qty / total_qty * 100), 1) if total_qty else 0

    return Response({
        "total_assets": total_assets,
        "total_qty": total_qty,
        "available_qty": available_qty,
        "borrowed_qty": borrowed_qty,
        "active_bookings": active_bookings,
        "pending_bookings": pending_bookings,
        "overdue_bookings": overdue_bookings,
        "utilisation_rate": utilisation,
        "total_categories": Category.objects.count(),
    })


@api_view(["GET"])
@permission_classes([IsAdminUser])
def top_assets(request):
    limit = int(request.query_params.get("limit", 5))
    top = (
        Asset.objects.annotate(booking_count=Count("bookings", filter=Q(bookings__status__in=["issued", "returned"])))
        .order_by("-booking_count")[:limit]
    )
    data = [
        {"id": str(a.id), "name": a.name, "category": a.category.name, "booking_count": a.booking_count}
        for a in top
    ]
    return Response(data)


@api_view(["GET"])
@permission_classes([IsAdminUser])
def overdue_bookings(request):
    today = timezone.now().date()
    qs = Booking.objects.filter(status="issued", end_date__lt=today).select_related("user", "asset")
    return Response(BookingSerializer(qs, many=True).data)


@api_view(["GET"])
@permission_classes([IsAdminUser])
def utilisation_by_category(request):
    cats = Category.objects.prefetch_related("assets")
    data = []
    for cat in cats:
        assets = cat.assets.all()
        total = sum(a.total_qty for a in assets)
        available = sum(a.available_qty for a in assets)
        borrowed = total - available
        data.append({
            "category": cat.name,
            "total_qty": total,
            "borrowed_qty": borrowed,
            "utilisation_rate": round((borrowed / total * 100), 1) if total else 0,
        })
    return Response(data)


@api_view(["GET"])
@permission_classes([IsAdminUser])
def recent_activity(request):
    limit = int(request.query_params.get("limit", 10))
    logs = AuditLog.objects.select_related("actor")[:limit]
    return Response(AuditLogSerializer(logs, many=True).data)
