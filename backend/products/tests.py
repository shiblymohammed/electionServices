"""
Unit tests for product validation logic
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from rest_framework.test import APITestCase
from rest_framework import status
from decimal import Decimal
from .models import Package, Campaign
from orders.models import Order, OrderItem

User = get_user_model()


class ProductValidationTestCase(TestCase):
    """Test product model validation logic"""
    
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
        
        self.package = Package.objects.create(
            name='Test Package',
            price=Decimal('100.00'),
            description='Test description',
            created_by=self.admin_user
        )
        
        self.campaign = Campaign.objects.create(
            name='Test Campaign',
            price=Decimal('50.00'),
            unit='per unit',
            description='Test campaign description',
            created_by=self.admin_user
        )
    
    def test_package_creation(self):
        """Test that packages can be created with valid data"""
        package = Package.objects.create(
            name='New Package',
            price=Decimal('200.00'),
            description='New package description',
            created_by=self.admin_user
        )
        self.assertEqual(package.name, 'New Package')
        self.assertEqual(package.price, Decimal('200.00'))
        self.assertTrue(package.is_active)
    
    def test_campaign_creation(self):
        """Test that campaigns can be created with valid data"""
        campaign = Campaign.objects.create(
            name='New Campaign',
            price=Decimal('75.00'),
            unit='per item',
            description='New campaign description',
            created_by=self.admin_user
        )
        self.assertEqual(campaign.name, 'New Campaign')
        self.assertEqual(campaign.price, Decimal('75.00'))
        self.assertTrue(campaign.is_active)


class ProductAPIValidationTestCase(APITestCase):
    """Test product API validation logic"""
    
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
        
        self.package = Package.objects.create(
            name='Existing Package',
            price=Decimal('100.00'),
            description='Test description',
            created_by=self.admin_user
        )
        
        self.campaign = Campaign.objects.create(
            name='Existing Campaign',
            price=Decimal('50.00'),
            unit='per unit',
            description='Test campaign description',
            created_by=self.admin_user
        )
    
    def test_unique_package_name_validation_on_create(self):
        """Test that duplicate package names are rejected on creation"""
        self.client.force_authenticate(user=self.admin_user)
        
        data = {
            'name': 'Existing Package',  # Duplicate name
            'price': 150.00,
            'description': 'Another package',
            'is_active': True
        }
        
        response = self.client.post('/api/admin/products/package/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)
        self.assertIn('already exists', str(response.data['name'][0]).lower())
    
    def test_unique_package_name_validation_on_update(self):
        """Test that duplicate package names are rejected on update"""
        self.client.force_authenticate(user=self.admin_user)
        
        # Create another package
        other_package = Package.objects.create(
            name='Other Package',
            price=Decimal('200.00'),
            description='Other description',
            created_by=self.admin_user
        )
        
        # Try to update with existing name
        data = {
            'name': 'Existing Package',  # Duplicate name
            'price': 250.00,
            'description': 'Updated description',
            'is_active': True
        }
        
        response = self.client.put(
            f'/api/admin/products/package/{other_package.id}/update/',
            data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)
    
    def test_unique_campaign_name_validation_on_create(self):
        """Test that duplicate campaign names are rejected on creation"""
        self.client.force_authenticate(user=self.admin_user)
        
        data = {
            'name': 'Existing Campaign',  # Duplicate name
            'price': 75.00,
            'unit': 'per item',
            'description': 'Another campaign',
            'is_active': True
        }
        
        response = self.client.post('/api/admin/products/campaign/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)
        self.assertIn('already exists', str(response.data['name'][0]).lower())
    
    def test_unique_campaign_name_validation_on_update(self):
        """Test that duplicate campaign names are rejected on update"""
        self.client.force_authenticate(user=self.admin_user)
        
        # Create another campaign
        other_campaign = Campaign.objects.create(
            name='Other Campaign',
            price=Decimal('100.00'),
            unit='per unit',
            description='Other description',
            created_by=self.admin_user
        )
        
        # Try to update with existing name
        data = {
            'name': 'Existing Campaign',  # Duplicate name
            'price': 125.00,
            'unit': 'per item',
            'description': 'Updated description',
            'is_active': True
        }
        
        response = self.client.put(
            f'/api/admin/products/campaign/{other_campaign.id}/update/',
            data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)
    
    def test_positive_price_validation_for_package(self):
        """Test that negative or zero prices are rejected for packages"""
        self.client.force_authenticate(user=self.admin_user)
        
        # Test zero price
        data = {
            'name': 'Zero Price Package',
            'price': 0,
            'description': 'Test package',
            'is_active': True
        }
        
        response = self.client.post('/api/admin/products/package/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('price', response.data)
        self.assertIn('greater than zero', str(response.data['price'][0]).lower())
        
        # Test negative price
        data['price'] = -50.00
        response = self.client.post('/api/admin/products/package/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('price', response.data)
    
    def test_positive_price_validation_for_campaign(self):
        """Test that negative or zero prices are rejected for campaigns"""
        self.client.force_authenticate(user=self.admin_user)
        
        # Test zero price
        data = {
            'name': 'Zero Price Campaign',
            'price': 0,
            'unit': 'per unit',
            'description': 'Test campaign',
            'is_active': True
        }
        
        response = self.client.post('/api/admin/products/campaign/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('price', response.data)
        self.assertIn('greater than zero', str(response.data['price'][0]).lower())
        
        # Test negative price
        data['price'] = -25.00
        response = self.client.post('/api/admin/products/campaign/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('price', response.data)
    
    def test_delete_product_without_active_orders(self):
        """Test that products without active orders can be deleted"""
        self.client.force_authenticate(user=self.admin_user)
        
        # Create a package without orders
        package = Package.objects.create(
            name='Deletable Package',
            price=Decimal('100.00'),
            description='Can be deleted',
            created_by=self.admin_user
        )
        
        response = self.client.delete(f'/api/admin/products/package/{package.id}/delete/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verify package is deleted
        self.assertFalse(Package.objects.filter(id=package.id).exists())
    
    def test_prevent_delete_product_with_pending_orders(self):
        """Test that products with pending orders cannot be deleted"""
        self.client.force_authenticate(user=self.admin_user)
        
        # Create an order with the package
        order = Order.objects.create(
            user=self.regular_user,
            total_amount=Decimal('100.00'),
            status='pending_payment'
        )
        
        content_type = ContentType.objects.get_for_model(Package)
        OrderItem.objects.create(
            order=order,
            content_type=content_type,
            object_id=self.package.id,
            quantity=1,
            price=self.package.price
        )
        
        response = self.client.delete(f'/api/admin/products/package/{self.package.id}/delete/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('pending or in-progress orders', str(response.data['error']).lower())
        
        # Verify package still exists
        self.assertTrue(Package.objects.filter(id=self.package.id).exists())
    
    def test_prevent_delete_product_with_in_progress_orders(self):
        """Test that products with in-progress orders cannot be deleted"""
        self.client.force_authenticate(user=self.admin_user)
        
        # Create an order with the campaign
        order = Order.objects.create(
            user=self.regular_user,
            total_amount=Decimal('50.00'),
            status='in_progress',
            assigned_to=self.admin_user
        )
        
        content_type = ContentType.objects.get_for_model(Campaign)
        OrderItem.objects.create(
            order=order,
            content_type=content_type,
            object_id=self.campaign.id,
            quantity=1,
            price=self.campaign.price
        )
        
        response = self.client.delete(f'/api/admin/products/campaign/{self.campaign.id}/delete/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('pending or in-progress orders', str(response.data['error']).lower())
        
        # Verify campaign still exists
        self.assertTrue(Campaign.objects.filter(id=self.campaign.id).exists())
    
    def test_allow_delete_product_with_completed_orders(self):
        """Test that products with only completed orders can be deleted"""
        self.client.force_authenticate(user=self.admin_user)
        
        # Create a package with a completed order
        package = Package.objects.create(
            name='Completed Package',
            price=Decimal('100.00'),
            description='Has completed order',
            created_by=self.admin_user
        )
        
        order = Order.objects.create(
            user=self.regular_user,
            total_amount=Decimal('100.00'),
            status='completed'
        )
        
        content_type = ContentType.objects.get_for_model(Package)
        OrderItem.objects.create(
            order=order,
            content_type=content_type,
            object_id=package.id,
            quantity=1,
            price=package.price
        )
        
        response = self.client.delete(f'/api/admin/products/package/{package.id}/delete/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verify package is deleted but order item still references it
        self.assertFalse(Package.objects.filter(id=package.id).exists())
        self.assertTrue(OrderItem.objects.filter(object_id=package.id).exists())
    
    def test_valid_package_creation(self):
        """Test that packages with valid data are created successfully"""
        self.client.force_authenticate(user=self.admin_user)
        
        data = {
            'name': 'Valid Package',
            'price': 150.00,
            'description': 'Valid package description',
            'is_active': True,
            'items': [
                {'name': 'Item 1', 'quantity': 5},
                {'name': 'Item 2', 'quantity': 10}
            ]
        }
        
        response = self.client.post('/api/admin/products/package/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Valid Package')
        self.assertEqual(float(response.data['price']), 150.00)
    
    def test_valid_campaign_creation(self):
        """Test that campaigns with valid data are created successfully"""
        self.client.force_authenticate(user=self.admin_user)
        
        data = {
            'name': 'Valid Campaign',
            'price': 75.00,
            'unit': 'per item',
            'description': 'Valid campaign description',
            'is_active': True
        }
        
        response = self.client.post('/api/admin/products/campaign/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Valid Campaign')
        self.assertEqual(float(response.data['price']), 75.00)
