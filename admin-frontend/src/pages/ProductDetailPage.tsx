import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product, Package, Campaign } from '../types/product';
import { getPackage, getCampaign } from '../services/productService';
import ResourceFieldBuilder from '../components/ResourceFieldBuilder';
import ChecklistTemplateBuilder from '../components/ChecklistTemplateBuilder';
import ImageGalleryManager from '../components/ImageGalleryManager';

const ProductDetailPage = () => {
  const { type, id } = useParams<{ type: 'package' | 'campaign'; id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Package | Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'images' | 'fields' | 'checklist'>(
    'details'
  );

  useEffect(() => {
    if (type && id) {
      fetchProduct();
    }
  }, [type, id]);

  const fetchProduct = async () => {
    if (!type || !id) return;

    try {
      setLoading(true);
      let data: Package | Campaign;

      if (type === 'package') {
        data = await getPackage(parseInt(id));
      } else {
        data = await getCampaign(parseInt(id));
      }

      setProduct(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product || !type || !id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Product not found'}</p>
          <button
            onClick={() => navigate('/products')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-full ${
                    product.type === 'package'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}
                >
                  {product.type}
                </span>
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-full ${
                    product.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {product.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="mt-2 text-gray-600">{product.description}</p>
            </div>
            <button
              onClick={() => navigate('/products')}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back to Products
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('images')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'images'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Images
            </button>
            <button
              onClick={() => setActiveTab('fields')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'fields'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Resource Fields
            </button>
            <button
              onClick={() => setActiveTab('checklist')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'checklist'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Checklist Template
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'details' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Price</dt>
                      <dd className="text-lg font-semibold text-gray-900">
                        ₹{product.price.toLocaleString()}
                      </dd>
                    </div>
                    {product.type === 'campaign' && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Unit</dt>
                        <dd className="text-gray-900">{product.unit}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Created</dt>
                      <dd className="text-gray-900">
                        {new Date(product.created_at).toLocaleString()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                      <dd className="text-gray-900">
                        {new Date(product.updated_at).toLocaleString()}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Features</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {product.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>

                  <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-4">Deliverables</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {product.deliverables.map((deliverable, index) => (
                      <li key={index}>{deliverable}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'images' && (
            <ImageGalleryManager productType={type} productId={parseInt(id)} />
          )}

          {activeTab === 'fields' && (
            <ResourceFieldBuilder productType={type} productId={parseInt(id)} />
          )}

          {activeTab === 'checklist' && (
            <ChecklistTemplateBuilder productType={type} productId={parseInt(id)} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
