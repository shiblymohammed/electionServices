# Authentication Implementation

This document describes the authentication system implemented for the Election Cart frontend.

## Overview

The authentication system uses Firebase for phone number OTP verification and JWT tokens for session management with the backend API.

## Components Implemented

### 1. Firebase Configuration (`src/config/firebase.ts`)
- Initializes Firebase app with environment variables
- Exports Firebase Auth instance

### 2. Authentication Service (`src/services/authService.ts`)
- Manages Firebase phone authentication
- Handles OTP sending and verification
- Manages reCAPTCHA for bot prevention

### 3. API Service (`src/services/api.ts`)
- Axios instance with JWT token interceptor
- Automatic token injection in request headers
- Handles 401 responses (auto-logout and redirect)
- Error handling for various HTTP status codes

### 4. Auth Context (`src/context/AuthContext.tsx`)
- Global authentication state management
- Provides `login`, `logout`, and `refreshUser` functions
- Persists auth state in localStorage
- Auto-initializes on app load

### 5. Protected Route Component (`src/components/ProtectedRoute.tsx`)
- Wraps routes that require authentication
- Supports role-based access control
- Auto-redirects to login if unauthenticated
- Shows loading state during auth check

### 6. Login Page (`src/pages/LoginPage.tsx`)
- Two-step authentication flow:
  1. Phone number input → Send OTP
  2. OTP verification → Login
- Error handling and user feedback
- Resend OTP functionality
- Change phone number option

### 7. Home Page (`src/pages/HomePage.tsx`)
- Protected route example
- Displays user info and role
- Logout functionality

## Environment Variables Required

Create a `.env` file in the frontend directory with:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

## Authentication Flow

1. User enters phone number with country code (e.g., +919876543210)
2. Firebase sends OTP via SMS
3. User enters 6-digit OTP
4. Frontend verifies OTP with Firebase
5. Firebase returns authentication token
6. Frontend sends Firebase token to backend `/api/auth/verify-phone/`
7. Backend verifies token and returns JWT + user data
8. JWT stored in localStorage
9. All subsequent API calls include JWT in Authorization header

## Usage Examples

### Protecting a Route

```tsx
import ProtectedRoute from './components/ProtectedRoute';

<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

### Role-Based Protection

```tsx
<Route
  path="/admin"
  element={
    <ProtectedRoute requiredRole="admin">
      <AdminPanel />
    </ProtectedRoute>
  }
/>
```

### Using Auth Context

```tsx
import { useAuth } from './context/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();
  
  return (
    <div>
      {isAuthenticated && <p>Welcome {user?.phone}</p>}
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Making Authenticated API Calls

```tsx
import api from './services/api';

// Token is automatically included
const response = await api.get('/cart/');
const cart = response.data;
```

## Security Features

- Firebase reCAPTCHA prevents bot attacks
- JWT tokens stored in localStorage
- Automatic token injection in API requests
- Auto-logout on 401 responses
- Role-based access control
- Token verification on app initialization

## Next Steps

The authentication system is now ready. Next tasks include:
- Product catalog pages
- Shopping cart functionality
- Payment integration
- Resource upload interface
