import api from './api';
import {
  CreateOrderResponse,
  PaymentVerificationRequest,
  PaymentVerificationResponse,
  Order,
} from '../types/order';

class OrderService {
  /**
   * Create order from cart
   */
  async createOrder(): Promise<CreateOrderResponse> {
    const response = await api.post<CreateOrderResponse>('/orders/create/');
    return response.data;
  }

  /**
   * Verify payment after Razorpay success
   */
  async verifyPayment(
    orderId: number,
    paymentData: PaymentVerificationRequest
  ): Promise<PaymentVerificationResponse> {
    const response = await api.post<PaymentVerificationResponse>(
      `/orders/${orderId}/payment-success/`,
      paymentData
    );
    return response.data;
  }

  /**
   * Get order details
   */
  async getOrder(orderId: number): Promise<Order> {
    const response = await api.get<Order>(`/orders/${orderId}/`);
    return response.data;
  }

  /**
   * Get all orders for current user
   */
  async getMyOrders(): Promise<Order[]> {
    const response = await api.get<Order[]>('/orders/my-orders/');
    return response.data;
  }

  /**
   * Upload resources for an order item
   */
  async uploadResources(
    orderId: number,
    _orderItemId: number,
    formData: FormData
  ): Promise<{ success: boolean; message: string; pending_items: any[] }> {
    const response = await api.post(
      `/orders/${orderId}/submit-resources/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  /**
   * Get resource field definitions for an order
   */
  async getResourceFields(orderId: number): Promise<any> {
    // Add timestamp to prevent caching
    const timestamp = new Date().getTime();
    const response = await api.get(`/orders/${orderId}/resource-fields/?t=${timestamp}`);
    return response.data;
  }

  /**
   * Download invoice for an order
   */
  async downloadInvoice(orderId: number): Promise<Blob> {
    const response = await api.get(`/orders/${orderId}/invoice/download/`, {
      responseType: 'blob',
    });
    return response.data;
  }
}

export default new OrderService();
