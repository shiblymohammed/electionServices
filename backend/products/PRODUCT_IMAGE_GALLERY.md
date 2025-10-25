# Product Image Gallery System

## Overview
This document describes the product image gallery system implementation for packages and campaigns.

## Features Implemented

### 1. ProductImage Model
- Supports multiple images per product (max 10)
- Generic foreign key for both Package and Campaign
- Automatic thumbnail generation (300x300px)
- Primary image designation
- Ordering support
- Image validation (JPG, PNG, GIF, max 5MB)

### 2. Image Processing
- Automatic thumbnail generation using Pillow
- Image optimization and resizing
- Format validation
- Size validation
- RGBA to RGB conversion for compatibility

### 3. API Endpoints

#### Public Endpoints
- `GET /api/products/{type}/{id}/images/` - List images for a product

#### Admin Endpoints
- `POST /api/admin/products/{type}/{id}/images/` - Upload image
- `PUT /api/admin/products/images/{id}/` - Update image details
- `DELETE /api/admin/products/images/{id}/` - Delete image
- `PATCH /api/admin/products/images/reorder/` - Reorder images
- `PATCH /api/admin/products/images/{id}/set-primary/` - Set primary image

### 4. Product Serializers
- Package and Campaign serializers now include:
  - `images`: Array of all images (primary first)
  - `primary_image`: The primary image object
  - Full URLs for images and thumbnails

## Usage Examples

### Upload Image
```bash
POST /api/admin/products/package/1/images/
Content-Type: multipart/form-data

{
  "image": <file>,
  "alt_text": "Product showcase",
  "is_primary": false
}
```

### Set Primary Image
```bash
PATCH /api/admin/products/images/5/set-primary/
```

### Reorder Images
```bash
PATCH /api/admin/products/images/reorder/
Content-Type: application/json

{
  "items": [
    {"id": 1, "order": 0},
    {"id": 2, "order": 1}
  ]
}
```
