"""Human-readable labels for audit log entries shown in the admin UI."""

from apps.bookings.models import Booking

ACTION_LABELS = {
    "booking_created": "New booking",
    "booking_approved": "Approved",
    "booking_rejected": "Rejected",
    "asset_issued": "Issued",
    "asset_returned": "Returned",
    "booking_cancelled": "Cancelled",
}


def _booking_for_log(log):
    if log.target_type != "Booking":
        return None
    try:
        return Booking.objects.select_related("user", "asset").get(pk=log.target_id)
    except (Booking.DoesNotExist, ValueError, TypeError):
        return None


def _asset_name(meta, booking):
    if meta.get("asset_name"):
        return meta["asset_name"]
    if booking:
        return booking.asset.name
    asset_id = meta.get("asset")
    if asset_id:
        from apps.assets.models import Asset

        try:
            return Asset.objects.get(pk=asset_id).name
        except Asset.DoesNotExist:
            pass
    return None


def _quantity(meta, booking):
    if meta.get("quantity") is not None:
        return meta["quantity"]
    if meta.get("qty") is not None:
        return meta["qty"]
    if booking:
        return booking.quantity
    return None


def booking_audit_metadata(booking):
    """Rich metadata stored on new audit rows (no raw UUIDs in the UI)."""
    return {
        "asset_name": booking.asset.name,
        "quantity": booking.quantity,
        "user_name": booking.user.full_name,
    }


def build_audit_display(log):
    meta = log.metadata or {}
    booking = _booking_for_log(log)
    asset_name = _asset_name(meta, booking)
    qty = _quantity(meta, booking)
    user_name = meta.get("user_name") or (booking.user.full_name if booking else None)

    if user_name and asset_name:
        target_label = f"{user_name} · {asset_name}"
    elif user_name:
        target_label = user_name
    elif asset_name:
        target_label = asset_name
    else:
        target_label = ACTION_LABELS.get(log.action, log.action.replace("_", " ").title())

    parts = []
    if asset_name:
        parts.append(f"Asset: {asset_name}")
    if qty is not None:
        parts.append(f"Qty: {qty}")

    if log.action == "asset_issued" and qty is not None:
        summary = f"Qty: {qty}"
    elif parts:
        summary = " · ".join(parts)
    else:
        summary = ""

    return {
        "action_label": ACTION_LABELS.get(log.action, log.action.replace("_", " ").title()),
        "summary": summary,
        "target_label": target_label,
    }
