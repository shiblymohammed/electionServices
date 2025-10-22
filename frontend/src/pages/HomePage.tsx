import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { Package, Campaign } from '../types/product';
import productService from '../services/productService';
import ProductCard from '../components/ProductCard';

const HomePage = () => {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const [packages, setPackages] = useState<Package[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const [packagesData, campaignsData] = await Promise.all([
        productService.getPackages(),
        productService.getCampaigns(),
      ]);
      setPackages(packagesData);
      setCampaigns(campaignsData);
    } catch (err: any) {
      setError('Failed to load products. Please try again.');
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow sticky top-0 z-10">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Election Cart</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/my-orders')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
            >
              My Orders
            </button>
            <button
              onClick={() => navigate('/cart')}
              className="relative px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
            >
              Cart
              {cart && cart.item_count > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cart.item_count}
                </span>
              )}
            </button>
            <div className="text-sm text-gray-700">
              <span className="font-medium">{user?.phone}</span>
              <span className="ml-2 px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs">
                {user?.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        ) : (
          <>
            {/* Packages Section */}
            {packages.length > 0 && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Campaign Packages
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {packages.map((pkg) => (
                    <ProductCard key={`package-${pkg.id}`} product={pkg} />
                  ))}
                </div>
              </section>
            )}

            {/* Campaigns Section */}
            {campaigns.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Individual Campaigns
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {campaigns.map((campaign) => (
                    <ProductCard key={`campaign-${campaign.id}`} product={campaign} />
                  ))}
                </div>
              </section>
            )}

            {packages.length === 0 && campaigns.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  No products available at the moment.
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default HomePage;
