import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserManagement from '../components/UserManagement';

const UserManagementPage = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link to="/" className="text-xl font-bold text-blue-600">
                Election Cart Admin
              </Link>
              <div className="hidden md:flex space-x-4">
                <Link
                  to="/"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  to="/orders"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Orders
                </Link>
                {user?.role === 'admin' && (
                  <>
                    <Link
                      to="/staff"
                      className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Staff
                    </Link>
                    <Link
                      to="/users"
                      className="text-blue-600 px-3 py-2 rounded-md text-sm font-medium border-b-2 border-blue-600"
                    >
                      Users
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {user?.phone || user?.name || 'Admin'}
              </span>
              <button
                onClick={logout}
                className="text-sm text-gray-700 hover:text-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <UserManagement />
      </main>
    </div>
  );
};

export default UserManagementPage;
