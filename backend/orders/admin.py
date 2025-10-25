from django.contrib import admin
from .models import Order, OrderItem, OrderResource, OrderChecklist, ChecklistItem, DynamicResourceSubmission


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['content_type', 'object_id', 'price']


class ChecklistItemInline(admin.TabularInline):
    model = ChecklistItem
    extra = 0


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_number', 'user', 'total_amount', 'status', 'assigned_to', 'created_at']
    list_filter = ['status', 'created_at', 'assigned_to']
    search_fields = ['order_number', 'user__phone_number', 'user__username']
    inlines = [OrderItemInline]


@admin.register(OrderResource)
class OrderResourceAdmin(admin.ModelAdmin):
    list_display = ['order_item', 'whatsapp_number', 'preferred_date', 'uploaded_at']
    search_fields = ['order_item__order__order_number', 'whatsapp_number']


@admin.register(OrderChecklist)
class OrderChecklistAdmin(admin.ModelAdmin):
    list_display = ['order', 'created_at']
    inlines = [ChecklistItemInline]



@admin.register(DynamicResourceSubmission)
class DynamicResourceSubmissionAdmin(admin.ModelAdmin):
    list_display = ['order_item', 'field_definition', 'get_value', 'uploaded_at']
    list_filter = ['field_definition__field_type', 'uploaded_at']
    search_fields = ['order_item__order__order_number', 'field_definition__field_name']
    readonly_fields = ['uploaded_at']
    
    def get_value(self, obj):
        """Display the appropriate value based on field type"""
        if obj.field_definition.field_type == 'text':
            return obj.text_value[:50] if obj.text_value else None
        elif obj.field_definition.field_type == 'number':
            return obj.number_value
        elif obj.field_definition.field_type in ['image', 'document']:
            return obj.file_value.name if obj.file_value else None
        return None
    get_value.short_description = 'Value'
