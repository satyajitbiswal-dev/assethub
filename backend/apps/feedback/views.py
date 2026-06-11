from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.permissions import IsAdminUser
from .models import FeedbackCampaign, FeedbackResponse
from .serializers import FeedbackCampaignSerializer, FeedbackResponseSerializer


class FeedbackCampaignViewSet(viewsets.ModelViewSet):
    """
    Admin-only CRUD for campaigns.
    GET  /api/feedback/campaigns/          — list all campaigns (admin)
    POST /api/feedback/campaigns/          — create new campaign (admin)
    GET  /api/feedback/campaigns/active/   — active campaign (any auth user)
    PATCH /api/feedback/campaigns/:id/activate/   — activate (admin)
    PATCH /api/feedback/campaigns/:id/deactivate/ — deactivate (admin)
    """
    queryset = FeedbackCampaign.objects.all()
    serializer_class = FeedbackCampaignSerializer

    def get_permissions(self):
        if self.action == "active":
            return [permissions.IsAuthenticated()]
        return [IsAdminUser()]

    def perform_create(self, serializer):
        # Deactivate all other campaigns when a new one is created as active
        if serializer.validated_data.get("is_active", True):
            FeedbackCampaign.objects.filter(is_active=True).update(
                is_active=False, deactivated_at=timezone.now()
            )
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=["get"], url_path="active")
    def active(self, request):
        """Returns the single active campaign, or 404 if none."""
        campaign = FeedbackCampaign.objects.filter(is_active=True).first()
        if not campaign:
            return Response(
                {"detail": "No active feedback campaign at the moment."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(FeedbackCampaignSerializer(campaign).data)

    @action(detail=True, methods=["patch"], url_path="activate")
    def activate(self, request, pk=None):
        """Activate this campaign — deactivates all others first."""
        FeedbackCampaign.objects.filter(is_active=True).update(
            is_active=False, deactivated_at=timezone.now()
        )
        campaign = self.get_object()
        campaign.is_active = True
        campaign.deactivated_at = None
        campaign.save()
        return Response(FeedbackCampaignSerializer(campaign).data)

    @action(detail=True, methods=["patch"], url_path="deactivate")
    def deactivate(self, request, pk=None):
        """Close this campaign."""
        campaign = self.get_object()
        campaign.is_active = False
        campaign.deactivated_at = timezone.now()
        campaign.save()
        return Response(FeedbackCampaignSerializer(campaign).data)


class FeedbackResponseViewSet(viewsets.ModelViewSet):
    """
    Users submit responses; admin reads all.
    POST /api/feedback/responses/                        — submit (any auth user)
    GET  /api/feedback/responses/?campaign=<id>          — list by campaign (admin)
    GET  /api/feedback/responses/my/?campaign=<id>       — check if current user submitted
    """
    serializer_class = FeedbackResponseSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve", "destroy"]:
            return [IsAdminUser()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = FeedbackResponse.objects.select_related("user", "campaign")
        campaign_id = self.request.query_params.get("campaign")
        if campaign_id:
            qs = qs.filter(campaign__id=campaign_id)
        # Non-admin users can only see their own responses
        if self.request.user.role != "admin":
            qs = qs.filter(user=self.request.user)
        return qs

    @action(detail=False, methods=["get"], url_path="my")
    def my_response(self, request):
        """
        Returns the current user's response for a given campaign, or 404.
        Used by the frontend to show 'already submitted' state.
        """
        campaign_id = request.query_params.get("campaign")
        if not campaign_id:
            return Response(
                {"detail": "campaign query param required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            resp = FeedbackResponse.objects.get(
                campaign__id=campaign_id, user=request.user
            )
            return Response(FeedbackResponseSerializer(resp).data)
        except FeedbackResponse.DoesNotExist:
            return Response(
                {"detail": "No response submitted yet."},
                status=status.HTTP_404_NOT_FOUND,
            )