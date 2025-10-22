import { Link } from 'react-router-dom';
import { OrderDetail as OrderDetailType } from '../types/order';

interface OrderDetailProps {
  order: OrderDetailType;
  onAssignClick?: () => void;
  showActions?: boolean;
  userRole?: string;
}

const OrderDetail = ({ order, onAssignClick, showActions = true, userRole }: OrderDetailProps) => {
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

  const handleDownloadImage = async (imageUrl: string, filename: string) => {
    try {
      const fullUrl = getFullImageUrl(imageUrl);
      if (!fullUrl) return;

      const response = await fetch(fullUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
      alert('Failed to download image. Please try again.');
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending_resources':
        return 'bg-orange-100 text-orange-800';
      case 'ready_for_processing':
        return 'bg-blue-100 text-blue-800';
      case 'assigned':
        return 'bg-purple-100 text-purple-800';
      case 'in_progress':
        return 'bg-indigo-100 text-indigo-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Order Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h2>
          <div className="flex items-center justify-between mb-4">
            <span className={`px-4 py-2 inline-flex text-sm font-semibold rounded-full ${getStatusBadgeColor(order.status)}`}>
              {formatStatus(order.status)}
            </span>
            {order.assigned_to && (
              <div className="text-sm text-gray-600">
                Assigned to: <span className="font-medium">{order.assigned_to.name || order.assigned_to.phone}</span>
              </div>
            )}
          </div>

          {/* Progress Information for Admins */}
          {order.checklist && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Completion Progress</span>
                <span className={`text-sm font-semibold ${
                  order.checklist.progress_percentage === 100 ? 'text-green-600' : 'text-blue-600'
                }`}>
                  {order.checklist.completed_items} / {order.checklist.total_items} items ({order.checklist.progress_percentage}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    order.checklist.progress_percentage === 100 
                      ? 'bg-gradient-to-r from-green-500 to-green-600' 
                      : 'bg-gradient-to-r from-blue-500 to-blue-600'
                  }`}
                  style={{ width: `${order.checklist.progress_percentage}%` }}
                ></div>
              </div>
              {order.checklist.progress_percentage === 100 && (
                <div className="mt-3 flex items-center text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  All checklist items completed!
                </div>
              )}
            </div>
          )}
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {item.item_type === 'package' ? 'Package' : 'Campaign'}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {item.item_details?.name || 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      ₹{item.price.toLocaleString('en-IN')}
                    </p>
                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                  </div>
                </div>
                {item.item_details?.description && (
                  <p className="text-sm text-gray-600 mt-2">
                    {item.item_details.description}
                  </p>
                )}
                {item.item_details?.items && item.item_details.items.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-700 mb-2">Package Includes:</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {item.item_details.items.map((packageItem: any, idx: number) => (
                        <li key={idx} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{packageItem.name} {packageItem.quantity > 1 && `(${packageItem.quantity})`}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="mt-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${item.resources_uploaded ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {item.resources_uploaded ? 'Resources Uploaded' : 'Resources Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Total Amount</span>
              <span className="text-2xl font-bold text-gray-900">
                ₹{order.total_amount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Checklist Details for Admins */}
        {order.checklist && order.checklist.items && order.checklist.items.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Checklist Progress</h2>
            <div className="space-y-3">
              {order.checklist.items.map((item, index) => (
                <div
                  key={item.id}
                  className={`border rounded-lg p-4 transition-all ${
                    item.completed
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start">
                    <div className={`flex-shrink-0 mt-0.5 mr-3 w-6 h-6 rounded border-2 flex items-center justify-center ${
                      item.completed
                        ? 'border-green-500 bg-green-500'
                        : 'border-gray-300 bg-white'
                    }`}>
                      {item.completed && (
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${
                        item.completed ? 'text-gray-600 line-through' : 'text-gray-900'
                      }`}>
                        {index + 1}. {item.description}
                      </p>
                      
                      {item.completed && item.completed_at && (
                        <div className="mt-2 flex items-center text-xs text-gray-500">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          <span>Completed on {formatDate(item.completed_at)}</span>
                          {item.completed_by && (
                            <span className="ml-2">
                              by {item.completed_by.name || item.completed_by.phone}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {item.completed && (
                      <div className="flex-shrink-0 ml-2">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Done
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <span>
                    {order.checklist.completed_items === order.checklist.total_items
                      ? 'All tasks completed'
                      : `${order.checklist.total_items - order.checklist.completed_items} task${
                          order.checklist.total_items - order.checklist.completed_items !== 1 ? 's' : ''
                        } remaining`}
                  </span>
                </div>
                <div className={`font-semibold ${
                  order.checklist.progress_percentage === 100 ? 'text-green-600' : 'text-blue-600'
                }`}>
                  {order.checklist.progress_percentage}% Complete
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Uploaded Resources */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Campaign Resources</h2>
          {order.resources && order.resources.length > 0 ? (
            <div className="space-y-6">
              {order.resources.map((resource) => (
                <div key={resource.id} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-4">
                    Resource Set #{resource.id}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Candidate Photo */}
                    {resource.candidate_photo && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Candidate Photo</p>
                        <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-100">
                          <img 
                            src={getFullImageUrl(resource.candidate_photo) || ''} 
                            alt="Candidate" 
                            className="w-full h-48 object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not found%3C/text%3E%3C/svg%3E';
                            }}
                          />
                        </div>
                        <div className="flex gap-2 mt-2">
                          <a
                            href={getFullImageUrl(resource.candidate_photo) || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-700 inline-flex items-center"
                            onClick={(e) => {
                              if (!getFullImageUrl(resource.candidate_photo)) {
                                e.preventDefault();
                              }
                            }}
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            View Full Size
                          </a>
                          <button
                            onClick={() => handleDownloadImage(resource.candidate_photo!, `candidate_photo_${resource.id}.jpg`)}
                            className="text-xs text-green-600 hover:text-green-700 inline-flex items-center"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Party Logo */}
                    {resource.party_logo && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Party Logo</p>
                        <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                          <img 
                            src={getFullImageUrl(resource.party_logo) || ''} 
                            alt="Party Logo" 
                            className="w-full h-48 object-contain p-4"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not found%3C/text%3E%3C/svg%3E';
                            }}
                          />
                        </div>
                        <div className="flex gap-2 mt-2">
                          <a
                            href={getFullImageUrl(resource.party_logo) || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-700 inline-flex items-center"
                            onClick={(e) => {
                              if (!getFullImageUrl(resource.party_logo)) {
                                e.preventDefault();
                              }
                            }}
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            View Full Size
                          </a>
                          <button
                            onClick={() => handleDownloadImage(resource.party_logo!, `party_logo_${resource.id}.png`)}
                            className="text-xs text-green-600 hover:text-green-700 inline-flex items-center"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Campaign Details */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {resource.campaign_slogan && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Campaign Slogan</p>
                        <p className="text-sm text-gray-900 mt-1 italic">"{resource.campaign_slogan}"</p>
                      </div>
                    )}

                    {resource.preferred_date && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Preferred Date</p>
                        <p className="text-sm text-gray-900 mt-1">{formatShortDate(resource.preferred_date)}</p>
                      </div>
                    )}

                    {resource.whatsapp_number && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">WhatsApp Number</p>
                        <a 
                          href={`https://wa.me/${resource.whatsapp_number.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-700 mt-1 inline-flex items-center"
                        >
                          {resource.whatsapp_number}
                          <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                        </a>
                      </div>
                    )}

                    {resource.additional_notes && (
                      <div className="md:col-span-2">
                        <p className="text-sm font-medium text-gray-700">Additional Notes</p>
                        <p className="text-sm text-gray-900 mt-1">{resource.additional_notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      Uploaded on {formatDate(resource.uploaded_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <p className="mt-4 text-gray-600">No resources uploaded yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Customer Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-medium text-gray-900">{order.user.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <a 
                href={`tel:${order.user.phone}`}
                className="font-medium text-blue-600 hover:text-blue-700"
              >
                {order.user.phone}
              </a>
            </div>
            <div>
              <p className="text-sm text-gray-600">Customer ID</p>
              <p className="font-medium text-gray-900">#{order.user.id}</p>
            </div>
          </div>
        </div>

        {/* Order Timeline */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Timeline</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Order Created</p>
                <p className="text-xs text-gray-500">{formatDate(order.created_at)}</p>
              </div>
            </div>

            {order.status !== 'pending_payment' && (
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Payment Completed</p>
                  <p className="text-xs text-gray-500">{formatDate(order.updated_at)}</p>
                </div>
              </div>
            )}

            {order.assigned_to && (
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Assigned to Staff</p>
                  <p className="text-xs text-gray-500">{order.assigned_to.name || order.assigned_to.phone}</p>
                </div>
              </div>
            )}

            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  order.status === 'completed' ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <svg className={`w-4 h-4 ${
                    order.status === 'completed' ? 'text-green-600' : 'text-gray-400'
                  }`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Order Completed</p>
                <p className="text-xs text-gray-500">
                  {order.status === 'completed' ? formatDate(order.updated_at) : 'Pending'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        {showActions && userRole === 'admin' && order.status !== 'completed' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
            {onAssignClick ? (
              <button
                onClick={onAssignClick}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                {order.assigned_to ? 'Reassign Order' : 'Assign to Staff'}
              </button>
            ) : (
              <Link
                to={`/orders/${order.id}/assign`}
                className="w-full block text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                {order.assigned_to ? 'Reassign Order' : 'Assign to Staff'}
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetail;
