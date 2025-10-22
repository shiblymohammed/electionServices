import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AdminOrder, StaffMember } from '../types/order';
import { useAuth } from '../context/AuthContext';
import { isAdmin } from '../utils/roleUtils';

interface OrderListProps {
  orders: AdminOrder[];
  staffMembers: StaffMember[];
  showFilters?: boolean;
  maxHeight?: string;
}

const OrderList = ({ orders, staffMembers, showFilters = true, maxHeight }: OrderListProps) => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filteredOrders, setFilteredOrders] = useState<AdminOrder[]>(orders);
  
  // Initialize filter states from URL parameters
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || '');
  const [staffFilter, setStaffFilter] = useState<string>(searchParams.get('staff') || '');
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('search') || '');
  
  // Check if user is admin
  const userIsAdmin = isAdmin(user);

  useEffect(() => {
    applyFilters();
  }, [orders, statusFilter, staffFilter, searchQuery]);

  // Update URL parameters when filters change
  useEffect(() => {
    const params: any = {};
    if (statusFilter) params.status = statusFilter;
    if (staffFilter) params.staff = staffFilter;
    if (searchQuery) params.search = searchQuery;
    
    setSearchParams(params);
  }, [statusFilter, staffFilter, searchQuery, setSearchParams]);

  const applyFilters = () => {
    let filtered = [...orders];

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Apply staff filter
    if (staffFilter) {
      const staffId = parseInt(staffFilter);
      filtered = filtered.filter(order => order.assigned_to?.id === staffId);
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        order.order_number.toLowerCase().includes(query) ||
        order.user.phone.includes(query) ||
        order.user.name?.toLowerCase().includes(query)
      );
    }

    setFilteredOrders(filtered);
  };

  const clearFilters = () => {
    setStatusFilter('');
    setStaffFilter('');
    setSearchQuery('');
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className={`grid grid-cols-1 ${userIsAdmin ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-4`}>
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Order #, phone, name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="pending_payment">Pending Payment</option>
                <option value="pending_resources">Pending Resources</option>
                <option value="ready_for_processing">Ready for Processing</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Staff Filter - Only show for admins */}
            {userIsAdmin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned Staff
                </label>
                <select
                  value={staffFilter}
                  onChange={(e) => setStaffFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Staff</option>
                  {staffMembers.map(staff => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name || staff.phone}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Filter Summary */}
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredOrders.length} of {orders.length} orders
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow">
        {filteredOrders.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-4 text-gray-600">
              {searchQuery || statusFilter || staffFilter ? 'No orders match your filters' : 'No orders found'}
            </p>
          </div>
        ) : (
          <div className={`overflow-x-auto ${maxHeight ? maxHeight : ''}`}>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.order_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div>
                        <div className="font-medium">{order.user.name || 'N/A'}</div>
                        <div className="text-gray-500">{order.user.phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{order.total_amount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(order.status)}`}>
                        {formatStatus(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {order.assigned_to ? (
                        <div>
                          <div className="font-medium">{order.assigned_to.name || 'N/A'}</div>
                          <div className="text-gray-500">{order.assigned_to.phone}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        to={`/orders/${order.id}`}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderList;
