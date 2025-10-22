interface CartSummaryProps {
  total: number;
  itemCount: number;
  onCheckout: () => void;
  onClearCart: () => void;
  loading: boolean;
}

const CartSummary = ({
  total,
  itemCount,
  onCheckout,
  onClearCart,
  loading,
}: CartSummaryProps) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-24">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Items ({itemCount})</span>
          <span className="font-medium text-gray-900">
            ₹{total.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="border-t border-gray-200 pt-3">
          <div className="flex justify-between">
            <span className="text-lg font-semibold text-gray-900">Total</span>
            <span className="text-2xl font-bold text-indigo-600">
              ₹{total.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={onCheckout}
        disabled={loading || itemCount === 0}
        className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 transition-colors duration-200 font-semibold mb-3 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        Proceed to Checkout
      </button>

      <button
        onClick={onClearCart}
        disabled={loading || itemCount === 0}
        className="w-full bg-white text-red-600 border border-red-600 py-2 px-4 rounded-md hover:bg-red-50 transition-colors duration-200 font-medium disabled:border-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed"
      >
        Clear Cart
      </button>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-start text-sm text-gray-600">
          <svg
            className="w-5 h-5 text-green-500 mr-2 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <p>Secure payment via Razorpay</p>
        </div>
      </div>
    </div>
  );
};

export default CartSummary;
