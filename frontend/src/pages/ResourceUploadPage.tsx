import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import orderService from '../services/orderService';
import { Order, OrderItem } from '../types/order';
import ResourceForm from '../components/ResourceForm';
import ProgressIndicator from '../components/ProgressIndicator';

const ResourceUploadPage = () => {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [pendingItems, setPendingItems] = useState<OrderItem[]>([]);

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
        
        // Filter items that need resources
        const itemsNeedingResources = orderData.items.filter(
          (item) => !item.resources_uploaded
        );
        setPendingItems(itemsNeedingResources);
        
        if (itemsNeedingResources.length === 0) {
          // All resources uploaded, redirect to home or order details
          navigate('/');
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, navigate]);

  const handleResourceSubmitted = () => {
    // Move to next item or complete
    if (currentItemIndex < pendingItems.length - 1) {
      setCurrentItemIndex(currentItemIndex + 1);
    } else {
      // All resources uploaded
      navigate('/');
    }
  };

  const handleSkip = () => {
    // Allow skipping to next item
    if (currentItemIndex < pendingItems.length - 1) {
      setCurrentItemIndex(currentItemIndex + 1);
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

  const currentItem = pendingItems[currentItemIndex];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">Upload Campaign Resources</h1>
          <p className="text-sm text-gray-600 mt-1">
            Order #{order.order_number}
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Progress Indicator */}
        <ProgressIndicator
          totalItems={pendingItems.length}
          currentIndex={currentItemIndex}
          items={pendingItems}
        />

        {/* Current Item Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {currentItem.item_details?.name || 'Item'}
              </h2>
              <p className="text-sm text-gray-600 capitalize mt-1">
                {currentItem.item_type}
              </p>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              Item {currentItemIndex + 1} of {pendingItems.length}
            </span>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              Please provide the following resources for this campaign item. All fields marked with * are required.
            </p>
          </div>
        </div>

        {/* Resource Form */}
        <ResourceForm
          orderId={order.id}
          orderItem={currentItem}
          onSuccess={handleResourceSubmitted}
          onSkip={handleSkip}
          isLastItem={currentItemIndex === pendingItems.length - 1}
        />
      </main>
    </div>
  );
};

export default ResourceUploadPage;
