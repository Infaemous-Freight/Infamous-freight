import { BILLING } from "@/config/billing";

export type UserRow = {
  id: string;
  email: string;
  name?: string;
  stripeCustomerId?: string;
  billingAccess?: boolean;
  tierKey?: string;
};

export type SubRow = {
  userId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  status: string;
  seats: number;
  basePriceId: string;
  aiMeteredPriceId: string;
  stripeMeteredItemId?: string;
  hasIntelligence: boolean;
  aiIncluded: number;
  aiOverage: number;
  hardCapMultiplier: number;
  aiHardCapped: boolean;
};

export type UsageAggRow = {
  userId: string;
  monthKey: string;
  actionsUsed: number;
};

const users = new Map<string, UserRow>();
const subs = new Map<string, SubRow>();
const usageAgg = new Map<string, UsageAggRow>();

export function monthKey(d = new Date()) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export const Store = {
  getUser(id: string) {
    return users.get(id);
  },
  upsertUser(row: UserRow) {
    const existing = users.get(row.id);
    users.set(row.id, { ...existing, ...row });
    return users.get(row.id)!;
  },

  getSub(userId: string) {
    return subs.get(userId);
  },
  upsertSub(row: SubRow) {
    subs.set(row.userId, row);
    return row;
  },
  updateSub(userId: string, patch: Partial<SubRow>) {
    const existing = subs.get(userId);
    if (!existing) return undefined;
    const next = { ...existing, ...patch };
    subs.set(userId, next);
    return next;
  },

  getUsage(userId: string, mKey = monthKey()) {
    return usageAgg.get(`${userId}:${mKey}`) ?? { userId, monthKey: mKey, actionsUsed: 0 };
  },
  incrementUsage(userId: string, qty: number, mKey = monthKey()) {
    const key = `${userId}:${mKey}`;
    const current = usageAgg.get(key) ?? { userId, monthKey: mKey, actionsUsed: 0 };
    const next = { ...current, actionsUsed: current.actionsUsed + qty };
    usageAgg.set(key, next);
    return next;
  },

  computeHardCapReached(sub: SubRow, used: number) {
    return sub.aiIncluded > 0 && used >= sub.aiIncluded * sub.hardCapMultiplier;
  },

  seedDemoUser() {
    const u = this.upsertUser({
      id: "demo_user",
      email: "demo@infaemousfreight.ai",
      name: "Demo User",
      billingAccess: true,
      tierKey: "fleet",
    });

    const t = BILLING.tiers.fleet;
    this.upsertSub({
      userId: u.id,
      stripeSubscriptionId: "sub_demo",
      stripeCustomerId: "cus_demo",
      status: "active",
      seats: 1,
      basePriceId: process.env.FLEET_PRICE_ID ?? "price_demo_fleet",
      aiMeteredPriceId: process.env.AI_METERED_PRICE_ID ?? "price_demo_ai",
      stripeMeteredItemId: "si_demo_metered",
      hasIntelligence: true,
      aiIncluded: t.aiIncluded,
      aiOverage: t.aiOverage,
      hardCapMultiplier: t.aiHardCapMultiplier,
      aiHardCapped: false,
    });

    return u;
  },
};
