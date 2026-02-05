import React from "react";
import { BILLING } from "@/config/billing";
import { UsageRing } from "@/components/pricing/UsageRing";
import { PricingButton } from "@/components/pricing/PricingButton";
import { Badge } from "@/components/pricing/Badge";

export default function UsagePage() {
  const tier = BILLING.tiers.fleet;
  const used = 412;
  const included = tier.aiIncluded;

  const pct = included ? used / included : 0;
  const overage = Math.max(0, used - included);
  const estimatedOverageCost = overage * tier.aiOverage;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black">AI Usage</h1>
          <Badge>{tier.name}</Badge>
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-8">
          <UsageRing used={used} included={included} />

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Kpi label="Included" value={`${included}`} />
            <Kpi label="Used" value={`${used}`} />
            <Kpi label="Overage" value={`${overage}`} />
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="text-xs text-white/60">Estimated overage</div>
            <div className="mt-1 text-lg font-black">
              ${estimatedOverageCost.toFixed(2)}
              <span className="ml-2 text-xs text-white/60">
                (${tier.aiOverage.toFixed(3)}/action)
              </span>
            </div>
          </div>

          {pct >= 0.8 && pct < 1 ? (
            <div className="mt-6 rounded-2xl border border-white/15 bg-white/5 p-4 text-sm">
              <span className="font-semibold">Heads up:</span> you’re above 80% usage. Consider
              upgrading before overages.
            </div>
          ) : null}

          {pct >= 2 ? (
            <div className="mt-6 rounded-2xl border border-white/15 bg-white/5 p-4 text-sm">
              <span className="font-semibold">Hard cap reached:</span> AI automation may pause until
              you upgrade or approve higher limits.
            </div>
          ) : null}

          <div className="mt-8 grid gap-3 md:grid-cols-2">
            <PricingButton href={BILLING.tiers.enterprise.stripeMinimumSpendLink}>
              Upgrade Plan
            </PricingButton>
            <PricingButton href="/dashboard/billing" variant="secondary">
              Manage Billing
            </PricingButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="text-xs text-white/60">{label}</div>
      <div className="mt-1 text-xl font-black">{value}</div>
    </div>
  );
}
