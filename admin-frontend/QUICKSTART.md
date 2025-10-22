# Quick Start Guide - Admin Panel

## Installation

```bash
cd admin-frontend
npm install
```

## Start Development Server

```bash
npm run dev
```

Access at: **http://localhost:5174**

## Login

1. Go to http://localhost:5174/login
2. Enter phone number with country code (e.g., +919876543210)
3. Enter OTP received via SMS
4. Must have `admin` or `staff` role to access

## Features Overview

### Dashboard (/)
- View order statistics
- See recent orders
- Quick navigation

### Orders (/orders)
- View all orders
- Filter by status
- Filter by assigned staff
- Search orders

### Order Details (/orders/:id)
- View complete order information
- See uploaded resources
- View customer details
- Check order timeline

### Staff Assignment (/orders/:id/assign) - Admin Only
- Assign orders to staff
- View staff workload
- Reassign orders

### Staff Management (/staff) - Admin Only
- View all staff members
- See assigned order counts
- Access staff orders

## Requirements

- Backend API running on http://localhost:8000
- User with admin or staff role
- Firebase authentication configured

## Troubleshooting

**Cannot login?**
- Check user role in backend (must be admin or staff)
- Verify Firebase configuration
- Ensure backend is running

**API errors?**
- Check VITE_API_BASE_URL in .env
- Verify backend is accessible
- Check browser console for errors

## Build for Production

```bash
npm run build
```

Output will be in `dist/` directory.
