# Election Cart - Admin Panel

Admin panel for managing orders and staff in the Election Cart system.

## Features

- **Dashboard**: Overview of order statistics and recent orders
- **Order Management**: View, filter, and search all orders
- **Order Details**: View detailed order information including uploaded resources
- **Staff Assignment**: Assign orders to staff members (admin only)
- **Staff Management**: View all staff members and their workload (admin only)

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend API running on `http://localhost:8000`

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
   - Copy `.env` file and update if needed
   - Ensure `VITE_API_BASE_URL` points to your backend API

## Development

Start the development server:
```bash
npm run dev
```

The admin panel will be available at `http://localhost:5174`

## Build

Build for production:
```bash
npm run build
```

## Access Control

- **Admin users**: Full access to all features including staff management and order assignment
- **Staff users**: Can view orders and their details

## Login

Use Firebase phone authentication to log in. Only users with `admin` or `staff` roles can access the admin panel.

## Project Structure

```
admin-frontend/
├── src/
│   ├── components/       # Reusable components
│   ├── config/          # Configuration files (Firebase)
│   ├── context/         # React context (Auth)
│   ├── pages/           # Page components
│   ├── services/        # API services
│   ├── types/           # TypeScript types
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
├── public/              # Static assets
└── package.json         # Dependencies
```

## Available Routes

- `/` - Dashboard
- `/login` - Login page
- `/orders` - Order list with filters
- `/orders/:id` - Order detail view
- `/orders/:id/assign` - Staff assignment (admin only)
- `/staff` - Staff management (admin only)

## Technologies

- React 18
- TypeScript
- React Router v6
- Axios
- Firebase Authentication
- Tailwind CSS
- Vite
