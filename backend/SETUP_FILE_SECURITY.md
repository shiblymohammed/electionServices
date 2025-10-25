# File Upload Security Setup Guide

Quick setup guide for the file upload security implementation.

## Prerequisites

- Python 3.8+
- Django 4.2+
- PostgreSQL database

## Installation Steps

### 1. Install Required Dependencies

```bash
cd backend
pip install -r requirements.txt
```

This will install `python-magic` for MIME type validation.

**Windows Users**: If you encounter issues with `python-magic`, install:
```bash
pip install python-magic-bin
```

### 2. Update Environment Variables

Add to your `.env` file:

```bash
# Secure media storage path (outside web root)
SECURE_MEDIA_ROOT=/path/to/secure_media

# Optional: Enable debug mode for testing
DEBUG=True
```

**Production**: Set `SECURE_MEDIA_ROOT` to a path outside your web server's document root.

### 3. Set Up Secure Storage Directories

Run the management command to create the directory structure:

```bash
python manage.py setup_secure_storage
```

This will:
- Create secure storage directories
- Set proper permissions (750 for directories, 640 for files)
- Create `.htaccess` for Apache
- Create `nginx.conf.example` for Nginx
- Create a README with security information

### 4. Configure Web Server (Production Only)

#### For Apache

The `.htaccess` file is automatically created. Ensure Apache is configured to read it:

```apache
<Directory /path/to/secure_media>
    AllowOverride All
</Directory>
```

#### For Nginx

Add to your server block (see `secure_media/nginx.conf.example`):

```nginx
location /path/to/secure_media {
    deny all;
    return 404;
}
```

### 5. Run Database Migrations

If you made any model changes:

```bash
python manage.py makemigrations
python manage.py migrate
```

### 6. Test the Setup

Start the development server:

```bash
python manage.py runserver
```

Test file uploads:
1. Upload a product image through the admin panel
2. Upload resources for an order
3. Verify files are stored in `secure_media/` directory
4. Verify files have proper permissions

## Optional: Enable Middleware

For additional security, enable the file upload middleware in `settings.py`:

```python
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    # Add these for file upload security
    'products.middleware.FileUploadSecurityMiddleware',
    'products.middleware.FileUploadRateLimitMiddleware',
]
```

**Note**: The middleware adds extra validation but may impact performance. Test thoroughly before enabling in production.

## Verification

### Check Directory Structure

```bash
ls -la /path/to/secure_media
```

You should see:
```
drwxr-x--- products/
drwxr-x--- resources/
drwxr-x--- invoices/
-rw-r----- .htaccess
-rw-r----- nginx.conf.example
-rw-r----- README.md
```

### Check File Permissions

After uploading a file:

```bash
ls -la /path/to/secure_media/products/images/2024/01/
```

Files should have `-rw-r-----` (640) permissions.

### Test File Access

1. Try accessing a file directly via URL - should fail
2. Access through Django view with authentication - should succeed
3. Try accessing another user's file - should fail (403 Forbidden)

## Security Features Implemented

✅ **File Type Validation**
- Extension checking
- MIME type validation using python-magic
- Content verification using PIL (for images)

✅ **File Size Limits**
- Images: 5 MB max
- Documents: 20 MB max
- Configurable per field type

✅ **Secure File Storage**
- Files stored outside web root
- Random UUID-based filenames
- Proper file permissions (640)
- Proper directory permissions (750)

✅ **Access Control**
- Authentication required
- Authorization checks (owner/staff/admin only)
- Secure file serving through Django views

✅ **Malware Protection**
- Basic signature scanning
- Executable detection
- Decompression bomb prevention

✅ **Rate Limiting**
- 10 uploads per minute per user/IP
- 50 MB total per minute per user/IP

✅ **Attack Prevention**
- Path traversal prevention
- File type spoofing prevention
- Empty file rejection
- Malicious filename rejection

## Troubleshooting

### Issue: python-magic not found

**Solution**: Install python-magic-bin (Windows) or libmagic (Linux/Mac)

```bash
# Windows
pip install python-magic-bin

# Ubuntu/Debian
sudo apt-get install libmagic1

# macOS
brew install libmagic
```

### Issue: Permission denied when creating directories

**Solution**: Ensure the application user has write access:

```bash
sudo chown -R www-data:www-data /path/to/secure_media
sudo chmod -R 750 /path/to/secure_media
```

### Issue: Files not accessible through API

**Solution**: Check:
1. User is authenticated
2. User has permission to access the file
3. File exists in secure storage
4. URL pattern is correct: `/api/secure-files/images/{id}/`

### Issue: Rate limit errors

**Solution**: The in-memory rate limiter resets on server restart. For production, implement Redis-based rate limiting.

## Production Recommendations

1. **Antivirus Integration**: Integrate ClamAV for real-time malware scanning
2. **Redis Rate Limiting**: Replace in-memory rate limiting with Redis
3. **CDN**: Use CDN for public product images
4. **Monitoring**: Set up logging and alerting for suspicious activity
5. **Backups**: Implement regular backups of secure_media directory
6. **File Retention**: Implement policies to clean up old files

## Next Steps

1. Test file uploads thoroughly
2. Configure web server to deny direct access
3. Set up monitoring and logging
4. Implement file retention policies
5. Consider integrating ClamAV for production
6. Set up regular backups

## Support

For issues or questions, refer to:
- `FILE_UPLOAD_SECURITY.md` - Detailed security documentation
- `secure_media/README.md` - Storage directory information
- Django documentation: https://docs.djangoproject.com/en/stable/topics/http/file-uploads/
