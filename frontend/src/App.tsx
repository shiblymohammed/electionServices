import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import MainLayout from './layout/MainLayout';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import PackageDetailPage from './pages/PackageDetailPage';
import CampaignDetailPage from './pages/CampaignDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import ResourceUploadPage from './pages/ResourceUploadPage';
import ProfilePage from './pages/ProfilePage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Login page without layout */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Public routes with MainLayout - No login required */}
            <Route
              path="/"
              element={
                <MainLayout>
                  <HomePage />
                </MainLayout>
              }
            />
            <Route
              path="/package/:id"
              element={
                <MainLayout>
                  <PackageDetailPage />
                </MainLayout>
              }
            />
            <Route
              path="/campaign/:id"
              element={
                <MainLayout>
                  <CampaignDetailPage />
                </MainLayout>
              }
            />
            
            {/* Protected routes - Login required */}
            <Route
              path="/cart"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <CartPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <CheckoutPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment-success/:orderId"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <PaymentSuccessPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/upload-resources/:orderId"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <ResourceUploadPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <ProfilePage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            
            {/* Redirect old my-orders route to profile */}
            <Route path="/my-orders" element={<Navigate to="/profile" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
