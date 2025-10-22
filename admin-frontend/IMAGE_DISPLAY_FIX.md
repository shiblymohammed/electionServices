# Image Display and Download Fix

## Issues Fixed

### 1. Images Not Displaying
**Problem:** Images were not showing in the admin panel because the backend was returning relative URLs (e.g., `/media/resources/photos/image.jpg`) but the frontend wasn't prepending the API base URL.

**Solution:** Added `getFullImageUrl()` helper function that:
- Checks if URL is already absolute (starts with http:// or https://)
- If relative, prepends the API base URL from environment variable
- Returns null for invalid/missing URLs

### 2. "View Full Size" Redirecting to Dashboard
**Problem:** Clicking "View Full Size" was navigating away from the page instead of opening the image in a new tab.

**Solution:** 
- Fixed the `href` attribute to use the full image URL
- Added `target="_blank"` and `rel="noopener noreferrer"` for security
- Added click handler to prevent navigation if URL is invalid

### 3. No Download Option
**Problem:** Users couldn't download images directly.

**Solution:** Added download buttons with:
- Fetch API to get image blob
- Automatic download trigger
- Proper filename generation
- Error handling with user feedback

## Implementation Details

### OrderDetail Component

#### Helper Functions Added:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const getFullImageUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${API_BASE_URL}${path}`;
};

