import { User } from '../types/auth';

/**
 * Check if user has admin role
 */
export const isAdmin = (user: User | null): boolean => {
  return user?.role === 'admin';
};

/**
 * Check if user has staff role (includes admin)
 */
export const isStaff = (user: User | null): boolean => {
  return user?.role === 'staff' || user?.role === 'admin';
};

/**
 * Check if user has regular user role
 */
export const isRegularUser = (user: User | null): boolean => {
  return user?.role === 'user';
};

/**
 * Check if user has admin or staff role
 */
export const isAdminOrStaff = (user: User | null): boolean => {
  return user?.role === 'admin' || user?.role === 'staff';
};

/**
 * Check if user can access admin features
 */
export const canAccessAdminFeatures = (user: User | null): boolean => {
  return isAdmin(user);
};

/**
 * Check if user can access staff features
 */
export const canAccessStaffFeatures = (user: User | null): boolean => {
  return isAdminOrStaff(user);
};

/**
 * Check if user can manage users
 */
export const canManageUsers = (user: User | null): boolean => {
  return isAdmin(user);
};

/**
 * Check if user can assign orders
 */
export const canAssignOrders = (user: User | null): boolean => {
  return isAdmin(user);
};

/**
 * Check if user can view all orders
 */
export const canViewAllOrders = (user: User | null): boolean => {
  return isAdmin(user);
};

/**
 * Check if user can update checklists
 */
export const canUpdateChecklists = (user: User | null): boolean => {
  return isAdminOrStaff(user);
};

/**
 * Get user role display name
 */
export const getRoleDisplayName = (role: string): string => {
  switch (role) {
    case 'admin':
      return 'Administrator';
    case 'staff':
      return 'Staff Member';
    case 'user':
      return 'User';
    default:
      return role;
  }
};

/**
 * Get allowed routes for user role
 */
export const getAllowedRoutes = (user: User | null): string[] => {
  if (!user) return ['/login'];

  const baseRoutes = ['/', '/orders'];

  if (isAdmin(user)) {
    return [...baseRoutes, '/staff', '/users', '/orders/:id/assign'];
  }

  if (isStaff(user)) {
    return [...baseRoutes];
  }

  return baseRoutes;
};

/**
 * Check if user can access a specific route
 */
export const canAccessRoute = (user: User | null, route: string): boolean => {
  const allowedRoutes = getAllowedRoutes(user);
  
  // Check exact match
  if (allowedRoutes.includes(route)) {
    return true;
  }

  // Check pattern match (e.g., /orders/:id)
  return allowedRoutes.some(allowedRoute => {
    if (allowedRoute.includes(':')) {
      const pattern = allowedRoute.replace(/:[^/]+/g, '[^/]+');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(route);
    }
    return false;
  });
};
