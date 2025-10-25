"""
URL configuration for election_cart project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from admin_panel.views import StaffOrderListView, StaffOrderDetailView, update_checklist_item

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),
    path('api/', include('products.urls')),
    path('api/cart/', include('cart.urls')),
    path('api/orders/', include('orders.urls')),
    path('api/admin/', include('admin_panel.urls')),
    # Staff endpoints
    path('api/staff/orders/', StaffOrderListView.as_view(), name='staff-order-list'),
    path('api/staff/orders/<int:pk>/', StaffOrderDetailView.as_view(), name='staff-order-detail'),
    path('api/staff/checklist/<int:item_id>/', update_checklist_item, name='staff-checklist-update'),
    # Secure file serving
    path('api/secure-files/', include('products.file_urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
