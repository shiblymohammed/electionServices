# Dynamic Checklist Template System Implementation

## Overview
This document describes the implementation of the dynamic checklist template system for the Election Cart application.

## What Was Implemented

### 1. ChecklistTemplateItem Model (Task 3.1)
- Created `ChecklistTemplateItem` model in `products/models.py`
- Fields:
  - `content_type` and `object_id` (GenericForeignKey for product association)
  - `name` - Name of the checklist item
  - `description` - Detailed description
  - `order` - Display order
  - `is_optional` - Whether the item is optional
  - `estimated_duration_minutes` - Estimated time to complete
  - `created_at` - Timestamp
- Created database migration: `products/migrations/0004_checklisttemplateitem.py`

### 2. Enhanced OrderChecklist Model (Task 3.2)
- Updated `ChecklistItem` model in `orders/models.py`
- Added fields:
  - `template_item` - Foreign key to ChecklistTemplateItem (tracks which template was used)
  - `is_optional` - Whether this checklist item is optional
- Created database migration: `orders/migrations/0004_checklistitem_is_optional_and_more.py`

### 3. Checklist Template Management API (Task 3.3)
- Created `ChecklistTemplateItemSerializer` in `products/serializers.py`
- Created `ChecklistTemplateViewSet` in `products/views.py`
- Added API endpoints in `products/urls.py`:
  - `GET /api/admin/products/{type}/{id}/checklist-template/` - List template items
  - `POST /api/admin/products/{type}/{id}/checklist-template/` - Create template item
  - `GET /api/admin/products/checklist-template/{id}/` - Get template item
  - `PUT /api/admin/products/checklist-template/{id}/` - Update template item
  - `DELETE /api/admin/products/checklist-template/{id}/` - Delete template item
  - `PATCH /api/admin/products/{type}/{id}/checklist-template/reorder/` - Reorder items

### 4. Updated Order Assignment Logic (Task 3.4)
- Modified `ChecklistService.generate_checklist_for_order()` in `admin_panel/checklist_service.py`:
  - Now checks for template items first
  - Creates checklist from templates if available
  - Falls back to default generation if no templates exist
  - Copies template item reference and optional status
- Added `_get_template_items_for_order()` method to retrieve templates for all products in order
- Updated `get_checklist_progress()` method:
  - Now excludes optional items from completion percentage calculation
  - Returns additional metrics: `required_items` and `completed_required`
  - Progress is based only on required items
- Registered `ChecklistTemplateItem` in Django admin

## How It Works

### Creating Templates
1. Admin creates checklist template items for a package or campaign
2. Each template item has a name, description, order, and optional flag
3. Templates are associated with products via GenericForeignKey

### Order Assignment
1. When an order is assigned to staff, `ChecklistService.generate_checklist_for_order()` is called
2. The service retrieves all template items for products in the order
3. Creates `ChecklistItem` instances from templates, preserving:
   - Template reference
   - Name (as description)
   - Order
   - Optional status
4. If no templates exist, falls back to default checklist generation

### Progress Calculation
1. `get_checklist_progress()` calculates completion based on required items only
2. Optional items don't affect the progress percentage
3. Order status updates to "completed" when all required items are done

## Database Schema

```
ChecklistTemplateItem
├── id (PK)
├── content_type_id (FK to ContentType)
├── object_id (Product ID)
├── name
├── description
├── order
├── is_optional
├── estimated_duration_minutes
└── created_at

ChecklistItem
├── id (PK)
├── checklist_id (FK to OrderChecklist)
├── template_item_id (FK to ChecklistTemplateItem) [NEW]
├── description
├── completed
├── completed_at
├── completed_by_id (FK to CustomUser)
├── order_index
└── is_optional [NEW]
```

## API Examples

### Create Template Item
```http
POST /api/admin/products/package/1/checklist-template/
Content-Type: application/json

{
  "name": "Review customer requirements",
  "description": "Review all uploaded resources and customer requirements",
  "order": 0,
  "is_optional": false,
  "estimated_duration_minutes": 30
}
```

### List Template Items
```http
GET /api/admin/products/package/1/checklist-template/
```

### Reorder Template Items
```http
PATCH /api/admin/products/package/1/checklist-template/reorder/
Content-Type: application/json

{
  "items": [
    {"id": 1, "order": 0},
    {"id": 2, "order": 1},
    {"id": 3, "order": 2}
  ]
}
```

## Testing

Run Django checks:
```bash
python manage.py check
```

Apply migrations:
```bash
python manage.py migrate
```

## Requirements Satisfied

- ✅ 3.1 - ChecklistTemplateItem model with GenericForeignKey
- ✅ 3.2 - Enhanced OrderChecklist with template_item and is_optional
- ✅ 3.6 - Checklist generation from templates
- ✅ 3.7 - Template management API endpoints
- ✅ 3.8 - Reorder functionality
- ✅ 3.9 - Completion percentage excludes optional items
- ✅ 3.10 - Optional items support
