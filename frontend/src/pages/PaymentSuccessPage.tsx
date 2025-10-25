import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import orderService from '../services/orderService';
import { Order } from '../types/order';

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setError('Invalid order ID');
        setLoading(false);
        return;
      }

      try {
        const orderData = await orderService.getOrder(parseInt(orderId));
        setOrder(orderData);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handleContinue = () => {
    if (order) {
      navigate(`/upload-resources/${order.id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <>

      <main className="flex-grow max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8 w-full">
        {/* Success Message */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
          <div className="bg-green-50 px-6 py-8 text-center border-b border-green-100">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-4">
              <svg
                className="h-10 w-10 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-600">
              Your order has been confirmed and payment received.
            </p>
          </div>

          {/* Order Details */}
          <div className="px-6 py-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Order Number</p>
                <p className="font-semibold text-gray-900">{order.order_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                <p className="font-semibold text-gray-900">
                  ₹{order.total_amount.toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Payment ID</p>
                <p className="font-mono text-sm text-gray-900">
                  {order.razorpay_payment_id || 'Processing...'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Contact</p>
                <p className="font-medium text-gray-900">{user?.phone_number || user?.username}</p>
              </div>
            </div>

            {/* Order Items */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {item.item_details?.name || 'Item'}
                      </p>
                      <p className="text-sm text-gray-600 capitalize">
                        {item.item_type} × {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex items-start">
            <svg
              className="h-6 w-6 text-blue-600 mt-0.5 mr-3 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Next Step: Upload Campaign Resources</h3>
              <p className="text-sm text-blue-800 mb-4">
                To proceed with your campaign, please upload the required resources including:
              </p>
              <ul className="text-sm text-blue-800 space-y-1 mb-4 ml-4 list-disc">
                <li>Candidate photo</li>
                <li>Party logo</li>
                <li>Campaign slogan</li>
                <li>Preferred campaign date</li>
                <li>WhatsApp contact number</li>
              </ul>
              <p className="text-sm text-blue-800">
                Once all resources are uploaded, our team will begin processing your campaign.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleContinue}
            className="flex-1 py-3 px-6 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium transition-colors"
          >
            Upload Resources Now
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 py-3 px-6 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 font-medium transition-colors"
          >
            Back to Home
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            A confirmation has been sent to your registered phone number.
            <br />
            You can view your order status anytime from your{' '}
            <button
              onClick={() => navigate('/profile')}
              className="text-indigo-600 hover:text-indigo-800 font-medium underline"
            >
              Profile
            </button>
            .
          </p>
        </div>
      </main>
    </>
  );
};

export default PaymentSuccessPage;
