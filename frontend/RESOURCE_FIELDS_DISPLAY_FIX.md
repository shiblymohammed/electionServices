# Resource Fields Display Fix

## Issue
Product-specific resource fields added from the admin dashboard were not showing up on the frontend user side during resource upload.

## Root Cause
The frontend was not properly transforming the backend API response into the expected data structure.

### Backend Response Structure
```json
{
  "order_id": 1,
  "order_number": "ORD-001",
  "items": [
    {
      "order_item_id": 123,
      "item_type": "package",
      "item_name": "Basic Package",
      "fields": [
        {
          "id": 1,
          "field_name": "Phone Number",
          "field_type": "phone",
          "is_required": true,
          ...
        }
      ]
    }
  ]
}
```

### Frontend Expected Structure
```typescript
resourceFields = {
  123: [  // order_item_id as key
    {
      id: 1,
      field_name: "Phone Number",
      field_type: "phone",
      ...
    }
  ]
}
```

## Fix Applied

### Updated File: `frontend/src/pages/ResourceUploadPage.tsx`

**Before:**
```typescript
const fieldsData = await orderService.getResourceFields(parseInt(orderId));
if (fieldsData && Object.keys(fieldsData).length > 0) {
  setResourceFields(fieldsData);  // ❌ Wrong structure
  setUseDynamicForm(true);
}
```

**After:**
```typescript
const fieldsData = await orderService.getResourceFields(parseInt(orderId));

if (fieldsData && fieldsData.items && fieldsData.items.length > 0) {
  // Transform the response into the expected format
  const fieldsMap: { [itemId: number]: ResourceFieldDefinition[] } = {};
  
  fieldsData.items.forEach((item: any) => {
    if (item.fields && item.fields.length > 0) {
      fieldsMap[item.order_item_id] = item.fields;
    }
  });
  
  if (Object.keys(fieldsMap).length > 0) {
    setResourceFields(fieldsMap);  // ✅ Correct structure
    setUseDynamicForm(true);
  }
}
```

## How It Works Now

1. **Admin adds resource fields** to a specific product (package or campaign)
2. **User places order** containing that product
3. **User goes to resource upload page**
4. **Frontend fetches** resource fields from `/api/orders/{id}/resource-fields/`
5. **Frontend transforms** the response into the correct structure
6. **DynamicResourceUploadForm** receives the fields for each order item
7. **User sees** the custom fields specific to their ordered products

## Data Flow

```
Admin Dashboard
    ↓
Add Resource Fields to Product
    ↓
User Orders Product
    ↓
Backend: GET /api/orders/{id}/resource-fields/
    ↓
Returns: { items: [{ order_item_id, fields: [...] }] }
    ↓
Frontend: Transform to { [itemId]: [...fields] }
    ↓
DynamicResourceUploadForm
    ↓
User Sees Custom Fields
```

## Debugging Added

Added console.log statements to help debug:
- `console.log('Fetched resource fields:', fieldsData)` - Shows raw API response
- `console.log('Transformed resource fields:', fieldsMap)` - Shows transformed data
- Error logging for failed requests

## Testing Checklist

- [ ] Add resource fields to a product in admin dashboard
- [ ] Create an order with that product
- [ ] Go to resource upload page
- [ ] Verify custom fields appear
- [ ] Verify field validation works
- [ ] Submit resources successfully
- [ ] Check console for any errors

## Related Files

- `frontend/src/pages/ResourceUploadPage.tsx` - Main fix location
- `frontend/src/components/DynamicResourceUploadForm.tsx` - Renders the fields
- `frontend/src/services/orderService.ts` - API call
- `backend/orders/views.py` - Backend endpoint
- `backend/products/models.py` - ResourceFieldDefinition model

## No Breaking Changes

This fix only corrects the data transformation. All existing functionality remains unchanged. Static forms still work as fallback if no dynamic fields are configured.
