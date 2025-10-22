from django.contrib import admin
from .models import Order, OrderItem, OrderResource, OrderChecklist, ChecklistItem


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
