import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Campaign } from '../types/product';
import productService from '../services/productService';
import { useCart } from '../context/CartContext';

const CampaignDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, loading: cartLoading } = useCart();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addingToCart, setAddingToCart] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (id) {
      loadCampaign(parseInt(id));
    }
  }, [id]);

  const loadCampaign = async (campaignId: number) => {
    try {
      setLoading(true);
      const data = await productService.getCampaignById(campaignId);
      setCampaign(data);
    } catch (err: any) {
      setError('Failed to load campaign details.');
      console.error('Error loading campaign:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!campaign) return;

    try {
      setAddingToCart(true);
      setError('');
      await addToCart('campaign', campaign.id, 1);
      setSuccessMessage('Campaign added to cart successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add to cart. Please try again.');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Campaign not found'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate('/')}
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            ← Back to Products
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {successMessage && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {successMessage}
          </div>
        )}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {campaign.name}
                </h1>
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
                  Campaign
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 mb-1">Price</p>
                <p className="text-3xl font-bold text-indigo-600">
                  ₹{campaign.price.toLocaleString('en-IN')}
                </p>
                <p className="text-sm text-gray-500 mt-1">{campaign.unit}</p>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Description
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {campaign.description}
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-blue-600 mt-0.5 mr-3"
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
                  <p className="text-sm font-medium text-blue-900">
                    Pricing Unit
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    This campaign is priced at <strong>{campaign.unit}</strong>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleAddToCart}
                disabled={addingToCart || cartLoading}
                className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-md hover:bg-indigo-700 transition-colors duration-200 font-semibold text-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {addingToCart ? 'Adding...' : 'Add to Cart'}
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200 font-medium"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CampaignDetailPage;
