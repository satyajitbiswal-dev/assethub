from django.utils import timezone
from django.db import transaction
from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Booking, AuditLog
from .serializers import BookingSerializer, BookingCreateSerializer, RejectSerializer, AuditLogSerializer
from apps.core.permissions import IsAdminUser, IsOwnerOrAdmin
from apps.notifications.utils import notify_user


class BookingViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Booking.objects.select_related("user", "asset__category", "reviewed_by")
        if user.role != "admin":
            qs = qs.filter(user=user)

        # Filters
        status_filter = self.request.query_params.get("status")
        asset_id = self.request.query_params.get("asset")
        if status_filter:
            qs = qs.filter(status=status_filter)
        if asset_id:
            qs = qs.filter(asset__id=asset_id)
        return qs

    def get_serializer_class(self):
        if self.action == "create":
            return BookingCreateSerializer
        return BookingSerializer

    def get_permissions(self):
        if self.action in ["update", "partial_update", "destroy"]:
            return [IsAdminUser()]
        return [permissions.IsAuthenticated()]

    @transaction.atomic
    def perform_create(self, serializer):
        booking = serializer.save()
        AuditLog.log(
            actor=self.request.user,
            action="booking_created",
            target=booking,
            metadata={"asset": str(booking.asset.id), "quantity": booking.quantity},
        )
        # Notify admins
        from django.contrib.auth import get_user_model
        User = get_user_model()
        for admin in User.objects.filter(role="admin"):
            notify_user(
                admin,
                title="New booking request",
                body=f"{booking.user.full_name} requested {booking.quantity}x {booking.asset.name}",
            )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        booking = Booking.objects.get(pk=serializer.instance.pk)
        return Response(
            BookingSerializer(booking).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["patch"], url_path="cancel")
    @transaction.atomic
    def cancel(self, request, pk=None):
        booking = self.get_object()
        self.check_object_permissions(request, booking)
        if booking.status not in [Booking.Status.PENDING, Booking.Status.APPROVED]:
            return Response(
                {"success": False, "message": "Only pending or approved bookings can be cancelled."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        booking.status = Booking.Status.CANCELLED
        booking.save()
        AuditLog.log(request.user, "booking_cancelled", booking)
        return Response(BookingSerializer(booking).data)

    @action(detail=True, methods=["patch"], url_path="approve", permission_classes=[IsAdminUser])
    @transaction.atomic
    def approve(self, request, pk=None):
        booking = self.get_object()
        if booking.status != Booking.Status.PENDING:
            return Response(
                {"success": False, "message": "Only pending bookings can be approved."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        booking.status = Booking.Status.APPROVED
        booking.reviewed_by = request.user
        booking.reviewed_at = timezone.now()
        booking.save()
        AuditLog.log(request.user, "booking_approved", booking)
        notify_user(booking.user, "Booking approved", f"Your request for {booking.asset.name} was approved.")
        return Response(BookingSerializer(booking).data)

    @action(detail=True, methods=["patch"], url_path="reject", permission_classes=[IsAdminUser])
    @transaction.atomic
    def reject(self, request, pk=None):
        booking = self.get_object()
        if booking.status not in [Booking.Status.PENDING, Booking.Status.APPROVED]:
            return Response(
                {"success": False, "message": "Only pending or approved bookings can be rejected."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        ser = RejectSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        booking.status = Booking.Status.REJECTED
        booking.reviewed_by = request.user
        booking.reviewed_at = timezone.now()
        booking.rejection_reason = ser.validated_data.get("reason", "")
        booking.save()
        AuditLog.log(request.user, "booking_rejected", booking)
        notify_user(booking.user, "Booking rejected", f"Your request for {booking.asset.name} was rejected.")
        return Response(BookingSerializer(booking).data)

    @action(detail=True, methods=["patch"], url_path="issue", permission_classes=[IsAdminUser])
    @transaction.atomic
    def issue(self, request, pk=None):
        booking = self.get_object()
        if booking.status != Booking.Status.APPROVED:
            return Response(
                {"success": False, "message": "Only approved bookings can be issued."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        asset = booking.asset
        if asset.available_qty < booking.quantity:
            return Response(
                {"success": False, "message": "Insufficient available quantity."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        asset.available_qty -= booking.quantity
        asset.save()
        booking.status = Booking.Status.ISSUED
        booking.issued_at = timezone.now()
        booking.save()
        AuditLog.log(request.user, "asset_issued", booking, {"qty": booking.quantity})
        notify_user(booking.user, "Asset issued", f"{booking.asset.name} has been issued to you.")
        return Response(BookingSerializer(booking).data)

    @action(detail=True, methods=["patch"], url_path="return", permission_classes=[IsAdminUser])
    @transaction.atomic
    def asset_return(self, request, pk=None):
        booking = self.get_object()
        if booking.status != Booking.Status.ISSUED:
            return Response(
                {"success": False, "message": "Only issued bookings can be returned."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        asset = booking.asset
        asset.available_qty += booking.quantity
        asset.save()
        booking.status = Booking.Status.RETURNED
        booking.returned_at = timezone.now()
        booking.save()
        AuditLog.log(request.user, "asset_returned", booking)
        return Response(BookingSerializer(booking).data)


class AuditLogListView(generics.ListAPIView):
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminUser]
    queryset = AuditLog.objects.select_related("actor").all()
