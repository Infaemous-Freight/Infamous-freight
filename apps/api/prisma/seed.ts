import prisma from "../src/lib/prisma.js";

async function main() {
  const org = await (prisma as any).organization.create({
    data: { name: "Infæmous Freight Demo", slug: `demo-${Date.now()}` }
  });

  await (prisma as any).load.createMany({
    data: [
      { organizationId: org.id, originCity: "Dallas", originState: "TX", destCity: "Denver", destState: "CO", distanceMi: 780, weightLb: 22000, rateCents: 420000, status: "OPEN" },
      { organizationId: org.id, originCity: "Atlanta", originState: "GA", destCity: "Chicago", destState: "IL", distanceMi: 715, weightLb: 18000, rateCents: 310000, status: "OPEN" }
    ]
  });
}

if (require.main === module) {
  main().finally(async () => {
    await (prisma as any).$disconnect?.();
  });
}
