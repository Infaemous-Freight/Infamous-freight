import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck, Users, DollarSign, TrendingUp, Clock, Target,
  AlertTriangle, Zap, ArrowUpRight, ArrowDownRight, Activity,
  MapPin, Phone, Radio, ChevronRight, Sparkles, MessageSquare
} from 'lucide-react';
import { useAppStore } from '@/store/app-store';

interface DashboardMetric {
  label: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  color: string;
}

interface QuickAction {
  label: string;
  icon: React.ReactNode;
  path: string;
  description: string;
}

interface ActivityItem {
  id: string;
  type: 'load' | 'driver' | 'alert' | 'message';
  title: string;
  description: string;
  time: string;
  icon: React.ReactNode;
  iconBg: string;
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { addNotification } = useAppStore();
  const [metrics, setMetrics] = useState<DashboardMetric[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    setMetrics([
      { label: 'Active Loads', value: '12', change: 20, icon: <Truck size={20} />, color: 'text-blue-400' },
      { label: 'Available Drivers', value: '8', change: 0, icon: <Users size={20} />, color: 'text-green-400' },
      { label: 'Revenue (MTD)', value: '$28.4K', change: 18.5, icon: <DollarSign size={20} />, color: 'text-infamous-orange' },
      { label: 'Avg Rate/Mile', value: '$2.84', change: 4.8, icon: <TrendingUp size={20} />, color: 'text-purple-400' },
      { label: 'Dispatch Time', value: '4.2m', change: -38, icon: <Clock size={20} />, color: 'text-cyan-400' },
      { label: 'On-Time %', value: '94%', change: 5.6, icon: <Target size={20} />, color: 'text-emerald-400' },
    ]);

    setActivities([
      { id: '1', type: 'load', title: 'New Load Available', description: 'Chicago, IL → Dallas, TX · $3,200 · Dry Van', time: '2 min ago', icon: <Truck size={14} />, iconBg: 'bg-infamous-orange/20 text-infamous-orange' },
      { id: '2', type: 'driver', title: 'Driver HOS Alert', description: 'Marcus T. approaching 8-hr driving limit', time: '15 min ago', icon: <Clock size={14} />, iconBg: 'bg-yellow-500/20 text-yellow-400' },
      { id: '3', type: 'alert', title: 'Rate Spike Detected', description: 'ATL → CLT reefer rates up 12% this week', time: '32 min ago', icon: <TrendingUp size={14} />, iconBg: 'bg-green-500/20 text-green-400' },
      { id: '4', type: 'message', title: 'New Message', description: 'James R.: "Arrived at pickup, loading now"', time: '1 hr ago', icon: <MessageSquare size={14} />, iconBg: 'bg-blue-500/20 text-blue-400' },
      { id: '5', type: 'load', title: 'Load Delivered', description: 'Houston → Phoenix · POD uploaded · Invoice ready', time: '2 hrs ago', icon: <MapPin size={14} />, iconBg: 'bg-green-500/20 text-green-400' },
      { id: '6', type: 'alert', title: 'Insurance Expiring', description: 'Auto Liability expires in 14 days — renew now', time: '3 hrs ago', icon: <AlertTriangle size={14} />, iconBg: 'bg-red-500/20 text-red-400' },
    ]);
  }, []);

  const quickActions: QuickAction[] = [
    { label: 'Find Loads', icon: <Truck size={18} />, path: '/loads', description: 'Search all load boards' },
    { label: 'Auto-Dispatch', icon: <Sparkles size={18} />, path: '/dispatch', description: 'AI-powered matching' },
    { label: 'Voice Book', icon: <Phone size={18} />, path: '/dispatch', description: 'Hands-free booking' },
    { label: 'Live Board', icon: <Radio size={18} />, path: '/dispatch', description: 'Real-time dispatch' },
  ];

  const getChangeIcon = (change: number) => {
    if (change > 0) return <ArrowUpRight size={12} className="text-green-400" />;
    if (change < 0) return <ArrowDownRight size={12} className="text-red-400" />;
    return <span className="text-gray-500">—</span>;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-gray-500';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Welcome back — here's what's happening today</p>
        </div>
        <div className="flex items-center gap-2 bg-infamous-card border border-infamous-border rounded-xl px-3 py-2">
          <Activity size={14} className="text-green-400 animate-pulse" />
          <span className="text-xs text-gray-400">8 drivers online</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={() => navigate(action.path)}
            className="flex items-center gap-3 bg-infamous-card border border-infamous-border hover:border-infamous-orange/40 rounded-xl p-4 transition-all group text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-infamous-orange/10 text-infamous-orange flex items-center justify-center group-hover:bg-infamous-orange group-hover:text-white transition-all">
              {action.icon}
            </div>
            <div>
              <p className="text-sm font-semibold">{action.label}</p>
              <p className="text-xs text-gray-500">{action.description}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {metrics.map((metric, i) => (
          <div key={i} className="card">
            <div className="flex items-center justify-between mb-3">
              <span className={metric.color}>{metric.icon}</span>
              <div className="flex items-center gap-0.5">
                {getChangeIcon(metric.change)}
                <span className={`text-xs font-medium ${getChangeColor(metric.change)}`}>
                  {metric.change > 0 ? '+' : ''}{metric.change}%
                </span>
              </div>
            </div>
            <p className="text-2xl font-bold">{metric.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{metric.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Loads */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Active Loads</h2>
            <button onClick={() => navigate('/dispatch')} className="text-sm text-infamous-orange hover:underline flex items-center gap-1">
              View All <ChevronRight size={14} />
            </button>
          </div>
          <div className="space-y-3">
            {[
              { ref: 'LD-4821', route: 'Chicago, IL → Dallas, TX', driver: 'Marcus T.', status: 'in_transit', progress: 65, eta: '6:30 PM', rate: '$3,200' },
              { ref: 'LD-4822', route: 'Atlanta, GA → Charlotte, NC', driver: 'James R.', status: 'at_pickup', progress: 10, eta: '4:00 PM', rate: '$1,850' },
              { ref: 'LD-4823', route: 'Houston, TX → Phoenix, AZ', driver: 'David K.', status: 'in_transit', progress: 40, eta: '11:00 PM', rate: '$4,100' },
              { ref: 'LD-4824', route: 'Memphis, TN → Indianapolis, IN', driver: 'Unassigned', status: 'available', progress: 0, eta: '—', rate: '$2,400' },
            ].map((load) => (
              <div key={load.ref} className="flex items-center gap-4 p-3 rounded-xl bg-[#1a1a1a] border border-infamous-border hover:border-infamous-border-light transition-all">
                <div className={`w-2 h-12 rounded-full ${
                  load.status === 'in_transit' ? 'bg-blue-400' :
                  load.status === 'at_pickup' ? 'bg-yellow-400' :
                  load.status === 'available' ? 'bg-green-400' : 'bg-gray-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-gray-500">{load.ref}</span>
                    <span className={`badge text-[10px] ${
                      load.status === 'in_transit' ? 'badge-blue' :
                      load.status === 'at_pickup' ? 'badge-yellow' :
                      load.status === 'available' ? 'badge-green' : ''
                    }`}>
                      {load.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm font-medium mt-0.5 truncate">{load.route}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Users size={10} /> {load.driver}</span>
                    <span className="flex items-center gap-1"><Clock size={10} /> ETA {load.eta}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{load.rate}</p>
                  {load.progress > 0 && (
                    <div className="w-16 h-1 bg-infamous-border rounded-full mt-1 ml-auto overflow-hidden">
                      <div className="h-full bg-infamous-orange rounded-full" style={{ width: `${load.progress}%` }} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Activity</h2>
            <span className="text-xs text-gray-500">Today</span>
          </div>
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex gap-3 group cursor-pointer">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${activity.iconBg}`}>
                  {activity.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium group-hover:text-infamous-orange transition-colors">{activity.title}</p>
                  <p className="text-xs text-gray-500 truncate">{activity.description}</p>
                  <p className="text-[10px] text-gray-600 mt-0.5">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
