from django.urls import path, re_path
from .views import (
    AdminOrderListView,
    AdminOrderDetailView,
    get_order_statistics,
    assign_order_to_staff,
    StaffListView,
    NotificationListView,
    mark_notification_read,
    mark_all_notifications_read,
    StaffOrderListView,
    StaffOrderDetailView,
    manage_product_resource_fields,
    manage_resource_field,
    reorder_resource_fields,
    analytics_overview,
    analytics_revenue_trend,
    analytics_top_products,
    analytics_staff_performance,
    analytics_order_distribution,
    analytics_export,
)
# Import product views for admin product management
from products import views as product_views

urlpatterns = [
    # Order management endpoints
    path('orders/statistics/', get_order_statistics, name='admin-order-statistics'),
    path('orders/', AdminOrderListView.as_view(), name='admin-order-list'),
    path('orders/<int:pk>/', AdminOrderDetailView.as_view(), name='admin-order-detail'),
    path('orders/<int:order_id>/assign/', assign_order_to_staff, name='admin-order-assign'),
    
    # Staff management endpoints
    path('staff/', StaffListView.as_view(), name='admin-staff-list'),
    
    # Notification endpoints
    path('notifications/', NotificationListView.as_view(), name='notification-list'),
    path('notifications/<int:notification_id>/mark-read/', mark_notification_read, name='notification-mark-read'),
    path('notifications/mark-all-read/', mark_all_notifications_read, name='notification-mark-all-read'),
    
    # Product management endpoints
    path('products/', product_views.list_all_products, name='product-list'),
    path('products/package/', product_views.create_package, name='package-create'),
    path('products/campaign/', product_views.create_campaign, name='campaign-create'),
    
    # Resource field management endpoints - MUST come before product detail to avoid conflicts
    path('products/resource-fields/reorder/', reorder_resource_fields, name='reorder-resource-fields'),
    path('products/resource-fields/<int:field_id>/', manage_resource_field, name='manage-resource-field'),
    path('products/<str:product_type>/<int:product_id>/resource-fields/', manage_product_resource_fields, name='product-resource-fields'),
    
    # Product detail and management - comes after more specific patterns
    path('products/<str:product_type>/<int:product_id>/', product_views.get_product_detail, name='product-detail'),
    path('products/<str:product_type>/<int:product_id>/update/', product_views.update_product, name='product-update'),
    path('products/<str:product_type>/<int:product_id>/delete/', product_views.delete_product, name='product-delete'),
    path('products/<str:product_type>/<int:product_id>/toggle-status/', product_views.toggle_product_status, name='product-toggle-status'),
    path('products/<str:product_type>/<int:product_id>/audit-logs/', product_views.get_product_audit_logs, name='product-audit-logs'),
    
    # Checklist template management endpoints
    path('products/<str:product_type>/<int:product_id>/checklist-template/', 
         product_views.ChecklistTemplateViewSet.as_view({
             'get': 'list',
             'post': 'create'
         }), 
         name='checklist-template-list'),
    path('products/checklist-template/<int:pk>/', 
         product_views.ChecklistTemplateViewSet.as_view({
             'get': 'retrieve',
             'put': 'update',
             'patch': 'partial_update',
             'delete': 'destroy'
         }), 
         name='checklist-template-detail'),
    path('products/checklist-template/reorder/', 
         product_views.ChecklistTemplateViewSet.as_view({
             'patch': 'reorder'
         }), 
         name='checklist-template-reorder'),
    
    # Product image management endpoints
    path('products/<str:product_type>/<int:product_id>/images/', 
         product_views.ProductImageViewSet.as_view({
             'post': 'create'
         }), 
         name='product-images-create'),
    path('products/images/<int:pk>/', 
         product_views.ProductImageViewSet.as_view({
             'get': 'retrieve',
             'put': 'update',
             'patch': 'partial_update',
             'delete': 'destroy'
         }), 
         name='product-images-detail'),
    path('products/images/reorder/', 
         product_views.ProductImageViewSet.as_view({
             'patch': 'reorder'
         }), 
         name='product-images-reorder'),
    path('products/images/<int:pk>/set-primary/', 
         product_views.ProductImageViewSet.as_view({
             'patch': 'set_primary'
         }), 
         name='product-images-set-primary'),
    

    
    # Analytics endpoints
    path('analytics/overview/', analytics_overview, name='analytics-overview'),
    path('analytics/revenue-trend/', analytics_revenue_trend, name='analytics-revenue-trend'),
    path('analytics/top-products/', analytics_top_products, name='analytics-top-products'),
    path('analytics/staff-performance/', analytics_staff_performance, name='analytics-staff-performance'),
    path('analytics/order-distribution/', analytics_order_distribution, name='analytics-order-distribution'),
    path('analytics/export/', analytics_export, name='analytics-export'),
]
