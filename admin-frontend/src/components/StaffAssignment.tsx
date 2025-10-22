import { useState, useEffect } from 'react';
import { getStaffMembers, assignOrderToStaff } from '../services/adminService';
import { StaffMember } from '../types/order';

interface StaffAssignmentProps {
  orderId: number;
  orderNumber: string;
  currentAssignedStaff?: {
    id: number;
    name?: string;
    phone: string;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
  isModal?: boolean;
}

const StaffAssignment = ({
  orderId,
  orderNumber,
  currentAssignedStaff,
  onSuccess,
  onCancel,
  isModal = false,
}: StaffAssignmentProps) => {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchStaffMembers();
  }, []);

  useEffect(() => {
    // Pre-select currently assigned staff if any
    if (currentAssignedStaff) {
      setSelectedStaffId(currentAssignedStaff.id.toString());
    }
  }, [currentAssignedStaff]);

  const fetchStaffMembers = async () => {
    try {
      setLoading(true);
      setError(null);

      const staffData = await getStaffMembers();
      setStaffMembers(staffData);
    } catch (err: any) {
      console.error('Error fetching staff members:', err);
      setError(err.response?.data?.error?.message || 'Failed to load staff members');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStaffId) {
      setError('Please select a staff member');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const result = await assignOrderToStaff(orderId, parseInt(selectedStaffId));
      
      setSuccess(result.message || 'Order assigned successfully!');
      
      // Call onSuccess callback after a short delay
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 1500);
    } catch (err: any) {
      console.error('Error assigning order:', err);
      setError(err.response?.data?.error?.message || 'Failed to assign order');
    } finally {
      setSubmitting(false);
    }
  };

  const containerClasses = isModal
    ? 'bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'
    : 'bg-white rounded-lg shadow';

  if (loading) {
    return (
      <div className={containerClasses}>
        <div className="p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading staff members...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {currentAssignedStaff ? 'Reassign Order' : 'Assign Order to Staff'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Order: {orderNumber}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {success}
          </div>
        )}

        {/* Current Assignment Info */}
        {currentAssignedStaff && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-900">Currently Assigned To:</p>
            <p className="text-sm text-blue-700 mt-1">
              {currentAssignedStaff.name || currentAssignedStaff.phone}
            </p>
          </div>
        )}

        {/* Assignment Form */}
        <form onSubmit={handleAssign}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Staff Member *
            </label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={submitting || success !== null}
            >
              <option value="">-- Select Staff --</option>
              {staffMembers.map(staff => (
                <option key={staff.id} value={staff.id}>
                  {staff.name || staff.phone} ({staff.assigned_orders_count} {staff.assigned_orders_count === 1 ? 'order' : 'orders'})
                </option>
              ))}
            </select>
          </div>

          {/* Staff List */}
          {staffMembers.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Available Staff Members</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-2">
                {staffMembers.map(staff => (
                  <div
                    key={staff.id}
                    className={`p-3 border rounded-lg cursor-pointer transition ${
                      selectedStaffId === staff.id.toString()
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    } ${submitting || success !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => {
                      if (!submitting && success === null) {
                        setSelectedStaffId(staff.id.toString());
                      }
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">{staff.name || 'N/A'}</p>
                        <p className="text-sm text-gray-600">{staff.phone}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-700">
                          {staff.assigned_orders_count}
                        </p>
                        <p className="text-xs text-gray-500">
                          {staff.assigned_orders_count === 1 ? 'order' : 'orders'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {staffMembers.length === 0 && (
            <div className="mb-6 text-center py-8 bg-gray-50 rounded-lg">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <p className="mt-4 text-gray-600">No staff members available</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting || !selectedStaffId || success !== null || staffMembers.length === 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {submitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Assigning...
                </span>
              ) : (
                currentAssignedStaff ? 'Reassign Order' : 'Assign Order'
              )}
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default StaffAssignment;
