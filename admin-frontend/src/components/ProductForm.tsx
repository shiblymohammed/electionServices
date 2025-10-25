import { useState, useEffect } from 'react';
import { Product, ProductFormData, Package, Campaign } from '../types/product';
import {
  createPackage,
  createCampaign,
  updatePackage,
  updateCampaign,
  getPackage,
  getCampaign,
} from '../services/productService';

interface ProductFormProps {
  product?: Product | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ProductForm = ({ product, onClose, onSuccess }: ProductFormProps) => {
  const [productType, setProductType] = useState<'package' | 'campaign'>(
    product?.type || 'package'
  );
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: 0,
    features: [''],
    deliverables: [''],
    unit: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(false);

  useEffect(() => {
    if (product) {
      loadProductDetails();
    }
  }, [product]);

  const loadProductDetails = async () => {
    if (!product) return;

    try {
      setLoadingProduct(true);
      let productDetails: Package | Campaign;

      if (product.type === 'package') {
        productDetails = await getPackage(product.id);
      } else {
        productDetails = await getCampaign(product.id);
      }

      setFormData({
        name: productDetails.name,
        description: productDetails.description,
        price: productDetails.price,
        features: productDetails.features.length > 0 ? productDetails.features : [''],
        deliverables: productDetails.deliverables.length > 0 ? productDetails.deliverables : [''],
        unit: productDetails.type === 'campaign' ? productDetails.unit : '',
      });
      setProductType(productDetails.type);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load product details');
    } finally {
      setLoadingProduct(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name.trim()) {
      setError('Product name is required');
      return;
    }
    if (formData.price <= 0) {
      setError('Price must be greater than zero');
      return;
    }
    if (productType === 'campaign' && !formData.unit?.trim()) {
      setError('Unit is required for campaigns');
      return;
    }

    // Filter out empty features and deliverables
    const cleanedData = {
      ...formData,
      features: formData.features.filter((f) => f.trim() !== ''),
      deliverables: formData.deliverables.filter((d) => d.trim() !== ''),
    };

    try {
      setLoading(true);

      if (product) {
        // Update existing product
        if (productType === 'package') {
          await updatePackage(product.id, cleanedData);
        } else {
          await updateCampaign(product.id, cleanedData);
        }
      } else {
        // Create new product
        if (productType === 'package') {
          await createPackage(cleanedData);
        } else {
          await createCampaign(cleanedData);
        }
      }

      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const handleArrayFieldChange = (
    field: 'features' | 'deliverables',
    index: number,
    value: string
  ) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData({ ...formData, [field]: newArray });
  };

  const addArrayField = (field: 'features' | 'deliverables') => {
    setFormData({ ...formData, [field]: [...formData[field], ''] });
  };

  const removeArrayField = (field: 'features' | 'deliverables', index: number) => {
    const newArray = formData[field].filter((_, i) => i !== index);
    setFormData({ ...formData, [field]: newArray.length > 0 ? newArray : [''] });
  };

  if (loadingProduct) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 my-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Product Type */}
          {!product && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Type
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="package"
                    checked={productType === 'package'}
                    onChange={(e) => setProductType(e.target.value as 'package')}
                    className="mr-2"
                  />
                  Package
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="campaign"
                    checked={productType === 'campaign'}
                    onChange={(e) => setProductType(e.target.value as 'campaign')}
                    className="mr-2"
                  />
                  Campaign
                </label>
              </div>
            </div>
          )}

          {/* Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Price */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
              min="0"
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Unit (for campaigns only) */}
          {productType === 'campaign' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="e.g., per 1000 voters"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          )}

          {/* Features */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
            {formData.features.map((feature, index) => (
              <div key={index} className="flex mb-2">
                <input
                  type="text"
                  value={feature}
                  onChange={(e) => handleArrayFieldChange('features', index, e.target.value)}
                  placeholder="Enter feature"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {formData.features.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayField('features', index)}
                    className="ml-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayField('features')}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              + Add Feature
            </button>
          </div>

          {/* Deliverables */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Deliverables</label>
            {formData.deliverables.map((deliverable, index) => (
              <div key={index} className="flex mb-2">
                <input
                  type="text"
                  value={deliverable}
                  onChange={(e) => handleArrayFieldChange('deliverables', index, e.target.value)}
                  placeholder="Enter deliverable"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {formData.deliverables.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayField('deliverables', index)}
                    className="ml-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayField('deliverables')}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              + Add Deliverable
            </button>
          </div>
        </form>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
          >
            {loading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductForm;
