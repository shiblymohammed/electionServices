# Analytics API Documentation

## Overview

The Analytics API provides comprehensive business metrics and insights for the Election Cart system. All endpoints require admin authentication and implement caching for optimal performance.

## Caching

- All analytics endpoints are cached for **5 minutes** (300 seconds)
- Cache is automatically invalidated when:
  - New orders are created
  - Payments are completed
  - Orders are assigned to staff
  - Order status changes (in_progress, completed)
- Cache implementation uses Django's cache framework (LocMemCache by default, can be upgraded to Redis)

## Endpoints

### 1. Analytics Overview

Get comprehensive dashboard metrics including revenue, orders, and conversion rate.

**Endpoint:** `GET /api/admin/analytics/overview/`

**Query Parameters:**

- `start_date` (optional): Start date in ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)
- `end_date` (optional): End date in ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)

**Default:** Current month if no dates provided

**Response:**

```json
{
  "success": true,
  "data": {
    "revenue": {
      "total_revenue": 150000.0,
      "order_count": 45,
      "average_order_value": 3333.33
    },
    "conversion": {
      "total_orders": 60,
      "paid_orders": 45,
      "conversion_rate": 75.0
    },
    "order_distribution": {
      "pending_payment": {
        "label": "Pending Payment",
        "count": 5
      },
      "completed": {
        "label": "Completed",
        "count": 30
      }
    },
    "date_range": {
      "start_date": "2024-01-01T00:00:00",
      "end_date": "2024-01-31T23:59:59"
    }
  }
}
```

### 2. Revenue Trend

Get monthly revenue data for trend analysis.

**Endpoint:** `GET /api/admin/analytics/revenue-trend/`

**Query Parameters:**

- `months` (optional): Number of months to include (1-24, default: 12)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "month": "2024-01",
      "month_label": "January 2024",
      "revenue": 150000.0,
      "order_count": 45
    },
    {
      "month": "2024-02",
      "month_label": "February 2024",
      "revenue": 180000.0,
      "order_count": 52
    }
  ]
}
```

### 3. Top Products

Get best-selling products by quantity sold.

**Endpoint:** `GET /api/admin/analytics/top-products/`

**Query Parameters:**

- `limit` (optional): Number of products to return (default: 5)
- `start_date` (optional): Start date in ISO format
- `end_date` (optional): End date in ISO format

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "product_id": 1,
      "product_type": "package",
      "product_name": "Premium Campaign Package",
      "quantity_sold": 25,
      "revenue": 125000.0
    },
    {
      "product_id": 3,
      "product_type": "campaign",
      "product_name": "Social Media Campaign",
      "quantity_sold": 18,
      "revenue": 54000.0
    }
  ]
}
```

### 4. Staff Performance

Get performance metrics for all staff members.

**Endpoint:** `GET /api/admin/analytics/staff-performance/`

**Query Parameters:**

- `start_date` (optional): Start date in ISO format
- `end_date` (optional): End date in ISO format

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "staff_id": 2,
      "staff_name": "john_staff",
      "phone_number": "+919876543210",
      "role": "staff",
      "assigned_orders": 15,
      "completed_orders": 12,
      "completion_rate": 80.0
    },
    {
      "staff_id": 3,
      "staff_name": "jane_staff",
      "phone_number": "+919876543211",
      "role": "staff",
      "assigned_orders": 10,
      "completed_orders": 9,
      "completion_rate": 90.0
    }
  ]
}
```

### 5. Order Distribution

Get count of orders by status.

**Endpoint:** `GET /api/admin/analytics/order-distribution/`

**Query Parameters:**

- `start_date` (optional): Start date in ISO format
- `end_date` (optional): End date in ISO format

**Response:**

```json
{
  "success": true,
  "data": {
    "pending_payment": {
      "label": "Pending Payment",
      "count": 5
    },
    "pending_resources": {
      "label": "Pending Resources",
      "count": 8
    },
    "ready_for_processing": {
      "label": "Ready for Processing",
      "count": 3
    },
    "assigned": {
      "label": "Assigned to Staff",
      "count": 7
    },
    "in_progress": {
      "label": "In Progress",
      "count": 12
    },
    "completed": {
      "label": "Completed",
      "count": 30
    }
  }
}
```

### 6. Export Analytics

Export all analytics data as CSV file.

**Endpoint:** `GET /api/admin/analytics/export/`

**Query Parameters:**

- `start_date` (optional): Start date in ISO format
- `end_date` (optional): End date in ISO format

**Default:** Current month if no dates provided

**Response:** CSV file download with filename format: `analytics_export_YYYYMMDD_HHMMSS.csv`

**CSV Contents:**

- Revenue metrics
- Conversion metrics
- Top 10 products
- Staff performance
- Order status distribution

## Authentication

All endpoints require:

- Valid JWT token in Authorization header: `Authorization: Bearer <token>`
- User must have `admin` role

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "message": "Invalid start_date format. Use ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)"
}
```

### 401 Unauthorized

```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 403 Forbidden

```json
{
  "detail": "You do not have permission to perform this action."
}
```

## Usage Examples

### Get current month overview

```bash
curl -X GET "http://localhost:8000/api/admin/analytics/overview/" \
  -H "Authorization: Bearer <token>"
```

### Get revenue trend for last 6 months

```bash
curl -X GET "http://localhost:8000/api/admin/analytics/revenue-trend/?months=6" \
  -H "Authorization: Bearer <token>"
```

### Get top 10 products for specific date range

```bash
curl -X GET "http://localhost:8000/api/admin/analytics/top-products/?limit=10&start_date=2024-01-01&end_date=2024-01-31" \
  -H "Authorization: Bearer <token>"
```

### Export analytics data

```bash
curl -X GET "http://localhost:8000/api/admin/analytics/export/?start_date=2024-01-01&end_date=2024-01-31" \
  -H "Authorization: Bearer <token>" \
  -o analytics_export.csv
```

## Performance Considerations

1. **Caching**: All endpoints are cached for 5 minutes to reduce database load
2. **Date Filtering**: Use date ranges to limit query scope for better performance
3. **Pagination**: Top products endpoint supports limit parameter to control result size
4. **Database Indexes**: Ensure proper indexes on:
   - `orders.payment_completed_at`
   - `orders.status`
   - `orders.created_at`
   - `order_items.content_type` and `order_items.object_id`

## Upgrading to Redis

To use Redis for caching in production:

1. Install django-redis:

```bash
pip install django-redis
```

2. Update `settings.py`:

```python
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        },
        'TIMEOUT': 300,
    }
}
```

3. Update `cache_utils.py` to use pattern-based cache invalidation:

```python
def invalidate_analytics_cache():
    from django_redis import get_redis_connection
    redis_conn = get_redis_connection("default")
    redis_conn.delete_pattern('analytics:*')
```
