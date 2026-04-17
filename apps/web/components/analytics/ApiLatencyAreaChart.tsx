import {
  AreaChart,
  Area,
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

export default function ApiLatencyAreaChart({ data }: { data: MetricData[] }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="timestamp" />
        <YAxis />
        <Tooltip />
        <Area type="monotone" dataKey="value" stroke="#8dd1e1" fill="#8dd1e1" opacity={0.5} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
