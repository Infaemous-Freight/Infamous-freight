import Link from "next/link";
import { UsageRing } from "@/components/ui/UsageRing";
import { BILLING } from "@/config/billing";
import { Store } from "@/lib/store";
import { formatNumber, percent } from "@/lib/math";

export default function UsageDashboard() {
  const user = Store.seedDemoUser();
  const sub = Store.getSub(user.id);

  if (!sub) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-2xl font-black">Usage</h1>
        <p className="mt-2 text-white/70">No subscription found. Please activate billing.</p>
      </div>
    );
  }

  const usage = Store.getUsage(user.id);
  const used = usage.actionsUsed || Math.round(sub.aiIncluded * 0.78);
  const pct = percent(used, sub.aiIncluded);
  const alert80 = pct >= 0.8;
  const overage = Math.max(0, used - sub.aiIncluded);
  const overageCost = overage * sub.aiOverage;
  const hardCap = sub.aiIncluded * sub.hardCapMultiplier;

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black">AI Usage</h1>
          <p className="mt-2 text-white/70">
            Track usage-based AI activity and automated overage controls.
          </p>
        </div>
        <Link
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold"
          href="/pricing"
        >
          Upgrade Plan
        </Link>
      </div>

      <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <UsageRing used={used} included={sub.aiIncluded} />
          <div className="space-y-2 text-sm text-white/70">
            <div>Plan: {BILLING.tiers.fleet.name}</div>
            <div>
              Overage rate: ${sub.aiOverage.toFixed(3)}/{BILLING.aiMetered.unitName}
            </div>
            <div>Hard cap: {formatNumber(hardCap)} actions</div>
            <div>Status: {sub.aiHardCapped ? "Hard capped" : alert80 ? "Alerted" : "Healthy"}</div>
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <SummaryCard
          label="Actions used"
          value={formatNumber(used)}
          hint="Current billing period"
        />
        <SummaryCard
          label="Overage actions"
          value={formatNumber(overage)}
          hint={`$${overageCost.toFixed(2)} estimated`}
        />
        <SummaryCard
          label="Remaining until hard cap"
          value={formatNumber(Math.max(0, hardCap - used))}
          hint="Auto-pauses beyond cap"
        />
      </div>

      <section className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-8">
        <h2 className="text-xl font-black">Alerts & controls</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3 text-sm text-white/70">
          <AlertCard
            title="80% Usage Alert"
            body={alert80 ? "Triggered. We notified your billing admins." : "Not yet triggered."}
          />
          <AlertCard
            title="Overage Billing"
            body={`Overage billed at $${sub.aiOverage.toFixed(3)} per action.`}
          />
          <AlertCard
            title="Hard Cap"
            body={`Automation pauses at ${formatNumber(hardCap)} actions.`}
          />
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
      <div className="text-xs text-white/60">{label}</div>
      <div className="mt-2 text-2xl font-black">{value}</div>
      <div className="mt-1 text-xs text-white/50">{hint}</div>
    </div>
  );
}

function AlertCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
      <div className="font-semibold">{title}</div>
      <div className="mt-2 text-xs text-white/60">{body}</div>
    </div>
  );
}
