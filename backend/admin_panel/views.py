from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count

from authentication.models import CustomUser
from authentication.permissions import IsAdmin, IsAdminOrStaff
from orders.models import Order, OrderChecklist, ChecklistItem
from .models import Notification
from .serializers import (
    AdminOrderListSerializer,
    AdminOrderDetailSerializer,
    StaffSerializer,
    OrderAssignmentSerializer,
    NotificationSerializer
)
from .services import NotificationService
from .checklist_service import ChecklistService
from .analytics_service import AnalyticsService
from .cache_utils import cache_analytics, invalidate_analytics_cache


class AdminOrderListView(generics.ListAPIView):
    """
    GET /api/admin/orders/
    List all orders with filtering by status and assigned staff
    """
    serializer_class = AdminOrderListSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    pagination_class = None  # Disable pagination
    
    def get_queryset(self):
        # Optimize with select_related and prefetch_related
        queryset = Order.objects.all().select_related(
            'user', 'assigned_to'
        ).prefetch_related(
            'items', 'items__dynamic_resources'
        ).order_by('-created_at')
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by assigned staff
        assigned_to = self.request.query_params.get('assigned_to', None)
        if assigned_to:
            if assigned_to.lower() == 'unassigned':
                queryset = queryset.filter(assigned_to__isnull=True)
            else:
                try:
                    staff_id = int(assigned_to)
                    queryset = queryset.filter(assigned_to_id=staff_id)
                except ValueError:
                    pass
        
        # Search by order number or user phone
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(order_number__icontains=search) |
                Q(user__phone_number__icontains=search) |
                Q(user__username__icontains=search)
            )
        
        return queryset


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def get_order_statistics(request):
    """
    GET /api/admin/orders/statistics/
    Get order statistics for dashboard
    """
    # Count orders by status
    pending_count = Order.objects.filter(
        Q(status='pending_payment') | Q(status='pending_resources')
    ).count()
    
    assigned_count = Order.objects.filter(status='assigned').count()
    in_progress_count = Order.objects.filter(status='in_progress').count()
    completed_count = Order.objects.filter(status='completed').count()
    total_count = Order.objects.count()
    
    return Response({
        'pending': pending_count,
        'assigned': assigned_count,
        'in_progress': in_progress_count,
        'completed': completed_count,
        'total': total_count
    })


