from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from .models import Package, Campaign
from .serializers import PackageSerializer, CampaignSerializer


class PackageViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing packages.
    Provides list and detail endpoints.
    """
    queryset = Package.objects.filter(is_active=True).prefetch_related('items')
    serializer_class = PackageSerializer
    permission_classes = [AllowAny]


class CampaignViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing campaigns.
    Provides list and detail endpoints.
    """
    queryset = Campaign.objects.filter(is_active=True)
    serializer_class = CampaignSerializer
    permission_classes = [AllowAny]
