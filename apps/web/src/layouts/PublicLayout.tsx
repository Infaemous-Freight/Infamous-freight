import { Link, Outlet, useLocation } from 'react-router-dom';
import { ArrowRight, Truck } from 'lucide-react';

const navLinks = [
  { label: 'Quote', href: '/request-quote' },
  { label: 'Track', href: '/track-shipment' },
  { label: 'Drivers', href: '/drive' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Partners', href: '/partners' },
  { label: 'Customer Portal', href: '/customer-portal' },
  { label: 'Carrier Portal', href: '/carrier-portal' },
];

const PublicLayout: React.FC = () => {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-[#090909] text-white">
      <header className="sticky top-0 z-50 border-b border-infamous-border bg-[#090909]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
          <Link to="/" className="flex items-center gap-3" aria-label="Infamous Freight home">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-infamous-orange text-white">
              <Truck size={20} />
            </span>
            <span>
              <span className="block text-lg font-black leading-none">Infamous Freight</span>
              <span className="text-xs uppercase tracking-[0.18em] text-gray-500">AI Freight Command Center</span>
            </span>
          </Link>

          <nav className="flex flex-wrap items-center gap-2 text-sm text-gray-300" aria-label="Public site navigation">
            {navLinks.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`rounded-lg px-3 py-2 font-semibold transition ${
                    active
                      ? 'bg-infamous-orange/10 text-infamous-orange'
                      : 'hover:bg-infamous-card hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/freight-assistant"
              className="rounded-xl border border-infamous-border bg-infamous-card px-4 py-2 text-sm font-semibold text-white transition hover:border-infamous-orange/50"
            >
              Freight Assistant
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-infamous-orange px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
            >
              Login <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </header>

      <Outlet />

      <footer className="border-t border-infamous-border bg-[#090909] px-6 py-10 text-sm text-gray-400">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Infamous Freight. Built for verified freight operations.</p>
          <div className="flex flex-wrap gap-4">
            <Link to="/request-quote" className="hover:text-infamous-orange">Request quote</Link>
            <Link to="/track-shipment" className="hover:text-infamous-orange">Track shipment</Link>
            <Link to="/drive" className="hover:text-infamous-orange">Apply to drive</Link>
            <Link to="/login" className="hover:text-infamous-orange">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
