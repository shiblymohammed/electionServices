"""
Integration tests for election cart enhancements
Tests complete workflows including product creation, resource submission, invoice generation, and analytics
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from decimal import Decimal
from datetime import datetime, timedelta
from PIL import Image
from io import BytesIO
from django.core.files.uploadedfile import SimpleUploadedFile

from products.models import (
    Package, Campaign, ResourceFieldDefinition,
    ChecklistTemplateItem, ProductImage
)
from orders.models import (
    Order, OrderItem, PaymentHistory, 
    DynamicResourceSubmission, OrderChecklist, ChecklistItem
)
from admin_panel.checklist_service import ChecklistService
from admin_panel.analytics_service import AnalyticsService

User = get_user_model()


class ProductCreationWorkflowTest(APITestCase):
    """Test complete product creation workflow with all enhancements"""
    
    def setUp(self):
        """Set up test data"""
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='testpass123',
            phone_number='1234567890',
            is_staff=True,
            is_superuser=True
        )
        
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin_user)
    
    def create_test_image(self, size=(800, 600), color='red'):
        """Helper method to create a test image"""
        img = Image.new('RGB', size, color=color)
        img_io = BytesIO()
        img.save(img_io, format='JPEG')
        img_io.seek(0)
        
        return SimpleUploadedFile(
            f"test_image_{color}.jpg",
            img_io.read(),
            content_type="image/jpeg"
        )
    
    def test_complete_product_creation_workflow(self):
        """Test creating a product with images, resource fields, and checklist template"""
        # Step 1: Create a package
        package_data = {
            'name': 'Complete Package',
            'price': 200.00,
            'description': 'Full featured package',
            'features': ['Feature 1', 'Feature 2'],
            'deliverables': ['Deliverable 1'],
            'is_active': True,
            'items': [
                {'name': 'Item 1', 'quantity': 5}
            ]
        }
        
        response = self.client.post('/api/admin/products/package/', package_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        package_id = response.data['id']
        
        # Step 2: Add resource field definitions
        resource_fields = [
            {
                'field_name': 'Candidate Name',
                'field_type': 'text',
                'is_required': True,
                'order': 0,
                'max_length': 100
            },
            {
                'field_name': 'Profile Photo',
                'field_type': 'image',
                'is_required': True,
                'order': 1,
                'max_file_size_mb': 5
            },
            {
                'field_name': 'Age',
                'field_type': 'number',
                'is_required': True,
                'order': 2,
                'min_value': 18,
                'max_value': 100
            }
        ]
        
        for field_data in resource_fields:
            response = self.client.post(
                f'/api/admin/products/package/{package_id}/resource-fields/',
                field_data,
                format='json'
            )
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Step 3: Add checklist template items
        checklist_items = [
            {
                'name': 'Review Requirements',
                'description': 'Review all requirements',
                'order': 0,
                'is_optional': False,
                'estimated_duration_minutes': 30
            },
            {
                'name': 'Prepare Materials',
                'description': 'Prepare campaign materials',
                'order': 1,
                'is_optional': False,
                'estimated_duration_minutes': 60
            },
            {
                'name': 'Quality Check',
                'description': 'Optional quality verification',
                'order': 2,
                'is_optional': True,
                'estimated_duration_minutes': 15
            }
        ]
        
        for item_data in checklist_items:
            response = self.client.post(
                f'/api/admin/products/package/{package_id}/checklist-template/',
                item_data,
                format='json'
            )
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Step 4: Upload product images
        test_image1 = self.create_test_image(color='red')
        test_image2 = self.create_test_image(color='blue')
        
        # Upload primary image
        response = self.client.post(
            f'/api/admin/products/package/{package_id}/images/',
            {
                'image': test_image1,
                'is_primary': True,
                'order': 0,
                'alt_text': 'Primary image'
            },
            format='multipart'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Upload secondary image
        response = self.client.post(
            f'/api/admin/products/package/{package_id}/images/',
            {
                'image': test_image2,
                'is_primary': False,
                'order': 1,
                'alt_text': 'Secondary image'
            },
            format='multipart'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Step 5: Verify everything was created correctly
        package = Package.objects.get(id=package_id)
        self.assertEqual(package.name, 'Complete Package')
        
        # Verify resource fields
        package_ct = ContentType.objects.get_for_model(Package)
        resource_fields_count = ResourceFieldDefinition.objects.filter(
            content_type=package_ct,
            object_id=package_id
        ).count()
        self.assertEqual(resource_fields_count, 3)
        
        # Verify checklist template
        checklist_items_count = ChecklistTemplateItem.objects.filter(
            content_type=package_ct,
            object_id=package_id
        ).count()
        self.assertEqual(checklist_items_count, 3)
        
        # Verify images
        images_count = ProductImage.objects.filter(
            content_type=package_ct,
            object_id=package_id
        ).count()
        self.assertEqual(images_count, 2)
        
        # Verify primary image
        primary_image = ProductImage.objects.filter(
            content_type=package_ct,
            object_id=package_id,
            is_primary=True
        ).first()
        self.assertIsNotNone(primary_image)


class DynamicResourceSubmissionWorkflowTest(APITestCase):
    """Test dynamic resource submission flow"""
    
    def setUp(self):
        """Set up test data"""
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='testpass123',
            phone_number='1234567890',
            is_staff=True,
            is_superuser=True
        )
        
        self.user = User.objects.create_user(
            username='customer',
            email='customer@test.com',
            password='testpass123',
            phone_number='0987654321'
        )
        
        # Create package with resource fields
        self.package = Package.objects.create(
            name='Test Package',
            price=Decimal('100.00'),
            description='Test',
            created_by=self.admin_user
        )
        
        package_ct = ContentType.objects.get_for_model(Package)
        
        # Create resource field definitions
        self.text_field = ResourceFieldDefinition.objects.create(
            content_type=package_ct,
            object_id=self.package.id,
            field_name='Candidate Name',
            field_type='text',
            is_required=True,
            order=0,
            max_length=100
        )
        
        self.number_field = ResourceFieldDefinition.objects.create(
            content_type=package_ct,
            object_id=self.package.id,
            field_name='Age',
            field_type='number',
            is_required=True,
            order=1,
            min_value=18,
            max_value=100
        )
        
        # Create order
        self.order = Order.objects.create(
            user=self.user,
            total_amount=Decimal('100.00'),
            status='pending_resources'
        )
        
        self.order_item = OrderItem.objects.create(
            order=self.order,
            content_type=package_ct,
            object_id=self.package.id,
            quantity=1,
            price=self.package.price
        )
        
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    def test_dynamic_resource_submission_flow(self):
        """Test submitting dynamic resources for an order"""
        # Step 1: Get required resource fields
        response = self.client.get(f'/api/orders/{self.order.id}/resource-fields/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        
        # Step 2: Submit dynamic resources
        submission_data = {
            'submissions': [
                {
                    'field_definition_id': self.text_field.id,
                    'text_value': 'John Doe'
                },
                {
                    'field_definition_id': self.number_field.id,
                    'number_value': 35
                }
            ]
        }
        
        response = self.client.post(
            f'/api/orders/{self.order.id}/submit-resources/',
            submission_data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Step 3: Verify submissions were created
        text_submission = DynamicResourceSubmission.objects.filter(
            order_item=self.order_item,
            field_definition=self.text_field
        ).first()
        self.assertIsNotNone(text_submission)
        self.assertEqual(text_submission.text_value, 'John Doe')
        
        number_submission = DynamicResourceSubmission.objects.filter(
            order_item=self.order_item,
            field_definition=self.number_field
        ).first()
        self.assertIsNotNone(number_submission)
        self.assertEqual(number_submission.number_value, 35)
        
        # Step 4: Verify order item is marked as resources uploaded
        self.order_item.refresh_from_db()
        self.assertTrue(self.order_item.resources_uploaded)


class InvoiceGenerationWorkflowTest(APITestCase):
    """Test invoice generation and download workflow"""
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username='customer',
            email='customer@test.com',
            password='testpass123',
            phone_number='0987654321'
        )
        
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='testpass123',
            phone_number='1234567890',
            is_staff=True
        )
        
        # Create package
        self.package = Package.objects.create(
            name='Test Package',
            price=Decimal('500.00'),
            description='Test',
            created_by=self.admin_user
        )
        
        # Create order
        self.order = Order.objects.create(
            user=self.user,
            total_amount=Decimal('500.00'),
            status='completed',
            payment_completed_at=datetime.now()
        )
        
        package_ct = ContentType.objects.get_for_model(Package)
        OrderItem.objects.create(
            order=self.order,
            content_type=package_ct,
            object_id=self.package.id,
            quantity=1,
            price=self.package.price
        )
        
        # Create payment history
        self.payment = PaymentHistory.objects.create(
            order=self.order,
            payment_method='Razorpay',
            transaction_id='pay_test123456',
            amount=Decimal('500.00'),
            currency='INR',
            status='completed',
            payment_date=datetime.now(),
            invoice_number=PaymentHistory.generate_invoice_number()
        )
        
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    def test_invoice_generation_and_download(self):
        """Test generating and downloading invoice"""
        # Step 1: Get payment history
        response = self.client.get(f'/api/orders/{self.order.id}/payment-history/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['invoice_number'], self.payment.invoice_number)
        
        # Step 2: Download invoice
        response = self.client.get(f'/api/orders/{self.order.id}/invoice/download/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'application/pdf')
        
        # Verify filename format
        content_disposition = response['Content-Disposition']
        self.assertIn('Invoice-', content_disposition)
        self.assertIn('.pdf', content_disposition)
    
    def test_user_can_only_download_own_invoice(self):
        """Test that users can only download their own invoices"""
        # Create another user
        other_user = User.objects.create_user(
            username='other',
            email='other@test.com',
            password='testpass123',
            phone_number='1111111111'
        )
        
        # Authenticate as other user
        self.client.force_authenticate(user=other_user)
        
        # Try to download invoice
        response = self.client.get(f'/api/orders/{self.order.id}/invoice/download/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class AnalyticsCalculationTest(TestCase):
    """Test analytics calculation accuracy"""
    
    def setUp(self):
        """Set up test data"""
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='testpass123',
            phone_number='1234567890',
            is_staff=True
        )
        
        self.staff_user = User.objects.create_user(
            username='staff',
            email='staff@test.com',
            password='testpass123',
            phone_number='2222222222',
            is_staff=True
        )
        
        self.user1 = User.objects.create_user(
            username='customer1',
            email='customer1@test.com',
            password='testpass123',
            phone_number='3333333333'
        )
        
        self.user2 = User.objects.create_user(
            username='customer2',
            email='customer2@test.com',
            password='testpass123',
            phone_number='4444444444'
        )
        
        # Create packages
        self.package1 = Package.objects.create(
            name='Package 1',
            price=Decimal('100.00'),
            description='Test',
            created_by=self.admin_user
        )
        
        self.package2 = Package.objects.create(
            name='Package 2',
            price=Decimal('200.00'),
            description='Test',
            created_by=self.admin_user
        )
    
    def test_revenue_metrics_calculation(self):
        """Test that revenue metrics are calculated correctly"""
        # Create completed orders
        order1 = Order.objects.create(
            user=self.user1,
            total_amount=Decimal('100.00'),
            status='completed',
            payment_completed_at=datetime.now()
        )
        
        order2 = Order.objects.create(
            user=self.user2,
            total_amount=Decimal('200.00'),
            status='completed',
            payment_completed_at=datetime.now()
        )
        
        order3 = Order.objects.create(
            user=self.user1,
            total_amount=Decimal('150.00'),
            status='completed',
            payment_completed_at=datetime.now()
        )
        
        # Calculate metrics
        start_date = datetime.now() - timedelta(days=30)
        end_date = datetime.now() + timedelta(days=1)
        
        metrics = AnalyticsService.get_revenue_metrics(start_date, end_date)
        
        # Verify calculations
        self.assertEqual(metrics['total_revenue'], Decimal('450.00'))
        self.assertEqual(metrics['order_count'], 3)
        self.assertEqual(metrics['average_order_value'], Decimal('150.00'))
    
    def test_top_products_calculation(self):
        """Test that top products are calculated correctly"""
        package_ct = ContentType.objects.get_for_model(Package)
        
        # Create orders with different products
        order1 = Order.objects.create(
            user=self.user1,
            total_amount=Decimal('100.00'),
            status='completed',
            payment_completed_at=datetime.now()
        )
        OrderItem.objects.create(
            order=order1,
            content_type=package_ct,
            object_id=self.package1.id,
            quantity=2,
            price=self.package1.price
        )
        
        order2 = Order.objects.create(
            user=self.user2,
            total_amount=Decimal('200.00'),
            status='completed',
            payment_completed_at=datetime.now()
        )
        OrderItem.objects.create(
            order=order2,
            content_type=package_ct,
            object_id=self.package2.id,
            quantity=1,
            price=self.package2.price
        )
        
        order3 = Order.objects.create(
            user=self.user1,
            total_amount=Decimal('100.00'),
            status='completed',
            payment_completed_at=datetime.now()
        )
        OrderItem.objects.create(
            order=order3,
            content_type=package_ct,
            object_id=self.package1.id,
            quantity=3,
            price=self.package1.price
        )
        
        # Get top products
        top_products = AnalyticsService.get_top_products(limit=5)
        
        # Verify Package 1 is top (5 total quantity)
        self.assertGreater(len(top_products), 0)
        self.assertEqual(top_products[0]['product_name'], 'Package 1')
        self.assertEqual(top_products[0]['total_quantity'], 5)
    
    def test_staff_performance_calculation(self):
        """Test that staff performance metrics are calculated correctly"""
        # Create orders assigned to staff
        order1 = Order.objects.create(
            user=self.user1,
            total_amount=Decimal('100.00'),
            status='completed',
            assigned_to=self.staff_user,
            payment_completed_at=datetime.now()
        )
        
        order2 = Order.objects.create(
            user=self.user2,
            total_amount=Decimal('200.00'),
            status='in_progress',
            assigned_to=self.staff_user,
            payment_completed_at=datetime.now()
        )
        
        order3 = Order.objects.create(
            user=self.user1,
            total_amount=Decimal('150.00'),
            status='assigned',
            assigned_to=self.staff_user,
            payment_completed_at=datetime.now()
        )
        
        # Get staff performance
        performance = AnalyticsService.get_staff_performance()
        
        # Find staff user in results
        staff_metrics = next(
            (p for p in performance if p['staff_id'] == self.staff_user.id),
            None
        )
        
        self.assertIsNotNone(staff_metrics)
        self.assertEqual(staff_metrics['assigned_orders'], 3)
        self.assertEqual(staff_metrics['completed_orders'], 1)
        self.assertEqual(staff_metrics['completion_rate'], 33.33)


class ChecklistGenerationIntegrationTest(TestCase):
    """Test checklist generation from templates during order assignment"""
    
    def setUp(self):
        """Set up test data"""
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='testpass123',
            phone_number='1234567890',
            is_staff=True
        )
        
        self.staff_user = User.objects.create_user(
            username='staff',
            email='staff@test.com',
            password='testpass123',
            phone_number='2222222222',
            is_staff=True
        )
        
        self.user = User.objects.create_user(
            username='customer',
            email='customer@test.com',
            password='testpass123',
            phone_number='3333333333'
        )
        
        # Create package with checklist template
        self.package = Package.objects.create(
            name='Test Package',
            price=Decimal('100.00'),
            description='Test',
            created_by=self.admin_user
        )
        
        package_ct = ContentType.objects.get_for_model(Package)
        
        # Create checklist template items
        self.template_item1 = ChecklistTemplateItem.objects.create(
            content_type=package_ct,
            object_id=self.package.id,
            name='Review Requirements',
            description='Review all requirements',
            order=0,
            is_optional=False
        )
        
        self.template_item2 = ChecklistTemplateItem.objects.create(
            content_type=package_ct,
            object_id=self.package.id,
            name='Prepare Materials',
            description='Prepare materials',
            order=1,
            is_optional=False
        )
        
        self.template_item3 = ChecklistTemplateItem.objects.create(
            content_type=package_ct,
            object_id=self.package.id,
            name='Optional Check',
            description='Optional verification',
            order=2,
            is_optional=True
        )
        
        # Create order
        self.order = Order.objects.create(
            user=self.user,
            total_amount=Decimal('100.00'),
            status='ready_for_processing'
        )
        
        OrderItem.objects.create(
            order=self.order,
            content_type=package_ct,
            object_id=self.package.id,
            quantity=1,
            price=self.package.price
        )
    
    def test_checklist_generation_on_order_assignment(self):
        """Test that checklist is generated from template when order is assigned"""
        # Generate checklist
        checklist = ChecklistService.generate_checklist_for_order(self.order)
        
        # Verify checklist was created
        self.assertIsNotNone(checklist)
        self.assertEqual(checklist.order, self.order)
        
        # Verify all template items were copied
        items = checklist.items.all()
        self.assertEqual(items.count(), 3)
        
        # Verify items match template
        self.assertEqual(items[0].description, 'Review Requirements')
        self.assertFalse(items[0].is_optional)
        self.assertEqual(items[0].template_item, self.template_item1)
        
        self.assertEqual(items[1].description, 'Prepare Materials')
        self.assertFalse(items[1].is_optional)
        self.assertEqual(items[1].template_item, self.template_item2)
        
        self.assertEqual(items[2].description, 'Optional verification')
        self.assertTrue(items[2].is_optional)
        self.assertEqual(items[2].template_item, self.template_item3)
    
    def test_progress_calculation_with_optional_items(self):
        """Test that progress calculation correctly handles optional items"""
        # Generate checklist
        checklist = ChecklistService.generate_checklist_for_order(self.order)
        
        # Get initial progress
        progress = ChecklistService.get_checklist_progress(checklist)
        self.assertEqual(progress['required_items'], 2)
        self.assertEqual(progress['progress_percentage'], 0)
        
        # Complete one required item
        item1 = checklist.items.all()[0]
        item1.completed = True
        item1.save()
        
        progress = ChecklistService.get_checklist_progress(checklist)
        self.assertEqual(progress['completed_required'], 1)
        self.assertEqual(progress['progress_percentage'], 50)
        
        # Complete optional item (should not affect progress)
        item3 = checklist.items.all()[2]
        item3.completed = True
        item3.save()
        
        progress = ChecklistService.get_checklist_progress(checklist)
        self.assertEqual(progress['progress_percentage'], 50)  # Still 50%
        
        # Complete second required item
        item2 = checklist.items.all()[1]
        item2.completed = True
        item2.save()
        
        progress = ChecklistService.get_checklist_progress(checklist)
        self.assertEqual(progress['progress_percentage'], 100)  # Now 100%
