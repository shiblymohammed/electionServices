import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminDashboard from '../pages/AdminDashboard';
import StaffDashboard from '../pages/StaffDashboard';

const RoleDashboard = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Route to appropriate dashboard based on role
  if (user.role === 'admin') {
    return <AdminDashboard />;
  } else if (user.role === 'staff') {
    return <StaffDashboard />;
  }

  // Fallback for unexpected roles
  return <Navigate to="/login" replace />;
};

export default RoleDashboard;
