import { Badge } from "@/components/ui/Badge";
import { Sparkline } from "@/components/ui/Sparkline";

const kpis = [
  { label: "MRR", value: "$248.4k", delta: "+9.4%", trend: [42, 48, 51, 57, 61, 64, 69] },
  { label: "ARR", value: "$2.98M", delta: "+11.2%", trend: [31, 36, 39, 41, 44, 50, 55] },
  { label: "Net Revenue", value: "$212.6k", delta: "+6.8%", trend: [25, 30, 35, 37, 36, 39, 44] },
  { label: "Expansion", value: "$38.1k", delta: "+4.1%", trend: [12, 14, 15, 16, 17, 19, 21] },
];

const lanes = [
  { name: "Operator", share: "24%", arr: "$720k", trend: [12, 14, 17, 18, 19, 21, 22] },
  { name: "Fleet", share: "58%", arr: "$1.72M", trend: [20, 22, 26, 29, 32, 35, 38] },
  { name: "Enterprise", share: "18%", arr: "$540k", trend: [6, 7, 8, 9, 10, 12, 13] },
];

export default function AdminRevenuePage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black">Revenue Ops</h1>
          <p className="mt-2 text-white/70">
            Executive KPI snapshots for subscriptions + metered AI.
          </p>
        </div>
        <Badge>Internal</Badge>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-white/60">{kpi.label}</div>
            <div className="mt-2 text-2xl font-black">{kpi.value}</div>
            <div className="mt-2 flex items-center justify-between text-xs text-white/60">
              <span>{kpi.delta}</span>
              <Sparkline data={kpi.trend} />
            </div>
          </div>
        ))}
      </div>

      <section className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black">Revenue mix</h2>
          <Badge>Last 30 days</Badge>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {lanes.map((lane) => (
            <div key={lane.name} className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{lane.name}</div>
                <span className="text-xs text-white/60">{lane.share} share</span>
              </div>
              <div className="mt-2 text-xl font-black">{lane.arr}</div>
              <div className="mt-3 flex items-center justify-between text-xs text-white/60">
                <span>ARR contribution</span>
                <Sparkline data={lane.trend} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
