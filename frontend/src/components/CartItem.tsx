import { CartItem as CartItemType } from "../types/cart";
import { isPackage } from "../types/product";

interface CartItemProps {
  item: CartItemType;
  onRemove: (itemId: number) => void;
  removing: boolean;
}

const CartItem = ({ item, onRemove, removing }: CartItemProps) => {
  const { item_details, quantity, subtotal } = item;

  // Safety check: if item_details is null, show error state
  if (!item_details) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <p className="text-red-800 font-medium">Error loading item details</p>
            <p className="text-sm text-red-600">This item may have been deleted</p>
          </div>
          <button
            onClick={() => onRemove(item.id)}
            disabled={removing}
            className="text-red-600 hover:text-red-800 text-sm font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {removing ? "Removing..." : "Remove"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {item_details.name}
            </h3>
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                isPackage(item_details)
                  ? "bg-green-100 text-green-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {isPackage(item_details) ? "Package" : "Campaign"}
            </span>
          </div>

          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {item_details.description}
          </p>

          {isPackage(item_details) && item_details.items.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-700 mb-1">
                Includes:
              </p>
              <ul className="text-xs text-gray-600 space-y-1">
                {item_details.items.slice(0, 2).map((pkgItem) => (
                  <li key={pkgItem.id} className="flex items-center">
                    <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                    {pkgItem.name}
                  </li>
                ))}
                {item_details.items.length > 2 && (
                  <li className="text-indigo-600 font-medium">
                    +{item_details.items.length - 2} more
                  </li>
                )}
              </ul>
            </div>
          )}

          {!isPackage(item_details) && (
            <p className="text-xs text-gray-500 mb-3">{item_details.unit}</p>
          )}

          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="text-gray-600">Price: </span>
              <span className="font-semibold text-gray-900">
                ₹{item_details.price.toLocaleString("en-IN")}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Quantity: </span>
              <span className="font-semibold text-gray-900">{quantity}</span>
            </div>
          </div>
        </div>

        <div className="ml-4 text-right">
          <p className="text-lg font-bold text-indigo-600 mb-3">
            ₹{subtotal.toLocaleString("en-IN")}
          </p>
          <button
            onClick={() => onRemove(item.id)}
            disabled={removing}
            className="text-red-600 hover:text-red-800 text-sm font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {removing ? "Removing..." : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
