import api from './api';
import { OrderStatistics, AdminOrder, OrderDetail, StaffMember } from '../types/order';

// Get order statistics for dashboard
export const getOrderStatistics = async (): Promise<OrderStatistics> => {
  const response = await api.get('/admin/orders/statistics/');
  return response.data;
};

// Get all orders with optional filters
export const getOrders = async (params?: {
  status?: string;
  assigned_to?: number;
  search?: string;
}): Promise<AdminOrder[]> => {
  const response = await api.get('/admin/orders/', { params });
  return response.data;
};

// Get order detail
export const getOrderDetail = async (orderId: number): Promise<OrderDetail> => {
  const response = await api.get(`/admin/orders/${orderId}/`);
  return response.data;
};

// Get all staff members
export const getStaffMembers = async (): Promise<StaffMember[]> => {
  const response = await api.get('/admin/staff/');
  return response.data;
};

// Assign order to staff
export const assignOrderToStaff = async (
  orderId: number,
  staffId: number
): Promise<{ success: boolean; message: string; checklist: any }> => {
  const response = await api.post(`/admin/orders/${orderId}/assign/`, {
    staff_id: staffId,
  });
  return response.data;
};
