import { useState } from 'react';
import razorpayService from '../services/razorpayService';
import orderService from '../services/orderService';
import { RazorpaySuccessResponse } from '../types/razorpay';

interface RazorpayButtonProps {
  onSuccess: (orderId: number) => void;
  onError: (error: string) => void;
  disabled?: boolean;
  userPhone?: string;
}

const RazorpayButton = ({ onSuccess, onError, disabled, userPhone }: RazorpayButtonProps) => {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    try {
      setLoading(true);

      // Check if Razorpay SDK is loaded
      if (!razorpayService.isLoaded()) {
        throw new Error('Payment system not loaded. Please refresh the page and try again.');
      }

      // Create order from cart
      const orderResponse = await orderService.createOrder();
      const { order, razorpay_order_id, amount } = orderResponse;

      // Create payment options
      const paymentOptions = razorpayService.createPaymentOptions(
        razorpay_order_id,
        amount,
        userPhone
      );

      // Open Razorpay modal
      razorpayService.openPaymentModal(
        paymentOptions,
        async (response: RazorpaySuccessResponse) => {
          // Payment successful, verify with backend
          try {
            await orderService.verifyPayment(order.id, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            // Call success callback
            onSuccess(order.id);
          } catch (verifyError: any) {
            const errorMsg = verifyError.response?.data?.error || 'Payment verification failed';
            onError(errorMsg);
          } finally {
            setLoading(false);
          }
        },
        () => {
          // Payment modal dismissed
          setLoading(false);
          onError('Payment cancelled');
        }
      );
    } catch (error: any) {
      setLoading(false);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to initiate payment';
      onError(errorMsg);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={disabled || loading}
      className={`w-full py-3 px-4 rounded-md font-medium text-white transition-colors ${
        disabled || loading
          ? 'bg-gray-400 cursor-not-allowed'
          : 'bg-indigo-600 hover:bg-indigo-700'
      }`}
    >
      {loading ? (
        <span className="flex items-center justify-center">
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Processing...
        </span>
      ) : (
        'Proceed to Payment'
      )}
    </button>
  );
};

export default RazorpayButton;
