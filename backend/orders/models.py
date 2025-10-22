from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from authentication.models import CustomUser
import uuid
from datetime import datetime
import os


def generate_order_number():
    """Generate unique order number with format: EC-YYYYMMDD-XXXX"""
    date_str = datetime.now().strftime('%Y%m%d')
    unique_id = str(uuid.uuid4().hex)[:8].upper()
    return f"EC-{date_str}-{unique_id}"


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending_payment', 'Pending Payment'),
        ('pending_resources', 'Pending Resources'),
        ('ready_for_processing', 'Ready for Processing'),
        ('assigned', 'Assigned to Staff'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    ]
    
    user = models.ForeignKey(CustomUser, related_name='orders', on_delete=models.CASCADE)
    order_number = models.CharField(max_length=50, unique=True, default=generate_order_number)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='pending_payment')
    razorpay_order_id = models.CharField(max_length=100, blank=True)
    razorpay_payment_id = models.CharField(max_length=100, blank=True, null=True)
    razorpay_signature = models.CharField(max_length=255, blank=True, null=True)
    payment_completed_at = models.DateTimeField(blank=True, null=True)
    assigned_to = models.ForeignKey(
        CustomUser, 
        related_name='assigned_orders', 
        on_delete=models.SET_NULL, 
        blank=True, 
        null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Order {self.order_number}"
    
    def get_total_items(self):
        """Get total number of items in order"""
        return self.items.count()
    
    def all_resources_uploaded(self):
        """Check if all order items have resources uploaded"""
        return all(item.resources_uploaded for item in self.items.all())
    
    def get_resource_upload_progress(self):
        """Get resource upload progress as a percentage"""
        total_items = self.items.count()
        if total_items == 0:
            return 100
        
        uploaded_items = self.items.filter(resources_uploaded=True).count()
        return int((uploaded_items / total_items) * 100)
    
    def get_pending_resource_items(self):
        """Get list of order items that still need resources"""
        return self.items.filter(resources_uploaded=False)


class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')
    quantity = models.IntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    resources_uploaded = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.content_object} x{self.quantity}"
    
    def get_subtotal(self):
        """Calculate subtotal for this order item"""
        return self.price * self.quantity


def validate_image_file(file):
    """Validate image file type and size"""
    # Maximum file size: 5MB
    max_size = 5 * 1024 * 1024
    
    if file.size > max_size:
        raise ValidationError(f'File size cannot exceed 5MB. Current size: {file.size / (1024 * 1024):.2f}MB')
    
    # Allowed extensions
    allowed_extensions = ['.jpg', '.jpeg', '.png', '.gif']
    ext = os.path.splitext(file.name)[1].lower()
    
    if ext not in allowed_extensions:
        raise ValidationError(f'File type not supported. Allowed types: {", ".join(allowed_extensions)}')


class OrderResource(models.Model):
    order_item = models.OneToOneField(OrderItem, related_name='resources', on_delete=models.CASCADE)
    candidate_photo = models.ImageField(
        upload_to='resources/photos/',
        validators=[validate_image_file],
        help_text='Upload candidate photo (max 5MB, formats: jpg, jpeg, png, gif)'
    )
    party_logo = models.ImageField(
        upload_to='resources/logos/',
        validators=[validate_image_file],
        help_text='Upload party logo (max 5MB, formats: jpg, jpeg, png, gif)'
    )
    campaign_slogan = models.TextField(help_text='Enter campaign slogan')
    preferred_date = models.DateField(help_text='Preferred date for campaign')
    whatsapp_number = models.CharField(max_length=15, help_text='WhatsApp contact number')
    additional_notes = models.TextField(blank=True, help_text='Any additional notes or requirements')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Resources for {self.order_item}"
    
    def clean(self):
        """Additional validation for the model"""
        super().clean()
        
        # Validate WhatsApp number format (basic validation)
        if self.whatsapp_number:
            # Remove spaces and special characters
            cleaned_number = ''.join(filter(str.isdigit, self.whatsapp_number))
            if len(cleaned_number) < 10:
                raise ValidationError({'whatsapp_number': 'WhatsApp number must be at least 10 digits'})


class OrderChecklist(models.Model):
    order = models.OneToOneField(Order, related_name='checklist', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Checklist for {self.order.order_number}"


class ChecklistItem(models.Model):
    checklist = models.ForeignKey(OrderChecklist, related_name='items', on_delete=models.CASCADE)
    description = models.CharField(max_length=500)
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(blank=True, null=True)
    completed_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, blank=True, null=True)
    order_index = models.IntegerField()

    class Meta:
        ordering = ['order_index']

    def __str__(self):
        return f"{self.description} - {'✓' if self.completed else '✗'}"
