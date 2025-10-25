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
    """Validate image file type and size - delegates to products.validators"""
    from products.validators import validate_image_file as validate_img
    return validate_img(file)


class OrderResource(models.Model):
    order_item = models.OneToOneField(OrderItem, related_name='resources', on_delete=models.CASCADE)
    candidate_photo = models.ImageField(
        upload_to='resources/photos/',
        validators=[validate_image_file],
        help_text='Upload candidate photo (max 5MB, formats: jpg, jpeg, png, gif)',
        storage=None  # Uses DEFAULT_FILE_STORAGE from settings
    )
    party_logo = models.ImageField(
        upload_to='resources/logos/',
        validators=[validate_image_file],
        help_text='Upload party logo (max 5MB, formats: jpg, jpeg, png, gif)',
        storage=None  # Uses DEFAULT_FILE_STORAGE from settings
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


class DynamicResourceSubmission(models.Model):
    """Store dynamic resource field submissions for order items"""
    order_item = models.ForeignKey(OrderItem, on_delete=models.CASCADE, related_name='dynamic_resources')
    field_definition = models.ForeignKey('products.ResourceFieldDefinition', on_delete=models.PROTECT)
    
    # Store different types of values
    text_value = models.TextField(blank=True, null=True)
    number_value = models.IntegerField(blank=True, null=True)
    file_value = models.FileField(
        upload_to='dynamic_resources/',
        blank=True,
        null=True,
        storage=None  # Uses DEFAULT_FILE_STORAGE from settings
    )
    
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['order_item', 'field_definition']
        indexes = [
            models.Index(fields=['order_item']),
        ]
    
    def __str__(self):
        return f"{self.field_definition.field_name} for {self.order_item}"


class OrderChecklist(models.Model):
    order = models.OneToOneField(Order, related_name='checklist', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Checklist for {self.order.order_number}"


class ChecklistItem(models.Model):
    checklist = models.ForeignKey(OrderChecklist, related_name='items', on_delete=models.CASCADE)
    template_item = models.ForeignKey(
        'products.ChecklistTemplateItem', 
        on_delete=models.PROTECT, 
        null=True, 
        blank=True,
        help_text='Reference to the template item this was created from'
    )
    description = models.CharField(max_length=500)
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(blank=True, null=True)
    completed_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, blank=True, null=True)
    order_index = models.IntegerField()
    is_optional = models.BooleanField(default=False)

    class Meta:
        ordering = ['order_index']

    def __str__(self):
        return f"{self.description} - {'✓' if self.completed else '✗'}"


class PaymentHistory(models.Model):
    """Store payment transaction details and invoice information for orders"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]
    
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='payment_history')
    
    payment_method = models.CharField(max_length=50, default='Razorpay')
    transaction_id = models.CharField(max_length=200, help_text='Razorpay payment ID or other transaction ID')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='INR')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    payment_date = models.DateTimeField()
    invoice_generated_at = models.DateTimeField(null=True, blank=True)
    invoice_number = models.CharField(max_length=50, unique=True)
    
    metadata = models.JSONField(default=dict, help_text='Store additional payment details')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = 'Payment histories'
        ordering = ['-payment_date']
        indexes = [
            models.Index(fields=['invoice_number']),
            models.Index(fields=['payment_date']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"Payment {self.invoice_number} - {self.order.order_number}"
    
    @staticmethod
    def generate_invoice_number():
        """Generate unique invoice number with format: INV-YYYYMMDD-XXXX"""
        date_str = datetime.now().strftime('%Y%m%d')
        unique_id = str(uuid.uuid4().hex)[:8].upper()
        return f"INV-{date_str}-{unique_id}"
