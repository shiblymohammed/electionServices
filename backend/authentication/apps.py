from django.apps import AppConfig
import firebase_admin
from firebase_admin import credentials
import os


class AuthenticationConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'authentication'
    
    def ready(self):
        """Initialize Firebase Admin SDK when Django starts"""
        if not firebase_admin._apps:
            # Get credentials path from environment
            creds_path = os.getenv('FIREBASE_CREDENTIALS_PATH', 'firebase-credentials.json')
            
            # Make path absolute if it's relative
            if not os.path.isabs(creds_path):
                from django.conf import settings
                creds_path = os.path.join(settings.BASE_DIR, creds_path)
            
            # Initialize Firebase Admin SDK
            cred = credentials.Certificate(creds_path)
            firebase_admin.initialize_app(cred)
