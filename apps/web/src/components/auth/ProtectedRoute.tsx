import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppStore } from '@/store/app-store';

const ProtectedRoute: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated } = useAppStore();
  const hasToken = Boolean(localStorage.getItem('infamous_token'));

  if (!isAuthenticated && !hasToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
