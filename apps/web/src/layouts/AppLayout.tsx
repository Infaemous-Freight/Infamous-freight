import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/app-store';
import Sidebar from '@/components/ui/Sidebar';
import TopBar from '@/components/ui/TopBar';
import { Toaster } from 'react-hot-toast';

const AppLayout: React.FC = () => {
  const { sidebarOpen, isAuthenticated, isLoading, setUser, setLoading } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Auth check on mount
  useEffect(() => {
    const token = localStorage.getItem('infamous_token');
    if (!token && location.pathname !== '/login' && location.pathname !== '/register') {
      setLoading(false);
      navigate('/login');
      return;
    }

    // Validate token / fetch user
    if (token) {
      // Mock user for now — in production: api.me()
      setUser({
        id: 'user_1',
        email: 'dispatch@acmetrucking.com',
        name: 'Marcus',
        role: 'owner',
        carrierId: 'carrier_1',
      });
    }
    setLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-infamous-dark">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-infamous-orange border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading Infamous Freight...</p>
        </div>
      </div>
    );
  }

  // Public pages (login/register/onboarding) don't use the layout
  const publicPaths = ['/login', '/register', '/onboarding', '/track'];
  if (publicPaths.some((p) => location.pathname.startsWith(p))) {
    return (
      <>
        <Outlet />
        <Toaster position="top-right" toastOptions={{
          style: { background: '#1a1a1a', color: '#fff', border: '1px solid #333' },
        }} />
      </>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-infamous-dark overflow-hidden">
      <Sidebar />
      <div className={`flex flex-col flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1a1a1a',
            color: '#fff',
            border: '1px solid #333',
            fontSize: '13px',
          },
          success: { iconTheme: { primary: '#4caf50', secondary: '#1a1a1a' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#1a1a1a' } },
        }}
      />
    </div>
  );
};

export default AppLayout;
