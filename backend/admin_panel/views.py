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


class AdminOrderListView(generics.ListAPIView):
    """
    GET /api/admin/orders/
    List all orders with filtering by status and assigned staff
    """
    serializer_class = AdminOrderListSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    pagination_class = None  # Disable pagination
    
    def get_queryset(self):
        queryset = Order.objects.all().select_related('user', 'assigned_to').order_by('-created_at')
        
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
    queryset = Order.objects.all().select_related('user', 'assigned_to').prefetch_related('items', 'items__resources')


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
        
        queryset = queryset.select_related('user', 'assigned_to').order_by('-created_at')
        
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
                'user', 'assigned_to'
            ).prefetch_related('items', 'items__resources')
        else:
            # Admin can see all orders
            return Order.objects.all().select_related(
                'user', 'assigned_to'
            ).prefetch_related('items', 'items__resources')


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
    
    # Calculate order completion percentage
    checklist = checklist_item.checklist
    total_items = checklist.items.count()
    completed_items = checklist.items.filter(completed=True).count()
    progress_percentage = int((completed_items / total_items * 100)) if total_items > 0 else 0
    
    # Update order status based on progress
    if progress_percentage == 100 and order.status != 'completed':
        # All items completed - mark order as completed
        order.status = 'completed'
        order.save()
        
        # Notify admins that order is completed
        NotificationService.notify_admins_order_completed(order)
    elif progress_percentage > 0 and order.status == 'assigned':
        # Some progress made - update status to in_progress
        order.status = 'in_progress'
        order.save()
    
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
            'order_index': checklist_item.order_index
        },
        'order_progress': {
            'total_items': total_items,
            'completed_items': completed_items,
            'progress_percentage': progress_percentage,
            'order_status': order.status
        }
    }, status=status.HTTP_200_OK)
