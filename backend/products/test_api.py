"""
API tests for election cart enhancements
Tests for product CRUD, resource field management, checklist templates, analytics, and image uploads
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
from orders.models import Order, OrderItem, PaymentHistory

User = get_user_model()


class ProductCRUDAPITest(APITestCase):
    """Test product CRUD API endpoints"""
    
    def setUp(self):
        """Set up test data"""
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='testpass123',
            phone_number='1234567890',
            first_name='Admin',
            last_name='User',
            is_staff=True,
            is_superuser=True
        )
        
        self.regular_user = User.objects.create_user(
            username='user',
            email='user@test.com',
            password='testpass123',
            phone_number='0987654321',
            first_name='Regular',
            last_name='User'
        )
        
        self.client = APIClient()
    
    def test_create_package(self):
        """Test creating a new package"""
        self.client.force_authenticate(user=self.admin_user)
        
        data = {
            'name': 'New Package',
            'price': 150.00,
            'description': 'Test package description',
            'features': ['Feature 1', 'Feature 2'],
            'deliverables': ['Deliverable 1'],
            'is_active': True,
            'items': [
                {'name': 'Item 1', 'quantity': 5},
                {'name': 'Item 2', 'quantity': 10}
            ]
        }
        
        response = self.client.post('/api/admin/products/package/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'New Package')
        self.assertEqual(float(response.data['price']), 150.00)
        self.assertTrue(Package.objects.filter(name='New Package').exists())
    
    def test_create_campaign(self):
        """Test creating a new campaign"""
        self.client.force_authenticate(user=self.admin_user)
        
        data = {
            'name': 'New Campaign',
            'price': 75.00,
            'unit': 'per day',
            'description': 'Test campaign description',
            'features': ['Feature 1'],
            'deliverables': ['Deliverable 1'],
            'is_active': True
        }
        
        response = self.client.post('/api/admin/products/campaign/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'New Campaign')
        self.assertEqual(float(response.data['price']), 75.00)
        self.assertTrue(Campaign.objects.filter(name='New Campaign').exists())
    
    def test_list_all_products(self):
        """Test listing all products (packages and campaigns)"""
        self.client.force_authenticate(user=self.admin_user)
        
        # Create test products
        Package.objects.create(
            name='Test Package',
            price=Decimal('100.00'),
            description='Package description',
            created_by=self.admin_user
        )
        
        Campaign.objects.create(
            name='Test Campaign',
            price=Decimal('50.00'),
            unit='per day',
            description='Campaign description',
            created_by=self.admin_user
        )
        
        response = self.client.get('/api/admin/products/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 2)
    
    def test_update_package(self):
        """Test updating a package"""
        self.client.force_authenticate(user=self.admin_user)
        
        package = Package.objects.create(
            name='Original Package',
            price=Decimal('100.00'),
            description='Original description',
            created_by=self.admin_user
        )
        
        data = {
            'name': 'Updated Package',
            'price': 150.00,
            'description': 'Updated description',
            'is_active': True
        }
        
        response = self.client.put(
            f'/api/admin/products/package/{package.id}/update/',
            data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Updated Package')
        
        package.refresh_from_db()
        self.assertEqual(package.name, 'Updated Package')
    
    def test_delete_package(self):
        """Test deleting a package"""
        self.client.force_authenticate(user=self.admin_user)
        
        package = Package.objects.create(
            name='Deletable Package',
            price=Decimal('100.00'),
            description='Can be deleted',
            created_by=self.admin_user
        )
        
        response = self.client.delete(f'/api/admin/products/package/{package.id}/delete/')
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Package.objects.filter(id=package.id).exists())
    
    def test_toggle_product_status(self):
        """Test toggling product active status"""
        self.client.force_authenticate(user=self.admin_user)
        
        package = Package.objects.create(
            name='Test Package',
            price=Decimal('100.00'),
            description='Test',
            is_active=True,
            created_by=self.admin_user
        )
        
        response = self.client.patch(f'/api/admin/products/package/{package.id}/toggle-status/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        package.refresh_from_db()
        self.assertFalse(package.is_active)
    
    def test_non_admin_cannot_create_product(self):
        """Test that non-admin users cannot create products"""
        self.client.force_authenticate(user=self.regular_user)
        
        data = {
            'name': 'Unauthorized Package',
            'price': 100.00,
            'description': 'Should not be created'
        }
        
        response = self.client.post('/api/admin/products/package/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class ResourceFieldManagementAPITest(APITestCase):
    """Test resource field management API endpoints"""
    
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
        
        self.package = Package.objects.create(
            name='Test Package',
            price=Decimal('100.00'),
            description='Test',
            created_by=self.admin_user
        )
        
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin_user)
    
    def test_create_resource_field(self):
        """Test creating a resource field definition"""
        data = {
            'field_name': 'Candidate Name',
            'field_type': 'text',
            'is_required': True,
            'order': 0,
            'help_text': 'Enter full name',
            'max_length': 100
        }
        
        response = self.client.post(
            f'/api/admin/products/package/{self.package.id}/resource-fields/',
            data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['field_name'], 'Candidate Name')
        self.assertTrue(
            ResourceFieldDefinition.objects.filter(
                field_name='Candidate Name',
                object_id=self.package.id
            ).exists()
        )
    
    def test_list_resource_fields(self):
        """Test listing resource fields for a product"""
        package_ct = ContentType.objects.get_for_model(Package)
        
        ResourceFieldDefinition.objects.create(
            content_type=package_ct,
            object_id=self.package.id,
            field_name='Field 1',
            field_type='text',
            order=0
        )
        
        ResourceFieldDefinition.objects.create(
            content_type=package_ct,
            object_id=self.package.id,
            field_name='Field 2',
            field_type='image',
            order=1
        )
        
        response = self.client.get(
            f'/api/admin/products/package/{self.package.id}/resource-fields/'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
    
    def test_update_resource_field(self):
        """Test updating a resource field"""
        package_ct = ContentType.objects.get_for_model(Package)
        
        field = ResourceFieldDefinition.objects.create(
            content_type=package_ct,
            object_id=self.package.id,
            field_name='Original Name',
            field_type='text',
            order=0
        )
        
        data = {
            'field_name': 'Updated Name',
            'field_type': 'text',
            'is_required': False,
            'order': 0
        }
        
        response = self.client.put(
            f'/api/admin/products/resource-fields/{field.id}/',
            data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        field.refresh_from_db()
        self.assertEqual(field.field_name, 'Updated Name')
    
    def test_delete_resource_field(self):
        """Test deleting a resource field"""
        package_ct = ContentType.objects.get_for_model(Package)
        
        field = ResourceFieldDefinition.objects.create(
            content_type=package_ct,
            object_id=self.package.id,
            field_name='Deletable Field',
            field_type='text',
            order=0
        )
        
        response = self.client.delete(
            f'/api/admin/products/resource-fields/{field.id}/'
        )
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(ResourceFieldDefinition.objects.filter(id=field.id).exists())
    
    def test_reorder_resource_fields(self):
        """Test reordering resource fields"""
        package_ct = ContentType.objects.get_for_model(Package)
        
        field1 = ResourceFieldDefinition.objects.create(
            content_type=package_ct,
            object_id=self.package.id,
            field_name='Field 1',
            field_type='text',
            order=0
        )
        
        field2 = ResourceFieldDefinition.objects.create(
            content_type=package_ct,
            object_id=self.package.id,
            field_name='Field 2',
            field_type='text',
            order=1
        )
        
        data = {
            'field_orders': [
                {'id': field2.id, 'order': 0},
                {'id': field1.id, 'order': 1}
            ]
        }
        
        response = self.client.patch(
            '/api/admin/products/resource-fields/reorder/',
            data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        field1.refresh_from_db()
        field2.refresh_from_db()
        
        self.assertEqual(field2.order, 0)
        self.assertEqual(field1.order, 1)


class ChecklistTemplateAPITest(APITestCase):
    """Test checklist template API endpoints"""
    
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
        
        self.campaign = Campaign.objects.create(
            name='Test Campaign',
            price=Decimal('50.00'),
            unit='per day',
            description='Test',
            created_by=self.admin_user
        )
        
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin_user)
    
    def test_create_checklist_template_item(self):
        """Test creating a checklist template item"""
        data = {
            'name': 'Review Requirements',
            'description': 'Review all campaign requirements',
            'order': 0,
            'is_optional': False,
            'estimated_duration_minutes': 30
        }
        
        response = self.client.post(
            f'/api/admin/products/campaign/{self.campaign.id}/checklist-template/',
            data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Review Requirements')
        self.assertTrue(
            ChecklistTemplateItem.objects.filter(
                name='Review Requirements',
                object_id=self.campaign.id
            ).exists()
        )
    
    def test_list_checklist_template_items(self):
        """Test listing checklist template items"""
        campaign_ct = ContentType.objects.get_for_model(Campaign)
        
        ChecklistTemplateItem.objects.create(
            content_type=campaign_ct,
            object_id=self.campaign.id,
            name='Item 1',
            description='Description 1',
            order=0
        )
        
        ChecklistTemplateItem.objects.create(
            content_type=campaign_ct,
            object_id=self.campaign.id,
            name='Item 2',
            description='Description 2',
            order=1
        )
        
        response = self.client.get(
            f'/api/admin/products/campaign/{self.campaign.id}/checklist-template/'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
    
    def test_update_checklist_template_item(self):
        """Test updating a checklist template item"""
        campaign_ct = ContentType.objects.get_for_model(Campaign)
        
        item = ChecklistTemplateItem.objects.create(
            content_type=campaign_ct,
            object_id=self.campaign.id,
            name='Original Name',
            description='Original description',
            order=0
        )
        
        data = {
            'name': 'Updated Name',
            'description': 'Updated description',
            'order': 0,
            'is_optional': True
        }
        
        response = self.client.put(
            f'/api/admin/products/checklist-template/{item.id}/',
            data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        item.refresh_from_db()
        self.assertEqual(item.name, 'Updated Name')
        self.assertTrue(item.is_optional)
    
    def test_delete_checklist_template_item(self):
        """Test deleting a checklist template item"""
        campaign_ct = ContentType.objects.get_for_model(Campaign)
        
        item = ChecklistTemplateItem.objects.create(
            content_type=campaign_ct,
            object_id=self.campaign.id,
            name='Deletable Item',
            description='Can be deleted',
            order=0
        )
        
        response = self.client.delete(
            f'/api/admin/products/checklist-template/{item.id}/'
        )
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(ChecklistTemplateItem.objects.filter(id=item.id).exists())


class AnalyticsAPITest(APITestCase):
    """Test analytics API endpoints"""
    
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
        
        # Create test orders
        self.package = Package.objects.create(
            name='Test Package',
            price=Decimal('100.00'),
            description='Test',
            created_by=self.admin_user
        )
        
        self.order = Order.objects.create(
            user=self.user,
            total_amount=Decimal('100.00'),
            status='completed',
            payment_completed_at=datetime.now()
        )
        
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin_user)
    
    def test_get_analytics_overview(self):
        """Test getting analytics overview"""
        response = self.client.get('/api/admin/analytics/overview/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_revenue', response.data)
        self.assertIn('total_orders', response.data)
        self.assertIn('average_order_value', response.data)
    
    def test_get_revenue_trend(self):
        """Test getting revenue trend data"""
        response = self.client.get('/api/admin/analytics/revenue-trend/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
    
    def test_get_top_products(self):
        """Test getting top products"""
        response = self.client.get('/api/admin/analytics/top-products/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
    
    def test_get_staff_performance(self):
        """Test getting staff performance metrics"""
        response = self.client.get('/api/admin/analytics/staff-performance/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
    
    def test_non_admin_cannot_access_analytics(self):
        """Test that non-admin users cannot access analytics"""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get('/api/admin/analytics/overview/')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class ImageUploadAPITest(APITestCase):
    """Test image upload API endpoints"""
    
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
        
        self.package = Package.objects.create(
            name='Test Package',
            price=Decimal('100.00'),
            description='Test',
            created_by=self.admin_user
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
            "test_image.jpg",
            img_io.read(),
            content_type="image/jpeg"
        )
    
    def test_upload_product_image(self):
        """Test uploading a product image"""
        test_image = self.create_test_image()
        
        data = {
            'image': test_image,
            'is_primary': True,
            'order': 0,
            'alt_text': 'Test image'
        }
        
        response = self.client.post(
            f'/api/admin/products/package/{self.package.id}/images/',
            data,
            format='multipart'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            ProductImage.objects.filter(
                object_id=self.package.id,
                is_primary=True
            ).exists()
        )
    
    def test_list_product_images(self):
        """Test listing product images"""
        package_ct = ContentType.objects.get_for_model(Package)
        
        test_image = self.create_test_image()
        
        ProductImage.objects.create(
            content_type=package_ct,
            object_id=self.package.id,
            image=test_image,
            order=0
        )
        
        response = self.client.get(
            f'/api/products/package/{self.package.id}/images/'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)
    
    def test_set_primary_image(self):
        """Test setting an image as primary"""
        package_ct = ContentType.objects.get_for_model(Package)
        
        test_image = self.create_test_image()
        
        image = ProductImage.objects.create(
            content_type=package_ct,
            object_id=self.package.id,
            image=test_image,
            is_primary=False,
            order=0
        )
        
        response = self.client.patch(
            f'/api/admin/products/images/{image.id}/set-primary/'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        image.refresh_from_db()
        self.assertTrue(image.is_primary)
    
    def test_delete_product_image(self):
        """Test deleting a product image"""
        package_ct = ContentType.objects.get_for_model(Package)
        
        test_image = self.create_test_image()
        
        image = ProductImage.objects.create(
            content_type=package_ct,
            object_id=self.package.id,
            image=test_image,
            order=0
        )
        
        response = self.client.delete(
            f'/api/admin/products/images/{image.id}/'
        )
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(ProductImage.objects.filter(id=image.id).exists())
