from rest_framework import serializers
from authentication.models import CustomUser
from orders.models import Order, OrderItem, OrderResource, OrderChecklist, ChecklistItem
from products.serializers import PackageSerializer, CampaignSerializer
from .models import Notification


class UserBasicSerializer(serializers.ModelSerializer):
    """Basic user information for admin views"""
    name = serializers.SerializerMethodField()
    phone = serializers.CharField(source='phone_number', read_only=True)
    
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'phone_number', 'phone', 'name', 'role', 'email', 'first_name', 'last_name']
    
    def get_name(self, obj):
        """Return full name or username if name is not available"""
        if obj.first_name and obj.last_name:
            return f"{obj.first_name} {obj.last_name}"
        elif obj.first_name:
            return obj.first_name
        elif obj.last_name:
            return obj.last_name
        else:
            return obj.username if obj.username else None


class StaffSerializer(serializers.ModelSerializer):
    """Serializer for staff members with assigned order count"""
    assigned_orders_count = serializers.SerializerMethodField()
    name = serializers.SerializerMethodField()
    phone = serializers.CharField(source='phone_number', read_only=True)
    
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'phone_number', 'phone', 'name', 'email', 'first_name', 'last_name', 'assigned_orders_count', 'created_at']
    
    def get_assigned_orders_count(self, obj):
        """Get count of orders assigned to this staff member"""
        return obj.assigned_orders.filter(status__in=['assigned', 'in_progress']).count()
    
    def get_name(self, obj):
        """Return full name or username if name is not available"""
        if obj.first_name and obj.last_name:
            return f"{obj.first_name} {obj.last_name}"
        elif obj.first_name:
            return obj.first_name
        elif obj.last_name:
            return obj.last_name
        else:
            return obj.username if obj.username else None


class OrderItemDetailSerializer(serializers.ModelSerializer):
    """Detailed order item serializer for admin views"""
    item_type = serializers.SerializerMethodField()
    item_details = serializers.SerializerMethodField()
    subtotal = serializers.SerializerMethodField()
    resources = serializers.SerializerMethodField()
    
    class Meta:
        model = OrderItem
        fields = ['id', 'item_type', 'item_details', 'quantity', 'price', 'subtotal', 'resources_uploaded', 'resources']
    
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
    
    def get_resources(self, obj):
        """Return uploaded resources if available"""
        try:
            resource = obj.resources
            return {
                'id': resource.id,
                'candidate_photo': resource.candidate_photo.url if resource.candidate_photo else None,
                'party_logo': resource.party_logo.url if resource.party_logo else None,
                'campaign_slogan': resource.campaign_slogan,
                'preferred_date': resource.preferred_date,
                'whatsapp_number': resource.whatsapp_number,
                'additional_notes': resource.additional_notes,
                'uploaded_at': resource.uploaded_at
            }
        except OrderResource.DoesNotExist:
            return None


class AdminOrderListSerializer(serializers.ModelSerializer):
    """Serializer for order list in admin panel"""
    user = UserBasicSerializer(read_only=True)
    assigned_to = UserBasicSerializer(read_only=True)
    total_items = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'user', 'total_amount', 'status',
            'assigned_to', 'total_items', 'payment_completed_at',
            'created_at', 'updated_at'
        ]
    
    def get_total_items(self, obj):
        """Return total number of items"""
        return obj.get_total_items()


class AdminOrderDetailSerializer(serializers.ModelSerializer):
    """Detailed order serializer for admin panel"""
    user = UserBasicSerializer(read_only=True)
    assigned_to = UserBasicSerializer(read_only=True)
    items = OrderItemDetailSerializer(many=True, read_only=True)
    total_items = serializers.SerializerMethodField()
    resource_upload_progress = serializers.SerializerMethodField()
    resources = serializers.SerializerMethodField()
    checklist = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'user', 'total_amount', 'status',
            'razorpay_order_id', 'razorpay_payment_id', 'payment_completed_at',
            'assigned_to', 'items', 'total_items', 'resource_upload_progress',
            'resources', 'checklist', 'created_at', 'updated_at'
        ]
    
    def get_total_items(self, obj):
        """Return total number of items"""
        return obj.get_total_items()
    
    def get_resource_upload_progress(self, obj):
        """Return resource upload progress percentage"""
        return obj.get_resource_upload_progress()
    
    def get_resources(self, obj):
        """Return all uploaded resources from all order items"""
        resources_list = []
        for item in obj.items.all():
            try:
                resource = item.resources
                resources_list.append({
                    'id': resource.id,
                    'candidate_photo': resource.candidate_photo.url if resource.candidate_photo else None,
                    'party_logo': resource.party_logo.url if resource.party_logo else None,
                    'campaign_slogan': resource.campaign_slogan,
                    'preferred_date': resource.preferred_date,
                    'whatsapp_number': resource.whatsapp_number,
                    'additional_notes': resource.additional_notes,
                    'uploaded_at': resource.uploaded_at
                })
            except OrderResource.DoesNotExist:
                # Skip items without resources
                continue
        return resources_list
    
    def get_checklist(self, obj):
        """Return checklist if exists"""
        try:
            checklist = obj.checklist
            items = checklist.items.all()
            total_items = items.count()
            completed_items = items.filter(completed=True).count()
            
            return {
                'id': checklist.id,
                'total_items': total_items,
                'completed_items': completed_items,
                'progress_percentage': int((completed_items / total_items * 100)) if total_items > 0 else 0,
                'items': [{
                    'id': item.id,
                    'description': item.description,
                    'completed': item.completed,
                    'completed_at': item.completed_at,
                    'completed_by': UserBasicSerializer(item.completed_by).data if item.completed_by else None,
                    'order_index': item.order_index
                } for item in items]
            }
        except OrderChecklist.DoesNotExist:
            return None


class OrderAssignmentSerializer(serializers.Serializer):
    """Serializer for assigning orders to staff"""
    staff_id = serializers.IntegerField()
    
    def validate_staff_id(self, value):
        """Validate that the staff member exists and has staff or admin role"""
        try:
            user = CustomUser.objects.get(id=value)
            if user.role not in ['staff', 'admin']:
                raise serializers.ValidationError('User must have staff or admin role')
            return value
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError('Staff member not found')


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for notifications"""
    order_number = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = ['id', 'notification_type', 'title', 'message', 'order', 'order_number', 'is_read', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_order_number(self, obj):
        """Return order number if order exists"""
        return obj.order.order_number if obj.order else None
