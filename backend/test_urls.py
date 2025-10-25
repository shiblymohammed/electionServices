"""
Test script to verify URL routing
Run with: python manage.py shell < test_urls.py
"""
from django.urls import resolve
from django.urls.exceptions import Resolver404

# Test URLs
test_urls = [
    '/api/admin/products/resource-fields/8',
    '/api/admin/products/resource-fields/8/',
]

for url in test_urls:
    try:
        match = resolve(url)
        print(f"✅ {url}")
        print(f"   View: {match.func.__name__}")
        print(f"   Args: {match.kwargs}")
    except Resolver404:
        print(f"❌ {url} - NOT FOUND")
    print()
