import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getStaffMembers } from '../services/adminService';
import { StaffMember } from '../types/order';
import { StaffList } from '../components';

const StaffListPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is admin
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }

    fetchStaffMembers();
  }, [user, navigate]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading staff members...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
              <p className="text-sm text-gray-600 mt-1">
                {staffMembers.length} staff {staffMembers.length === 1 ? 'member' : 'members'}
              </p>
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <StaffList 
          staffMembers={staffMembers} 
          onRefresh={fetchStaffMembers}
          showActions={true}
        />
      </main>
    </div>
  );
};

export default StaffListPage;
