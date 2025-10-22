from django.urls import path
from . import views

urlpatterns = [
    path('create/', views.create_order, name='create-order'),
    path('<int:order_id>/', views.get_order, name='get-order'),
    path('<int:order_id>/payment-success/', views.verify_payment, name='verify-payment'),
    path('<int:order_id>/upload-resources/', views.upload_resources, name='upload-resources'),
    path('<int:order_id>/resources/', views.get_order_resources, name='get-order-resources'),
    path('<int:order_id>/resource-status/', views.get_resource_upload_status, name='get-resource-upload-status'),
    path('my-orders/', views.get_my_orders, name='my-orders'),
]
