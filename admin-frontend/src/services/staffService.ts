import api from './api';
import { AdminOrder, OrderDetail } from '../types/order';

// Get orders assigned to the logged-in staff member
export const getAssignedOrders = async (params?: {
  status?: string;
}): Promise<AdminOrder[]> => {
  const response = await api.get('/staff/orders/', { params });
  return response.data;
};

// Get detailed information about a specific assigned order
export const getAssignedOrderDetail = async (orderId: number): Promise<OrderDetail> => {
  const response = await api.get(`/staff/orders/${orderId}/`);
  return response.data;
};

// Update a checklist item (mark as complete/incomplete)
export const updateChecklistItem = async (
  itemId: number,
  completed: boolean
): Promise<{
  success: boolean;
  message: string;
  checklist_item: any;
  order_progress: {
    total_items: number;
    completed_items: number;
    progress_percentage: number;
    order_status: string;
  };
}> => {
  const response = await api.patch(`/staff/checklist/${itemId}/`, {
    completed,
  });
  return response.data;
};
