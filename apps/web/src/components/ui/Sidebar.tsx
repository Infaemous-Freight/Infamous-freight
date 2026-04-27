import { NavLink, useLocation } from 'react-router-dom';
import { useAppStore } from '@/store/app-store';
import { canAccessLaunchValidation } from '@/lib/launchValidationAccess';
import {
  LayoutDashboard, Truck, Radio, Users, FileText, MessageSquare,
  TrendingUp, ShieldCheck, Settings, ChevronLeft, ChevronRight,
  Zap, LogOut, ClipboardCheck, ClipboardList, DollarSign, type LucideIcon
} from 'lucide-react';

type NavItem = {
  path: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
};

const baseNavItems: NavItem[] = [
  { path: '/', label: 'Operations', icon: LayoutDashboard },
  { path: '/quotes', label: 'Quotes', icon: ClipboardList },
  { path: '/loads', label: 'Loads', icon: Truck },
  { path: '/dispatch', label: 'Dispatch Board', icon: Radio },
  { path: '/carriers', label: 'Carriers', icon: Users },
  { path: '/drivers', label: 'Drivers', icon: Users },
  { path: '/accounting', label: 'Accounting', icon: DollarSign },
  { path: '/invoices', label: 'Invoices', icon: FileText },
  { path: '/chat', label: 'Messages', icon: MessageSquare, badge: '3' },
  { path: '/analytics', label: 'Analytics', icon: TrendingUp },
  { path: '/compliance', label: 'Compliance', icon: ShieldCheck },
];

const launchValidationNavItem: NavItem = {
  path: '/launch-validation',
  label: 'Launch Validation',
  icon: ClipboardCheck,
};

const settingsNavItem: NavItem = { path: '/settings', label: 'Settings', icon: Settings };

const Sidebar: React.FC = () => {
  const { sidebarOpen, toggleSidebar, logout, user } = useAppStore();
  const location = useLocation();
  const navItems: NavItem[] = canAccessLaunchValidation(user?.role)
    ? [...baseNavItems, launchValidationNavItem, settingsNavItem]
    : [...baseNavItems, settingsNavItem];

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-infamous-card border-r border-infamous-border z-50 flex flex-col transition-all duration-300 ${
        sidebarOpen ? 'w-64' : 'w-16'
      }`}
    >
      {/* Logo */}
      <div className={`flex items-center h-16 border-b border-infamous-border px-4 ${!sidebarOpen && 'justify-center'}`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-infamous-orange to-infamous-orange-light flex items-center justify-center flex-shrink-0">
            <Zap size={18} className="text-white" />
          </div>
          {sidebarOpen && (
            <div>
              <h1 className="text-sm font-extrabold tracking-tight leading-none">INFAMOUS</h1>
              <p className="text-[10px] text-gray-500 leading-none">FREIGHT</p>
            </div>
          )}
        </div>
        <button
          onClick={toggleSidebar}
          className={`ml-auto text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-infamous-border ${!sidebarOpen && 'hidden'}`}
        >
          {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative ${
                isActive
                  ? 'bg-infamous-orange/10 text-infamous-orange border border-infamous-orange/20'
                  : 'text-gray-400 hover:text-white hover:bg-infamous-border'
              } ${!sidebarOpen && 'justify-center'}`}
            >
              <item.icon size={20} className={isActive ? 'text-infamous-orange' : 'text-gray-500 group-hover:text-white'} />
              {sidebarOpen && (
                <>
                  <span className="text-sm font-medium flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="bg-infamous-orange text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
              {!sidebarOpen && item.badge && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-infamous-orange rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className={`border-t border-infamous-border p-3 ${!sidebarOpen && 'flex justify-center'}`}>
        <button
          onClick={logout}
          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all ${!sidebarOpen && 'justify-center'}`}
          title="Log Out"
        >
          <LogOut size={18} />
          {sidebarOpen && <span className="text-sm font-medium">Log Out</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