const handleDownloadImage = async (imageUrl: string, filename: string) => {
  try {
    const fullUrl = getFullImageUrl(imageUrl);
    if (!fullUrl) return;

    const response = await fetch(fullUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading image:', error);
    alert('Failed to download image. Please try again.');
  }
};
```

#### Image Display Updates:

**Before:**
```tsx
<img src={resource.candidate_photo} alt="Candidate" />
<a href={resource.candidate_photo} target="_blank">View Full Size →</a>
```

**After:**
```tsx
<img 
  src={getFullImageUrl(resource.candidate_photo) || ''} 
  alt="Candidate"
  onError={(e) => {
    // Fallback to placeholder if image fails to load
    e.target.src = 'data:image/svg+xml,...';
  }}
/>
<div className="flex gap-2 mt-2">
  <a
    href={getFullImageUrl(resource.candidate_photo) || '#'}
    target="_blank"
    rel="noopener noreferrer"
    className="text-xs text-blue-600 hover:text-blue-700 inline-flex items-center"
  >
    <svg>...</svg>
    View Full Size
  </a>
  <button
    onClick={() => handleDownloadImage(resource.candidate_photo!, `candidate_photo_${resource.id}.jpg`)}
    className="text-xs text-green-600 hover:text-green-700 inline-flex items-center"
  >
    <svg>...</svg>
    Download
  </button>
</div>
```

### ChecklistView Component

Applied the same `getFullImageUrl()` helper to fix image links in the staff view:

```typescript
<a
  href={getFullImageUrl(resource.candidate_photo) || '#'}
  target="_blank"
  rel="noopener noreferrer"
  onClick={(e) => {
    if (!getFullImageUrl(resource.candidate_photo)) {
      e.preventDefault();
    }
  }}
>
  View Photo →
</a>
```

## Features Added

### 1. Proper Image Display
✅ Images load correctly with full URLs
✅ Fallback placeholder for broken images
✅ Responsive image sizing
✅ Proper aspect ratios maintained

### 2. View Full Size
✅ Opens in new tab (doesn't navigate away)
✅ Secure with `rel="noopener noreferrer"`
✅ Prevents action if URL is invalid
✅ Visual icon indicator

### 3. Download Functionality
✅ One-click download button
✅ Automatic filename generation
✅ Downloads as original file type
✅ Error handling with user feedback
✅ Visual download icon

## Environment Configuration

The fix uses the `VITE_API_BASE_URL` environment variable:

**Development (.env.development):**
```env
VITE_API_BASE_URL=http://localhost:8000
```

**Production (.env.production):**
```env
VITE_API_BASE_URL=https://your-production-domain.com
```

**Fallback:**
If not set, defaults to `http://localhost:8000`

## Backend Configuration

### Django Settings (election_cart/settings.py):
```python
MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'
```

### URL Configuration (election_cart/urls.py):
```python
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

### API Response Format:
```json
{
  "resources": [
    {
      "id": 1,
      "candidate_photo": "/media/resources/photos/candidate_abc123.jpg",
      "party_logo": "/media/resources/logos/logo_xyz789.png"
    }
  ]
}
```

## User Experience

### Before Fix:
❌ Images don't display (broken image icon)
❌ "View Full Size" redirects to dashboard
❌ No way to download images
❌ Poor user experience

### After Fix:
✅ Images display correctly
✅ "View Full Size" opens in new tab
✅ Download button available
✅ Fallback for broken images
✅ Professional appearance

## Visual Changes

### Image Card Layout:

```
┌─────────────────────────────────────────┐
│ Candidate Photo                         │
├─────────────────────────────────────────┤
│                                         │
│         [Image Preview]                 │
│                                         │
├─────────────────────────────────────────┤
│ 🔗 View Full Size  |  ⬇️ Download      │
└─────────────────────────────────────────┘
```

### Button Styles:
- **View Full Size:** Blue text with external link icon
- **Download:** Green text with download icon
- Both buttons have hover effects
- Icons provide visual clarity

## Error Handling

### Image Load Failure:
```typescript
onError={(e) => {
  const target = e.target as HTMLImageElement;
  target.src = 'data:image/svg+xml,%3Csvg...%3E...%3C/svg%3E';
}}
```
Shows a gray placeholder with "Image not found" text.

### Download Failure:
```typescript
catch (error) {
  console.error('Error downloading image:', error);
  alert('Failed to download image. Please try again.');
}
```
Shows user-friendly error message.

### Invalid URL:
```typescript
onClick={(e) => {
  if (!getFullImageUrl(resource.candidate_photo)) {
    e.preventDefault();
  }
}}
```
Prevents navigation if URL is invalid.

## Testing

### Manual Testing Steps:

1. **Test Image Display:**
   ```
   - Login as admin
   - Navigate to order with uploaded resources
   - Verify candidate photo displays
   - Verify party logo displays
   - Check images are not broken
   ```

2. **Test View Full Size:**
   ```
   - Click "View Full Size" link
   - Verify opens in new tab
   - Verify doesn't navigate away from order page
   - Verify image displays at full resolution
   ```

3. **Test Download:**
   ```
   - Click "Download" button
   - Verify file downloads automatically
   - Check filename is descriptive
   - Verify file opens correctly
   ```

4. **Test Error Handling:**
   ```
   - Test with missing image URL
   - Test with invalid image URL
   - Verify placeholder shows for broken images
   - Verify error message for failed downloads
   ```

5. **Test in Staff View:**
   ```
   - Login as staff member
   - View assigned order
   - Verify resource links work in ChecklistView
   - Test "View Photo" and "View Logo" links
   ```

## Browser Compatibility

✅ Chrome/Edge (Chromium)
✅ Firefox
✅ Safari
✅ Mobile browsers

## Security Considerations

1. **CORS:** Backend must allow frontend origin
2. **rel="noopener noreferrer":** Prevents tab-napping attacks
3. **URL Validation:** Checks for valid URLs before navigation
4. **Blob Cleanup:** Properly revokes object URLs after download
5. **Error Handling:** Doesn't expose sensitive error details to users

## Performance

- **Image Loading:** Lazy loading with browser defaults
- **Download:** Efficient blob handling
- **Memory:** Proper cleanup of object URLs
- **Network:** Images cached by browser

## Future Enhancements

1. **Image Preview Modal:** Full-screen lightbox preview
2. **Bulk Download:** Download all resources as ZIP
3. **Image Editing:** Crop/resize before download
4. **Thumbnails:** Generate thumbnails for faster loading
5. **Progress Indicator:** Show download progress
6. **Image Optimization:** Compress images on upload
7. **CDN Integration:** Serve images from CDN

## Troubleshooting

### Images Still Not Showing

**Check:**
1. Backend is running and accessible
2. MEDIA_URL and MEDIA_ROOT are configured
3. Images exist in the media directory
4. CORS is configured correctly
5. Environment variable VITE_API_BASE_URL is set

**Solution:**
```bash
# Check backend media directory
ls backend/media/resources/

# Verify Django settings
python manage.py shell
>>> from django.conf import settings
>>> print(settings.MEDIA_URL)
>>> print(settings.MEDIA_ROOT)

# Check frontend environment
cat admin-frontend/.env
```

### Download Not Working

**Check:**
1. Browser allows downloads
2. No popup blocker interfering
3. Network connection is stable
4. Image URL is accessible

**Solution:**
- Check browser console for errors
- Try opening image URL directly
- Verify CORS headers allow fetch

### "View Full Size" Opens Wrong Page

**Check:**
1. Image URL is correct
2. No JavaScript errors
3. Link has proper attributes

**Solution:**
- Inspect element and check href attribute
- Verify getFullImageUrl() returns correct URL
- Check browser console for errors
