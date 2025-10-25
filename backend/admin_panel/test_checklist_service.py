"""
Test script for verifying checklist generation from templates.
This tests task 3.4: Update order assignment logic
"""
from django.test import TestCase
from django.contrib.contenttypes.models import ContentType
from authentication.models import CustomUser
from products.models import Package, Campaign, ChecklistTemplateItem
from orders.models import Order, OrderItem, OrderChecklist, ChecklistItem
from admin_panel.checklist_service import ChecklistService


class ChecklistServiceTest(TestCase):
    """Test checklist generation from templates"""
    
    def setUp(self):
        """Set up test data"""
        # Create test user
        self.user = CustomUser.objects.create_user(
            username='testuser',
            phone_number='1234567890',
            password='testpass123',
            role='customer'
        )
        
        # Create test staff
        self.staff = CustomUser.objects.create_user(
            username='staffuser',
            phone_number='0987654321',
            password='testpass123',
            role='staff'
        )
        
        # Create test package
        self.package = Package.objects.create(
            name='Test Package',
            price=1000.00,
            description='Test package description',
            is_active=True
        )
        
        # Create checklist template items for the package
        package_ct = ContentType.objects.get_for_model(Package)
        
        self.template_item1 = ChecklistTemplateItem.objects.create(
            content_type=package_ct,
            object_id=self.package.id,
            name='Review order details',
            description='Review all order details and requirements',
            order=0,
            is_optional=False
        )
        
        self.template_item2 = ChecklistTemplateItem.objects.create(
            content_type=package_ct,
            object_id=self.package.id,
            name='Prepare materials',
            description='Prepare all campaign materials',
            order=1,
            is_optional=False
        )
        
        self.template_item3 = ChecklistTemplateItem.objects.create(
            content_type=package_ct,
            object_id=self.package.id,
            name='Optional quality check',
            description='Perform additional quality checks',
            order=2,
            is_optional=True
        )
        
        # Create test order
        self.order = Order.objects.create(
            user=self.user,
            total_amount=1000.00,
            status='ready_for_processing'
        )
        
        # Create order item
        package_ct = ContentType.objects.get_for_model(Package)
        self.order_item = OrderItem.objects.create(
            order=self.order,
            content_type=package_ct,
            object_id=self.package.id,
            quantity=1,
            price=1000.00
        )
    
    def test_generate_checklist_from_template(self):
        """Test that checklist is generated from template items"""
        # Generate checklist
        checklist = ChecklistService.generate_checklist_for_order(self.order)
        
        # Verify checklist was created
        self.assertIsNotNone(checklist)
        self.assertEqual(checklist.order, self.order)
        
        # Verify checklist items were created from template
        items = checklist.items.all()
        self.assertEqual(items.count(), 3)
        
        # Verify first item
        item1 = items[0]
        self.assertEqual(item1.description, 'Review order details')
        self.assertEqual(item1.order_index, 0)
        self.assertFalse(item1.is_optional)
        self.assertEqual(item1.template_item, self.template_item1)
        
        # Verify second item
        item2 = items[1]
        self.assertEqual(item2.description, 'Prepare materials')
        self.assertEqual(item2.order_index, 1)
        self.assertFalse(item2.is_optional)
        self.assertEqual(item2.template_item, self.template_item2)
        
        # Verify third item (optional)
        item3 = items[2]
        self.assertEqual(item3.description, 'Optional quality check')
        self.assertEqual(item3.order_index, 2)
        self.assertTrue(item3.is_optional)
        self.assertEqual(item3.template_item, self.template_item3)
    
    def test_progress_calculation_excludes_optional_items(self):
        """Test that progress calculation excludes optional items"""
        # Generate checklist
        checklist = ChecklistService.generate_checklist_for_order(self.order)
        
        # Initially, no items are completed
        progress = ChecklistService.get_checklist_progress(checklist)
        self.assertEqual(progress['total_items'], 3)
        self.assertEqual(progress['required_items'], 2)  # Only 2 required items
        self.assertEqual(progress['completed_required'], 0)
        self.assertEqual(progress['progress_percentage'], 0)
        
        # Complete first required item
        item1 = checklist.items.all()[0]
        item1.completed = True
        item1.save()
        
        progress = ChecklistService.get_checklist_progress(checklist)
        self.assertEqual(progress['completed_required'], 1)
        self.assertEqual(progress['progress_percentage'], 50)  # 1 of 2 required items
        
        # Complete optional item (should not affect progress)
        item3 = checklist.items.all()[2]
        item3.completed = True
        item3.save()
        
        progress = ChecklistService.get_checklist_progress(checklist)
        self.assertEqual(progress['completed_items'], 2)  # 2 total items completed
        self.assertEqual(progress['completed_required'], 1)  # Still only 1 required item
        self.assertEqual(progress['progress_percentage'], 50)  # Still 50%
        
        # Complete second required item
        item2 = checklist.items.all()[1]
        item2.completed = True
        item2.save()
        
        progress = ChecklistService.get_checklist_progress(checklist)
        self.assertEqual(progress['completed_required'], 2)
        self.assertEqual(progress['progress_percentage'], 100)  # All required items done
    
    def test_fallback_to_default_checklist(self):
        """Test that default checklist is generated when no templates exist"""
        # Create a campaign without template items
        campaign = Campaign.objects.create(
            name='Test Campaign',
            price=500.00,
            unit='per day',
            description='Test campaign description',
            is_active=True
        )
        
        # Create order with campaign
        order = Order.objects.create(
            user=self.user,
            total_amount=500.00,
            status='ready_for_processing'
        )
        
        campaign_ct = ContentType.objects.get_for_model(Campaign)
        OrderItem.objects.create(
            order=order,
            content_type=campaign_ct,
            object_id=campaign.id,
            quantity=1,
            price=500.00
        )
        
        # Generate checklist
        checklist = ChecklistService.generate_checklist_for_order(order)
        
        # Verify checklist was created with default items
        self.assertIsNotNone(checklist)
        items = checklist.items.all()
        self.assertGreater(items.count(), 0)
        
        # Verify items don't have template references
        for item in items:
            self.assertIsNone(item.template_item)


if __name__ == '__main__':
    import django
    import os
    import sys
    
    # Setup Django
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'election_cart.settings')
    django.setup()
    
    # Run tests
    from django.test.utils import get_runner
    from django.conf import settings
    
    TestRunner = get_runner(settings)
    test_runner = TestRunner(verbosity=2, interactive=True, keepdb=False)
    failures = test_runner.run_tests(['admin_panel.test_checklist_service'])
    
    if failures:
        sys.exit(1)
