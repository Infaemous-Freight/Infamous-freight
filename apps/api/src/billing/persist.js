const { getPrisma } = require("../db/prisma");

/**
 * DB optional. If DB is not enabled, these become no-ops to keep system running.
 */
async function upsertSubscription(input) {
    const p = getPrisma();
    if (!p) return;

    await p.user.upsert({
        where: { id: input.userId },
        update: {},
        create: { id: input.userId },
    });

    const id = `sub_${input.userId}_stripe`;
    await p.subscription.upsert({
        where: { id },
        update: {
            customerId: input.customerId ?? undefined,
            subscriptionId: input.subscriptionId ?? undefined,
            priceId: input.priceId ?? undefined,
            status: input.status ?? undefined,
            currentPeriodEnd: input.currentPeriodEnd ?? undefined,
            cancelAtPeriodEnd: input.cancelAtPeriodEnd ?? undefined,
        },
        create: {
            id,
            userId: input.userId,
            provider: "stripe",
            customerId: input.customerId ?? undefined,
            subscriptionId: input.subscriptionId ?? undefined,
            priceId: input.priceId ?? undefined,
            status: input.status ?? undefined,
            currentPeriodEnd: input.currentPeriodEnd ?? undefined,
            cancelAtPeriodEnd: input.cancelAtPeriodEnd ?? false,
        },
    });
}

async function setEntitlement(userId, key, value) {
    const p = getPrisma();
    if (!p) return;

    await p.user.upsert({
        where: { id: userId },
        update: {},
        create: { id: userId },
    });

    await p.entitlement.upsert({
        where: { userId_key: { userId, key } },
        update: { value },
        create: {
            id: `ent_${userId}_${key}_${Date.now()}`,
            userId,
            key,
            value,
        },
    });
}

async function getEntitlements(userId) {
    const p = getPrisma();
    if (!p) return { plan: "free", features: "basic" };

    const rows = await p.entitlement.findMany({ where: { userId } });
    const out = {};
    for (const r of rows) out[r.key] = r.value;
    if (!out.plan) out.plan = "free";
    if (!out.features) out.features = "basic";
    return out;
}

module.exports = { upsertSubscription, setEntitlement, getEntitlements };
