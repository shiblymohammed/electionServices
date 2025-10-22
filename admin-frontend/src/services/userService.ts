import api from './api';

export interface User {
  id: number;
  username: string;
  phone_number: string;
  role: 'user' | 'staff' | 'admin';
  created_at: string;
  order_count?: number;
}

export interface CreateUserRequest {
  username: string;
  phone_number: string;
  role: 'user' | 'staff' | 'admin';
  password?: string;
  firebase_uid?: string;
}

export interface UpdateUserRoleRequest {
  role: 'user' | 'staff' | 'admin';
}

// Get all users with optional filters
export const getUsers = async (params?: {
  role?: string;
  search?: string;
}): Promise<User[]> => {
  const response = await api.get('/auth/users/', { params });
  return response.data;
};

// Create a new user
export const createUser = async (data: CreateUserRequest): Promise<{ success: boolean; message: string; user: User }> => {
  const response = await api.post('/auth/users/create/', data);
  return response.data;
};

// Update user role
export const updateUserRole = async (
  userId: number,
  data: UpdateUserRoleRequest
): Promise<{ success: boolean; message: string; user: User }> => {
  const response = await api.patch(`/auth/users/${userId}/role/`, data);
  return response.data;
};

// Delete user
export const deleteUser = async (userId: number): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/auth/users/${userId}/`);
  return response.data;
};
