import { useState, useEffect } from 'react';
import { ChecklistTemplateItem } from '../types/product';
import {
  getChecklistTemplate,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  reorderChecklistItems,
} from '../services/productService';

interface ChecklistTemplateBuilderProps {
  productType: 'package' | 'campaign';
  productId: number;
}

const ChecklistTemplateBuilder = ({ productType, productId }: ChecklistTemplateBuilderProps) => {
  const [items, setItems] = useState<ChecklistTemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ChecklistTemplateItem | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchItems();
  }, [productType, productId]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await getChecklistTemplate(productType, productId);
      setItems(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load checklist template');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newItems = [...items];
    const draggedItem = newItems[draggedIndex];
    newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, draggedItem);

    setItems(newItems);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null) return;

    try {
      const itemIds = items.map((item) => item.id);
      await reorderChecklistItems(itemIds);
      setDraggedIndex(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reorder items');
      fetchItems(); // Reload to reset order
    }
  };

  const handleDelete = async (itemId: number) => {
    if (!confirm('Are you sure you want to delete this checklist item?')) return;

    try {
      await deleteChecklistItem(itemId);
      await fetchItems();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete item');
    }
  };

  const handleEdit = (item: ChecklistTemplateItem) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  const handleFormSuccess = () => {
    fetchItems();
    handleFormClose();
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading checklist...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Checklist Template</h3>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          + Add Item
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No checklist items configured. Add items to define the workflow for this product.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`border border-gray-200 rounded-lg p-4 cursor-move hover:bg-gray-50 ${
                draggedIndex === index ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400">☰</span>
                    <h4 className="font-medium text-gray-900">{item.name}</h4>
                    {item.is_optional && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                        Optional
                      </span>
                    )}
                    {item.estimated_duration_minutes && (
                      <span className="text-xs text-gray-500">
                        ~{item.estimated_duration_minutes} min
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1 ml-6">{item.description}</p>
                </div>
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleEdit(item)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ChecklistItemForm
          productType={productType}
          productId={productId}
          item={editingItem}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
};

interface ChecklistItemFormProps {
  productType: 'package' | 'campaign';
  productId: number;
  item: ChecklistTemplateItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ChecklistItemForm = ({
  productType,
  productId,
  item,
  onClose,
  onSuccess,
}: ChecklistItemFormProps) => {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    description: item?.description || '',
    is_optional: item?.is_optional ?? false,
    estimated_duration_minutes: item?.estimated_duration_minutes || null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Item name is required');
      return;
    }
    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }

    try {
      setLoading(true);

      const data: any = {
        name: formData.name,
        description: formData.description,
        is_optional: formData.is_optional,
      };

      if (formData.estimated_duration_minutes) {
        data.estimated_duration_minutes = formData.estimated_duration_minutes;
      }

      if (item) {
        await updateChecklistItem(item.id, data);
      } else {
        await createChecklistItem(productType, productId, data);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save checklist item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {item ? 'Edit Checklist Item' : 'Add Checklist Item'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Item Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Review campaign materials"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed instructions for this task"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Is Optional */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_optional"
                checked={formData.is_optional}
                onChange={(e) => setFormData({ ...formData, is_optional: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="is_optional" className="text-sm text-gray-700">
                Optional item (does not affect completion percentage)
              </label>
            </div>

            {/* Estimated Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Duration (minutes)
              </label>
              <input
                type="number"
                value={formData.estimated_duration_minutes || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    estimated_duration_minutes: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                min="1"
                placeholder="Optional"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
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
            {loading ? 'Saving...' : item ? 'Update Item' : 'Add Item'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChecklistTemplateBuilder;
