import { useState, FormEvent } from 'react';
import { OrderItem } from '../types/order';
import { ResourceFieldDefinition } from '../types/resource';
import FileUpload from './FileUpload';
import orderService from '../services/orderService';

interface DynamicResourceUploadFormProps {
  orderId: number;
  orderItem: OrderItem;
  resourceFields: ResourceFieldDefinition[];
  onSuccess: () => void;
  onSkip: () => void;
  isLastItem: boolean;
}

interface FormValues {
  [fieldId: number]: string | File | null;
}

const DynamicResourceUploadForm = ({
  orderId,
  orderItem,
  resourceFields,
  onSuccess,
  onSkip,
  isLastItem,
}: DynamicResourceUploadFormProps) => {
  const [formValues, setFormValues] = useState<FormValues>({});
  const [errors, setErrors] = useState<{ [fieldId: number]: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleFileChange = (fieldId: number, file: File | null) => {
    setFormValues((prev) => ({
      ...prev,
      [fieldId]: file,
    }));

    // Clear error for this field
    if (file && errors[fieldId]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const handleInputChange = (fieldId: number, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }));

    // Clear error for this field
    if (value && errors[fieldId]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [fieldId: number]: string } = {};

    resourceFields.forEach((field) => {
      const value = formValues[field.id];

      // Check required fields
      if (field.is_required && !value) {
        newErrors[field.id] = `${field.field_name} is required`;
        return;
      }

      // Skip validation if field is empty and not required
      if (!value) return;

      // Validate based on field type
      switch (field.field_type) {
        case 'text':
          if (typeof value === 'string') {
            if (field.max_length && value.length > field.max_length) {
              newErrors[field.id] = `Maximum ${field.max_length} characters allowed`;
            }
          }
          break;

        case 'number':
          if (typeof value === 'string') {
            const numValue = parseFloat(value);
            if (isNaN(numValue)) {
              newErrors[field.id] = 'Please enter a valid number';
            } else {
              if (field.min_value !== undefined && numValue < field.min_value) {
                newErrors[field.id] = `Minimum value is ${field.min_value}`;
              }
              if (field.max_value !== undefined && numValue > field.max_value) {
                newErrors[field.id] = `Maximum value is ${field.max_value}`;
              }
            }
          }
          break;

        case 'phone':
          if (typeof value === 'string') {
            // Basic phone validation - 10 digits
            const phoneRegex = /^[0-9]{10}$/;
            if (!phoneRegex.test(value.replace(/\s/g, ''))) {
              newErrors[field.id] = 'Please enter a valid 10-digit phone number';
            }
          }
          break;

        case 'date':
          if (typeof value === 'string') {
            const dateValue = new Date(value);
            if (isNaN(dateValue.getTime())) {
              newErrors[field.id] = 'Please enter a valid date';
            }
          }
          break;

        case 'image':
        case 'document':
          if (value instanceof File) {
            // Validate file size
            if (field.max_file_size_mb) {
              const maxSizeBytes = field.max_file_size_mb * 1024 * 1024;
              if (value.size > maxSizeBytes) {
                newErrors[field.id] = `File size must be less than ${field.max_file_size_mb}MB`;
              }
            }

            // Validate file extension for documents
            if (field.field_type === 'document' && field.allowed_extensions) {
              const fileExt = value.name.split('.').pop()?.toLowerCase();
              if (fileExt && !field.allowed_extensions.includes(fileExt)) {
                newErrors[field.id] = `Allowed formats: ${field.allowed_extensions.join(', ')}`;
              }
            }
          }
          break;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      // Scroll to first error
      const firstErrorElement = document.querySelector('.border-red-500');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);

    try {
      // Create FormData object
      const formDataToSend = new FormData();

      // Add order item ID
      formDataToSend.append('order_item_id', orderItem.id.toString());

      // Add dynamic field values
      resourceFields.forEach((field) => {
        const value = formValues[field.id];
        if (value !== undefined && value !== null) {
          if (value instanceof File) {
            formDataToSend.append(`field_${field.id}`, value);
          } else {
            formDataToSend.append(`field_${field.id}`, value.toString());
          }
        }
      });

      // Upload resources
      const response = await orderService.uploadResources(
        orderId,
        orderItem.id,
        formDataToSend
      );

      if (response.success) {
        setSubmitSuccess(true);

        // Show success message briefly before moving to next item
        setTimeout(() => {
          onSuccess();
        }, 1000);
      } else {
        setSubmitError('Failed to upload resources. Please try again.');
      }
    } catch (err: any) {
      console.error('Failed to upload resources:', err);

      // Handle specific error messages from backend
      if (err.response?.data?.error) {
        setSubmitError(err.response.data.error);
      } else if (err.response?.status === 413) {
        setSubmitError('File size too large. Please upload smaller files.');
      } else if (err.response?.status === 415) {
        setSubmitError('Invalid file type. Please upload valid files.');
      } else if (err.response?.status === 422) {
        setSubmitError('Missing required fields. Please check all fields and try again.');
      } else if (err.message === 'Network Error') {
        setSubmitError('Network error. Please check your connection and try again.');
      } else {
        setSubmitError('Failed to upload resources. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: ResourceFieldDefinition) => {
    const value = formValues[field.id];
    const error = errors[field.id];

    switch (field.field_type) {
      case 'text':
        return (
          <div key={field.id}>
            <label htmlFor={`field-${field.id}`} className="block text-sm font-medium text-gray-700 mb-2">
              {field.field_name} {field.is_required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              id={`field-${field.id}`}
              value={(value as string) || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              maxLength={field.max_length}
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={field.help_text || `Enter ${field.field_name.toLowerCase()}`}
            />
            {field.help_text && !error && (
              <p className="mt-1 text-xs text-gray-500">{field.help_text}</p>
            )}
            {field.max_length && (
              <p className="mt-1 text-xs text-gray-500">
                {((value as string) || '').length} / {field.max_length} characters
              </p>
            )}
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          </div>
        );

      case 'number':
        return (
          <div key={field.id}>
            <label htmlFor={`field-${field.id}`} className="block text-sm font-medium text-gray-700 mb-2">
              {field.field_name} {field.is_required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="number"
              id={`field-${field.id}`}
              value={(value as string) || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              min={field.min_value}
              max={field.max_value}
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={field.help_text || `Enter ${field.field_name.toLowerCase()}`}
            />
            {field.help_text && !error && (
              <p className="mt-1 text-xs text-gray-500">{field.help_text}</p>
            )}
            {(field.min_value !== undefined || field.max_value !== undefined) && (
              <p className="mt-1 text-xs text-gray-500">
                {field.min_value !== undefined && field.max_value !== undefined
                  ? `Range: ${field.min_value} - ${field.max_value}`
                  : field.min_value !== undefined
                  ? `Minimum: ${field.min_value}`
                  : `Maximum: ${field.max_value}`}
              </p>
            )}
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          </div>
        );

      case 'image':
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.field_name} {field.is_required && <span className="text-red-500">*</span>}
            </label>
            <FileUpload
              accept="image/*"
              maxSize={(field.max_file_size_mb || 10) * 1024 * 1024}
              onFileSelect={(file) => handleFileChange(field.id, file)}
              error={error}
              label={field.help_text || `Upload ${field.field_name.toLowerCase()}`}
            />
            {field.help_text && !error && (
              <p className="mt-1 text-xs text-gray-500">{field.help_text}</p>
            )}
            {field.max_file_size_mb && (
              <p className="mt-1 text-xs text-gray-500">Maximum file size: {field.max_file_size_mb}MB</p>
            )}
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          </div>
        );

      case 'document':
        const acceptedFormats = field.allowed_extensions
          ? field.allowed_extensions.map((ext) => `.${ext}`).join(',')
          : '.pdf,.doc,.docx';
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.field_name} {field.is_required && <span className="text-red-500">*</span>}
            </label>
            <FileUpload
              accept={acceptedFormats}
              maxSize={(field.max_file_size_mb || 20) * 1024 * 1024}
              onFileSelect={(file) => handleFileChange(field.id, file)}
              error={error}
              label={field.help_text || `Upload ${field.field_name.toLowerCase()}`}
            />
            {field.help_text && !error && (
              <p className="mt-1 text-xs text-gray-500">{field.help_text}</p>
            )}
            {field.allowed_extensions && (
              <p className="mt-1 text-xs text-gray-500">
                Allowed formats: {field.allowed_extensions.join(', ').toUpperCase()}
              </p>
            )}
            {field.max_file_size_mb && (
              <p className="mt-1 text-xs text-gray-500">Maximum file size: {field.max_file_size_mb}MB</p>
            )}
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          </div>
        );

      case 'phone':
        return (
          <div key={field.id}>
            <label htmlFor={`field-${field.id}`} className="block text-sm font-medium text-gray-700 mb-2">
              {field.field_name} {field.is_required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="tel"
              id={`field-${field.id}`}
              value={(value as string) || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              maxLength={10}
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={field.help_text || 'Enter 10-digit phone number'}
            />
            {field.help_text && !error && (
              <p className="mt-1 text-xs text-gray-500">{field.help_text}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">Format: 10 digits (e.g., 9876543210)</p>
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          </div>
        );

      case 'date':
        return (
          <div key={field.id}>
            <label htmlFor={`field-${field.id}`} className="block text-sm font-medium text-gray-700 mb-2">
              {field.field_name} {field.is_required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="date"
              id={`field-${field.id}`}
              value={(value as string) || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {field.help_text && !error && (
              <p className="mt-1 text-xs text-gray-500">{field.help_text}</p>
            )}
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
      {/* Success Message */}
      {submitSuccess && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg
              className="h-5 w-5 text-green-600 mr-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm font-medium text-green-800">Resources uploaded successfully!</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {submitError && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg
              className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">{submitError}</p>
            </div>
            <button
              type="button"
              onClick={() => setSubmitError('')}
              className="ml-3 flex-shrink-0 text-red-600 hover:text-red-800"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {resourceFields.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No resource fields configured for this product.</p>
          </div>
        ) : (
          resourceFields.map((field) => renderField(field))
        )}
      </div>

      {/* Action Buttons */}
      {resourceFields.length > 0 && (
        <>
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 px-6 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Uploading...
                </span>
              ) : isLastItem ? (
                'Submit & Complete'
              ) : (
                'Submit & Continue'
              )}
            </button>

            {!isLastItem && (
              <button
                type="button"
                onClick={onSkip}
                disabled={submitting}
                className="sm:w-auto py-3 px-6 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 font-medium transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                Skip for Now
              </button>
            )}
          </div>

          {/* Help Text */}
          <div className="mt-4 text-sm text-gray-600 text-center">
            <p>All uploaded files will be securely stored and used only for campaign purposes.</p>
          </div>
        </>
      )}
    </form>
  );
};

export default DynamicResourceUploadForm;
