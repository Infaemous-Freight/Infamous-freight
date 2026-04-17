"use client";

import React, { memo } from "react";
import {
  Line,
  LineChart,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

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

interface RevenueChartsProps {
  mrrHistory: MRRHistoryPoint[];
  tierDistribution: TierDistribution[];
  formatCurrency: (value: number) => string;
}

export const RevenueMonitorCharts = memo(function RevenueMonitorCharts({
  mrrHistory,
  tierDistribution,
  formatCurrency,
}: RevenueChartsProps) {
  const tooltipFormatter = (value: unknown): string => {
    if (value === undefined || value === null) return formatCurrency(0);
    const numericValue = Array.isArray(value) ? Number(value[0]) : Number(value);
    return formatCurrency(Number.isFinite(numericValue) ? numericValue : 0);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* MRR Growth Chart */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">MRR Growth (Last 12 Months)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={mrrHistory}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={tooltipFormatter} />
            <Legend />
            <Line
              type="monotone"
              dataKey="mrr"
              stroke="#4CAF50"
              strokeWidth={2}
              name="Total MRR"
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="newMRR"
              stroke="#2196F3"
              strokeWidth={2}
              name="New MRR"
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="churnedMRR"
              stroke="#f44336"
              strokeWidth={2}
              name="Churned MRR"
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Tier Distribution Chart */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Revenue by Tier</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={tierDistribution}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="tier" />
            <YAxis />
            <Tooltip formatter={tooltipFormatter} />
            <Legend />
            <Bar dataKey="revenue" fill="#4CAF50" name="Revenue" isAnimationActive={false} />
            <Bar dataKey="count" fill="#2196F3" name="Customers" isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

export default RevenueMonitorCharts;
