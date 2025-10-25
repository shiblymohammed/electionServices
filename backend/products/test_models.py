"""
Model tests for election cart enhancements
Tests for ResourceFieldDefinition, ChecklistTemplateItem, ProductImage, and PaymentHistory
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from decimal import Decimal
from datetime import datetime, timedelta
from PIL import Image
from io import BytesIO

from products.models import (
    Package, Campaign, ResourceFieldDefinition, 
    ChecklistTemplateItem, ProductImage, ProductAuditLog
)
from orders.models import Order, OrderItem, PaymentHistory

User = get_user_model()


class ResourceFieldDefinitionModelTest(TestCase):
    """Test ResourceFieldDefinition model validation and behavior"""
    
    def setUp(self):
        """Set up test data"""
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='testpass123',
            phone_number='1234567890',
            first_name='Admin',
            last_name='User',
            is_staff=True
        )
        
        self.package = Package.objects.create(
            name='Test Package',
            price=Decimal('100.00'),
            description='Test description',
            created_by=self.admin_user
        )
        
        self.package_ct = ContentType.objects.get_for_model(Package)
    
    def test_create_text_field_definition(self):
        """Test creating a text field definition"""
        field = ResourceFieldDefinition.objects.create(
            content_type=self.package_ct,
            object_id=self.package.id,
            field_name='Candidate Name',
            field_type='text',
            is_required=True,
            order=0,
            help_text='Enter candidate full name',
            max_length=100
        )
        
        self.assertEqual(field.field_name, 'Candidate Name')
        self.assertEqual(field.field_type, 'text')
        self.assertTrue(field.is_required)
        self.assertEqual(field.max_length, 100)
        self.assertEqual(field.product, self.package)
    
    def test_create_image_field_definition(self):
        """Test creating an image field definition"""
        field = ResourceFieldDefinition.objects.create(
            content_type=self.package_ct,
            object_id=self.package.id,
            field_name='Profile Photo',
            field_type='image',
            is_required=True,
            order=1,
            help_text='Upload profile photo',
            max_file_size_mb=5
        )
        
        self.assertEqual(field.field_type, 'image')
        self.assertEqual(field.max_file_size_mb, 5)
    
    def test_create_number_field_definition(self):
        """Test creating a number field definition"""
        field = ResourceFieldDefinition.objects.create(
            content_type=self.package_ct,
            object_id=self.package.id,
            field_name='Age',
            field_type='number',
            is_required=True,
            order=2,
            min_value=18,
            max_value=100
        )
        
        self.assertEqual(field.field_type, 'number')
        self.assertEqual(field.min_value, 18)
        self.assertEqual(field.max_value, 100)
    
    def test_create_document_field_definition(self):
        """Test creating a document field definition"""
        field = ResourceFieldDefinition.objects.create(
            content_type=self.package_ct,
            object_id=self.package.id,
            field_name='Resume',
            field_type='document',
            is_required=False,
            order=3,
            max_file_size_mb=10,
            allowed_extensions=['pdf', 'docx']
        )
        
        self.assertEqual(field.field_type, 'document')
        self.assertFalse(field.is_required)
        self.assertEqual(field.allowed_extensions, ['pdf', 'docx'])
    
    def test_unique_field_name_per_product(self):
        """Test that field names must be unique per product"""
        ResourceFieldDefinition.objects.create(
            content_type=self.package_ct,
            object_id=self.package.id,
            field_name='Email',
            field_type='text',
            order=0
        )
        
        # Try to create another field with same name for same product
        with self.assertRaises(Exception):
            ResourceFieldDefinition.objects.create(
                content_type=self.package_ct,
                object_id=self.package.id,
                field_name='Email',
                field_type='text',
                order=1
            )
    
    def test_field_ordering(self):
        """Test that fields are ordered correctly"""
        field1 = ResourceFieldDefinition.objects.create(
            content_type=self.package_ct,
            object_id=self.package.id,
            field_name='Field 1',
            field_type='text',
            order=2
        )
        
        field2 = ResourceFieldDefinition.objects.create(
            content_type=self.package_ct,
            object_id=self.package.id,
            field_name='Field 2',
            field_type='text',
            order=0
        )
        
        field3 = ResourceFieldDefinition.objects.create(
            content_type=self.package_ct,
            object_id=self.package.id,
            field_name='Field 3',
            field_type='text',
            order=1
        )
        
        fields = ResourceFieldDefinition.objects.filter(
            content_type=self.package_ct,
            object_id=self.package.id
        )
        
        self.assertEqual(fields[0], field2)
        self.assertEqual(fields[1], field3)
        self.assertEqual(fields[2], field1)


class ChecklistTemplateItemModelTest(TestCase):
    """Test ChecklistTemplateItem model creation and behavior"""
    
    def setUp(self):
        """Set up test data"""
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='testpass123',
            phone_number='1234567890',
            first_name='Admin',
            last_name='User',
            is_staff=True
        )
        
        self.campaign = Campaign.objects.create(
            name='Test Campaign',
            price=Decimal('50.00'),
            unit='per day',
            description='Test campaign',
            created_by=self.admin_user
        )
        
        self.campaign_ct = ContentType.objects.get_for_model(Campaign)
    
    def test_create_required_checklist_item(self):
        """Test creating a required checklist template item"""
        item = ChecklistTemplateItem.objects.create(
            content_type=self.campaign_ct,
            object_id=self.campaign.id,
            name='Review Requirements',
            description='Review all campaign requirements',
            order=0,
            is_optional=False,
            estimated_duration_minutes=30
        )
        
        self.assertEqual(item.name, 'Review Requirements')
        self.assertFalse(item.is_optional)
        self.assertEqual(item.estimated_duration_minutes, 30)
        self.assertEqual(item.product, self.campaign)
    
    def test_create_optional_checklist_item(self):
        """Test creating an optional checklist template item"""
        item = ChecklistTemplateItem.objects.create(
            content_type=self.campaign_ct,
            object_id=self.campaign.id,
            name='Quality Check',
            description='Optional quality verification',
            order=1,
            is_optional=True
        )
        
        self.assertTrue(item.is_optional)
    
    def test_checklist_item_ordering(self):
        """Test that checklist items are ordered correctly"""
        item1 = ChecklistTemplateItem.objects.create(
            content_type=self.campaign_ct,
            object_id=self.campaign.id,
            name='Item 1',
            description='First item',
            order=2
        )
        
        item2 = ChecklistTemplateItem.objects.create(
            content_type=self.campaign_ct,
            object_id=self.campaign.id,
            name='Item 2',
            description='Second item',
            order=0
        )
        
        item3 = ChecklistTemplateItem.objects.create(
            content_type=self.campaign_ct,
            object_id=self.campaign.id,
            name='Item 3',
            description='Third item',
            order=1
        )
        
        items = ChecklistTemplateItem.objects.filter(
            content_type=self.campaign_ct,
            object_id=self.campaign.id
        )
        
        self.assertEqual(items[0], item2)
        self.assertEqual(items[1], item3)
        self.assertEqual(items[2], item1)


class ProductImageModelTest(TestCase):
    """Test ProductImage model and thumbnail generation"""
    
    def setUp(self):
        """Set up test data"""
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='testpass123',
            phone_number='1234567890',
            first_name='Admin',
            last_name='User',
            is_staff=True
        )
        
        self.package = Package.objects.create(
            name='Test Package',
            price=Decimal('100.00'),
            description='Test description',
            created_by=self.admin_user
        )
        
        self.package_ct = ContentType.objects.get_for_model(Package)
    
    def create_test_image(self, size=(800, 600), color='red', format='JPEG'):
        """Helper method to create a test image"""
        img = Image.new('RGB', size, color=color)
        img_io = BytesIO()
        img.save(img_io, format=format)
        img_io.seek(0)
        
        return SimpleUploadedFile(
            f"test_image.{format.lower()}",
            img_io.read(),
            content_type=f"image/{format.lower()}"
        )
    
    def test_create_product_image(self):
        """Test creating a product image"""
        test_image = self.create_test_image()
        
        product_image = ProductImage.objects.create(
            content_type=self.package_ct,
            object_id=self.package.id,
            image=test_image,
            is_primary=True,
            order=0,
            alt_text='Test product image'
        )
        
        self.assertTrue(product_image.is_primary)
        self.assertEqual(product_image.order, 0)
        self.assertEqual(product_image.alt_text, 'Test product image')
        self.assertEqual(product_image.product, self.package)
    
    def test_thumbnail_generation(self):
        """Test that thumbnail is generated automatically"""
        test_image = self.create_test_image(size=(1000, 800))
        
        product_image = ProductImage.objects.create(
            content_type=self.package_ct,
            object_id=self.package.id,
            image=test_image,
            order=0
        )
        
        # Thumbnail should be generated
        self.assertIsNotNone(product_image.thumbnail)
        self.assertTrue(product_image.thumbnail.name)
    
    def test_only_one_primary_image_per_product(self):
        """Test that only one image can be primary per product"""
        test_image1 = self.create_test_image(color='red')
        test_image2 = self.create_test_image(color='blue')
        
        # Create first primary image
        image1 = ProductImage.objects.create(
            content_type=self.package_ct,
            object_id=self.package.id,
            image=test_image1,
            is_primary=True,
            order=0
        )
        
        self.assertTrue(image1.is_primary)
        
        # Create second primary image
        image2 = ProductImage.objects.create(
            content_type=self.package_ct,
            object_id=self.package.id,
            image=test_image2,
            is_primary=True,
            order=1
        )
        
        # Refresh first image from database
        image1.refresh_from_db()
        
        # First image should no longer be primary
        self.assertFalse(image1.is_primary)
        self.assertTrue(image2.is_primary)
    
    def test_image_ordering(self):
        """Test that images are ordered correctly"""
        test_image1 = self.create_test_image(color='red')
        test_image2 = self.create_test_image(color='blue')
        test_image3 = self.create_test_image(color='green')
        
        image1 = ProductImage.objects.create(
            content_type=self.package_ct,
            object_id=self.package.id,
            image=test_image1,
            order=2
        )
        
        image2 = ProductImage.objects.create(
            content_type=self.package_ct,
            object_id=self.package.id,
            image=test_image2,
            order=0
        )
        
        image3 = ProductImage.objects.create(
            content_type=self.package_ct,
            object_id=self.package.id,
            image=test_image3,
            order=1
        )
        
        images = ProductImage.objects.filter(
            content_type=self.package_ct,
            object_id=self.package.id
        )
        
        self.assertEqual(images[0], image2)
        self.assertEqual(images[1], image3)
        self.assertEqual(images[2], image1)


class PaymentHistoryModelTest(TestCase):
    """Test PaymentHistory model creation and behavior"""
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username='customer',
            email='customer@test.com',
            password='testpass123',
            phone_number='1234567890',
            first_name='Customer',
            last_name='User'
        )
        
        self.order = Order.objects.create(
            user=self.user,
            total_amount=Decimal('500.00'),
            status='pending_payment'
        )
    
    def test_create_payment_history(self):
        """Test creating a payment history record"""
        payment = PaymentHistory.objects.create(
            order=self.order,
            payment_method='Razorpay',
            transaction_id='pay_test123456',
            amount=Decimal('500.00'),
            currency='INR',
            status='completed',
            payment_date=datetime.now(),
            invoice_number=PaymentHistory.generate_invoice_number()
        )
        
        self.assertEqual(payment.order, self.order)
        self.assertEqual(payment.payment_method, 'Razorpay')
        self.assertEqual(payment.amount, Decimal('500.00'))
        self.assertEqual(payment.status, 'completed')
        self.assertTrue(payment.invoice_number.startswith('INV-'))
    
    def test_invoice_number_generation(self):
        """Test that invoice numbers are generated correctly"""
        invoice_number = PaymentHistory.generate_invoice_number()
        
        # Check format: INV-YYYYMMDD-XXXX
        self.assertTrue(invoice_number.startswith('INV-'))
        parts = invoice_number.split('-')
        self.assertEqual(len(parts), 3)
        self.assertEqual(len(parts[1]), 8)  # YYYYMMDD
        self.assertEqual(len(parts[2]), 8)  # 8 character unique ID
    
    def test_unique_invoice_number(self):
        """Test that invoice numbers are unique"""
        payment1 = PaymentHistory.objects.create(
            order=self.order,
            payment_method='Razorpay',
            transaction_id='pay_test123',
            amount=Decimal('500.00'),
            payment_date=datetime.now(),
            invoice_number=PaymentHistory.generate_invoice_number()
        )
        
        # Create another order
        order2 = Order.objects.create(
            user=self.user,
            total_amount=Decimal('300.00'),
            status='pending_payment'
        )
        
        # Try to create payment with same invoice number
        with self.assertRaises(Exception):
            PaymentHistory.objects.create(
                order=order2,
                payment_method='Razorpay',
                transaction_id='pay_test456',
                amount=Decimal('300.00'),
                payment_date=datetime.now(),
                invoice_number=payment1.invoice_number
            )
    
    def test_payment_metadata_storage(self):
        """Test that payment metadata can be stored"""
        metadata = {
            'razorpay_order_id': 'order_test123',
            'razorpay_signature': 'sig_test456',
            'payment_gateway': 'Razorpay',
            'customer_email': 'customer@test.com'
        }
        
        payment = PaymentHistory.objects.create(
            order=self.order,
            payment_method='Razorpay',
            transaction_id='pay_test789',
            amount=Decimal('500.00'),
            payment_date=datetime.now(),
            invoice_number=PaymentHistory.generate_invoice_number(),
            metadata=metadata
        )
        
        self.assertEqual(payment.metadata['razorpay_order_id'], 'order_test123')
        self.assertEqual(payment.metadata['customer_email'], 'customer@test.com')
