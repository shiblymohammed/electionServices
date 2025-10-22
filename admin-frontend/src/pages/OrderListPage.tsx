import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getOrders, getStaffMembers } from '../services/adminService';
import { getAssignedOrders } from '../services/staffService';
import { AdminOrder, StaffMember } from '../types/order';
import OrderList from '../components/OrderList';

const OrderListPage = () => {
  const { user, logout } = useAuth();
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (user?.role === 'staff') {
        // Staff users see only their assigned orders
        const params: any = {};
        const status = searchParams.get('status');
        if (status) params.status = status;

        const ordersData = await getAssignedOrders(params);
        setOrders(ordersData);
        setStaffMembers([]); // Staff don't need to see other staff members
      } else {
        // Admin users see all orders
        const params: any = {};
        const status = searchParams.get('status');
        const staff = searchParams.get('staff');
        const search = searchParams.get('search');

        if (status) params.status = status;
        if (staff) params.assigned_to = staff;
        if (search) params.search = search;

        const [ordersData, staffData] = await Promise.all([
          getOrders(params),
          getStaffMembers(),
        ]);

        setOrders(ordersData);
        setStaffMembers(staffData);
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(
        err.response?.data?.error?.message || 
        err.response?.data?.detail || 
        err.message || 
        'Failed to load orders'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">
                {user?.role === 'staff' ? 'My Assigned Orders' : 'Orders'}
              </h1>
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

        <OrderList orders={orders} staffMembers={staffMembers} showFilters={true} />
      </main>
    </div>
  );
};

export default OrderListPage;