class AdminOrderDetailView(generics.RetrieveAPIView):
    """
    GET /api/admin/orders/{id}/
    Get detailed order information including resources and checklist
    """
    serializer_class = AdminOrderDetailSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    queryset = Order.objects.all().select_related(
        'user', 'assigned_to', 'payment_history'
    ).prefetch_related(
        'items', 
        'items__resources',
        'items__dynamic_resources',
        'items__dynamic_resources__field_definition',
        'checklist',
        'checklist__items',
        'checklist__items__completed_by'
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def assign_order_to_staff(request, order_id):
    """
    POST /api/admin/orders/{id}/assign/
    Assign an order to a staff member and generate checklist
    """
    order = get_object_or_404(Order, id=order_id)
    
    serializer = OrderAssignmentSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    staff_id = serializer.validated_data['staff_id']
    staff_user = get_object_or_404(CustomUser, id=staff_id)
    
    # Assign order to staff
    order.assigned_to = staff_user
    order.status = 'assigned'
    order.save()
    
    # Generate checklist using ChecklistService
    checklist = ChecklistService.generate_checklist_for_order(order)
    
    # Send notification to staff
    NotificationService.notify_staff_order_assigned(order, staff_user)
    
    # Invalidate analytics cache
    invalidate_analytics_cache()
    
    # Return updated order details
    order_serializer = AdminOrderDetailSerializer(order)
    
    return Response({
        'success': True,
        'message': f'Order assigned to {staff_user.username}',
        'order': order_serializer.data
    }, status=status.HTTP_200_OK)


class StaffListView(generics.ListAPIView):
    """
    GET /api/admin/staff/
    List all staff members with their assigned order counts
    """
    serializer_class = StaffSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    pagination_class = None  # Disable pagination
    
    def get_queryset(self):
        # Return users with staff or admin role
        return CustomUser.objects.filter(role__in=['staff', 'admin']).order_by('username')


class NotificationListView(generics.ListAPIView):
    """
    GET /api/admin/notifications/
    List notifications for the current user
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        unread_only = self.request.query_params.get('unread_only', 'false').lower() == 'true'
        
        return NotificationService.get_user_notifications(user, unread_only=unread_only)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, notification_id):
    """
    POST /api/admin/notifications/{id}/mark-read/
    Mark a notification as read
    """
    notification = NotificationService.mark_as_read(notification_id, request.user)
    
    if notification:
        return Response({
            'success': True,
            'message': 'Notification marked as read'
        }, status=status.HTTP_200_OK)
    else:
        return Response({
            'success': False,
            'message': 'Notification not found'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_notifications_read(request):
    """
    POST /api/admin/notifications/mark-all-read/
    Mark all notifications as read for the current user
    """
    count = NotificationService.mark_all_as_read(request.user)
    
    return Response({
        'success': True,
        'message': f'{count} notifications marked as read'
    }, status=status.HTTP_200_OK)


# ============================================================================
# STAFF ENDPOINTS
# ============================================================================

class StaffOrderListView(generics.ListAPIView):
    """
    GET /api/staff/orders/
    List orders assigned to the logged-in staff member
    """
    serializer_class = AdminOrderListSerializer
    pagination_class = None  # Disable pagination
    permission_classes = [IsAuthenticated, IsAdminOrStaff]
    
    def get_queryset(self):
        user = self.request.user
        
        # Staff can only see their assigned orders
        # Admins can see all orders (but typically use admin endpoints)
        if user.role == 'staff':
            queryset = Order.objects.filter(assigned_to=user)
        else:
            # Admin accessing staff endpoint sees all orders
            queryset = Order.objects.all()
        
        # Optimize with select_related and prefetch_related
        queryset = queryset.select_related(
            'user', 'assigned_to'
        ).prefetch_related(
            'items', 'items__dynamic_resources'
        ).order_by('-created_at')
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset


class StaffOrderDetailView(generics.RetrieveAPIView):
    """
    GET /api/staff/orders/{id}/
    Get detailed order information including resources and checklist
    Only returns orders assigned to the logged-in staff member
    """
    serializer_class = AdminOrderDetailSerializer
    permission_classes = [IsAuthenticated, IsAdminOrStaff]
    
    def get_queryset(self):
        user = self.request.user
        
        # Staff can only see their assigned orders
        if user.role == 'staff':
            return Order.objects.filter(assigned_to=user).select_related(
                'user', 'assigned_to', 'payment_history'
            ).prefetch_related(
                'items', 
                'items__resources',
                'items__dynamic_resources',
                'items__dynamic_resources__field_definition',
                'checklist',
                'checklist__items',
                'checklist__items__completed_by'
            )
        else:
            # Admin can see all orders
            return Order.objects.all().select_related(
                'user', 'assigned_to', 'payment_history'
            ).prefetch_related(
                'items', 
                'items__resources',
                'items__dynamic_resources',
                'items__dynamic_resources__field_definition',
                'checklist',
                'checklist__items',
                'checklist__items__completed_by'
            )


@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsAdminOrStaff])
def update_checklist_item(request, item_id):
    """
    PATCH /api/staff/checklist/{item_id}/
    Mark a checklist item as complete or incomplete
    """
    from django.utils import timezone
    
    # Get the checklist item
    checklist_item = get_object_or_404(ChecklistItem, id=item_id)
    
    # Get the order associated with this checklist item
    order = checklist_item.checklist.order
    
    # Verify that the user has permission to update this checklist
    # Staff can only update checklists for their assigned orders
    if request.user.role == 'staff' and order.assigned_to != request.user:
        return Response({
            'success': False,
            'message': 'You do not have permission to update this checklist'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Get the completed status from request
    completed = request.data.get('completed', None)
    
    if completed is None:
        return Response({
            'success': False,
            'message': 'completed field is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Update the checklist item
    checklist_item.completed = completed
    
    if completed:
        checklist_item.completed_at = timezone.now()
        checklist_item.completed_by = request.user
    else:
        checklist_item.completed_at = None
        checklist_item.completed_by = None
    
    checklist_item.save()
    
    # Calculate order completion percentage using ChecklistService
    # This properly excludes optional items from the calculation
    progress = ChecklistService.get_checklist_progress(checklist_item.checklist)
    progress_percentage = progress['progress_percentage']
    
    # Update order status based on progress
    if progress_percentage == 100 and order.status != 'completed':
        # All items completed - mark order as completed
        order.status = 'completed'
        order.save()
        
        # Invalidate analytics cache when order is completed
        invalidate_analytics_cache()
        
        # Notify admins that order is completed
        NotificationService.notify_admins_order_completed(order)
    elif progress_percentage > 0 and order.status == 'assigned':
        # Some progress made - update status to in_progress
        order.status = 'in_progress'
        order.save()
        
        # Invalidate analytics cache when order status changes
        invalidate_analytics_cache()
    
    # Notify admins of progress update (for significant milestones)
    # Notify at 25%, 50%, 75% completion or when order is completed
    if progress_percentage in [25, 50, 75] or progress_percentage == 100:
        NotificationService.notify_admins_progress_update(order, progress_percentage)
    
    # Return updated checklist item and progress
    return Response({
        'success': True,
        'message': 'Checklist item updated successfully',
        'checklist_item': {
            'id': checklist_item.id,
            'description': checklist_item.description,
            'completed': checklist_item.completed,
            'completed_at': checklist_item.completed_at,
            'completed_by': {
                'id': checklist_item.completed_by.id,
                'username': checklist_item.completed_by.username,
                'phone_number': checklist_item.completed_by.phone_number
            } if checklist_item.completed_by else None,
            'order_index': checklist_item.order_index,
            'is_optional': checklist_item.is_optional
        },
        'order_progress': {
            'total_items': progress['total_items'],
            'completed_items': progress['completed_items'],
            'required_items': progress['required_items'],
            'completed_required': progress['completed_required'],
            'progress_percentage': progress_percentage,
            'order_status': order.status
        }
    }, status=status.HTTP_200_OK)



# ============================================================================
# RESOURCE FIELD MANAGEMENT ENDPOINTS
# ============================================================================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def manage_product_resource_fields(request, product_type, product_id):
    """
    GET /api/admin/products/{type}/{id}/resource-fields/
    List all resource fields for a product
    
    POST /api/admin/products/{type}/{id}/resource-fields/
    Create a new resource field for a product
    """
    from products.models import Package, Campaign, ResourceFieldDefinition
    from django.contrib.contenttypes.models import ContentType
    from .serializers import ResourceFieldDefinitionSerializer, ResourceFieldCreateSerializer
    
    # Validate product type
    if product_type not in ['package', 'campaign']:
        return Response({
            'success': False,
            'message': 'Invalid product type. Must be package or campaign'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Get the product
    if product_type == 'package':
        product = get_object_or_404(Package, id=product_id)
        content_type = ContentType.objects.get_for_model(Package)
    else:
        product = get_object_or_404(Campaign, id=product_id)
        content_type = ContentType.objects.get_for_model(Campaign)
    
    if request.method == 'GET':
        # List all resource fields for this product
        fields = ResourceFieldDefinition.objects.filter(
            content_type=content_type,
            object_id=product_id
        ).order_by('order')
        
        serializer = ResourceFieldDefinitionSerializer(fields, many=True)
        return Response({
            'success': True,
            'fields': serializer.data
        }, status=status.HTTP_200_OK)
    
    elif request.method == 'POST':
        # Create a new resource field
        serializer = ResourceFieldCreateSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check for duplicate field name
        field_name = serializer.validated_data['field_name']
        if ResourceFieldDefinition.objects.filter(
            content_type=content_type,
            object_id=product_id,
            field_name=field_name
        ).exists():
            return Response({
                'success': False,
                'message': f'Field with name "{field_name}" already exists for this product'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create the field
        field = ResourceFieldDefinition.objects.create(
            content_type=content_type,
            object_id=product_id,
            **serializer.validated_data
        )
        
        response_serializer = ResourceFieldDefinitionSerializer(field)
        return Response({
            'success': True,
            'message': 'Resource field created successfully',
            'field': response_serializer.data
        }, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PUT', 'DELETE'])  # Added GET for testing
@permission_classes([IsAuthenticated, IsAdmin])
def manage_resource_field(request, field_id):
    """
    PUT /api/admin/products/resource-fields/{id}/
    Update a resource field
    
    DELETE /api/admin/products/resource-fields/{id}/
    Delete a resource field
    """
    from products.models import ResourceFieldDefinition
    from .serializers import ResourceFieldDefinitionSerializer, ResourceFieldCreateSerializer
    import logging
    
    logger = logging.getLogger(__name__)
    
    # Debug logging
    print(f"=== manage_resource_field called ===")
    print(f"Method: {request.method}")
    print(f"Field ID: {field_id}")
    print(f"User: {request.user}")
    logger.info(f"manage_resource_field called with method {request.method} for field {field_id}")
    
    try:
        field = get_object_or_404(ResourceFieldDefinition, id=field_id)
    except Exception as e:
        logger.error(f"Resource field not found: {field_id}, Error: {str(e)}")
        return Response({
            'success': False,
            'message': 'Resource field not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        # Test endpoint to verify URL is working
        response_serializer = ResourceFieldDefinitionSerializer(field)
        return Response({
            'success': True,
            'message': 'GET request successful - URL is working!',
            'field': response_serializer.data
        }, status=status.HTTP_200_OK)
    
    elif request.method == 'PUT':
        logger.info(f"Updating resource field {field_id} with data: {request.data}")
        
        # Update the field
        serializer = ResourceFieldCreateSerializer(data=request.data)
        
        if not serializer.is_valid():
            logger.error(f"Validation errors: {serializer.errors}")
            return Response({
                'success': False,
                'errors': serializer.errors,
                'message': 'Validation failed'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check for duplicate field name (excluding current field)
        field_name = serializer.validated_data['field_name']
        if ResourceFieldDefinition.objects.filter(
            content_type=field.content_type,
            object_id=field.object_id,
            field_name=field_name
        ).exclude(id=field_id).exists():
            return Response({
                'success': False,
                'message': f'Field with name "{field_name}" already exists for this product'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Update the field
        try:
            for key, value in serializer.validated_data.items():
                setattr(field, key, value)
            field.save()
            logger.info(f"Successfully updated resource field {field_id}")
        except Exception as e:
            logger.error(f"Error saving field: {str(e)}")
            return Response({
                'success': False,
                'message': f'Error saving field: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        response_serializer = ResourceFieldDefinitionSerializer(field)
        return Response({
            'success': True,
            'message': 'Resource field updated successfully',
            'field': response_serializer.data
        }, status=status.HTTP_200_OK)
    
    elif request.method == 'DELETE':
        logger.info(f"Deleting resource field {field_id}")
        
        try:
            field.delete()
            logger.info(f"Successfully deleted resource field {field_id}")
            return Response({
                'success': True,
                'message': 'Resource field deleted successfully'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error deleting field: {str(e)}")
            return Response({
                'success': False,
                'message': f'Error deleting field: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsAdmin])
def reorder_resource_fields(request):
    """
    PATCH /api/admin/products/resource-fields/reorder/
    Reorder resource fields
    """
    from products.models import ResourceFieldDefinition
    from .serializers import ResourceFieldReorderSerializer
    
    serializer = ResourceFieldReorderSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    field_orders = serializer.validated_data['field_orders']
    
    # Update the order for each field
    for item in field_orders:
        field_id = item['id']
        new_order = item['order']
        
        try:
            field = ResourceFieldDefinition.objects.get(id=field_id)
            field.order = new_order
            field.save()
        except ResourceFieldDefinition.DoesNotExist:
            pass
    
    return Response({
        'success': True,
        'message': 'Resource fields reordered successfully'
    }, status=status.HTTP_200_OK)



# ============================================================================
# ANALYTICS ENDPOINTS
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
@cache_analytics(timeout=300)  # Cache for 5 minutes
def analytics_overview(request):
    """
    GET /api/admin/analytics/overview/
    Get dashboard overview metrics including revenue, orders, and conversion rate
    """
    from datetime import datetime, timedelta
    from django.utils import timezone
    
    # Parse date range from query params
    start_date_str = request.query_params.get('start_date', None)
    end_date_str = request.query_params.get('end_date', None)
    
    start_date = None
    end_date = None
    
    if start_date_str:
        try:
            start_date = datetime.fromisoformat(start_date_str.replace('Z', '+00:00'))
        except ValueError:
            return Response({
                'success': False,
                'message': 'Invalid start_date format. Use ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    if end_date_str:
        try:
            end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
        except ValueError:
            return Response({
                'success': False,
                'message': 'Invalid end_date format. Use ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    # Default to current month if no dates provided
    if not start_date and not end_date:
        now = timezone.now()
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end_date = now
    
    # Get metrics
    revenue_metrics = AnalyticsService.get_revenue_metrics(start_date, end_date)
    conversion_metrics = AnalyticsService.get_conversion_rate(start_date, end_date)
    order_distribution = AnalyticsService.get_order_status_distribution(start_date, end_date)
    
    return Response({
        'success': True,
        'data': {
            'revenue': revenue_metrics,
            'conversion': conversion_metrics,
            'order_distribution': order_distribution,
            'date_range': {
                'start_date': start_date.isoformat() if start_date else None,
                'end_date': end_date.isoformat() if end_date else None
            }
        }
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
@cache_analytics(timeout=300)  # Cache for 5 minutes
def analytics_revenue_trend(request):
    """
    GET /api/admin/analytics/revenue-trend/
    Get monthly revenue trend data
    """
    # Parse months parameter (default to 12)
    months = int(request.query_params.get('months', 12))
    
    if months < 1 or months > 24:
        return Response({
            'success': False,
            'message': 'Months parameter must be between 1 and 24'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Get trend data
    trend_data = AnalyticsService.get_revenue_trend(months)
    
    return Response({
        'success': True,
        'data': trend_data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
@cache_analytics(timeout=300)  # Cache for 5 minutes
def analytics_top_products(request):
    """
    GET /api/admin/analytics/top-products/
    Get best-selling products
    """
    from datetime import datetime
    
    # Parse parameters
    limit = int(request.query_params.get('limit', 5))
    start_date_str = request.query_params.get('start_date', None)
    end_date_str = request.query_params.get('end_date', None)
    
    start_date = None
    end_date = None
    
    if start_date_str:
        try:
            start_date = datetime.fromisoformat(start_date_str.replace('Z', '+00:00'))
        except ValueError:
            return Response({
                'success': False,
                'message': 'Invalid start_date format'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    if end_date_str:
        try:
            end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
        except ValueError:
            return Response({
                'success': False,
                'message': 'Invalid end_date format'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    # Get top products
    top_products = AnalyticsService.get_top_products(limit, start_date, end_date)
    
    return Response({
        'success': True,
        'data': top_products
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
@cache_analytics(timeout=300)  # Cache for 5 minutes
def analytics_staff_performance(request):
    """
    GET /api/admin/analytics/staff-performance/
    Get staff performance metrics
    """
    from datetime import datetime
    
    # Parse date range from query params
    start_date_str = request.query_params.get('start_date', None)
    end_date_str = request.query_params.get('end_date', None)
    
    start_date = None
    end_date = None
    
    if start_date_str:
        try:
            start_date = datetime.fromisoformat(start_date_str.replace('Z', '+00:00'))
        except ValueError:
            return Response({
                'success': False,
                'message': 'Invalid start_date format'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    if end_date_str:
        try:
            end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
        except ValueError:
            return Response({
                'success': False,
                'message': 'Invalid end_date format'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    # Get staff performance
    performance_data = AnalyticsService.get_staff_performance(start_date, end_date)
    
    return Response({
        'success': True,
        'data': performance_data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
@cache_analytics(timeout=300)  # Cache for 5 minutes
def analytics_order_distribution(request):
    """
    GET /api/admin/analytics/order-distribution/
    Get order status distribution
    """
    from datetime import datetime
    
    # Parse date range from query params
    start_date_str = request.query_params.get('start_date', None)
    end_date_str = request.query_params.get('end_date', None)
    
    start_date = None
    end_date = None
    
    if start_date_str:
        try:
            start_date = datetime.fromisoformat(start_date_str.replace('Z', '+00:00'))
        except ValueError:
            return Response({
                'success': False,
                'message': 'Invalid start_date format'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    if end_date_str:
        try:
            end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
        except ValueError:
            return Response({
                'success': False,
                'message': 'Invalid end_date format'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    # Get order distribution
    distribution = AnalyticsService.get_order_status_distribution(start_date, end_date)
    
    return Response({
        'success': True,
        'data': distribution
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def analytics_export(request):
    """
    GET /api/admin/analytics/export/
    Export analytics data as CSV
    """
    import csv
    from django.http import HttpResponse
    from datetime import datetime
    from django.utils import timezone
    
    # Parse date range from query params
    start_date_str = request.query_params.get('start_date', None)
    end_date_str = request.query_params.get('end_date', None)
    
    start_date = None
    end_date = None
    
    if start_date_str:
        try:
            start_date = datetime.fromisoformat(start_date_str.replace('Z', '+00:00'))
        except ValueError:
            return Response({
                'success': False,
                'message': 'Invalid start_date format'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    if end_date_str:
        try:
            end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
        except ValueError:
            return Response({
                'success': False,
                'message': 'Invalid end_date format'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    # Default to current month if no dates provided
    if not start_date and not end_date:
        now = timezone.now()
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end_date = now
    
    # Get all analytics data
    revenue_metrics = AnalyticsService.get_revenue_metrics(start_date, end_date)
    top_products = AnalyticsService.get_top_products(10, start_date, end_date)
    staff_performance = AnalyticsService.get_staff_performance(start_date, end_date)
    order_distribution = AnalyticsService.get_order_status_distribution(start_date, end_date)
    conversion_metrics = AnalyticsService.get_conversion_rate(start_date, end_date)
    
    # Create CSV response
    response = HttpResponse(content_type='text/csv')
    filename = f'analytics_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    
    writer = csv.writer(response)
    
    # Write header
    writer.writerow(['Election Cart Analytics Export'])
    writer.writerow(['Generated:', datetime.now().strftime('%Y-%m-%d %H:%M:%S')])
    writer.writerow(['Date Range:', f'{start_date.strftime("%Y-%m-%d")} to {end_date.strftime("%Y-%m-%d")}'])
    writer.writerow([])
    
    # Revenue Metrics
    writer.writerow(['REVENUE METRICS'])
    writer.writerow(['Metric', 'Value'])
    writer.writerow(['Total Revenue', f'₹{revenue_metrics["total_revenue"]:.2f}'])
    writer.writerow(['Order Count', revenue_metrics['order_count']])
    writer.writerow(['Average Order Value', f'₹{revenue_metrics["average_order_value"]:.2f}'])
    writer.writerow([])
    
    # Conversion Metrics
    writer.writerow(['CONVERSION METRICS'])
    writer.writerow(['Metric', 'Value'])
    writer.writerow(['Total Orders', conversion_metrics['total_orders']])
    writer.writerow(['Paid Orders', conversion_metrics['paid_orders']])
    writer.writerow(['Conversion Rate', f'{conversion_metrics["conversion_rate"]}%'])
    writer.writerow([])
    
    # Top Products
    writer.writerow(['TOP PRODUCTS'])
    writer.writerow(['Product Name', 'Type', 'Quantity Sold', 'Revenue'])
    for product in top_products:
        writer.writerow([
            product['product_name'],
            product['product_type'],
            product['quantity_sold'],
            f'₹{product["revenue"]:.2f}'
        ])
    writer.writerow([])
    
    # Staff Performance
    writer.writerow(['STAFF PERFORMANCE'])
    writer.writerow(['Staff Name', 'Phone Number', 'Role', 'Assigned Orders', 'Completed Orders', 'Completion Rate'])
    for staff in staff_performance:
        writer.writerow([
            staff['staff_name'],
            staff['phone_number'],
            staff['role'],
            staff['assigned_orders'],
            staff['completed_orders'],
            f'{staff["completion_rate"]}%'
        ])
    writer.writerow([])
    
    # Order Distribution
    writer.writerow(['ORDER STATUS DISTRIBUTION'])
    writer.writerow(['Status', 'Count'])
    for status_key, status_data in order_distribution.items():
        writer.writerow([status_data['label'], status_data['count']])
    
    return response
