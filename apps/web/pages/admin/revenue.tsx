import React from "react";
import { Sparkline } from "@/components/pricing/Sparkline";
import { Badge } from "@/components/pricing/Badge";

export default function RevenueAdminPage() {
  const mrr = 35620;
  const aiRev = 4820;
  const arpu = 78.4;
  const seats = 402;
  const attachRate = 0.27;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black">Revenue Command Center</h1>
          <Badge>Admin</Badge>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <Stat
            title="MRR"
            value={`$${mrr.toLocaleString()}`}
            data={[28, 29, 31, 30, 32, 35, 35.6]}
          />
          <Stat
            title="AI Usage Revenue"
            value={`$${aiRev.toLocaleString()}`}
            data={[2.8, 3.1, 3.3, 3.6, 4.0, 4.5, 4.82]}
          />
          <Stat title="ARPU" value={`$${arpu.toFixed(1)}`} data={[61, 64, 66, 70, 72, 76, 78.4]} />
          <Stat
            title="Seats"
            value={seats.toLocaleString()}
            data={[220, 244, 270, 310, 340, 380, 402]}
          />
          <Stat
            title="Attach Rate (Add-On)"
            value={`${Math.round(attachRate * 100)}%`}
            data={[8, 12, 15, 18, 21, 25, 27]}
          />
          <Stat title="Churn (monthly)" value="2.1%" data={[3.3, 3.1, 2.8, 2.6, 2.4, 2.2, 2.1]} />
        </div>

        <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-xl font-black">Notes</h2>
          <ul className="mt-4 space-y-2 text-sm text-white/80">
            <li>• Monitor AI margin: usage revenue must exceed inference costs.</li>
            <li>
              • Track Fleet tier conversion (Most Popular) and attach-rate for Intelligence Add-On.
            </li>
            <li>• Ensure dunning + retries are enabled to reduce churn from failed payments.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function Stat({ title, value, data }: { title: string; value: string; data: number[] }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-white/80">{title}</div>
        <div className="text-white/70">
          <Sparkline data={data} />
        </div>
      </div>
      <div className="mt-3 text-3xl font-black">{value}</div>
    </div>
  );
}
