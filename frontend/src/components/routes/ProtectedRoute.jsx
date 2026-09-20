import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PageLoader } from '../ui';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ message: user?.status === 'suspended' || user?.status === 'banned' ? 'Tài khoản của bạn đang bị hạn chế.' : undefined }} />;
  }

  return children || <Outlet />;
};

export const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading, user } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ message: user?.status === 'suspended' || user?.status === 'banned' ? 'Tài khoản của bạn đang bị hạn chế.' : undefined }} />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children || <Outlet />;
};

export const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader />;
  }

  const isRecoveryRoute = location.pathname === '/forgot-password';

  if (isAuthenticated && !isRecoveryRoute) {
    return <Navigate to="/dashboard" replace />;
  }

  return children || <Outlet />;
};
