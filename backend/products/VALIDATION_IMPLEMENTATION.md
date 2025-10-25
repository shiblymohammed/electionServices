# Product Validation Logic Implementation

This document describes the validation logic implemented for product management in the Election Cart system.

## Overview

Task 4.3 implements three key validation requirements:
1. Validate unique product names
2. Validate positive prices
3. Prevent deletion of products with active orders

## Implementation Details

### 1. Unique Product Name Validation

**Location:** `backend/products/serializers.py`

**Implementation:**
- `PackageWriteSerializer.validate_name()` - Validates package names are unique
- `CampaignWriteSerializer.validate_name()` - Validates campaign names are unique

**Behavior:**
- On **create**: Checks if any existing product has the same name
- On **update**: Checks if any other product (excluding current) has the same name
- Returns validation error if duplicate name is found

**Example Error:**
```json
{
  "name": ["A package with this name already exists."]
}
```

### 2. Positive Price Validation

**Location:** `backend/products/serializers.py`

**Implementation:**
- `PackageWriteSerializer.validate_price()` - Validates package prices
- `CampaignWriteSerializer.validate_price()` - Validates campaign prices

**Behavior:**
- Rejects prices that are zero or negative
- Ensures all products have a positive price greater than zero

**Example Error:**
```json
{
  "price": ["Price must be greater than zero."]
}
```

### 3. Prevent Deletion with Active Orders

**Location:** `backend/products/views.py`

**Implementation:**
- `delete_product()` function checks for active orders before deletion

**Behavior:**
- Checks if product has orders with status:
  - `pending_payment`
  - `pending_resources`
  - `ready_for_processing`
  - `assigned`
  - `in_progress`
- If active orders exist, deletion is prevented
- If only completed orders exist, deletion is allowed (preserves historical data)
- Creates audit log entry before deletion

**Example Error:**
```json
{
  "error": "Cannot delete product with pending or in-progress orders. Please deactivate it instead."
}
```

## Testing

**Test File:** `backend/products/tests.py`

### Test Coverage

#### Unique Name Validation Tests:
- `test_unique_package_name_validation_on_create` - Verifies duplicate package names are rejected on creation
- `test_unique_package_name_validation_on_update` - Verifies duplicate package names are rejected on update
- `test_unique_campaign_name_validation_on_create` - Verifies duplicate campaign names are rejected on creation
- `test_unique_campaign_name_validation_on_update` - Verifies duplicate campaign names are rejected on update

#### Positive Price Validation Tests:
- `test_positive_price_validation_for_package` - Verifies zero and negative prices are rejected for packages
- `test_positive_price_validation_for_campaign` - Verifies zero and negative prices are rejected for campaigns

#### Deletion Prevention Tests:
- `test_delete_product_without_active_orders` - Verifies products without orders can be deleted
- `test_prevent_delete_product_with_pending_orders` - Verifies products with pending orders cannot be deleted
- `test_prevent_delete_product_with_in_progress_orders` - Verifies products with in-progress orders cannot be deleted
- `test_allow_delete_product_with_completed_orders` - Verifies products with only completed orders can be deleted

#### Valid Creation Tests:
- `test_valid_package_creation` - Verifies packages with valid data are created successfully
- `test_valid_campaign_creation` - Verifies campaigns with valid data are created successfully
- `test_package_creation` - Verifies basic package creation
- `test_campaign_creation` - Verifies basic campaign creation

### Running Tests

```bash
cd backend
python manage.py test products.tests
```

**Test Results:** All 14 tests passing ✓

## API Endpoints Affected

### Create Package
- **Endpoint:** `POST /api/admin/products/package/`
- **Validations:** Unique name, positive price

### Create Campaign
- **Endpoint:** `POST /api/admin/products/campaign/`
- **Validations:** Unique name, positive price

### Update Package
- **Endpoint:** `PUT /api/admin/products/package/{id}/update/`
- **Validations:** Unique name (excluding self), positive price

### Update Campaign
- **Endpoint:** `PUT /api/admin/products/campaign/{id}/update/`
- **Validations:** Unique name (excluding self), positive price

### Delete Package
- **Endpoint:** `DELETE /api/admin/products/package/{id}/delete/`
- **Validations:** No active orders

### Delete Campaign
- **Endpoint:** `DELETE /api/admin/products/campaign/{id}/delete/`
- **Validations:** No active orders

## Requirements Satisfied

✅ **Requirement 7.3:** Validate that product name is unique before saving
✅ **Requirement 7.4:** Validate that product price is a positive number greater than zero
✅ **Requirement 7.12:** Prevent deletion of products with pending or in-progress orders

## Notes

- Validation is performed at the serializer level for data integrity
- Deletion prevention is performed at the view level to check business logic
- Audit logs are created before product deletion for tracking
- Products with only completed orders can be deleted while preserving historical order data
- Deactivation is recommended over deletion for products with active orders
