import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import CartItem from '../components/CartItem';
import CartSummary from '../components/CartSummary';

const CartPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { cart, removeFromCart, clearCart, loading } = useCart();
  const [removingItemId, setRemovingItemId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const handleRemoveItem = async (itemId: number) => {
    try {
      setRemovingItemId(itemId);
      setError('');
      await removeFromCart(itemId);
    } catch (err: any) {
      setError('Failed to remove item. Please try again.');
    } finally {
      setRemovingItemId(null);
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm('Are you sure you want to clear your cart?')) {
      return;
    }

    try {
      setError('');
      await clearCart();
    } catch (err: any) {
      setError('Failed to clear cart. Please try again.');
    }
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow sticky top-0 z-10">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              ← Continue Shopping
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/my-orders')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
            >
              My Orders
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
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {loading && !cart ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : cart && cart.items.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Cart Items ({cart.item_count})
              </h2>
              {cart.items.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onRemove={handleRemoveItem}
                  removing={removingItemId === item.id}
                />
              ))}
            </div>

            {/* Cart Summary */}
            <div className="lg:col-span-1">
              <CartSummary
                total={cart.total}
                itemCount={cart.item_count}
                onCheckout={handleCheckout}
                onClearCart={handleClearCart}
                loading={loading}
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <svg
              className="mx-auto h-24 w-24 text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Your cart is empty
            </h2>
            <p className="text-gray-600 mb-6">
              Add some packages or campaigns to get started!
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium"
            >
              Browse Products
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default CartPage;
