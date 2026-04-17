import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface MetricData {
  timestamp: string;
  value: number;
}

export default function ErrorRateLineChart({ data }: { data: MetricData[] }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="timestamp" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="value" stroke="#ff7c7c" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}
