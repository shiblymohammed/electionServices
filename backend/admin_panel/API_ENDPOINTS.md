# Admin Panel API Endpoints

This document describes the API endpoints implemented for the admin panel functionality.

## Order Management Endpoints

### 1. List All Orders
**Endpoint:** `GET /api/admin/orders/`  
**Permission:** Admin only  
**Description:** List all orders with filtering and search capabilities

**Query Parameters:**
- `status` (optional): Filter by order status (pending_payment, pending_resources, ready_for_processing, assigned, in_progress, completed)
- `assigned_to` (optional): Filter by assigned staff ID or "unassigned"
- `search` (optional): Search by order number, user phone, or username

**Response:**
```json
[
  {
    "id": 1,
    "order_number": "EC-20251022-ABC123",
    "user": {
      "id": 1,
      "username": "user1",
      "phone_number": "+919876543210",
      "role": "user"
    },
    "total_amount": "38500.00",
    "status": "ready_for_processing",
    "assigned_to": null,
    "total_items": 3,
    "payment_completed_at": "2025-10-22T10:30:00Z",
    "created_at": "2025-10-22T10:00:00Z",
    "updated_at": "2025-10-22T10:30:00Z"
  }
]
```

### 2. Get Order Details
**Endpoint:** `GET /api/admin/orders/{id}/`  
**Permission:** Admin only  
**Description:** Get detailed information about a specific order including items, resources, and checklist

**Response:**
```json
{
  "id": 1,
  "order_number": "EC-20251022-ABC123",
  "user": {
    "id": 1,
    "username": "user1",
    "phone_number": "+919876543210",
    "role": "user"
  },
  "total_amount": "38500.00",
  "status": "assigned",
  "razorpay_order_id": "order_xyz",
  "razorpay_payment_id": "pay_abc",
  "payment_completed_at": "2025-10-22T10:30:00Z",
  "assigned_to": {
    "id": 5,
    "username": "staff1",
    "phone_number": "+919876543211",
    "role": "staff"
  },
  "items": [
    {
      "id": 1,
      "item_type": "package",
      "item_details": {
        "id": 1,
        "name": "Election Hungama",
        "price": "18500.00"
      },
      "quantity": 1,
      "price": "18500.00",
      "subtotal": 18500.0,
      "resources_uploaded": true,
      "resources": {
        "id": 1,
        "candidate_photo": "/media/resources/photos/photo.jpg",
        "party_logo": "/media/resources/logos/logo.png",
        "campaign_slogan": "Vote for Change",
        "preferred_date": "2025-11-01",
        "whatsapp_number": "+919876543210",
        "additional_notes": "Please contact before delivery",
        "uploaded_at": "2025-10-22T11:00:00Z"
      }
    }
  ],
  "total_items": 3,
  "resource_upload_progress": 100,
  "checklist": {
    "id": 1,
    "total_items": 15,
    "completed_items": 5,
    "progress_percentage": 33,
    "items": [
      {
        "id": 1,
        "description": "Review order EC-20251022-ABC123 details and requirements",
        "completed": true,
        "completed_at": "2025-10-22T12:00:00Z",
        "completed_by": {
          "id": 5,
          "username": "staff1"
        },
        "order_index": 0
      }
    ]
  },
  "created_at": "2025-10-22T10:00:00Z",
  "updated_at": "2025-10-22T12:00:00Z"
}
```

### 3. Assign Order to Staff
**Endpoint:** `POST /api/admin/orders/{id}/assign/`  
**Permission:** Admin only  
**Description:** Assign an order to a staff member and automatically generate a checklist

**Request Body:**
```json
{
  "staff_id": 5
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order assigned to staff1",
  "order": {
    // Full order details (same as Get Order Details response)
  }
}
```

## Staff Management Endpoints

### 4. List Staff Members
**Endpoint:** `GET /api/admin/staff/`  
**Permission:** Admin only  
**Description:** List all staff members with their assigned order counts

**Response:**
```json
[
  {
    "id": 5,
    "username": "staff1",
    "phone_number": "+919876543211",
    "email": "staff1@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "assigned_orders_count": 3,
    "created_at": "2025-10-01T10:00:00Z"
  }
]
```

## Notification Endpoints

### 5. List Notifications
**Endpoint:** `GET /api/admin/notifications/`  
**Permission:** Authenticated users  
**Description:** List notifications for the current user

**Query Parameters:**
- `unread_only` (optional): Set to "true" to get only unread notifications

**Response:**
```json
[
  {
    "id": 1,
    "notification_type": "new_order",
    "title": "New Order Ready for Processing",
    "message": "Order EC-20251022-ABC123 from +919876543210 is ready for processing. Total: ₹38500.00",
    "order": 1,
    "order_number": "EC-20251022-ABC123",
    "is_read": false,
    "created_at": "2025-10-22T11:00:00Z"
  }
]
```

### 6. Mark Notification as Read
**Endpoint:** `POST /api/admin/notifications/{id}/mark-read/`  
**Permission:** Authenticated users  
**Description:** Mark a specific notification as read

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

### 7. Mark All Notifications as Read
**Endpoint:** `POST /api/admin/notifications/mark-all-read/`  
**Permission:** Authenticated users  
**Description:** Mark all notifications as read for the current user

**Response:**
```json
{
  "success": true,
  "message": "5 notifications marked as read"
}
```

## Notification Types

The system generates the following types of notifications:

1. **new_order**: Sent to all admins when an order is ready for processing (all resources uploaded)
2. **order_assigned**: Sent to staff member when an order is assigned to them
3. **progress_update**: Sent to admins when there's progress on an order
4. **order_completed**: Sent to admins when an order is completed

## Checklist Generation

When an order is assigned to a staff member, a checklist is automatically generated based on the order contents:

### Package Items Generate:
- Review uploaded resources
- Prepare all components
- Customize materials with candidate information
- Schedule delivery/installation
- Coordinate with technical team
- Complete delivery and setup
- Provide training/documentation

### Campaign Items Generate:
- Review uploaded resources
- Schedule campaign execution
- Coordinate with field team
- Prepare campaign materials
- Execute campaign activities
- Document execution and results
- Provide campaign report

### Common Tasks:
- Initial order review
- Customer contact and confirmation
- Final quality check
- Customer approval and feedback
- Order completion and archiving

## Error Responses

All endpoints return appropriate HTTP status codes and error messages:

**400 Bad Request:**
```json
{
  "error": "Invalid request data",
  "details": {
    "staff_id": ["This field is required"]
  }
}
```

**401 Unauthorized:**
```json
{
  "error": "Authentication credentials were not provided"
}
```

**403 Forbidden:**
```json
{
  "error": "You do not have permission to perform this action"
}
```

**404 Not Found:**
```json
{
  "error": "Order not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "An unexpected error occurred"
}
```
