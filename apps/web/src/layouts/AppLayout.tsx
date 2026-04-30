import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/app-store';
import { getSupabase } from '@/hooks/useSupabase';
import Sidebar from '@/components/ui/Sidebar';
import TopBar from '@/components/ui/TopBar';
import { Toaster } from 'react-hot-toast';

const AppLayout: React.FC = () => {
  const { sidebarOpen, isLoading, setUser, setLoading } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Auth check on mount
  useEffect(() => {
    const publicPaths = ['/login', '/register', '/onboarding', '/track'];

    let supabase;
    try {
      supabase = getSupabase();
    } catch {
      setUser(null);
      setLoading(false);
      if (!publicPaths.some((p) => location.pathname.startsWith(p))) {
        navigate('/login');
      }
      return;
    }

    const syncSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        localStorage.removeItem('infamous_token');
        setUser(null);

        if (!publicPaths.some((p) => location.pathname.startsWith(p))) {
          navigate('/login');
        }

        setLoading(false);
        return;
      }

      localStorage.setItem('infamous_token', session.access_token);
      setUser({
        id: session.user.id,
        email: session.user.email ?? '',
        name: session.user.user_metadata?.full_name ?? session.user.email?.split('@')[0] ?? 'User',
        role: session.user.user_metadata?.role ?? 'owner',
        carrierId: session.user.user_metadata?.carrierId ?? 'carrier_default',
      });
      setLoading(false);
    };

    syncSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        localStorage.setItem('infamous_token', session.access_token);
        setUser({
          id: session.user.id,
          email: session.user.email ?? '',
          name: session.user.user_metadata?.full_name ?? session.user.email?.split('@')[0] ?? 'User',
          role: session.user.user_metadata?.role ?? 'owner',
          carrierId: session.user.user_metadata?.carrierId ?? 'carrier_default',
        });
      } else {
        localStorage.removeItem('infamous_token');
        setUser(null);
        if (!publicPaths.some((p) => location.pathname.startsWith(p))) {
          navigate('/login');
        }
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [location.pathname, navigate, setLoading, setUser]);

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
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-infamous-orange focus:px-3 focus:py-2 focus:text-white"
        >
          Skip to main content
        </a>
        <main id="main-content" tabIndex={-1}>
          <Outlet />
        </main>
        <Toaster position="top-right" toastOptions={{
          style: { background: '#1a1a1a', color: '#fff', border: '1px solid #333' },
        }} />
      </>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-infamous-dark overflow-hidden">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-infamous-orange focus:px-3 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>
      <Sidebar />
      <div className={`flex flex-col flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <TopBar />
        <main id="main-content" tabIndex={-1} className="flex-1 overflow-y-auto p-6">
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
