import { Link } from 'react-router-dom';
import { StaffMember } from '../types/order';

interface StaffListProps {
  staffMembers: StaffMember[];
  onRefresh?: () => void;
  showActions?: boolean;
}

const StaffList = ({ staffMembers, onRefresh, showActions = true }: StaffListProps) => {
  const getWorkloadColor = (count: number) => {
    if (count === 0) return 'text-gray-600';
    if (count <= 3) return 'text-green-600';
    if (count <= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getWorkloadLabel = (count: number) => {
    if (count === 0) return 'Available';
    if (count <= 3) return 'Light';
    if (count <= 6) return 'Moderate';
    return 'Heavy';
  };

  if (staffMembers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <p className="mt-4 text-gray-600">No staff members found</p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Refresh
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Staff</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{staffMembers.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Available</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {staffMembers.filter(s => s.assigned_orders_count === 0).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Active</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {staffMembers.filter(s => s.assigned_orders_count > 0).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Orders</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">
            {staffMembers.reduce((sum, s) => sum + s.assigned_orders_count, 0)}
          </p>
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staffMembers.map((staff) => (
          <div key={staff.id} className="bg-white rounded-lg shadow hover:shadow-lg transition">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {staff.name || 'N/A'}
                    </h3>
                    <p className="text-xs text-gray-500">ID: #{staff.id}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  staff.assigned_orders_count === 0 
                    ? 'bg-green-100 text-green-800'
                    : staff.assigned_orders_count <= 3
                    ? 'bg-blue-100 text-blue-800'
                    : staff.assigned_orders_count <= 6
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {getWorkloadLabel(staff.assigned_orders_count)}
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Contact Info */}
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Contact
                </p>
                <div className="flex items-center text-sm text-gray-900">
                  <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <a href={`tel:${staff.phone}`} className="hover:text-blue-600">
                    {staff.phone}
                  </a>
                </div>
              </div>

              {/* Workload */}
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Current Workload
                </p>
                <div className="flex items-baseline">
                  <span className={`text-3xl font-bold ${getWorkloadColor(staff.assigned_orders_count)}`}>
                    {staff.assigned_orders_count}
                  </span>
                  <span className="ml-2 text-sm text-gray-600">
                    {staff.assigned_orders_count === 1 ? 'order' : 'orders'}
                  </span>
                </div>
                
                {/* Workload Bar */}
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      staff.assigned_orders_count === 0
                        ? 'bg-gray-400 w-0'
                        : staff.assigned_orders_count <= 3
                        ? 'bg-green-500'
                        : staff.assigned_orders_count <= 6
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ 
                      width: `${Math.min((staff.assigned_orders_count / 10) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Actions */}
            {showActions && (
              <div className="px-6 pb-6">
                <Link
                  to={`/orders?staff=${staff.id}`}
                  className="block w-full text-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
                >
                  View Assigned Orders
                </Link>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StaffList;
