import api from './api';
import { Cart, AddToCartRequest } from '../types/cart';

class CartService {
  /**
   * Get current user's cart
   */
  async getCart(): Promise<Cart> {
    const response = await api.get<Cart>('/cart/');
    return response.data;
  }

  /**
   * Add item to cart
   */
  async addToCart(request: AddToCartRequest): Promise<Cart> {
    const response = await api.post<Cart>('/cart/add/', request);
    return response.data;
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(itemId: number): Promise<Cart> {
    const response = await api.delete<Cart>(`/cart/remove/${itemId}/`);
    return response.data;
  }

  /**
   * Clear all items from cart
   */
  async clearCart(): Promise<Cart> {
    const response = await api.delete<Cart>('/cart/clear/');
    return response.data;
  }
}

export default new CartService();
