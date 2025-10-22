# Admin Frontend Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   cd admin-frontend
   npm install
   ```

2. **Configure Environment**
   - The `.env` file is already configured with Firebase credentials
   - Update `VITE_API_BASE_URL` if your backend runs on a different port

3. **Start Development Server**
   ```bash
   npm run dev
   ```
   
   The admin panel will be available at: `http://localhost:5174`

## First Time Login

1. Navigate to `http://localhost:5174/login`
2. Enter your phone number with country code (e.g., +919876543210)
3. Enter the OTP received via SMS
4. You must have an `admin` or `staff` role in the backend to access the panel

## Creating Admin/Staff Users

Admin and staff users must be created in the backend. You can:

1. Use Django admin panel to change user roles
2. Use the backend API to update user roles
3. Create users with specific roles during registration

## Troubleshooting

### Cannot login
- Ensure your user has `admin` or `staff` role in the backend
- Check that Firebase is properly configured
- Verify the backend API is running

### API errors
- Check that `VITE_API_BASE_URL` in `.env` matches your backend URL
- Ensure the backend is running on the correct port
- Check browser console for detailed error messages

### Build errors
- Delete `node_modules` and run `npm install` again
- Clear npm cache: `npm cache clean --force`
- Ensure you're using Node.js v16 or higher

## Production Build

```bash
npm run build
```

The build output will be in the `dist/` directory.

## Port Configuration

The admin panel runs on port **5174** by default (different from the main frontend which uses 5173).

You can change this in `vite.config.ts`:
```typescript
server: {
  port: 5174, // Change this
  ...
}
```
