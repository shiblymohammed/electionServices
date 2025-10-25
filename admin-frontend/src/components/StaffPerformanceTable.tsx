import { useState } from 'react';
import { StaffPerformance } from '../types/analytics';

interface StaffPerformanceTableProps {
  staff: StaffPerformance[];
}

type SortField = 'staff_name' | 'assigned_orders' | 'completed_orders' | 'completion_rate';
type SortDirection = 'asc' | 'desc';

const StaffPerformanceTable = ({ staff }: StaffPerformanceTableProps) => {
  const [sortField, setSortField] = useState<SortField>('completion_rate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Get unique roles for filtering
  const roles = ['all', ...Array.from(new Set(staff.map((s) => s.role)))];

  // Filter staff by role
  const filteredStaff = roleFilter === 'all'
    ? staff
    : staff.filter((s) => s.role === roleFilter);

  // Sort staff
  const sortedStaff = [...filteredStaff].sort((a, b) => {
    let aValue: number | string = a[sortField];
    let bValue: number | string = b[sortField];

    if (sortField === 'staff_name') {
      aValue = (aValue as string).toLowerCase();
      bValue = (bValue as string).toLowerCase();
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Get completion rate color
  const getCompletionRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600 bg-green-50';
    if (rate >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    const colors: { [key: string]: string } = {
      admin: 'bg-purple-100 text-purple-800',
      staff: 'bg-blue-100 text-blue-800',
      manager: 'bg-green-100 text-green-800',
    };
    return colors[role.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  // Render sort icon
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  if (!staff || staff.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No staff performance data available
      </div>
    );
  }

  return (
    <div>
      {/* Role Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filter by Role
        </label>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {roles.map((role) => (
            <option key={role} value={role}>
              {role === 'all' ? 'All Roles' : role.charAt(0).toUpperCase() + role.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('staff_name')}
              >
                <div className="flex items-center gap-1">
                  Staff Member
                  {renderSortIcon('staff_name')}
                </div>
              </th>
              <th
                className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('assigned_orders')}
              >
                <div className="flex items-center justify-center gap-1">
                  Assigned
                  {renderSortIcon('assigned_orders')}
                </div>
              </th>
              <th
                className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('completed_orders')}
              >
                <div className="flex items-center justify-center gap-1">
                  Completed
                  {renderSortIcon('completed_orders')}
                </div>
              </th>
              <th
                className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('completion_rate')}
              >
                <div className="flex items-center justify-center gap-1">
                  Rate
                  {renderSortIcon('completion_rate')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedStaff.map((member) => (
              <tr key={member.staff_id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">{member.staff_name}</span>
                    <span className="text-xs text-gray-500">{member.phone_number}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 w-fit ${getRoleBadgeColor(member.role)}`}>
                      {member.role}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  <span className="text-sm font-semibold text-gray-900">{member.assigned_orders}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  <span className="text-sm font-semibold text-blue-600">{member.completed_orders}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getCompletionRateColor(member.completion_rate)}`}>
                      {member.completion_rate.toFixed(1)}%
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${
                        member.completion_rate >= 80
                          ? 'bg-green-600'
                          : member.completion_rate >= 60
                          ? 'bg-yellow-600'
                          : 'bg-red-600'
                      }`}
                      style={{ width: `${member.completion_rate}%` }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <p className="text-gray-600">Total Staff</p>
            <p className="text-lg font-semibold text-gray-900">{sortedStaff.length}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-600">Total Assigned</p>
            <p className="text-lg font-semibold text-gray-900">
              {sortedStaff.reduce((sum, s) => sum + s.assigned_orders, 0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-600">Total Completed</p>
            <p className="text-lg font-semibold text-blue-600">
              {sortedStaff.reduce((sum, s) => sum + s.completed_orders, 0)}
            </p>
          </div>
        </div>
        <div className="mt-3 text-center">
          <p className="text-gray-600 text-sm">Average Completion Rate</p>
          <p className="text-xl font-semibold text-green-600">
            {sortedStaff.length > 0
              ? (sortedStaff.reduce((sum, s) => sum + s.completion_rate, 0) / sortedStaff.length).toFixed(1)
              : 0}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default StaffPerformanceTable;
