/**
 * ShipmentChart Component
 * Displays shipment analytics and metrics
 */

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ChartData {
  date: string;
  shipments: number;
  delivered: number;
  pending: number;
}

interface ShipmentChartProps {
  data?: ChartData[];
}

const ShipmentChart: React.FC<ShipmentChartProps> = ({ data = [] }) => {
  const defaultData = [
    { date: "2024-01-01", shipments: 240, delivered: 180, pending: 60 },
    { date: "2024-01-02", shipments: 280, delivered: 210, pending: 70 },
    { date: "2024-01-03", shipments: 320, delivered: 240, pending: 80 },
    { date: "2024-01-04", shipments: 290, delivered: 220, pending: 70 },
    { date: "2024-01-05", shipments: 350, delivered: 270, pending: 80 },
    { date: "2024-01-06", shipments: 310, delivered: 240, pending: 70 },
  ];

  const chartData = data.length > 0 ? data : defaultData;

  return (
    <div className="w-full h-full bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Shipment Analytics</h2>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="shipments"
            stroke="#8884d8"
            name="Total Shipments"
          />
          <Line
            type="monotone"
            dataKey="delivered"
            stroke="#82ca9d"
            name="Delivered"
          />
          <Line
            type="monotone"
            dataKey="pending"
            stroke="#ffc658"
            name="Pending"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ShipmentChart;
