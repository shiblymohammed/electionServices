from rest_framework import serializers
from .models import Package, PackageItem, Campaign, ChecklistTemplateItem, ProductAuditLog, ProductImage
from django.contrib.contenttypes.models import ContentType


class PackageItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PackageItem
        fields = ['id', 'name', 'quantity']


class PackageSerializer(serializers.ModelSerializer):
    items = PackageItemSerializer(many=True, read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    images = serializers.SerializerMethodField()
    primary_image = serializers.SerializerMethodField()
    type = serializers.SerializerMethodField()
    
    class Meta:
        model = Package
        fields = ['id', 'name', 'price', 'description', 'features', 'deliverables', 'items', 'is_active', 'created_at', 'updated_at', 'created_by', 'created_by_name', 'images', 'primary_image', 'type']
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by', 'created_by_name', 'images', 'primary_image', 'type']
    
    def get_type(self, obj):
        return 'package'
    
    def get_images(self, obj):
        """Get all images for the package, ordered with primary first"""
        from django.contrib.contenttypes.models import ContentType
        content_type = ContentType.objects.get_for_model(Package)
        images = ProductImage.objects.filter(
            content_type=content_type,
            object_id=obj.id
        ).order_by('-is_primary', 'order')
        
        request = self.context.get('request')
        return ProductImageSerializer(images, many=True, context={'request': request}).data
    
    def get_primary_image(self, obj):
        """Get the primary image for the package"""
        from django.contrib.contenttypes.models import ContentType
        content_type = ContentType.objects.get_for_model(Package)
        primary_image = ProductImage.objects.filter(
            content_type=content_type,
            object_id=obj.id,
            is_primary=True
        ).first()
        
        if primary_image:
            request = self.context.get('request')
            return ProductImageSerializer(primary_image, context={'request': request}).data
        return None


class PackageWriteSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating packages"""
    items = PackageItemSerializer(many=True, required=False)
    
    class Meta:
        model = Package
        fields = ['id', 'name', 'price', 'description', 'features', 'deliverables', 'items', 'is_active']
        read_only_fields = ['id']
    
    def validate_name(self, value):
        """Validate that package name is unique"""
        instance = self.instance
        if instance:
            # Update case - exclude current instance
            if Package.objects.exclude(id=instance.id).filter(name=value).exists():
                raise serializers.ValidationError("A package with this name already exists.")
        else:
            # Create case
            if Package.objects.filter(name=value).exists():
                raise serializers.ValidationError("A package with this name already exists.")
        return value
    
    def validate_price(self, value):
        """Validate that price is positive"""
        if value <= 0:
            raise serializers.ValidationError("Price must be greater than zero.")
        return value
    
    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        package = Package.objects.create(**validated_data)
        
        # Create package items
        for item_data in items_data:
            PackageItem.objects.create(package=package, **item_data)
        
        return package
    
    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        
        # Update package fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update items if provided
        if items_data is not None:
            # Delete existing items and create new ones
            instance.items.all().delete()
            for item_data in items_data:
                PackageItem.objects.create(package=instance, **item_data)
        
        return instance


class CampaignSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    images = serializers.SerializerMethodField()
    primary_image = serializers.SerializerMethodField()
    type = serializers.SerializerMethodField()
    
    class Meta:
        model = Campaign
        fields = ['id', 'name', 'price', 'unit', 'description', 'features', 'deliverables', 'is_active', 'created_at', 'updated_at', 'created_by', 'created_by_name', 'images', 'primary_image', 'type']
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by', 'created_by_name', 'images', 'primary_image', 'type']
    
    def get_type(self, obj):
        return 'campaign'
    
    def get_images(self, obj):
        """Get all images for the campaign, ordered with primary first"""
        from django.contrib.contenttypes.models import ContentType
        content_type = ContentType.objects.get_for_model(Campaign)
        images = ProductImage.objects.filter(
            content_type=content_type,
            object_id=obj.id
        ).order_by('-is_primary', 'order')
        
        request = self.context.get('request')
        return ProductImageSerializer(images, many=True, context={'request': request}).data
    
    def get_primary_image(self, obj):
        """Get the primary image for the campaign"""
        from django.contrib.contenttypes.models import ContentType
        content_type = ContentType.objects.get_for_model(Campaign)
        primary_image = ProductImage.objects.filter(
            content_type=content_type,
            object_id=obj.id,
            is_primary=True
        ).first()
        
        if primary_image:
            request = self.context.get('request')
            return ProductImageSerializer(primary_image, context={'request': request}).data
        return None


class CampaignWriteSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating campaigns"""
    
    class Meta:
        model = Campaign
        fields = ['id', 'name', 'price', 'unit', 'description', 'features', 'deliverables', 'is_active']
        read_only_fields = ['id']
    
    def validate_name(self, value):
        """Validate that campaign name is unique"""
        instance = self.instance
        if instance:
            # Update case - exclude current instance
            if Campaign.objects.exclude(id=instance.id).filter(name=value).exists():
                raise serializers.ValidationError("A campaign with this name already exists.")
        else:
            # Create case
            if Campaign.objects.filter(name=value).exists():
                raise serializers.ValidationError("A campaign with this name already exists.")
        return value
    
    def validate_price(self, value):
        """Validate that price is positive"""
        if value <= 0:
            raise serializers.ValidationError("Price must be greater than zero.")
        return value


class ProductListSerializer(serializers.Serializer):
    """Serializer for listing all products (packages and campaigns together)"""
    id = serializers.IntegerField()
    name = serializers.CharField()
    price = serializers.DecimalField(max_digits=10, decimal_places=2)
    description = serializers.CharField()
    is_active = serializers.BooleanField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()
    created_by_name = serializers.CharField()
    type = serializers.CharField()  # 'package' or 'campaign'


class ProductAuditLogSerializer(serializers.ModelSerializer):
    """Serializer for product audit logs"""
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    product_type = serializers.SerializerMethodField()
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    
    class Meta:
        model = ProductAuditLog
        fields = ['id', 'action', 'action_display', 'user', 'user_name', 'timestamp', 'changes', 'product_type', 'object_id']
        read_only_fields = ['id', 'timestamp']
    
    def get_product_type(self, obj):
        return obj.content_type.model


class ChecklistTemplateItemSerializer(serializers.ModelSerializer):
    product_type = serializers.SerializerMethodField()
    product_id = serializers.SerializerMethodField()
    
    class Meta:
        model = ChecklistTemplateItem
        fields = [
            'id', 'name', 'description', 'order', 'is_optional', 
            'estimated_duration_minutes', 'created_at', 'product_type', 'product_id'
        ]
        read_only_fields = ['id', 'created_at', 'product_type', 'product_id']
    
    def get_product_type(self, obj):
        return obj.content_type.model
    
    def get_product_id(self, obj):
        return obj.object_id



class ProductImageSerializer(serializers.ModelSerializer):
    """Serializer for product images"""
    image_url = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()
    product_type = serializers.SerializerMethodField()
    product_id = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductImage
        fields = [
            'id', 'image', 'image_url', 'thumbnail', 'thumbnail_url', 
            'is_primary', 'order', 'alt_text', 'uploaded_at',
            'product_type', 'product_id'
        ]
        read_only_fields = ['id', 'uploaded_at', 'thumbnail', 'image_url', 'thumbnail_url', 'product_type', 'product_id']
    
    def get_image_url(self, obj):
        if obj.image:
            from .cdn import CDNService
            from django.conf import settings
            
            # Use CDN URL if configured
            cdn_url = CDNService.get_image_url_with_cache_headers(obj.image.name)
            
            # If CDN is not configured, fall back to building absolute URI
            if not getattr(settings, 'CDN_BASE_URL', None):
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(obj.image.url)
            
            return cdn_url
        return None
    
    def get_thumbnail_url(self, obj):
        if obj.thumbnail:
            from .cdn import CDNService
            from django.conf import settings
            
            # Use CDN URL if configured
            cdn_url = CDNService.get_image_url_with_cache_headers(obj.thumbnail.name)
            
            # If CDN is not configured, fall back to building absolute URI
            if not getattr(settings, 'CDN_BASE_URL', None):
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(obj.thumbnail.url)
            
            return cdn_url
        return None
    
    def get_product_type(self, obj):
        return obj.content_type.model if obj.content_type else None
    
    def get_product_id(self, obj):
        return obj.object_id


class ProductImageWriteSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating product images"""
    
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'is_primary', 'order', 'alt_text']
        read_only_fields = ['id']
    
    def validate(self, data):
        """Validate image upload"""
        # Additional validation can be added here
        return data
