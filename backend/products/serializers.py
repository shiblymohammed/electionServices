from rest_framework import serializers
from .models import Package, PackageItem, Campaign


class PackageItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PackageItem
        fields = ['id', 'name', 'quantity']


class PackageSerializer(serializers.ModelSerializer):
    items = PackageItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Package
        fields = ['id', 'name', 'price', 'description', 'items', 'is_active', 'created_at']


class CampaignSerializer(serializers.ModelSerializer):
    class Meta:
        model = Campaign
        fields = ['id', 'name', 'price', 'unit', 'description', 'is_active', 'created_at']
