// Real-Time Revenue Dashboard Component
// Displays MRR, ARR, churn, LTV, and customer metrics with live updates

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";

interface RevenueMetrics {
  mrr: number;
  arr: number;
  churn: number;
  ltv: number;
  customerCount: number;
  newCustomersToday: number;
  newCustomersThisWeek: number;
  newCustomersThisMonth: number;
  revenueToday: number;
  revenueThisWeek: number;
  revenueThisMonth: number;
  avgRevenuePerCustomer: number;
  cac: number;
  nrr: number;
}

interface MRRHistoryPoint {
  month: string;
  mrr: number;
  newMRR: number;
  churnedMRR: number;
}

interface TierDistribution {
  tier: string;
  count: number;
  revenue: number;
}

interface RevenueAlert {
  id: string;
  severity: "critical" | "warning" | "info" | "success";
  title: string;
  message: string;
  timestamp: string;
}

// Ship all recharts code in a single client-only chunk that loads after first paint.
const RevenueCharts = dynamic(
  () => import("./RevenueMonitorCharts").then((mod) => mod.RevenueMonitorCharts),
  {
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="h-[360px] bg-white rounded-lg shadow-md animate-pulse" />
        <div className="h-[360px] bg-white rounded-lg shadow-md animate-pulse" />
      </div>
    ),
  },
);

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
});

const formatCurrency = (value: number) => currencyFormatter.format(value);
const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

const POLL_INTERVAL_MS = 30_000;

