import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Package } from '../types/product';
import productService from '../services/productService';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import ImageGallery from '../components/ImageGallery';

const PackageDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart, loading: cartLoading } = useCart();
  const [packageData, setPackageData] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addingToCart, setAddingToCart] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (id) {
      loadPackage(parseInt(id));
    }
  }, [id]);

  const loadPackage = async (packageId: number) => {
    try {
      setLoading(true);
      const data = await productService.getPackageById(packageId);
      setPackageData(data);
    } catch (err: any) {
      setError('Failed to load package details.');
      console.error('Error loading package:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!packageData) return;

    // Check if user is logged in
    if (!user) {
      navigate('/login', { state: { from: `/package/${id}` } });
      return;
    }

    try {
      setAddingToCart(true);
      setError('');
      await addToCart('package', packageData.id, 1);
      setSuccessMessage('Package added to cart successfully!');
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

  if (error || !packageData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Package not found'}</p>
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
    <>

      <main className="flex-grow max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 w-full">
        {successMessage && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {successMessage}
          </div>
        )}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-8">
            {/* Image Gallery */}
            {packageData.images && packageData.images.length > 0 && (
              <div className="mb-8">
                <ImageGallery images={packageData.images} productName={packageData.name} />
              </div>
            )}

            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {packageData.name}
                </h1>
                <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
                  Package
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 mb-1">Price</p>
                <p className="text-3xl font-bold text-indigo-600">
                  ₹{packageData.price.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Description
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {packageData.description}
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Package Includes
              </h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <ul className="space-y-3">
                  {packageData.items.map((item) => (
                    <li key={item.id} className="flex items-center">
                      <svg
                        className="w-5 h-5 text-green-500 mr-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-gray-700">
                        {item.name}
                        {item.quantity > 1 && (
                          <span className="ml-2 text-sm text-gray-500">
                            (Quantity: {item.quantity})
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
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
    </>
  );
};

export default PackageDetailPage;
