# Firebase Setup Guide

## How to Get Firebase Credentials

### Step 1: Go to Firebase Console
1. Visit [Firebase Console](https://console.firebase.google.com/)
2. Sign in with your Google account

### Step 2: Create or Select a Project
1. Click "Add project" (or select an existing project)
2. Follow the setup wizard to create your project

### Step 3: Enable Phone Authentication
1. In your Firebase project, go to **Authentication** in the left sidebar
2. Click on the **Sign-in method** tab
3. Enable **Phone** as a sign-in provider
4. Configure your phone authentication settings

### Step 4: Generate Service Account Key
1. Click the **gear icon** (⚙️) next to "Project Overview" in the left sidebar
2. Select **Project settings**
3. Go to the **Service accounts** tab
4. Click **Generate new private key**
5. Click **Generate key** in the confirmation dialog
6. A JSON file will be downloaded - this is your Firebase credentials file

### Step 5: Add Credentials to Your Project
1. Save the downloaded JSON file in a secure location
   - **Recommended**: Save it as `backend/firebase-credentials.json`
   - **Important**: Add this file to `.gitignore` to keep it secure

2. Create a `.env` file in the `backend/` directory (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

3. Update the `FIREBASE_CREDENTIALS_PATH` in your `.env` file:
   ```
   FIREBASE_CREDENTIALS_PATH=backend/firebase-credentials.json
   ```
   Or use an absolute path:                                                         
   ```
   FIREBASE_CREDENTIALS_PATH=/absolute/path/to/firebase-credentials.json
   ```

### Step 6: Secure Your Credentials
Make sure `firebase-credentials.json` is in your `.gitignore`:
```
# Firebase credentials
firebase-credentials.json
**/firebase-credentials.json
```

## Testing Your Setup

Once configured, you can test the authentication by:
1. Starting your Django server: `python manage.py runserver`
2. Making a POST request to `/api/auth/verify-phone/` with a valid Firebase token

## Important Security Notes
- **Never commit** your Firebase credentials to version control
- Keep your service account key secure
- Use environment variables for production deployments
- Consider using Firebase Admin SDK initialization with environment variables in production
