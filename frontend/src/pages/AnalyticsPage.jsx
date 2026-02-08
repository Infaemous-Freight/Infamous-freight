import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { analyticsApi } from '@/lib/api';
import { formatMoney } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  TrendingUp,
  Package,
  DollarSign,
  MapPin,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, marketRes] = await Promise.all([
          user ? analyticsApi.getDashboard() : Promise.resolve({ data: null }),
          analyticsApi.getMarket(),
        ]);
        setData(dashRes.data);
        setMarketData(marketRes.data);
      } catch (err) {
        console.error('Analytics error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold uppercase tracking-tight">
            Analytics Dashboard
          </h1>
          <p className="text-zinc-500 mt-1">Market insights and performance metrics</p>
        </div>

        {/* Market Overview */}
        <div className="mb-8">
          <h2 className="font-heading text-xl font-bold uppercase tracking-tight mb-4">
            Market Overview
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-[#121217] border border-zinc-800 rounded-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-500/10 rounded-sm">
                  <Package className="h-5 w-5 text-amber-500" />
                </div>
                <span className="text-zinc-400 text-sm">Available Loads</span>
              </div>
              <p className="font-heading text-3xl font-bold">
                {marketData?.total_available || 0}
              </p>
            </div>

            <div className="bg-[#121217] border border-zinc-800 rounded-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-500/10 rounded-sm">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                </div>
                <span className="text-zinc-400 text-sm">Hot Lanes</span>
              </div>
              <div className="space-y-2">
                {(marketData?.hot_lanes || []).slice(0, 3).map((lane, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="font-mono text-zinc-300">{lane.lane}</span>
                    <span className="text-amber-500">{lane.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#121217] border border-zinc-800 rounded-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-500/10 rounded-sm">
                  <DollarSign className="h-5 w-5 text-blue-500" />
                </div>
                <span className="text-zinc-400 text-sm">Avg Rate by Equipment</span>
              </div>
              <div className="space-y-2">
                {Object.entries(marketData?.avg_rate_by_equipment || {}).slice(0, 4).map(([eq, rate]) => (
                  <div key={eq} className="flex justify-between text-sm">
                    <span className="uppercase text-zinc-300">{eq}</span>
                    <span className="font-mono text-amber-500">{formatMoney(rate)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* User Stats */}
        {user && data && (
          <div className="mb-8">
            <h2 className="font-heading text-xl font-bold uppercase tracking-tight mb-4">
              Your Performance
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-[#121217] border border-zinc-800 rounded-sm p-6">
                <p className="text-zinc-500 text-sm mb-1">Total Loads</p>
                <p className="font-heading text-3xl font-bold">{data.total_loads}</p>
              </div>
              <div className="bg-[#121217] border border-zinc-800 rounded-sm p-6">
                <p className="text-zinc-500 text-sm mb-1">Total Revenue</p>
                <p className="font-heading text-3xl font-bold text-amber-500">
                  {formatMoney(data.total_revenue_cents)}
                </p>
              </div>
              <div className="bg-[#121217] border border-zinc-800 rounded-sm p-6">
                <p className="text-zinc-500 text-sm mb-1">Avg Rate</p>
                <p className="font-heading text-3xl font-bold">
                  {formatMoney(data.avg_rate_cents)}
                </p>
              </div>
              <div className="bg-[#121217] border border-zinc-800 rounded-sm p-6">
                <p className="text-zinc-500 text-sm mb-1">Top Lane</p>
                <p className="font-mono text-lg">
                  {data.top_lanes?.[0]?.lane || '—'}
                </p>
              </div>
            </div>

            {/* Status Breakdown */}
            <div className="mt-6 bg-[#121217] border border-zinc-800 rounded-sm p-6">
              <h3 className="font-heading text-lg font-bold uppercase tracking-tight mb-4">
                Loads by Status
              </h3>
              <div className="flex flex-wrap gap-4">
                {Object.entries(data.loads_by_status || {}).map(([status, count]) => (
                  <div key={status} className="flex items-center gap-2">
                    <span className="uppercase text-sm text-zinc-400">{status.replace('_', ' ')}:</span>
                    <span className="font-mono font-bold">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Trends */}
            {data.monthly_trends?.length > 0 && (
              <div className="mt-6 bg-[#121217] border border-zinc-800 rounded-sm p-6">
                <h3 className="font-heading text-lg font-bold uppercase tracking-tight mb-4">
                  Monthly Trends
                </h3>
                <div className="space-y-3">
                  {data.monthly_trends.map((m) => (
                    <div key={m.month} className="flex items-center justify-between">
                      <span className="font-mono text-zinc-400">{m.month}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm">{m.count} loads</span>
                        <span className="font-mono text-amber-500">{formatMoney(m.revenue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!user && (
          <div className="bg-[#121217] border border-zinc-800 rounded-sm p-8 text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h2 className="font-heading text-xl font-bold uppercase mb-2">Sign In for More</h2>
            <p className="text-zinc-500 mb-4">Get personalized analytics and performance metrics</p>
            <Link to="/sign-in">
              <Button data-testid="analytics-signin">Sign In</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
