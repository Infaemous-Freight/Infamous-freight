import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { loadsApi, bidsApi, assignmentsApi } from '@/lib/api';
import { formatMoney, getStatusColor } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LoadCard } from '@/components/LoadCard';
import {
  User,
  Package,
  Gavel,
  Truck,
  Plus,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    myLoads: [],
    myBids: [],
    myAssignments: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [loadsRes, bidsRes, assignmentsRes] = await Promise.all([
          loadsApi.myLoads().catch(() => ({ data: [] })),
          bidsApi.myBids().catch(() => ({ data: [] })),
          assignmentsApi.myAssignments().catch(() => ({ data: [] })),
        ]);

        setStats({
          myLoads: loadsRes.data || [],
          myBids: bidsRes.data || [],
          myAssignments: assignmentsRes.data || [],
          loading: false,
          error: null,
        });
      } catch (err) {
        setStats((s) => ({ ...s, loading: false, error: 'Failed to load data' }));
      }
    };

    loadData();
  }, []);

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-bold uppercase tracking-tight mb-2">
            Sign In Required
          </h1>
          <p className="text-zinc-500 mb-4">Please sign in to view your dashboard.</p>
          <Link to="/sign-in">
            <Button data-testid="dashboard-signin">Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold uppercase tracking-tight mb-2">
            Dashboard
          </h1>
          <p className="text-zinc-500">Welcome back, {user.display_name || user.email}</p>
        </div>

        {/* User Info Card */}
        <div className="bg-[#121217] border border-zinc-800 rounded-sm p-6 mb-8" data-testid="user-info-card">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-500/10 rounded-sm">
              <User className="h-6 w-6 text-amber-500" />
            </div>
            <div className="flex-1">
              <h2 className="font-heading text-xl font-bold uppercase tracking-tight">
                {user.display_name || 'User'}
              </h2>
              <p className="text-zinc-500 font-mono text-sm">{user.email}</p>
              <div className="flex gap-2 mt-2">
                <span
                  className={`px-2 py-0.5 text-xs font-mono uppercase tracking-wider rounded-sm border ${getStatusColor(
                    'active'
                  )}`}
                >
                  {user.role}
                </span>
              </div>
            </div>
            <Link to="/profile">
              <Button variant="outline" size="sm" data-testid="edit-profile-btn">
                Edit Profile
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#121217] border border-zinc-800 rounded-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-500/10 rounded-sm">
                <Package className="h-5 w-5 text-amber-500" />
              </div>
              <span className="text-zinc-400 text-sm">My Loads</span>
            </div>
            <p className="font-heading text-3xl font-bold">{stats.myLoads.length}</p>
          </div>

          <div className="bg-[#121217] border border-zinc-800 rounded-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500/10 rounded-sm">
                <Gavel className="h-5 w-5 text-blue-500" />
              </div>
              <span className="text-zinc-400 text-sm">My Bids</span>
            </div>
            <p className="font-heading text-3xl font-bold">{stats.myBids.length}</p>
          </div>

          <div className="bg-[#121217] border border-zinc-800 rounded-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-500/10 rounded-sm">
                <Truck className="h-5 w-5 text-emerald-500" />
              </div>
              <span className="text-zinc-400 text-sm">Assignments</span>
            </div>
            <p className="font-heading text-3xl font-bold">{stats.myAssignments.length}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-[#121217] border border-zinc-800 rounded-sm p-6 mb-8">
          <h3 className="font-heading text-lg font-bold uppercase tracking-tight mb-4">
            Quick Actions
          </h3>
          <div className="flex flex-wrap gap-3">
            <Link to="/loads/new">
              <Button className="gap-2" data-testid="quick-post-load">
                <Plus className="h-4 w-4" />
                Post New Load
              </Button>
            </Link>
            <Link to="/loads">
              <Button variant="outline" className="gap-2" data-testid="quick-browse-loads">
                <Package className="h-4 w-4" />
                Browse Loads
              </Button>
            </Link>
            <Link to="/messages">
              <Button variant="outline" className="gap-2" data-testid="quick-messages">
                Messages
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Recent Loads */}
        {stats.myLoads.length > 0 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-heading text-lg font-bold uppercase tracking-tight">
                Your Recent Loads
              </h3>
              <Link to="/loads/my">
                <Button variant="ghost" size="sm" className="gap-1">
                  View All <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="space-y-4">
              {stats.myLoads.slice(0, 3).map((load) => (
                <LoadCard key={load.id} load={load} />
              ))}
            </div>
          </div>
        )}

        {/* Recent Bids */}
        {stats.myBids.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-heading text-lg font-bold uppercase tracking-tight">
                Your Recent Bids
              </h3>
              <Link to="/bids/my">
                <Button variant="ghost" size="sm" className="gap-1">
                  View All <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="bg-[#121217] border border-zinc-800 rounded-sm divide-y divide-zinc-800">
              {stats.myBids.slice(0, 5).map((bid) => (
                <div key={bid.id} className="p-4 flex justify-between items-center">
                  <div>
                    <Link
                      to={`/loads/${bid.load_id}`}
                      className="text-amber-500 hover:text-amber-400 font-mono text-sm"
                    >
                      Load: {bid.load_id.slice(0, 8)}...
                    </Link>
                    <p className="text-zinc-500 text-sm mt-1">
                      Bid: {formatMoney(bid.offer_rate_cents)}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-xs font-mono uppercase tracking-wider rounded-sm border ${getStatusColor(
                      bid.status
                    )}`}
                  >
                    {bid.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
