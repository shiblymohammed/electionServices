import { Package, Campaign } from './product';

export interface CartItem {
  id: number;
  item_type: 'package' | 'campaign';
  item_details: Package | Campaign;
  quantity: number;
  subtotal: number;
  added_at: string;
}

export interface Cart {
  id: number;
  items: CartItem[];
  total: number;
  item_count: number;
  created_at: string;
  updated_at: string;
}

export interface AddToCartRequest {
  item_type: 'package' | 'campaign';
  item_id: number;
  quantity: number;
}
