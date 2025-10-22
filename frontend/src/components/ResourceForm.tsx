import { useState, FormEvent } from 'react';
import { OrderItem } from '../types/order';
import FileUpload from './FileUpload';
import orderService from '../services/orderService';

interface ResourceFormProps {
  orderId: number;
  orderItem: OrderItem;
  onSuccess: () => void;
  onSkip: () => void;
  isLastItem: boolean;
}

interface ResourceFormData {
  candidatePhoto: File | null;
  partyLogo: File | null;
  campaignSlogan: string;
  preferredDate: string;
  whatsappNumber: string;
  additionalNotes: string;
}

const ResourceForm = ({ orderId, orderItem, onSuccess, onSkip, isLastItem }: ResourceFormProps) => {
  const [formData, setFormData] = useState<ResourceFormData>({
    candidatePhoto: null,
    partyLogo: null,
    campaignSlogan: '',
    preferredDate: '',
    whatsappNumber: '',
    additionalNotes: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ResourceFormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleFileChange = (fieldName: 'candidatePhoto' | 'partyLogo', file: File | null) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: file,
    }));
    
    // Clear error for this field
    if (file && errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const handleInputChange = (
    fieldName: keyof ResourceFormData,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
    
    // Clear error for this field
    if (value && errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ResourceFormData, string>> = {};

    if (!formData.candidatePhoto) {
      newErrors.candidatePhoto = 'Candidate photo is required';
    }

    if (!formData.partyLogo) {
      newErrors.partyLogo = 'Party logo is required';
    }

    if (!formData.campaignSlogan.trim()) {
      newErrors.campaignSlogan = 'Campaign slogan is required';
    }

    if (!formData.preferredDate) {
      newErrors.preferredDate = 'Preferred date is required';
    }

    if (!formData.whatsappNumber.trim()) {
      newErrors.whatsappNumber = 'WhatsApp number is required';
    } else if (!/^\+?[1-9]\d{9,14}$/.test(formData.whatsappNumber.replace(/\s/g, ''))) {
      newErrors.whatsappNumber = 'Please enter a valid phone number';
    }

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
      
      // Add files
      if (formData.candidatePhoto) {
        formDataToSend.append('candidate_photo', formData.candidatePhoto);
      }
      
      if (formData.partyLogo) {
        formDataToSend.append('party_logo', formData.partyLogo);
      }
      
      // Add text fields
      formDataToSend.append('campaign_slogan', formData.campaignSlogan);
      formDataToSend.append('preferred_date', formData.preferredDate);
      formDataToSend.append('whatsapp_number', formData.whatsappNumber);
      
      if (formData.additionalNotes.trim()) {
        formDataToSend.append('additional_notes', formData.additionalNotes);
      }

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
        setSubmitError('Invalid file type. Please upload valid image files.');
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <p className="text-sm font-medium text-green-800">
              Resources uploaded successfully!
            </p>
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Candidate Photo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Candidate Photo <span className="text-red-500">*</span>
          </label>
          <FileUpload
            accept="image/*"
            maxSize={5 * 1024 * 1024} // 5MB
            onFileSelect={(file) => handleFileChange('candidatePhoto', file)}
            error={errors.candidatePhoto}
            label="Upload candidate photo"
          />
          {errors.candidatePhoto && (
            <p className="mt-1 text-sm text-red-600">{errors.candidatePhoto}</p>
          )}
        </div>

        {/* Party Logo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Party Logo <span className="text-red-500">*</span>
          </label>
          <FileUpload
            accept="image/*"
            maxSize={5 * 1024 * 1024} // 5MB
            onFileSelect={(file) => handleFileChange('partyLogo', file)}
            error={errors.partyLogo}
            label="Upload party logo"
          />
          {errors.partyLogo && (
            <p className="mt-1 text-sm text-red-600">{errors.partyLogo}</p>
          )}
        </div>

        {/* Campaign Slogan */}
        <div>
          <label htmlFor="campaignSlogan" className="block text-sm font-medium text-gray-700 mb-2">
            Campaign Slogan <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="campaignSlogan"
            value={formData.campaignSlogan}
            onChange={(e) => handleInputChange('campaignSlogan', e.target.value)}
            className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
              errors.campaignSlogan ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your campaign slogan"
          />
          {errors.campaignSlogan && (
            <p className="mt-1 text-sm text-red-600">{errors.campaignSlogan}</p>
          )}
        </div>

        {/* Preferred Date */}
        <div>
          <label htmlFor="preferredDate" className="block text-sm font-medium text-gray-700 mb-2">
            Preferred Campaign Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="preferredDate"
            value={formData.preferredDate}
            onChange={(e) => handleInputChange('preferredDate', e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
              errors.preferredDate ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.preferredDate && (
            <p className="mt-1 text-sm text-red-600">{errors.preferredDate}</p>
          )}
        </div>

        {/* WhatsApp Number */}
        <div>
          <label htmlFor="whatsappNumber" className="block text-sm font-medium text-gray-700 mb-2">
            WhatsApp Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            id="whatsappNumber"
            value={formData.whatsappNumber}
            onChange={(e) => handleInputChange('whatsappNumber', e.target.value)}
            className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
              errors.whatsappNumber ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="+91 9876543210"
          />
          {errors.whatsappNumber && (
            <p className="mt-1 text-sm text-red-600">{errors.whatsappNumber}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Include country code (e.g., +91 for India)
          </p>
        </div>

        {/* Additional Notes */}
        <div>
          <label htmlFor="additionalNotes" className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes (Optional)
          </label>
          <textarea
            id="additionalNotes"
            value={formData.additionalNotes}
            onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Any additional information or special requests..."
          />
        </div>
      </div>

      {/* Action Buttons */}
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
    </form>
  );
};

export default ResourceForm;
