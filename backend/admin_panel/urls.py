from django.urls import path
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
)

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
]
