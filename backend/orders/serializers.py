from rest_framework import serializers
from .models import Order, OrderItem, OrderResource, OrderChecklist, ChecklistItem
from products.serializers import PackageSerializer, CampaignSerializer


class OrderItemSerializer(serializers.ModelSerializer):
    item_type = serializers.SerializerMethodField()
    item_details = serializers.SerializerMethodField()
    subtotal = serializers.SerializerMethodField()
    
    class Meta:
        model = OrderItem
        fields = ['id', 'item_type', 'item_details', 'quantity', 'price', 'subtotal', 'resources_uploaded']
    
    def get_item_type(self, obj):
        """Return the type of item (package or campaign)"""
        return obj.content_type.model
    
    def get_item_details(self, obj):
        """Return serialized item details"""
        if obj.content_object:
            if obj.content_type.model == 'package':
                return PackageSerializer(obj.content_object).data
            elif obj.content_type.model == 'campaign':
                return CampaignSerializer(obj.content_object).data
        return None
    
    def get_subtotal(self, obj):
        """Return subtotal for this order item"""
        return float(obj.get_subtotal())


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    total_items = serializers.SerializerMethodField()
    resource_upload_progress = serializers.SerializerMethodField()
    pending_resource_items = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'total_amount', 'status',
            'razorpay_order_id', 'razorpay_payment_id', 'payment_completed_at',
            'items', 'total_items', 'resource_upload_progress', 'pending_resource_items',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['order_number', 'razorpay_order_id', 'razorpay_payment_id']
    
    def get_total_items(self, obj):
        """Return total number of items"""
        return obj.get_total_items()
    
    def get_resource_upload_progress(self, obj):
        """Return resource upload progress percentage"""
        return obj.get_resource_upload_progress()
    
    def get_pending_resource_items(self, obj):
        """Return list of items that still need resources"""
        pending_items = []
        for item in obj.get_pending_resource_items():
            pending_items.append({
                'id': item.id,
                'item_type': item.content_type.model,
                'item_name': str(item.content_object) if item.content_object else 'Unknown',
                'quantity': item.quantity
            })
        return pending_items


class PaymentVerificationSerializer(serializers.Serializer):
    razorpay_order_id = serializers.CharField()
    razorpay_payment_id = serializers.CharField()
    razorpay_signature = serializers.CharField()


class OrderResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderResource
        fields = [
            'id', 'order_item', 'candidate_photo', 'party_logo',
            'campaign_slogan', 'preferred_date', 'whatsapp_number',
            'additional_notes', 'uploaded_at'
        ]
        read_only_fields = ['uploaded_at']
    
    def validate_candidate_photo(self, value):
        """Validate candidate photo file"""
        if value.size > 5 * 1024 * 1024:  # 5MB
            raise serializers.ValidationError('File size cannot exceed 5MB')
        return value
    
    def validate_party_logo(self, value):
        """Validate party logo file"""
        if value.size > 5 * 1024 * 1024:  # 5MB
            raise serializers.ValidationError('File size cannot exceed 5MB')
        return value
    
    def validate_whatsapp_number(self, value):
        """Validate WhatsApp number"""
        cleaned_number = ''.join(filter(str.isdigit, value))
        if len(cleaned_number) < 10:
            raise serializers.ValidationError('WhatsApp number must be at least 10 digits')
        return value


class ResourceUploadSerializer(serializers.Serializer):
    """Serializer for uploading resources for a specific order item"""
    order_item_id = serializers.IntegerField()
    candidate_photo = serializers.ImageField()
    party_logo = serializers.ImageField()
    campaign_slogan = serializers.CharField(max_length=1000)
    preferred_date = serializers.DateField()
    whatsapp_number = serializers.CharField(max_length=15)
    additional_notes = serializers.CharField(required=False, allow_blank=True, max_length=2000)
    
    def validate_candidate_photo(self, value):
        """Validate candidate photo file"""
        if value.size > 5 * 1024 * 1024:  # 5MB
            raise serializers.ValidationError('File size cannot exceed 5MB')
        return value
    
    def validate_party_logo(self, value):
        """Validate party logo file"""
        if value.size > 5 * 1024 * 1024:  # 5MB
            raise serializers.ValidationError('File size cannot exceed 5MB')
        return value
    
    def validate_whatsapp_number(self, value):
        """Validate WhatsApp number"""
        cleaned_number = ''.join(filter(str.isdigit, value))
        if len(cleaned_number) < 10:
            raise serializers.ValidationError('WhatsApp number must be at least 10 digits')
        return value


class ChecklistItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChecklistItem
        fields = ['id', 'description', 'completed', 'completed_at', 'completed_by', 'order_index']


class OrderChecklistSerializer(serializers.ModelSerializer):
    items = ChecklistItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = OrderChecklist
        fields = ['id', 'order', 'items', 'created_at']
