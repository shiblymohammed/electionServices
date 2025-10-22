export interface Order {
  id: number;
  order_number: string;
  user: number;
  total_amount: number;
  status: 'pending_payment' | 'pending_resources' | 'ready_for_processing' | 'assigned' | 'in_progress' | 'completed';
  razorpay_order_id: string;
  razorpay_payment_id?: string;
  payment_completed_at?: string;
  assigned_to?: number;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: number;
  item_type: 'package' | 'campaign';
  item_details: any;
  quantity: number;
  price: number;
  resources_uploaded: boolean;
}

export interface CreateOrderResponse {
  order: Order;
  razorpay_order_id: string;
  razorpay_key_id: string;
  amount: number;
}

export interface PaymentVerificationRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface PaymentVerificationResponse {
  success: boolean;
  message: string;
  order: Order;
}
