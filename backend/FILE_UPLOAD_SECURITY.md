# File Upload Security Implementation

This document describes the file upload security measures implemented in the Election Cart system.

## Overview

The system implements multiple layers of security for file uploads to protect against:
- Malicious file uploads
- Path traversal attacks
- File type spoofing
- Decompression bombs
- Unauthorized file access
- DoS attacks through large uploads

## Security Layers

### 1. File Validation Middleware

**Location**: `products/middleware.py`

#### FileUploadSecurityMiddleware
- Validates all file uploads before they reach view handlers
- Checks file types against allowed MIME types
- Enforces file size limits per content type
- Prevents empty file uploads
- Validates file names to prevent path traversal
- Logs all file upload attempts

**Configuration**:
```python
# Maximum file sizes by content type
max_file_sizes = {
    'image/jpeg': 5 MB,
    'image/png': 5 MB,
    'image/gif': 5 MB,
    'application/pdf': 20 MB,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 20 MB,
    'application/msword': 20 MB,
}
```

#### FileUploadRateLimitMiddleware
- Limits number of uploads per user/IP per minute
- Limits total upload size per user/IP per minute
- Prevents DoS attacks through excessive uploads

**Configuration**:
```python
max_uploads_per_minute = 10
max_total_size_per_minute_mb = 50
```

**Note**: In production, implement rate limiting with Redis for distributed systems.

### 2. File Validators

**Location**: `products/validators.py`

#### validate_image_file()
- Validates file extension
- Validates MIME type using python-magic (checks actual file content)
- Validates image format using PIL
- Checks image dimensions to prevent decompression bombs
- Maximum size: 5 MB
- Allowed formats: JPEG, PNG, GIF

#### validate_document_file()
- Validates file extension
- Validates MIME type using python-magic
- Scans for malicious content patterns
- Checks for executable signatures
- Maximum size: 20 MB (configurable)
- Allowed formats: PDF, DOCX, DOC (configurable)

#### validate_dynamic_resource_file()
- Validates files based on field definition configuration
- Supports custom size limits and allowed extensions
- Delegates to appropriate validator based on field type

#### scan_file_for_malware()
- Basic malware scanning using file signatures
- Checks for executable content
- Calculates file hash for malware database lookup
- **Production**: Integrate with ClamAV or VirusTotal API

### 3. Secure File Storage

**Location**: `products/storage.py`

#### SecureFileStorage
Base storage class that:
- Stores files outside web root
- Generates secure random filenames (UUID + hash)
- Sets proper file permissions (640 - rw-r-----)
- Sets proper directory permissions (750 - rwxr-x---)
- Prevents file overwrites
- Prevents path traversal attacks

#### Specialized Storage Classes

**ProductImageStorage**
- Stores product images in organized date structure
- Path: `secure_media/products/images/YYYY/MM/`

**ProductThumbnailStorage**
- Stores generated thumbnails
- Path: `secure_media/products/thumbnails/YYYY/MM/`

**DynamicResourceStorage**
- Stores user-uploaded dynamic resources
- Organizes by date and file type
- Path: `secure_media/resources/dynamic/YYYY/MM/{type}/`

**OrderResourceStorage**
- Stores order-specific resources
- Path: `secure_media/resources/orders/YYYY/MM/`

### 4. Secure File Serving

**Location**: `products/file_views.py`

Files are served through Django views with authentication and authorization:

#### serve_product_image()
- Requires authentication
- Public access for authenticated users
- Supports thumbnail parameter

#### serve_dynamic_resource()
- Requires authentication
- Only accessible by:
  - File owner (order user)
  - Assigned staff member
  - Admin users
- Forces download for documents
- Displays inline for images

#### serve_order_resource()
- Requires authentication
- Only accessible by:
  - Order owner
  - Assigned staff member
  - Admin users

**URL Pattern**: `/api/secure-files/`

### 5. Django Settings Configuration

**Location**: `election_cart/settings.py`

```python
# Secure media storage (outside web root)
SECURE_MEDIA_ROOT = os.getenv('SECURE_MEDIA_ROOT', str(BASE_DIR.parent / 'secure_media'))

# File upload settings
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB

# File upload permissions
FILE_UPLOAD_PERMISSIONS = 0o640  # rw-r-----
FILE_UPLOAD_DIRECTORY_PERMISSIONS = 0o750  # rwxr-x---

# Default storage backend
DEFAULT_FILE_STORAGE = 'products.storage.SecureFileStorage'
```

## Setup Instructions

### 1. Install Dependencies

```bash
pip install python-magic
```

**Note**: On Windows, you may need to install `python-magic-bin`:
```bash
pip install python-magic-bin
```

### 2. Set Up Secure Storage Directory

```bash
python manage.py setup_secure_storage
```

This command:
- Creates secure storage directory structure
- Sets proper permissions
- Creates .htaccess for Apache
- Creates nginx.conf.example for Nginx
- Creates README with security information