export const RevenueMonitorDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<RevenueMetrics | null>(null);
  const [mrrHistory, setMrrHistory] = useState<MRRHistoryPoint[]>([]);
  const [tierDistribution, setTierDistribution] = useState<TierDistribution[]>([]);
  const [alerts, setAlerts] = useState<RevenueAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const abortRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  const fetchMetrics = useCallback(async () => {
    // Cancel any in-flight fetch to avoid race conditions on stale responses.
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/metrics/revenue/live", {
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Failed with status ${response.status}`);
      const data = await response.json();
      if (!isMountedRef.current || controller.signal.aborted) return;

      setMetrics(data.current);
      setMrrHistory(data.mrrHistory || []);
      setTierDistribution(data.tierDistribution || []);
      setAlerts(data.alerts || []);
      setLastUpdated(new Date());
      setLoading(false);
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      // eslint-disable-next-line no-console
      console.error("Failed to fetch metrics:", error);
      if (isMountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    void fetchMetrics();

    let intervalId: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (intervalId !== null) return;
      intervalId = setInterval(() => {
        void fetchMetrics();
      }, POLL_INTERVAL_MS);
    };

    const stopPolling = () => {
      if (intervalId === null) return;
      clearInterval(intervalId);
      intervalId = null;
    };

    const handleVisibilityChange = () => {
      if (typeof document === "undefined") return;
      if (document.visibilityState === "visible") {
        // Refresh immediately and resume polling when the tab regains focus.
        void fetchMetrics();
        startPolling();
      } else {
        stopPolling();
      }
    };

    startPolling();
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      isMountedRef.current = false;
      stopPolling();
      abortRef.current?.abort();
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
    };
  }, [fetchMetrics]);

  const formattedValues = useMemo(() => {
    if (!metrics) return null;
    return {
      mrr: formatCurrency(metrics.mrr),
      arr: formatCurrency(metrics.arr),
      churn: formatPercent(metrics.churn),
      ltv: formatCurrency(metrics.ltv),
      customerCount: metrics.customerCount.toLocaleString(),
      revenueToday: formatCurrency(metrics.revenueToday),
      revenueThisWeek: formatCurrency(metrics.revenueThisWeek),
      revenueThisMonth: formatCurrency(metrics.revenueThisMonth),
      avgRevenuePerCustomer: formatCurrency(metrics.avgRevenuePerCustomer),
      cac: formatCurrency(metrics.cac),
      nrr: formatPercent(metrics.nrr),
      newCustomersToday: metrics.newCustomersToday.toString(),
      newCustomersThisWeek: metrics.newCustomersThisWeek.toString(),
      newCustomersThisMonth: metrics.newCustomersThisMonth.toString(),
      avgDealSize: formatCurrency(
        metrics.revenueThisWeek / Math.max(metrics.newCustomersThisWeek, 1),
      ),
    };
  }, [metrics]);

  if (loading || !metrics || !formattedValues) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Revenue Dashboard</h1>
        <p className="text-gray-600">
          Last updated: {lastUpdated.toLocaleTimeString()}
          <button
            onClick={fetchMetrics}
            className="ml-4 text-blue-600 hover:text-blue-800"
            type="button"
          >
            Refresh
          </button>
        </p>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Revenue Alerts</h2>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <Alert key={alert.id} {...alert} />
            ))}
          </div>
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="MRR"
          value={formattedValues.mrr}
          subtitle="Monthly Recurring Revenue"
          trend="+12.3%"
          trendDirection="up"
          icon="💰"
        />
        <MetricCard
          title="ARR"
          value={formattedValues.arr}
          subtitle="Annual Recurring Revenue"
          trend="+15.7%"
          trendDirection="up"
          icon="📈"
        />
        <MetricCard
          title="Churn Rate"
          value={formattedValues.churn}
          subtitle="Monthly customer churn"
          trend="-1.2%"
          trendDirection="down"
          icon="📉"
          invertTrend
        />
        <MetricCard
          title="LTV"
          value={formattedValues.ltv}
          subtitle="Customer Lifetime Value"
          trend="+8.4%"
          trendDirection="up"
          icon="💎"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Customers"
          value={formattedValues.customerCount}
          subtitle="Active subscriptions"
          icon="👥"
        />
        <MetricCard
          title="Today's Revenue"
          value={formattedValues.revenueToday}
          subtitle="Revenue generated today"
          icon="💵"
        />
        <MetricCard
          title="ARPU"
          value={formattedValues.avgRevenuePerCustomer}
          subtitle="Average revenue per user"
          icon="📊"
        />
        <MetricCard
          title="CAC"
          value={formattedValues.cac}
          subtitle="Customer acquisition cost"
          icon="💸"
        />
      </div>

      {/* Charts Section (client-only lazy chunk) */}
      <RevenueCharts
        mrrHistory={mrrHistory}
        tierDistribution={tierDistribution}
        formatCurrency={formatCurrency}
      />

      {/* Growth Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Today's Performance</h3>
          <div className="space-y-3">
            <StatRow label="Revenue" value={formattedValues.revenueToday} />
            <StatRow label="New Customers" value={formattedValues.newCustomersToday} />
            <StatRow label="Net Revenue Retention" value={formattedValues.nrr} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">This Week</h3>
          <div className="space-y-3">
            <StatRow label="Revenue" value={formattedValues.revenueThisWeek} />
            <StatRow label="New Customers" value={formattedValues.newCustomersThisWeek} />
            <StatRow label="Avg Deal Size" value={formattedValues.avgDealSize} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">This Month</h3>
          <div className="space-y-3">
            <StatRow label="Revenue" value={formattedValues.revenueThisMonth} />
            <StatRow label="New Customers" value={formattedValues.newCustomersThisMonth} />
            <StatRow label="MRR Growth" value="+$12,450" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: string;
  trendDirection?: "up" | "down";
  icon?: string;
  invertTrend?: boolean;
}

const MetricCard = memo(function MetricCard({
  title,
  value,
  subtitle,
  trend,
  trendDirection,
  icon,
  invertTrend = false,
}: MetricCardProps) {
  const trendColor = invertTrend
    ? trendDirection === "down"
      ? "text-green-600"
      : "text-red-600"
    : trendDirection === "up"
      ? "text-green-600"
      : "text-red-600";

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-600">{title}</h4>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      {subtitle && <p className="text-xs text-gray-500 mb-2">{subtitle}</p>}
      {trend && (
        <div className={`text-sm font-medium ${trendColor}`}>
          {trendDirection === "up" ? "↑" : "↓"} {trend}
        </div>
      )}
    </div>
  );
});

// Stat Row Component
interface StatRowProps {
  label: string;
  value: string;
}

const StatRow = memo(function StatRow({ label, value }: StatRowProps) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-600">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
});

// Alert Component
const alertColors = {
  critical: "bg-red-50 border-red-200 text-red-800",
  warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
  success: "bg-green-50 border-green-200 text-green-800",
} as const;

const alertIcons = {
  critical: "🚨",
  warning: "⚠️",
  info: "ℹ️",
  success: "✅",
} as const;

const Alert = memo(function Alert({ severity, title, message }: RevenueAlert) {
  return (
    <div className={`border-l-4 p-4 rounded ${alertColors[severity]}`}>
      <div className="flex items-start">
        <span className="text-xl mr-3">{alertIcons[severity]}</span>
        <div>
          <h4 className="font-semibold mb-1">{title}</h4>
          <p className="text-sm">{message}</p>
        </div>
      </div>
    </div>
  );
});

export default RevenueMonitorDashboard;
