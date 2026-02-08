import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Truck, Menu, User, LogOut, LayoutDashboard, Package, MessageSquare, 
  Gavel, Calculator, Route, BarChart3, CreditCard, Shield
} from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 group"
            data-testid="navbar-logo"
          >
            <div className="p-2 bg-amber-500 rounded-sm group-hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-shadow">
              <Truck className="h-5 w-5 text-black" />
            </div>
            <div className="hidden sm:block">
              <span className="font-heading text-xl font-bold tracking-tight uppercase">
                IMFÆMOUS FREIGHT
              </span>
              <span className="ml-2 text-xs font-mono text-amber-500 border border-amber-800 px-2 py-0.5 rounded-sm">
                GET TRUCK'N
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <Link to="/loads" data-testid="nav-loads">
              <Button
                variant={isActive('/loads') ? 'default' : 'ghost'}
                className="gap-2"
              >
                <Package className="h-4 w-4" />
                Loads
              </Button>
            </Link>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2" data-testid="nav-tools">
                  <Calculator className="h-4 w-4" />
                  Tools
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-zinc-950 border-zinc-800">
                <DropdownMenuItem asChild>
                  <Link to="/calculator" className="cursor-pointer">
                    <Calculator className="h-4 w-4 mr-2" />
                    Rate Calculator
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/analytics" className="cursor-pointer">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics
                  </Link>
                </DropdownMenuItem>
                {user && (
                  <DropdownMenuItem asChild>
                    <Link to="/preferences" className="cursor-pointer">
                      <Route className="h-4 w-4 mr-2" />
                      Lane Preferences
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {user && (
              <>
                <Link to="/messages" data-testid="nav-messages">
                  <Button
                    variant={isActive('/messages') ? 'default' : 'ghost'}
                    className="gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Messages
                  </Button>
                </Link>
                <Link to="/dashboard" data-testid="nav-dashboard">
                  <Button
                    variant={isActive('/dashboard') ? 'default' : 'ghost'}
                    className="gap-2"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="gap-2"
                    data-testid="user-menu-trigger"
                  >
                    {user.is_verified && <Shield className="h-3 w-3 text-emerald-500" />}
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline font-mono text-sm">
                      {user.display_name || user.email}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-zinc-950 border-zinc-800">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user.display_name}</p>
                    <p className="text-xs text-zinc-500 font-mono">{user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-amber-500 uppercase tracking-wider">
                        {user.role}
                      </span>
                      {user.rating && (
                        <span className="text-xs text-zinc-500">⭐ {user.rating.toFixed(1)}</span>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-zinc-800" />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="cursor-pointer">
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/loads/my" className="cursor-pointer">
                      <Package className="h-4 w-4 mr-2" />
                      My Loads
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/bids/my" className="cursor-pointer">
                      <Gavel className="h-4 w-4 mr-2" />
                      My Bids
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/preferences" className="cursor-pointer">
                      <Route className="h-4 w-4 mr-2" />
                      Lane Preferences
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-zinc-800" />
                  <DropdownMenuItem asChild>
                    <Link to="/payments" className="cursor-pointer">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Premium Services
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-zinc-800" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-red-400 focus:text-red-300"
                    data-testid="logout-btn"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/sign-in" data-testid="nav-signin">
                <Button className="gap-2">
                  <User className="h-4 w-4" />
                  Sign in
                </Button>
              </Link>
            )}

            {/* Mobile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" data-testid="mobile-menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-zinc-950 border-zinc-800 md:hidden">
                <DropdownMenuItem asChild>
                  <Link to="/loads">Loads</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/calculator">Rate Calculator</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/analytics">Analytics</Link>
                </DropdownMenuItem>
                {user && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/messages">Messages</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard">Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/preferences">Lane Preferences</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/payments">Premium</Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};
