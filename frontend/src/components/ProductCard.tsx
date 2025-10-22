import { useNavigate } from 'react-router-dom';
import { Package, Campaign, isPackage } from '../types/product';

interface ProductCardProps {
  product: Package | Campaign;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    if (isPackage(product)) {
      navigate(`/package/${product.id}`);
    } else {
      navigate(`/campaign/${product.id}`);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-bold text-gray-900">{product.name}</h3>
          <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm font-semibold rounded-full">
            ₹{product.price.toLocaleString('en-IN')}
          </span>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {product.description}
        </p>

        {isPackage(product) && product.items.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">
              Includes:
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              {product.items.slice(0, 3).map((item) => (
                <li key={item.id} className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full mr-2"></span>
                  {item.name} {item.quantity > 1 && `(x${item.quantity})`}
                </li>
              ))}
              {product.items.length > 3 && (
                <li className="text-indigo-600 font-medium">
                  +{product.items.length - 3} more items
                </li>
              )}
            </ul>
          </div>
        )}

        {!isPackage(product) && (
          <div className="mb-4">
            <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
              {product.unit}
            </span>
          </div>
        )}

        <button
          onClick={handleViewDetails}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors duration-200 font-medium"
        >
          View Details
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
