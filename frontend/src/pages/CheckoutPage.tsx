import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import RazorpayButton from '../components/RazorpayButton';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, loading: cartLoading } = useCart();
  const [error, setError] = useState('');

  useEffect(() => {
    // Redirect to cart if cart is empty
    if (!cartLoading && cart && cart.items.length === 0) {
      navigate('/cart');
    }
  }, [cart, cartLoading, navigate]);

  const handlePaymentSuccess = (orderId: number) => {
    // Navigate to payment success page
    navigate(`/payment-success/${orderId}`);
  };

  const handlePaymentError = (errorMsg: string) => {
    setError(errorMsg);
  };

  if (cartLoading || !cart) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/cart')}
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              ← Back to Cart
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <div className="flex items-start">
              <svg
                className="h-5 w-5 text-red-400 mt-0.5 mr-3"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h3 className="font-medium">Payment Error</h3>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
            
            <div className="space-y-4 mb-6">
              {cart.items.map((item) => (
                <div key={item.id} className="flex justify-between items-start pb-4 border-b">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      {item.item_details.name}
                    </h3>
                    <p className="text-sm text-gray-500 capitalize">
                      {item.item_type} × {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      ₹{item.subtotal.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900">₹{cart.total.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax</span>
                <span className="text-gray-900">Included</span>
              </div>
              <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                <span className="text-gray-900">Total</span>
                <span className="text-indigo-600">₹{cart.total.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Details</h2>
            
            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <svg
                    className="h-5 w-5 text-blue-400 mt-0.5 mr-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">Secure Payment</p>
                    <p>Your payment is processed securely through Razorpay. We accept all major credit/debit cards, UPI, and net banking.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Contact</span>
                  <span className="font-medium text-gray-900">{user?.phone}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Items</span>
                  <span className="font-medium text-gray-900">{cart.item_count}</span>
                </div>
              </div>
            </div>

            <RazorpayButton
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              userPhone={user?.phone}
            />

            <p className="text-xs text-gray-500 text-center mt-4">
              By proceeding, you agree to our terms and conditions
            </p>
          </div>
        </div>

        {/* What happens next */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">What happens next?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-indigo-100 rounded-lg p-3 mr-4">
                <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">1. Payment</h4>
                <p className="text-sm text-gray-600">Complete your secure payment</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-indigo-100 rounded-lg p-3 mr-4">
                <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">2. Upload Resources</h4>
                <p className="text-sm text-gray-600">Provide campaign materials</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-indigo-100 rounded-lg p-3 mr-4">
                <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">3. Processing</h4>
                <p className="text-sm text-gray-600">We'll create your campaign</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CheckoutPage;
