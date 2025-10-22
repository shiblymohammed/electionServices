from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from django.db import transaction
from .models import Order, OrderItem, OrderResource
from .serializers import (
    OrderSerializer, 
    PaymentVerificationSerializer, 
    ResourceUploadSerializer,
    OrderResourceSerializer
)
from .razorpay_client import razorpay_client
from cart.models import Cart
from admin_panel.services import NotificationService


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_order(request):
    """
    Create order from cart and generate Razorpay order.
    Endpoint: POST /api/orders/create/
    """
    try:
        # Get user's cart
        cart = Cart.objects.get(user=request.user)
        
        if not cart.items.exists():
            return Response(
                {'error': 'Cart is empty'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calculate total
        total_amount = cart.get_total()
        
        # Create order
        order = Order.objects.create(
            user=request.user,
            total_amount=total_amount,
            status='pending_payment'
        )
        
        # Create order items from cart
        for cart_item in cart.items.all():
            OrderItem.objects.create(
                order=order,
                content_type=cart_item.content_type,
                object_id=cart_item.object_id,
                quantity=cart_item.quantity,
                price=cart_item.content_object.price if cart_item.content_object else 0
            )
        
        # Create Razorpay order
        razorpay_order = razorpay_client.create_order(
            amount=total_amount,
            receipt=order.order_number
        )
        
        # Update order with Razorpay order ID
        order.razorpay_order_id = razorpay_order['id']
        order.save()
        
        # Clear cart
        cart.items.all().delete()
        
        # Return order details with Razorpay order ID
        serializer = OrderSerializer(order)
        return Response({
            'order': serializer.data,
            'razorpay_order_id': razorpay_order['id'],
            'razorpay_key_id': razorpay_client.client.auth[0],
            'amount': int(total_amount * 100)  # Amount in paise
        }, status=status.HTTP_201_CREATED)
        
    except Cart.DoesNotExist:
        return Response(
            {'error': 'Cart not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Order creation failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_payment(request, order_id):
    """
    Verify Razorpay payment and update order status.
    Endpoint: POST /api/orders/{id}/payment-success/
    Body: { "razorpay_order_id": "...", "razorpay_payment_id": "...", "razorpay_signature": "..." }
    """
    serializer = PaymentVerificationSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        order = Order.objects.get(id=order_id, user=request.user)
        
        # Verify payment signature
        is_valid = razorpay_client.verify_payment_signature(
            razorpay_order_id=serializer.validated_data['razorpay_order_id'],
            razorpay_payment_id=serializer.validated_data['razorpay_payment_id'],
            razorpay_signature=serializer.validated_data['razorpay_signature']
        )
        
        if not is_valid:
            return Response(
                {'error': 'Payment signature verification failed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update order
        order.razorpay_payment_id = serializer.validated_data['razorpay_payment_id']
        order.razorpay_signature = serializer.validated_data['razorpay_signature']
        order.payment_completed_at = timezone.now()
        order.status = 'pending_resources'
        order.save()
        
        # Return updated order
        order_serializer = OrderSerializer(order)
        return Response({
            'success': True,
            'message': 'Payment verified successfully',
            'order': order_serializer.data
        }, status=status.HTTP_200_OK)
        
    except Order.DoesNotExist:
        return Response(
            {'error': 'Order not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Payment verification failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_order(request, order_id):
    """
    Get order details.
    Endpoint: GET /api/orders/{id}/
    """
    try:
        order = Order.objects.get(id=order_id, user=request.user)
        serializer = OrderSerializer(order)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Order.DoesNotExist:
        return Response(
            {'error': 'Order not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_my_orders(request):
    """
    Get all orders for current user.
    Endpoint: GET /api/orders/my-orders/
    """
    orders = Order.objects.filter(user=request.user).order_by('-created_at')
    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_resources(request, order_id):
    """
    Upload resources for order items.
    Endpoint: POST /api/orders/{id}/upload-resources/
    Content-Type: multipart/form-data
    Body: {
        "order_item_id": int,
        "candidate_photo": file,
        "party_logo": file,
        "campaign_slogan": string,
        "preferred_date": date (YYYY-MM-DD),
        "whatsapp_number": string,
        "additional_notes": string (optional)
    }
    """
    try:
        # Get order and verify ownership
        order = Order.objects.get(id=order_id, user=request.user)
        
        # Check if order is in correct status
        if order.status not in ['pending_resources', 'ready_for_processing']:
            return Response(
                {'error': f'Cannot upload resources for order with status: {order.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate request data
        serializer = ResourceUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Get order item and verify it belongs to this order
        order_item_id = serializer.validated_data['order_item_id']
        try:
            order_item = OrderItem.objects.get(id=order_item_id, order=order)
        except OrderItem.DoesNotExist:
            return Response(
                {'error': 'Order item not found or does not belong to this order'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if resources already exist for this item
        if hasattr(order_item, 'resources'):
            return Response(
                {'error': 'Resources already uploaded for this order item'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create OrderResource with transaction
        with transaction.atomic():
            order_resource = OrderResource.objects.create(
                order_item=order_item,
                candidate_photo=serializer.validated_data['candidate_photo'],
                party_logo=serializer.validated_data['party_logo'],
                campaign_slogan=serializer.validated_data['campaign_slogan'],
                preferred_date=serializer.validated_data['preferred_date'],
                whatsapp_number=serializer.validated_data['whatsapp_number'],
                additional_notes=serializer.validated_data.get('additional_notes', '')
            )
            
            # Mark order item as resources uploaded
            order_item.resources_uploaded = True
            order_item.save()
            
            # Check if all items have resources uploaded
            all_uploaded = order.all_resources_uploaded()
            if all_uploaded:
                order.status = 'ready_for_processing'
                order.save()
                
                # Notify admins that order is ready for processing
                NotificationService.notify_admins_new_order(order)
        
        # Get pending items (items without resources)
        pending_items = []
        for item in order.items.all():
            if not item.resources_uploaded:
                pending_items.append({
                    'id': item.id,
                    'item_type': item.content_type.model,
                    'item_name': str(item.content_object) if item.content_object else 'Unknown',
                    'quantity': item.quantity
                })
        
        # Return response
        resource_serializer = OrderResourceSerializer(order_resource)
        return Response({
            'success': True,
            'message': 'Resources uploaded successfully',
            'resource': resource_serializer.data,
            'order_status': order.status,
            'all_resources_uploaded': all_uploaded,
            'pending_items': pending_items
        }, status=status.HTTP_201_CREATED)
        
    except Order.DoesNotExist:
        return Response(
            {'error': 'Order not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Resource upload failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_order_resources(request, order_id):
    """
    Get all resources for an order.
    Endpoint: GET /api/orders/{id}/resources/
    """
    try:
        order = Order.objects.get(id=order_id, user=request.user)
        
        # Get all order items with their resources
        items_with_resources = []
        for item in order.items.all():
            item_data = {
                'id': item.id,
                'item_type': item.content_type.model,
                'item_name': str(item.content_object) if item.content_object else 'Unknown',
                'quantity': item.quantity,
                'resources_uploaded': item.resources_uploaded,
                'resources': None
            }
            
            if hasattr(item, 'resources'):
                resource_serializer = OrderResourceSerializer(item.resources)
                item_data['resources'] = resource_serializer.data
            
            items_with_resources.append(item_data)
        
        return Response({
            'order_id': order.id,
            'order_number': order.order_number,
            'status': order.status,
            'items': items_with_resources
        }, status=status.HTTP_200_OK)
        
    except Order.DoesNotExist:
        return Response(
            {'error': 'Order not found'},
            status=status.HTTP_404_NOT_FOUND
        )



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_resource_upload_status(request, order_id):
    """
    Get resource upload status and pending items for an order.
    Endpoint: GET /api/orders/{id}/resource-status/
    """
    try:
        order = Order.objects.get(id=order_id, user=request.user)
        
        # Get pending items
        pending_items = []
        for item in order.get_pending_resource_items():
            pending_items.append({
                'id': item.id,
                'item_type': item.content_type.model,
                'item_name': str(item.content_object) if item.content_object else 'Unknown',
                'quantity': item.quantity,
                'price': float(item.price)
            })
        
        # Get uploaded items
        uploaded_items = []
        for item in order.items.filter(resources_uploaded=True):
            uploaded_items.append({
                'id': item.id,
                'item_type': item.content_type.model,
                'item_name': str(item.content_object) if item.content_object else 'Unknown',
                'quantity': item.quantity,
                'uploaded_at': item.resources.uploaded_at if hasattr(item, 'resources') else None
            })
        
        return Response({
            'order_id': order.id,
            'order_number': order.order_number,
            'status': order.status,
            'total_items': order.get_total_items(),
            'progress_percentage': order.get_resource_upload_progress(),
            'all_resources_uploaded': order.all_resources_uploaded(),
            'pending_items': pending_items,
            'uploaded_items': uploaded_items
        }, status=status.HTTP_200_OK)
        
    except Order.DoesNotExist:
        return Response(
            {'error': 'Order not found'},
            status=status.HTTP_404_NOT_FOUND
        )
