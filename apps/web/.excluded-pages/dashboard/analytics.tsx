/**
 * /pages/dashboard/analytics.tsx
 * Analytics Dashboard - Driver Performance & Revenue Trends
 */

import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/hooks/useAuth";
import { ApiResponse } from "@infamous-freight/shared";
import logger from "@/utils/logger";

interface DriverMetrics {
  earnings: {
    total: number;
    average: number;
    trend: string;
  };
  loads: {
    completed: number;
    pending: number;
    rejected: number;
    acceptanceRate: number;
  };
  performance: {
    rating: number;
    onTimePercentage: number;
    cancelRate: number;
  };
  loadBoardStats: {
    topSource: string;
    avgLoadValue: number;
    totalMiles: number;
  };
}

interface LeaderboardEntry {
  rank: number;
  displayName: string;
  earnings: number;
  loads: number;
  rating: number;
  onTimePercentage: number;
}

interface RevenueTrend {
  month: string;
  revenue: number;
  loads: number;
  avgLoadValue: number;
  trend: string;
}

export default function AnalyticsDashboard() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [metrics, setMetrics] = useState<DriverMetrics | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [trends, setTrends] = useState<RevenueTrend[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<"earnings" | "rating" | "loads">("earnings");
  const [_loadingData, setLoadingData] = useState(true);
  const [daysBack, setDaysBack] = useState(7);

  useEffect(() => {
    if (loading) return;

    if (!user || user.role !== "driver") {
      router.push("/auth/login");
      return;
    }

    fetchAnalytics();
  }, [user, loading, daysBack]);

  const fetchAnalytics = async () => {
    try {
      setLoadingData(true);

      // Fetch driver metrics
      const metricsRes = await fetch(`/api/analytics/driver/dashboard?days=${daysBack}`, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });

      if (!metricsRes.ok) throw new Error("Failed to fetch metrics");
      const metricsData: ApiResponse<DriverMetrics> = await metricsRes.json();

      if (metricsData.success && metricsData.data) {
        setMetrics(metricsData.data);
      }

      // Fetch trends
      const trendsRes = await fetch("/api/analytics/driver/trends?months=12", {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });

      if (!trendsRes.ok) throw new Error("Failed to fetch trends");
      const trendsData: ApiResponse<RevenueTrend[]> = await trendsRes.json();

      if (trendsData.success && trendsData.data) {
        setTrends(trendsData.data);
      }

      // Fetch leaderboard
      const leaderboardRes = await fetch(
        `/api/analytics/leaderboard?metric=${selectedMetric}&limit=10`,
      );

      if (!leaderboardRes.ok) throw new Error("Failed to fetch leaderboard");
      const leaderboardData: ApiResponse<LeaderboardEntry[]> = await leaderboardRes.json();

      if (leaderboardData.success && leaderboardData.data) {
        setLeaderboard(leaderboardData.data);
      }
    } catch (err) {
      logger.error("Failed to fetch analytics", { error: err });
    } finally {
      setLoadingData(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Failed to load analytics</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>

            {/* Time Period Selector */}
            <div className="flex gap-2">
              {[7, 14, 30, 90].map((days) => (
                <button
                  key={days}
                  onClick={() => setDaysBack(days)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    daysBack === days
                      ? "bg-orange-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {days}d
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Earnings */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  ${metrics.earnings.total.toLocaleString()}
                </p>
                <p className="text-sm text-green-600 mt-1">{metrics.earnings.trend}</p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </div>

          {/* Completed Loads */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Loads</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{metrics.loads.completed}</p>
                <p className="text-sm text-gray-600 mt-1">Pending: {metrics.loads.pending}</p>
              </div>
              <div className="text-4xl">📦</div>
            </div>
          </div>

          {/* Driver Rating */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Driver Rating</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {metrics.performance.rating} ⭐
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {metrics.performance.onTimePercentage}% on-time
                </p>
              </div>
              <div className="text-4xl">🎯</div>
            </div>
          </div>

          {/* Avg Load Value */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Load Value</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  ${metrics.loadBoardStats.avgLoadValue.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Top: {metrics.loadBoardStats.topSource}
                </p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>
        </div>

        {/* Charts & Tables Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Revenue Trends */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Revenue Trends</h2>

            <div className="space-y-4">
              {trends.slice(-6).map((month) => (
                <div key={month.month} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{month.month}</p>
                    <p className="text-sm text-gray-600">{month.loads} loads</p>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Bar chart */}
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min((month.revenue / 10000) * 100, 100)}%`,
                        }}
                      ></div>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-gray-900">${month.revenue.toLocaleString()}</p>
                      <p className="text-sm text-green-600">{month.trend}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Performance</h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Acceptance Rate</p>
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${metrics.loads.acceptanceRate}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-1">{metrics.loads.acceptanceRate}%</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">On-Time Delivery</p>
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${metrics.performance.onTimePercentage}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {metrics.performance.onTimePercentage}%
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Cancel Rate</p>
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${metrics.performance.cancelRate}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-1">{metrics.performance.cancelRate}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Leaderboard - Top Drivers</h2>

            <div className="flex gap-2">
              {(["earnings", "rating", "loads"] as const).map((metric) => (
                <button
                  key={metric}
                  onClick={() => setSelectedMetric(metric)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedMetric === metric
                      ? "bg-orange-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {metric.charAt(0).toUpperCase() + metric.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">Rank</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">
                    Driver
                  </th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-gray-900">
                    Earnings
                  </th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-gray-900">
                    Loads
                  </th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-gray-900">
                    Rating
                  </th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-gray-900">
                    On-Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry) => (
                  <tr key={entry.rank} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-bold text-gray-900">{entry.rank}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{entry.displayName}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">
                      ${entry.earnings.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">{entry.loads}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">
                      {entry.rating} ⭐
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">
                      {entry.onTimePercentage}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Server-side rendering with auth check
export async function getServerSideProps(context) {
  const { req } = context;
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return {
      redirect: {
        destination: "/auth/login",
        permanent: false,
      },
    };
  }

  return { props: {} };
}
