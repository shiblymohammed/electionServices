import { OrderDetail } from '../types/order';
import ProgressUpdate from './ProgressUpdate';

/**
 * ChecklistView Component
 * 
 * Displays an interactive checklist for staff members to track order completion progress.
 * Features:
 * - Shows customer contact information and campaign resources
 * - Displays all checklist items with completion status
 * - Integrates ProgressUpdate component for real-time tracking
 * 
 * Requirements: 8.2, 8.3, 9.1
 */
interface ChecklistViewProps {
  order: OrderDetail;
  onUpdate?: () => void;
}

const ChecklistView = ({ order, onUpdate }: ChecklistViewProps) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  const getFullImageUrl = (path: string | null | undefined): string | null => {
    if (!path) return null;
    // If path already starts with http, return as is
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    // Otherwise, prepend the API base URL
    return `${API_BASE_URL}${path}`;
  };

  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };



  return (
    <div className="space-y-6">
      {/* User Resources and Contact Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information & Resources</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Contact Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 border-b pb-2">Contact Details</h3>
            <div>
              <p className="text-xs text-gray-600">Customer Name</p>
              <p className="font-medium text-gray-900">{order.user.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Phone Number</p>
              <a 
                href={`tel:${order.user.phone}`}
                className="font-medium text-blue-600 hover:text-blue-700"
              >
                {order.user.phone}
              </a>
            </div>
            <div>
              <p className="text-xs text-gray-600">Order Number</p>
              <p className="font-medium text-gray-900">{order.order_number}</p>
            </div>
          </div>

          {/* Campaign Resources Summary */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 border-b pb-2">Campaign Resources</h3>
            {order.resources && order.resources.length > 0 ? (
              order.resources.map((resource, index) => (
                <div key={resource.id} className="text-sm space-y-2">
                  {index > 0 && <div className="border-t pt-2 mt-2"></div>}
                  {resource.campaign_slogan && (
                    <div>
                      <p className="text-xs text-gray-600">Slogan</p>
                      <p className="text-gray-900 italic">"{resource.campaign_slogan}"</p>
                    </div>
                  )}
                  {resource.preferred_date && (
                    <div>
                      <p className="text-xs text-gray-600">Preferred Date</p>
                      <p className="text-gray-900">{formatShortDate(resource.preferred_date)}</p>
                    </div>
                  )}
                  {resource.whatsapp_number && (
                    <div>
                      <p className="text-xs text-gray-600">WhatsApp</p>
                      <a 
                        href={`https://wa.me/${resource.whatsapp_number.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 inline-flex items-center"
                      >
                        {resource.whatsapp_number}
                        <svg className="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                          <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                        </svg>
                      </a>
                    </div>
                  )}
                  {resource.candidate_photo && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Candidate Photo</p>
                      <a
                        href={getFullImageUrl(resource.candidate_photo) || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-xs"
                        onClick={(e) => {
                          if (!getFullImageUrl(resource.candidate_photo)) {
                            e.preventDefault();
                          }
                        }}
                      >
                        View Photo →
                      </a>
                    </div>
                  )}
                  {resource.party_logo && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Party Logo</p>
                      <a
                        href={getFullImageUrl(resource.party_logo) || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-xs"
                        onClick={(e) => {
                          if (!getFullImageUrl(resource.party_logo)) {
                            e.preventDefault();
                          }
                        }}
                      >
                        View Logo →
                      </a>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No resources uploaded yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Progress Update with Interactive Checklist */}
      {order.checklist && order.checklist.items.length > 0 && (
        <ProgressUpdate
          checklistItems={order.checklist.items}
          onUpdate={onUpdate}
        />
      )}
    </div>
  );
};

export default ChecklistView;
