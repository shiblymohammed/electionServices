# Resources Display Fix

## Issue

User-uploaded resources (candidate photos, party logos, campaign slogans, etc.) were not showing in the admin panel order detail view.

## Root Cause

The backend `AdminOrderDetailSerializer` was not including a top-level `resources` field. Resources were only available nested within each order item's `resources` field, but the frontend components (`OrderDetail` and `ChecklistView`) expected a top-level `resources` array.

### Frontend Expected Structure:
```typescript
interface OrderDetail {
  id: number;
  order_number: string;
  // ... other fields
  resources: OrderResource[];  // ← Expected at top level
  checklist?: OrderChecklist;
}
```

### Backend Was Providing:
```json
{
  "id": 1,
  "order_number": "ORD-2025-001",
  "items": [
    {
      "id": 1,
      "resources": {  // ← Resources nested in items
        "candidate_photo": "...",
        "party_logo": "..."
      }
    }
  ]
  // No top-level resources field
}
```

## Solution

Updated `AdminOrderDetailSerializer` in `backend/admin_panel/serializers.py` to include a `resources` field that collects all resources from all order items into a single top-level array.

### Changes Made:

1. **Added `resources` field to serializer:**
   ```python
   class AdminOrderDetailSerializer(serializers.ModelSerializer):
       resources = serializers.SerializerMethodField()
       
       class Meta:
           fields = [
               # ... other fields
               'resources',  # Added this
               'checklist',
               # ...
           ]
   ```

2. **Implemented `get_resources` method:**
   ```python
   def get_resources(self, obj):
       """Return all uploaded resources from all order items"""
       resources_list = []
       for item in obj.items.all():
           try:
               resource = item.resources
               resources_list.append({
                   'id': resource.id,
                   'candidate_photo': resource.candidate_photo.url if resource.candidate_photo else None,
                   'party_logo': resource.party_logo.url if resource.party_logo else None,
                   'campaign_slogan': resource.campaign_slogan,
                   'preferred_date': resource.preferred_date,
                   'whatsapp_number': resource.whatsapp_number,
                   'additional_notes': resource.additional_notes,
                   'uploaded_at': resource.uploaded_at
               })
           except OrderResource.DoesNotExist:
               # Skip items without resources
               continue
       return resources_list
   ```

## Result

Now the backend provides resources in the expected format:

```json
{
  "id": 1,
  "order_number": "ORD-2025-001",
  "items": [...],
  "resources": [  // ← Now available at top level
    {
      "id": 1,
      "candidate_photo": "http://example.com/media/resources/photos/candidate.jpg",
      "party_logo": "http://example.com/media/resources/logos/logo.png",
      "campaign_slogan": "Vote for Progress!",
      "preferred_date": "2025-02-15",
      "whatsapp_number": "+919876543210",
      "additional_notes": "Please use high-quality printing",
      "uploaded_at": "2025-01-15T10:30:00Z"
    }
  ],
  "checklist": {...}
}
```

## Components Affected

### 1. OrderDetail Component
- Displays uploaded resources in the "Campaign Resources" section
- Shows candidate photos and party logos with preview
- Displays campaign details (slogan, preferred date, WhatsApp)
- Provides download links for full-size images

### 2. ChecklistView Component
- Shows campaign resources in the "Customer Information & Resources" section
- Displays resources alongside contact information for staff reference
- Provides quick access to campaign materials while working on checklist

## Testing

### Manual Testing Steps:

1. **Create an order with resources:**
   ```
   - Login as a user in the frontend
   - Add items to cart
   - Complete payment
   - Upload campaign resources (photos, logos, slogan, etc.)
   ```

2. **View as admin:**
   ```
   - Login as admin
   - Navigate to Orders
   - Click on the order with uploaded resources
   - Verify resources are displayed in "Campaign Resources" section
   ```

3. **View as staff:**
   ```
   - Login as staff member
   - View assigned order
   - Verify resources are shown in "Customer Information & Resources"
   ```

### Expected Results:

✅ Candidate photos display with preview
✅ Party logos display with preview
✅ Campaign slogan is visible
✅ Preferred date is formatted correctly
✅ WhatsApp number is clickable (opens WhatsApp)
✅ Additional notes are displayed
✅ Upload timestamp is shown
✅ "View Full Size" links work for images

## API Endpoint

**GET** `/api/admin/orders/{id}/`

**Response includes:**
```json
{
  "resources": [
    {
      "id": 1,
      "candidate_photo": "http://localhost:8000/media/resources/photos/candidate_abc123.jpg",
      "party_logo": "http://localhost:8000/media/resources/logos/logo_xyz789.png",
      "campaign_slogan": "Building a Better Tomorrow",
      "preferred_date": "2025-02-20",
      "whatsapp_number": "+919876543210",
      "additional_notes": "Please ensure colors match party theme",
      "uploaded_at": "2025-01-15T14:30:00Z"
    }
  ]
}
```

## Benefits

1. **Complete Visibility:** Admins can now see all uploaded campaign materials
2. **Better Coordination:** Staff can reference materials while working on orders
3. **Quality Control:** Admins can verify uploaded resources meet requirements
4. **Customer Service:** Quick access to materials for customer inquiries
5. **Workflow Efficiency:** No need to ask users to re-upload resources

## Related Files

- `backend/admin_panel/serializers.py` - Backend serializer fix
- `admin-frontend/src/components/OrderDetail.tsx` - Admin view component
- `admin-frontend/src/components/ChecklistView.tsx` - Staff view component
- `admin-frontend/src/types/order.ts` - TypeScript type definitions
- `backend/orders/models.py` - OrderResource model definition

## Notes

- Resources are linked to OrderItems via a OneToOne relationship
- Each order item can have one set of resources
- Multiple order items = multiple resource sets
- Empty resources are gracefully handled (skipped in the list)
- Image URLs are absolute paths including media server URL
- File uploads are validated on the backend (size, format)

## Future Enhancements

1. **Inline Editing:** Allow admins to update resource details
2. **Bulk Download:** Download all resources as a ZIP file
3. **Version History:** Track changes to uploaded resources
4. **Preview Modal:** Full-screen preview of images
5. **Resource Approval:** Admin approval workflow for resources
