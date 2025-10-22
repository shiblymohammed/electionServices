# Staff API Endpoints

This document describes the API endpoints available for staff members to view and manage their assigned orders.

## Authentication

All endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Permissions

- Staff members can only access orders assigned to them
- Admin users can access all orders through these endpoints

---

## Endpoints

### 1. List Assigned Orders

**GET** `/api/staff/orders/`

Get a list of all orders assigned to the logged-in staff member.

**Query Parameters:**
- `status` (optional): Filter by order status (e.g., `assigned`, `in_progress`, `completed`)

**Response:**
```json
[
  {
    "id": 1,
    "order_number": "EC-20241022-ABC123",
    "user": {
      "id": 5,
      "username": "user123",
      "phone_number": "+919876543210",
      "role": "user",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe"
    },
    "total_amount": "38500.00",
    "status": "in_progress",
    "assigned_to": {
      "id": 3,
      "username": "staff1",
      "phone_number": "+919876543211",
      "role": "staff",
      "email": "staff@example.com",
      "first_name": "Jane",
      "last_name": "Smith"
    },
    "total_items": 2,
    "payment_completed_at": "2024-10-22T10:30:00Z",
    "created_at": "2024-10-22T10:00:00Z",
    "updated_at": "2024-10-22T11:00:00Z"
  }
]
```

---

### 2. Get Order Details

**GET** `/api/staff/orders/{id}/`

Get detailed information about a specific order, including items, resources, and checklist.

**Path Parameters:**
- `id`: Order ID

**Response:**
```json
{
  "id": 1,
  "order_number": "EC-20241022-ABC123",
  "user": {
    "id": 5,
    "username": "user123",
    "phone_number": "+919876543210",
    "role": "user",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe"
  },
  "total_amount": "38500.00",
  "status": "in_progress",
  "razorpay_order_id": "order_xyz123",
  "razorpay_payment_id": "pay_abc456",
  "payment_completed_at": "2024-10-22T10:30:00Z",
  "assigned_to": {
    "id": 3,
    "username": "staff1",
    "phone_number": "+919876543211",
    "role": "staff",
    "email": "staff@example.com",
    "first_name": "Jane",
    "last_name": "Smith"
  },
  "items": [
    {
      "id": 1,
      "item_type": "package",
      "item_details": {
        "id": 1,
        "name": "Election Hungama",
        "price": "18500.00",
        "description": "Complete election campaign package",
        "items": [
          {
            "id": 1,
            "name": "Ward Level App",
            "quantity": 1
          }
        ]
      },
      "quantity": 1,
      "price": "18500.00",
      "subtotal": 18500.0,
      "resources_uploaded": true,
      "resources": {
        "id": 1,
        "candidate_photo": "/media/resources/photos/candidate.jpg",
        "party_logo": "/media/resources/logos/logo.png",
        "campaign_slogan": "Vote for Change",
        "preferred_date": "2024-11-01",
        "whatsapp_number": "+919876543210",
        "additional_notes": "Please use blue theme",
        "uploaded_at": "2024-10-22T11:00:00Z"
      }
    }
  ],
  "total_items": 1,
  "resource_upload_progress": 100,
  "checklist": {
    "id": 1,
    "total_items": 5,
    "completed_items": 2,
    "progress_percentage": 40,
    "items": [
      {
        "id": 1,
        "description": "Design campaign materials",
        "completed": true,
        "completed_at": "2024-10-22T12:00:00Z",
        "completed_by": {
          "id": 3,
          "username": "staff1",
          "phone_number": "+919876543211",
          "role": "staff",
          "email": "staff@example.com",
          "first_name": "Jane",
          "last_name": "Smith"
        },
        "order_index": 0
      },
      {
        "id": 2,
        "description": "Print campaign posters",
        "completed": false,
        "completed_at": null,
        "completed_by": null,
        "order_index": 1
      }
    ]
  },
  "created_at": "2024-10-22T10:00:00Z",
  "updated_at": "2024-10-22T12:00:00Z"
}
```

---

### 3. Update Checklist Item

**PATCH** `/api/staff/checklist/{item_id}/`

Mark a checklist item as complete or incomplete.

**Path Parameters:**
- `item_id`: Checklist item ID

**Request Body:**
```json
{
  "completed": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Checklist item updated successfully",
  "checklist_item": {
    "id": 1,
    "description": "Design campaign materials",
    "completed": true,
    "completed_at": "2024-10-22T12:00:00Z",
    "completed_by": {
      "id": 3,
      "username": "staff1",
      "phone_number": "+919876543211"
    },
    "order_index": 0
  },
  "order_progress": {
    "total_items": 5,
    "completed_items": 3,
    "progress_percentage": 60,
    "order_status": "in_progress"
  }
}
```

**Behavior:**
- When a checklist item is marked as complete, the system records the completion timestamp and the user who completed it
- The order's completion percentage is automatically calculated
- When the first item is completed, the order status changes from `assigned` to `in_progress`
- When all items are completed (100%), the order status changes to `completed`
- Admin users are notified at 25%, 50%, 75%, and 100% completion milestones

**Error Responses:**

403 Forbidden - Staff member trying to update a checklist for an order not assigned to them:
```json
{
  "success": false,
  "message": "You do not have permission to update this checklist"
}
```

400 Bad Request - Missing required field:
```json
{
  "success": false,
  "message": "completed field is required"
}
```

404 Not Found - Checklist item does not exist:
```json
{
  "detail": "Not found."
}
```

---

## Workflow

1. **Staff logs in** and receives a JWT token
2. **Staff views assigned orders** using `GET /api/staff/orders/`
3. **Staff selects an order** and views details using `GET /api/staff/orders/{id}/`
4. **Staff sees the checklist** with all tasks to complete
5. **Staff completes tasks** and marks them using `PATCH /api/staff/checklist/{item_id}/`
6. **System tracks progress** and notifies admins at milestones
7. **Order auto-completes** when all checklist items are done

---

## Status Transitions

- `assigned` → `in_progress`: When first checklist item is completed
- `in_progress` → `completed`: When all checklist items are completed (100%)

---

## Notifications

Admins receive notifications when:
- Progress reaches 25%, 50%, 75%, or 100%
- Order is completed

Staff members receive notifications when:
- An order is assigned to them
