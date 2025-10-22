import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getOrderDetail, getStaffMembers, assignOrderToStaff } from '../services/adminService';
import { OrderDetail, StaffMember } from '../types/order';

const StaffAssignmentPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is admin
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }

    if (id) {
      fetchData(parseInt(id));
    }
  }, [id, user, navigate]);

  const fetchData = async (orderId: number) => {
    try {
      setLoading(true);
      setError(null);

      const [orderData, staffData] = await Promise.all([
        getOrderDetail(orderId),
        getStaffMembers(),
      ]);

      setOrder(orderData);
      setStaffMembers(staffData);

      // Pre-select currently assigned staff if any
      if (orderData.assigned_to) {
        setSelectedStaffId(orderData.assigned_to.id.toString());
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.error?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStaffId || !order) {
      setError('Please select a staff member');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const result = await assignOrderToStaff(order.id, parseInt(selectedStaffId));
      
      setSuccess(result.message || 'Order assigned successfully!');
      
      // Redirect to order detail page after 2 seconds
      setTimeout(() => {
        navigate(`/orders/${order.id}`);
      }, 2000);
    } catch (err: any) {
      console.error('Error assigning order:', err);
      setError(err.response?.data?.error?.message || 'Failed to assign order');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
          <Link
            to="/orders"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-4">
                <Link
                  to={`/orders/${order.id}`}
                  className="text-gray-600 hover:text-gray-900"
                >
                  ← Back
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">
                  Assign Order {order.order_number}
                </h1>
              </div>
            </div>
            <div className="flex gap-4">
              <Link
                to="/"
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition"
              >
                Dashboard
              </Link>
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Order Number</p>
              <p className="font-medium text-gray-900">{order.order_number}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Customer</p>
              <p className="font-medium text-gray-900">{order.user.name || order.user.phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="font-medium text-gray-900">₹{order.total_amount.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Current Status</p>
              <p className="font-medium text-gray-900">
                {order.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </p>
            </div>
          </div>
          {order.assigned_to && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">Currently Assigned To</p>
              <p className="font-medium text-gray-900">
                {order.assigned_to.name || order.assigned_to.phone}
              </p>
            </div>
          )}
        </div>

        {/* Assignment Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {order.assigned_to ? 'Reassign to Staff Member' : 'Assign to Staff Member'}
          </h2>

          <form onSubmit={handleAssign}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Staff Member
              </label>
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={submitting}
              >
                <option value="">-- Select Staff --</option>
                {staffMembers.map(staff => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name || staff.phone} ({staff.assigned_orders_count} orders assigned)
                  </option>
                ))}
              </select>
            </div>

            {/* Staff List */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Available Staff</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {staffMembers.map(staff => (
                  <div
                    key={staff.id}
                    className={`p-3 border rounded-lg cursor-pointer transition ${
                      selectedStaffId === staff.id.toString()
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedStaffId(staff.id.toString())}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">{staff.name || 'N/A'}</p>
                        <p className="text-sm text-gray-600">{staff.phone}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          {staff.assigned_orders_count} {staff.assigned_orders_count === 1 ? 'order' : 'orders'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submitting || !selectedStaffId}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {submitting ? 'Assigning...' : order.assigned_to ? 'Reassign Order' : 'Assign Order'}
              </button>
              <Link
                to={`/orders/${order.id}`}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default StaffAssignmentPage;
