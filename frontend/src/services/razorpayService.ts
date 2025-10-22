import { RazorpayOptions, RazorpaySuccessResponse } from '../types/razorpay';

class RazorpayService {
  private razorpayKeyId: string;

  constructor() {
    this.razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID || '';
    
    if (!this.razorpayKeyId) {
      console.warn('Razorpay Key ID not configured in environment variables');
    }
  }

  /**
   * Check if Razorpay SDK is loaded
   */
  isLoaded(): boolean {
    return typeof window !== 'undefined' && typeof window.Razorpay !== 'undefined';
  }

  /**
   * Open Razorpay payment modal
   */
  openPaymentModal(
    options: Omit<RazorpayOptions, 'key' | 'handler'>,
    onSuccess: (response: RazorpaySuccessResponse) => void,
    onDismiss?: () => void
  ): void {
    if (!this.isLoaded()) {
      throw new Error('Razorpay SDK not loaded. Please check your internet connection.');
    }

    const razorpayOptions: RazorpayOptions = {
      ...options,
      key: this.razorpayKeyId,
      handler: onSuccess,
      modal: {
        ondismiss: onDismiss || (() => {
          console.log('Payment modal dismissed');
        }),
      },
    };

    const razorpay = new window.Razorpay(razorpayOptions);
    razorpay.open();
  }

  /**
   * Create payment options for an order
   */
  createPaymentOptions(
    orderId: string,
    amount: number,
    userPhone?: string
  ): Omit<RazorpayOptions, 'key' | 'handler'> {
    return {
      amount: amount, // Amount in paise
      currency: 'INR',
      name: 'Election Cart',
      description: 'Campaign Package Purchase',
      order_id: orderId,
      prefill: {
        contact: userPhone || '',
      },
      theme: {
        color: '#4F46E5', // Indigo color matching the app theme
      },
    };
  }
}

export default new RazorpayService();