### 3. Configure Web Server

#### Apache
The `.htaccess` file is automatically created. Ensure Apache is configured to read it:
```apache
<Directory /path/to/secure_media>
    AllowOverride All
</Directory>
```

#### Nginx
Add to your server block:
```nginx
location /path/to/secure_media {
    deny all;
    return 404;
}
```

### 4. Environment Variables

Add to `.env`:
```bash
SECURE_MEDIA_ROOT=/path/to/secure_media
```

### 5. Enable Middleware (Optional)

Add to `MIDDLEWARE` in `settings.py`:
```python
MIDDLEWARE = [
    # ... other middleware
    'products.middleware.FileUploadSecurityMiddleware',
    'products.middleware.FileUploadRateLimitMiddleware',
]
```

**Note**: The middleware provides additional security but may impact performance. Consider enabling in production only.

## Production Recommendations

### 1. Antivirus Integration

Integrate with ClamAV for real-time malware scanning:

```python
import pyclamd

def scan_file_with_clamav(file_path):
    cd = pyclamd.ClamdUnixSocket()
    result = cd.scan_file(file_path)
    if result:
        raise ValidationError('Malware detected')
```

### 2. VirusTotal Integration

For additional security, scan file hashes with VirusTotal:

```python
import requests

def check_virustotal(file_hash):
    api_key = settings.VIRUSTOTAL_API_KEY
    url = f'https://www.virustotal.com/api/v3/files/{file_hash}'
    headers = {'x-apikey': api_key}
    response = requests.get(url, headers=headers)
    # Check response for malware detection
```

### 3. Redis-Based Rate Limiting

Replace in-memory rate limiting with Redis:

```python
import redis
from django.conf import settings

redis_client = redis.Redis.from_url(settings.REDIS_URL)

def check_rate_limit(identifier):
    key = f'upload_rate:{identifier}'
    count = redis_client.incr(key)
    if count == 1:
        redis_client.expire(key, 60)  # 1 minute
    return count <= 10
```

### 4. Content Delivery Network (CDN)

For product images (public content):
- Use CDN for faster delivery
- Keep secure resources on application server
- Implement signed URLs for temporary access

### 5. File Retention Policies

Implement automatic cleanup:

```python
# Management command: cleanup_old_files.py
from datetime import datetime, timedelta

def cleanup_old_files():
    cutoff_date = datetime.now() - timedelta(days=365)
    # Delete files older than 1 year
    # Keep audit trail
```

### 6. Monitoring and Logging

- Log all file upload attempts
- Monitor for suspicious patterns
- Set up alerts for:
  - Multiple failed uploads
  - Large file uploads
  - Unusual file types
  - Rate limit violations

### 7. Regular Security Audits

- Review file upload logs
- Scan stored files for malware
- Update allowed file types
- Review access permissions
- Test security measures

## Security Checklist

- [x] File type validation (extension + MIME type)
- [x] File size limits
- [x] Secure file naming (random UUIDs)
- [x] Files stored outside web root
- [x] Proper file permissions (640)
- [x] Proper directory permissions (750)
- [x] Authentication required for file access
- [x] Authorization checks (owner/staff only)
- [x] Rate limiting
- [x] Malicious content scanning
- [x] Path traversal prevention
- [x] Decompression bomb prevention
- [ ] ClamAV integration (recommended for production)
- [ ] VirusTotal integration (recommended for production)
- [ ] Redis-based rate limiting (recommended for production)
- [ ] CDN integration (optional)
- [ ] File retention policies (recommended)
- [ ] Monitoring and alerting (recommended)

## Testing

### Test File Upload Security

```python
# Test malicious file upload
def test_malicious_file_upload():
    # Try to upload executable
    # Try to upload file with wrong extension
    # Try to upload oversized file
    # Try path traversal in filename
    # Verify all are rejected

# Test file access control
def test_file_access_control():
    # Try to access another user's file
    # Verify access denied
    # Try as staff member
    # Verify access granted
```

### Manual Testing

1. Try uploading various file types
2. Try uploading oversized files
3. Try uploading files with malicious names
4. Try accessing files without authentication
5. Try accessing other users' files
6. Test rate limiting with multiple uploads

## Troubleshooting

### python-magic not working on Windows

Install `python-magic-bin`:
```bash
pip install python-magic-bin
```

### Permission denied errors

Ensure the application user has write access to `SECURE_MEDIA_ROOT`:
```bash
chown -R www-data:www-data /path/to/secure_media
chmod -R 750 /path/to/secure_media
```

### Files not accessible

Check:
1. File exists in secure storage
2. User has proper permissions
3. Web server is not blocking access
4. Django view is properly configured

## References

- [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
- [Django File Uploads](https://docs.djangoproject.com/en/stable/topics/http/file-uploads/)
- [Django Security](https://docs.djangoproject.com/en/stable/topics/security/)
