# Checklist Template Management API

This document describes the API endpoints for managing checklist templates for products (packages and campaigns).

## Authentication

All endpoints require admin authentication. Include the Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase_id_token>
```

## Endpoints

### 1. List Checklist Template Items

Get all checklist template items for a specific product.

**Endpoint:** `GET /api/admin/products/{product_type}/{product_id}/checklist-template/`

**Parameters:**
- `product_type`: Either "package" or "campaign"
- `product_id`: The ID of the product

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "Review campaign materials",
    "description": "Check all submitted materials for quality and compliance",
    "order": 0,
    "is_optional": false,
    "estimated_duration_minutes": 30,
    "created_at": "2024-01-15T10:30:00Z",
    "product_type": "campaign",
    "product_id": 5
  },
  {
    "id": 2,
    "name": "Design approval",
    "description": "Get client approval on design mockups",
    "order": 1,
    "is_optional": false,
    "estimated_duration_minutes": 60,
    "created_at": "2024-01-15T10:35:00Z",
    "product_type": "campaign",
    "product_id": 5
  }
]
```

### 2. Create Checklist Template Item

Add a new checklist item to a product's template.

**Endpoint:** `POST /api/admin/products/{product_type}/{product_id}/checklist-template/`

**Parameters:**
- `product_type`: Either "package" or "campaign"
- `product_id`: The ID of the product

**Request Body:**
```json
{
  "name": "Print materials",
  "description": "Send materials to printing vendor",
  "order": 2,
  "is_optional": false,
  "estimated_duration_minutes": 120
}
```

**Notes:**
- If `order` is not provided, it will be automatically set to the next available order number
- All fields except `order` and `estimated_duration_minutes` are required

**Response:** `201 Created`
```json
{
  "id": 3,
  "name": "Print materials",
  "description": "Send materials to printing vendor",
  "order": 2,
  "is_optional": false,
  "estimated_duration_minutes": 120,
  "created_at": "2024-01-15T11:00:00Z",
  "product_type": "campaign",
  "product_id": 5
}
```

### 3. Get Checklist Template Item

Retrieve details of a specific checklist template item.

**Endpoint:** `GET /api/admin/products/checklist-template/{id}/`

**Parameters:**
- `id`: The ID of the checklist template item

**Response:** `200 OK`
```json
{
  "id": 1,
  "name": "Review campaign materials",
  "description": "Check all submitted materials for quality and compliance",
  "order": 0,
  "is_optional": false,
  "estimated_duration_minutes": 30,
  "created_at": "2024-01-15T10:30:00Z",
  "product_type": "campaign",
  "product_id": 5
}
```

### 4. Update Checklist Template Item

Update an existing checklist template item.

**Endpoint:** `PUT /api/admin/products/checklist-template/{id}/`

**Parameters:**
- `id`: The ID of the checklist template item

**Request Body:**
```json
{
  "name": "Review and approve campaign materials",
  "description": "Thoroughly check all submitted materials for quality, compliance, and brand guidelines",
  "order": 0,
  "is_optional": false,
  "estimated_duration_minutes": 45
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "name": "Review and approve campaign materials",
  "description": "Thoroughly check all submitted materials for quality, compliance, and brand guidelines",
  "order": 0,
  "is_optional": false,
  "estimated_duration_minutes": 45,
  "created_at": "2024-01-15T10:30:00Z",
  "product_type": "campaign",
  "product_id": 5
}
```

**Partial Update:** You can also use `PATCH` to update only specific fields:

**Endpoint:** `PATCH /api/admin/products/checklist-template/{id}/`

**Request Body:**
```json
{
  "estimated_duration_minutes": 60
}
```

### 5. Delete Checklist Template Item

Delete a checklist template item.

**Endpoint:** `DELETE /api/admin/products/checklist-template/{id}/`

**Parameters:**
- `id`: The ID of the checklist template item

**Response:** `204 No Content`
```json
{
  "message": "Checklist template item deleted successfully"
}
```

**Note:** Deleting a template item does not affect existing orders that were created with this template.

### 6. Reorder Checklist Template Items

Change the order of multiple checklist template items at once.

**Endpoint:** `PATCH /api/admin/products/checklist-template/reorder/`

**Request Body:**
```json
{
  "items": [
    {"id": 2, "order": 0},
    {"id": 1, "order": 1},
    {"id": 3, "order": 2}
  ]
}
```

**Response:** `200 OK`
```json
{
  "message": "Successfully reordered 3 items",
  "items": [
    {
      "id": 2,
      "name": "Design approval",
      "description": "Get client approval on design mockups",
      "order": 0,
      "is_optional": false,
      "estimated_duration_minutes": 60,
      "created_at": "2024-01-15T10:35:00Z",
      "product_type": "campaign",
      "product_id": 5
    },
    {
      "id": 1,
      "name": "Review campaign materials",
      "description": "Check all submitted materials for quality and compliance",
      "order": 1,
      "is_optional": false,
      "estimated_duration_minutes": 30,
      "created_at": "2024-01-15T10:30:00Z",
      "product_type": "campaign",
      "product_id": 5
    },
    {
      "id": 3,
      "name": "Print materials",
      "description": "Send materials to printing vendor",
      "order": 2,
      "is_optional": false,
      "estimated_duration_minutes": 120,
      "created_at": "2024-01-15T11:00:00Z",
      "product_type": "campaign",
      "product_id": 5
    }
  ]
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Product type and ID are required"
}
```

```json
{
  "error": "Invalid product type. Must be \"package\" or \"campaign\""
}
```

```json
{
  "error": "Items array is required with format: [{\"id\": 1, \"order\": 0}, ...]"
}
```

### 404 Not Found
```json
{
  "detail": "Not found."
}
```

```json
{
  "error": "One or more checklist items not found"
}
```

## Usage Examples

### Example 1: Create a complete checklist template for a package

```bash
# Create first item
curl -X POST http://localhost:8000/api/admin/products/package/1/checklist-template/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Verify order details",
    "description": "Confirm all order specifications with client",
    "is_optional": false,
    "estimated_duration_minutes": 15
  }'

# Create second item
curl -X POST http://localhost:8000/api/admin/products/package/1/checklist-template/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Prepare materials",
    "description": "Gather all required materials for the package",
    "is_optional": false,
    "estimated_duration_minutes": 30
  }'

# Create optional item
curl -X POST http://localhost:8000/api/admin/products/package/1/checklist-template/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Quality check",
    "description": "Optional final quality verification",
    "is_optional": true,
    "estimated_duration_minutes": 10
  }'
```

### Example 2: Reorder items after creation

```bash
curl -X PATCH http://localhost:8000/api/admin/products/checklist-template/reorder/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"id": 2, "order": 0},
      {"id": 1, "order": 1},
      {"id": 3, "order": 2}
    ]
  }'
```

## Integration with Order Processing

When an order is assigned to staff, the system will:
1. Fetch all checklist template items for the ordered product
2. Create OrderChecklist items based on the template
3. Copy the name, description, order, and is_optional fields
4. Link each OrderChecklist item to the template item for reference

This ensures that:
- Staff members see the correct checklist for each product
- Changes to templates don't affect existing orders
- Order completion percentage is calculated correctly (excluding optional items)
