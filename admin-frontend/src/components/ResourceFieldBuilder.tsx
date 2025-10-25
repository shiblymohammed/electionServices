import { useState, useEffect } from 'react';
import { ResourceFieldDefinition } from '../types/product';
import {
  getResourceFields,
  createResourceField,
  updateResourceField,
  deleteResourceField,
  reorderResourceFields,
} from '../services/productService';

interface ResourceFieldBuilderProps {
  productType: 'package' | 'campaign';
  productId: number;
}

const ResourceFieldBuilder = ({ productType, productId }: ResourceFieldBuilderProps) => {
  const [fields, setFields] = useState<ResourceFieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingField, setEditingField] = useState<ResourceFieldDefinition | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchFields();
  }, [productType, productId]);

  const fetchFields = async () => {
    try {
      setLoading(true);
      const data = await getResourceFields(productType, productId);
      setFields(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load resource fields');
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

    const newFields = [...fields];
    const draggedField = newFields[draggedIndex];
    newFields.splice(draggedIndex, 1);
    newFields.splice(index, 0, draggedField);

    setFields(newFields);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null) return;

    try {
      const fieldIds = fields.map((f) => f.id);
      await reorderResourceFields(fieldIds);
      setDraggedIndex(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reorder fields');
      fetchFields(); // Reload to reset order
    }
  };

  const handleDelete = async (fieldId: number) => {
    if (!confirm('Are you sure you want to delete this field?')) return;

    try {
      await deleteResourceField(fieldId);
      await fetchFields();
      setError(''); // Clear any previous errors
    } catch (err: any) {
      console.error('Delete error:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to delete field';
      setError(errorMessage);
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleEdit = (field: ResourceFieldDefinition) => {
    setEditingField(field);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingField(null);
  };

  const handleFormSuccess = () => {
    fetchFields();
    handleFormClose();
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading fields...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Resource Fields</h3>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          + Add Field
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {fields.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No resource fields configured. Add fields to collect information from users.
        </p>
      ) : (
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div
              key={field.id}
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
                    <h4 className="font-medium text-gray-900">{field.field_name}</h4>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        field.field_type === 'image'
                          ? 'bg-purple-100 text-purple-800'
                          : field.field_type === 'document'
                          ? 'bg-blue-100 text-blue-800'
                          : field.field_type === 'number'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {field.field_type}
                    </span>
                    {field.is_required && (
                      <span className="text-xs text-red-600 font-medium">Required</span>
                    )}
                  </div>
                  {field.help_text && (
                    <p className="text-sm text-gray-600 mt-1 ml-6">{field.help_text}</p>
                  )}
                  <div className="text-xs text-gray-500 mt-2 ml-6 space-x-4">
                    {field.max_file_size_mb && (
                      <span>Max size: {field.max_file_size_mb}MB</span>
                    )}
                    {field.max_length && <span>Max length: {field.max_length}</span>}
                    {field.min_value !== null && field.min_value !== undefined && (
                      <span>Min: {field.min_value}</span>
                    )}
                    {field.max_value !== null && field.max_value !== undefined && (
                      <span>Max: {field.max_value}</span>
                    )}
                    {field.allowed_extensions && field.allowed_extensions.length > 0 && (
                      <span>Allowed: {field.allowed_extensions.join(', ')}</span>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleEdit(field)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(field.id)}
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
        <ResourceFieldForm
          productType={productType}
          productId={productId}
          field={editingField}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
};

interface ResourceFieldFormProps {
  productType: 'package' | 'campaign';
  productId: number;
  field: ResourceFieldDefinition | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ResourceFieldForm = ({
  productType,
  productId,
  field,
  onClose,
  onSuccess,
}: ResourceFieldFormProps) => {
  const [formData, setFormData] = useState({
    field_name: field?.field_name || '',
    field_type: field?.field_type || 'text',
    is_required: field?.is_required ?? true,
    help_text: field?.help_text || '',
    max_file_size_mb: field?.max_file_size_mb || 10,
    max_length: field?.max_length || 500,
    min_value: field?.min_value || 0,
    max_value: field?.max_value || 1000000,
    allowed_extensions: field?.allowed_extensions?.join(', ') || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.field_name.trim()) {
      setError('Field name is required');
      return;
    }

    try {
      setLoading(true);

      const data: any = {
        field_name: formData.field_name,
        field_type: formData.field_type,
        is_required: formData.is_required,
        help_text: formData.help_text,
      };

      // Add type-specific configurations
      if (formData.field_type === 'image' || formData.field_type === 'document') {
        data.max_file_size_mb = formData.max_file_size_mb;
        if (formData.field_type === 'document' && formData.allowed_extensions) {
          data.allowed_extensions = formData.allowed_extensions
            .split(',')
            .map((ext) => ext.trim())
            .filter((ext) => ext);
        }
      } else if (formData.field_type === 'text') {
        data.max_length = formData.max_length;
      } else if (formData.field_type === 'number') {
        data.min_value = formData.min_value;
        data.max_value = formData.max_value;
      }

      if (field) {
        console.log('Updating field:', field.id, 'with data:', data);
        await updateResourceField(field.id, data);
      } else {
        console.log('Creating field with data:', data);
        await createResourceField(productType, productId, data);
      }

      onSuccess();
    } catch (err: any) {
      console.error('Save error:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to save field';
      const validationErrors = err.response?.data?.errors;
      
      if (validationErrors) {
        console.error('Validation errors:', validationErrors);
        setError(`Validation failed: ${JSON.stringify(validationErrors)}`);
      } else {
        setError(errorMessage);
      }
      
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {field ? 'Edit Resource Field' : 'Add Resource Field'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Field Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Field Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.field_name}
                onChange={(e) => setFormData({ ...formData, field_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Field Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Field Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.field_type}
                onChange={(e) => setFormData({ ...formData, field_type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!!field}
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="phone">Phone Number</option>
                <option value="date">Date</option>
                <option value="image">Image</option>
                <option value="document">Document</option>
              </select>
            </div>

            {/* Is Required */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_required"
                checked={formData.is_required}
                onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="is_required" className="text-sm text-gray-700">
                Required field
              </label>
            </div>

            {/* Help Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Help Text</label>
              <input
                type="text"
                value={formData.help_text}
                onChange={(e) => setFormData({ ...formData, help_text: e.target.value })}
                placeholder="Instructions for users"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Type-specific fields */}
            {(formData.field_type === 'image' || formData.field_type === 'document') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max File Size (MB)
                </label>
                <input
                  type="number"
                  value={formData.max_file_size_mb}
                  onChange={(e) =>
                    setFormData({ ...formData, max_file_size_mb: parseInt(e.target.value) })
                  }
                  min="1"
                  max="50"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {formData.field_type === 'document' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Allowed Extensions (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.allowed_extensions}
                  onChange={(e) => setFormData({ ...formData, allowed_extensions: e.target.value })}
                  placeholder="pdf, docx, doc"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {formData.field_type === 'text' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Length
                </label>
                <input
                  type="number"
                  value={formData.max_length}
                  onChange={(e) =>
                    setFormData({ ...formData, max_length: parseInt(e.target.value) })
                  }
                  min="1"
                  max="5000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {formData.field_type === 'number' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Value
                  </label>
                  <input
                    type="number"
                    value={formData.min_value}
                    onChange={(e) =>
                      setFormData({ ...formData, min_value: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Value
                  </label>
                  <input
                    type="number"
                    value={formData.max_value}
                    onChange={(e) =>
                      setFormData({ ...formData, max_value: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </>
            )}
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
            {loading ? 'Saving...' : field ? 'Update Field' : 'Add Field'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResourceFieldBuilder;
