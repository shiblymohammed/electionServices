"""Views for serving secure files"""
from django.http import FileResponse, Http404, HttpResponseForbidden
from django.conf import settings
from django.contrib.auth.decorators import login_required
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from products.models import ProductImage
from orders.models import DynamicResourceSubmission, OrderResource
import os
import mimetypes


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def serve_product_image(request, image_id):
    """
    Serve product images securely.
    Public access for product images (authenticated users only).
    """
    try:
        image = ProductImage.objects.get(id=image_id)
        
        # Get file path
        if request.GET.get('thumbnail') == 'true' and image.thumbnail:
            file_path = image.thumbnail.path
        else:
            file_path = image.image.path
        
        # Check if file exists
        if not os.path.exists(file_path):
            raise Http404("Image file not found")
        
        # Determine content type
        content_type, _ = mimetypes.guess_type(file_path)
        if not content_type:
            content_type = 'application/octet-stream'
        
        # Serve file
        response = FileResponse(open(file_path, 'rb'), content_type=content_type)
        response['Content-Disposition'] = f'inline; filename="{os.path.basename(file_path)}"'
        
        return response
        
    except ProductImage.DoesNotExist:
        raise Http404("Image not found")
    except Exception as e:
        raise Http404(f"Error serving image: {str(e)}")


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def serve_dynamic_resource(request, submission_id):
    """
    Serve dynamic resource files securely.
    Only accessible by the user who uploaded it or admin staff.
    """
    try:
        submission = DynamicResourceSubmission.objects.select_related(
            'order_item__order__user'
        ).get(id=submission_id)
        
        # Check permissions
        if not (request.user == submission.order_item.order.user or 
                request.user.is_staff or 
                request.user == submission.order_item.order.assigned_to):
            return HttpResponseForbidden("You don't have permission to access this file")
        
        # Get file path
        if not submission.file_value:
            raise Http404("No file associated with this submission")
        
        file_path = submission.file_value.path
        
        # Check if file exists
        if not os.path.exists(file_path):
            raise Http404("File not found")
        
        # Determine content type
        content_type, _ = mimetypes.guess_type(file_path)
        if not content_type:
            content_type = 'application/octet-stream'
        
        # Serve file
        response = FileResponse(open(file_path, 'rb'), content_type=content_type)
        
        # For documents, force download; for images, display inline
        if submission.field_definition.field_type == 'document':
            response['Content-Disposition'] = f'attachment; filename="{os.path.basename(file_path)}"'
        else:
            response['Content-Disposition'] = f'inline; filename="{os.path.basename(file_path)}"'
        
        return response
        
    except DynamicResourceSubmission.DoesNotExist:
        raise Http404("Resource not found")
    except Exception as e:
        raise Http404(f"Error serving file: {str(e)}")


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def serve_order_resource(request, order_id, resource_type):
    """
    Serve order resource files (candidate photos, logos, etc.).
    Only accessible by the order owner, assigned staff, or admin.
    """
    try:
        from orders.models import Order
        
        order = Order.objects.select_related('user', 'assigned_to').get(id=order_id)
        
        # Check permissions
        if not (request.user == order.user or 
                request.user.is_staff or 
                request.user == order.assigned_to):
            return HttpResponseForbidden("You don't have permission to access this file")
        
        # Get order resource
        order_item = order.items.first()
        if not order_item or not hasattr(order_item, 'resources'):
            raise Http404("Order resources not found")
        
        resources = order_item.resources
        
        # Get the requested file
        if resource_type == 'candidate_photo':
            file_field = resources.candidate_photo
        elif resource_type == 'party_logo':
            file_field = resources.party_logo
        else:
            raise Http404("Invalid resource type")
        
        file_path = file_field.path
        
        # Check if file exists
        if not os.path.exists(file_path):
            raise Http404("File not found")
        
        # Determine content type
        content_type, _ = mimetypes.guess_type(file_path)
        if not content_type:
            content_type = 'application/octet-stream'
        
        # Serve file
        response = FileResponse(open(file_path, 'rb'), content_type=content_type)
        response['Content-Disposition'] = f'inline; filename="{os.path.basename(file_path)}"'
        
        return response
        
    except Order.DoesNotExist:
        raise Http404("Order not found")
    except Exception as e:
        raise Http404(f"Error serving file: {str(e)}")
