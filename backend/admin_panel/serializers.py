from rest_framework import serializers
from authentication.models import CustomUser
from orders.models import Order, OrderItem, OrderResource, OrderChecklist, ChecklistItem, DynamicResourceSubmission
from products.models import ResourceFieldDefinition
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
        """Return uploaded resources if available (both static and dynamic)"""
        resources = {}
        
        # Check for old static resources
        try:
            resource = obj.resources
            resources['static'] = {
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
            resources['static'] = None
        
        # Get dynamic resource submissions
        dynamic_submissions = DynamicResourceSubmission.objects.filter(order_item=obj).select_related('field_definition')
        resources['dynamic'] = []
        
        for submission in dynamic_submissions:
            field_def = submission.field_definition
            submission_data = {
                'id': submission.id,
                'field_id': field_def.id,
                'field_name': field_def.field_name,
                'field_type': field_def.field_type,
                'uploaded_at': submission.uploaded_at
            }
            
            # Add the appropriate value based on field type
            if field_def.field_type == 'text':
                submission_data['value'] = submission.text_value
            elif field_def.field_type == 'number':
                submission_data['value'] = submission.number_value
            elif field_def.field_type in ['image', 'document']:
                submission_data['value'] = submission.file_value.url if submission.file_value else None
                submission_data['file_name'] = submission.file_value.name if submission.file_value else None
            
            resources['dynamic'].append(submission_data)
        
        return resources


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
        """Return all uploaded resources from all order items (both static and dynamic)"""
        resources_list = []
        
        for item in obj.items.all():
            item_resources = {
                'order_item_id': item.id,
                'item_type': item.content_type.model,
                'item_name': str(item.content_object) if item.content_object else 'Unknown',
                'static': None,
                'dynamic': []
            }
            
            # Check for old static resources
            try:
                resource = item.resources
                item_resources['static'] = {
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
                pass
            
            # Get dynamic resource submissions
            dynamic_submissions = DynamicResourceSubmission.objects.filter(order_item=item).select_related('field_definition')
            
            for submission in dynamic_submissions:
                field_def = submission.field_definition
                submission_data = {
                    'id': submission.id,
                    'field_id': field_def.id,
                    'field_name': field_def.field_name,
                    'field_type': field_def.field_type,
                    'uploaded_at': submission.uploaded_at
                }
                
                # Add the appropriate value based on field type
                if field_def.field_type == 'text':
                    submission_data['value'] = submission.text_value
                elif field_def.field_type == 'number':
                    submission_data['value'] = submission.number_value
                elif field_def.field_type in ['image', 'document']:
                    submission_data['value'] = submission.file_value.url if submission.file_value else None
                    submission_data['file_name'] = submission.file_value.name if submission.file_value else None
                
                item_resources['dynamic'].append(submission_data)
            
            # Only add to list if there are any resources
            if item_resources['static'] or item_resources['dynamic']:
                resources_list.append(item_resources)
        
        return resources_list
    
    def get_checklist(self, obj):
        """Return checklist if exists"""
        try:
            from .checklist_service import ChecklistService
            
            checklist = obj.checklist
            items = checklist.items.all()
            
            # Use ChecklistService to calculate progress excluding optional items
            progress = ChecklistService.get_checklist_progress(checklist)
            
            return {
                'id': checklist.id,
                'total_items': progress['total_items'],
                'completed_items': progress['completed_items'],
                'required_items': progress['required_items'],
                'completed_required': progress['completed_required'],
                'progress_percentage': progress['progress_percentage'],
                'items': [{
                    'id': item.id,
                    'description': item.description,
                    'completed': item.completed,
                    'completed_at': item.completed_at,
                    'completed_by': UserBasicSerializer(item.completed_by).data if item.completed_by else None,
                    'order_index': item.order_index,
                    'is_optional': item.is_optional,
                    'template_item_id': item.template_item.id if item.template_item else None
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


class ResourceFieldDefinitionSerializer(serializers.ModelSerializer):
    """Serializer for resource field definitions"""
    product_type = serializers.SerializerMethodField()
    product_id = serializers.IntegerField(source='object_id', read_only=True)
    
    class Meta:
        model = ResourceFieldDefinition
        fields = [
            'id', 'product_type', 'product_id', 'field_name', 'field_type',
            'is_required', 'order', 'help_text', 'max_file_size_mb',
            'max_length', 'min_value', 'max_value', 'allowed_extensions',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_product_type(self, obj):
        """Return the product type (package or campaign)"""
        return obj.content_type.model if obj.content_type else None
    
    def validate(self, data):
        """Validate field configuration based on field type"""
        field_type = data.get('field_type')
        
        # Validate image field configuration
        if field_type == 'image':
            if data.get('max_file_size_mb') and data['max_file_size_mb'] > 10:
                raise serializers.ValidationError({
                    'max_file_size_mb': 'Maximum file size for images cannot exceed 10MB'
                })
        
        # Validate document field configuration
        elif field_type == 'document':
            if data.get('max_file_size_mb') and data['max_file_size_mb'] > 20:
                raise serializers.ValidationError({
                    'max_file_size_mb': 'Maximum file size for documents cannot exceed 20MB'
                })
        
        # Validate text field configuration
        elif field_type == 'text':
            if data.get('max_length') and data['max_length'] > 500:
                raise serializers.ValidationError({
                    'max_length': 'Maximum length for text fields cannot exceed 500 characters'
                })
        
        # Validate number field configuration
        elif field_type == 'number':
            min_val = data.get('min_value')
            max_val = data.get('max_value')
            if min_val is not None and max_val is not None and min_val > max_val:
                raise serializers.ValidationError({
                    'min_value': 'Minimum value cannot be greater than maximum value'
                })
        
        return data


class ResourceFieldCreateSerializer(serializers.Serializer):
    """Serializer for creating resource field definitions"""
    field_name = serializers.CharField(max_length=100)
    field_type = serializers.ChoiceField(choices=['image', 'text', 'number', 'document', 'phone', 'date'])
    is_required = serializers.BooleanField(default=True)
    order = serializers.IntegerField(default=0)
    help_text = serializers.CharField(max_length=200, required=False, allow_blank=True)
    max_file_size_mb = serializers.IntegerField(required=False, allow_null=True)
    max_length = serializers.IntegerField(required=False, allow_null=True)
    min_value = serializers.IntegerField(required=False, allow_null=True)
    max_value = serializers.IntegerField(required=False, allow_null=True)
    allowed_extensions = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_empty=True
    )
    
    def validate(self, data):
        """Validate field configuration based on field type"""
        field_type = data.get('field_type')
        
        # Validate image field configuration
        if field_type == 'image':
            if data.get('max_file_size_mb') and data['max_file_size_mb'] > 10:
                raise serializers.ValidationError({
                    'max_file_size_mb': 'Maximum file size for images cannot exceed 10MB'
                })
        
        # Validate document field configuration
        elif field_type == 'document':
            if data.get('max_file_size_mb') and data['max_file_size_mb'] > 20:
                raise serializers.ValidationError({
                    'max_file_size_mb': 'Maximum file size for documents cannot exceed 20MB'
                })
        
        # Validate text field configuration
        elif field_type == 'text':
            if data.get('max_length') and data['max_length'] > 500:
                raise serializers.ValidationError({
                    'max_length': 'Maximum length for text fields cannot exceed 500 characters'
                })
        
        # Validate number field configuration
        elif field_type == 'number':
            min_val = data.get('min_value')
            max_val = data.get('max_value')
            if min_val is not None and max_val is not None and min_val > max_val:
                raise serializers.ValidationError({
                    'min_value': 'Minimum value cannot be greater than maximum value'
                })
        
        return data


class ResourceFieldReorderSerializer(serializers.Serializer):
    """Serializer for reordering resource fields"""
    field_orders = serializers.ListField(
        child=serializers.DictField(child=serializers.IntegerField())
    )
    
    def validate_field_orders(self, value):
        """Validate that each item has id and order"""
        for item in value:
            if 'id' not in item or 'order' not in item:
                raise serializers.ValidationError('Each item must have id and order fields')
        return value
