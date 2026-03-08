import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { id: "tenant_demo" },
    update: {},
    create: {
      id: "tenant_demo",
      name: "Infamous Freight Demo"
    }
  });

  const load = await prisma.load.create({
    data: {
      tenantId: tenant.id,
      originCity: "Oklahoma City",
      originState: "OK",
      destCity: "Dallas",
      destState: "TX",
      distanceMi: 205,
      weightLb: 10000,
      rateCents: 185000,
      status: "OPEN"
    }
  });

  const shipment = await prisma.shipment.create({
    data: {
      tenantId: tenant.id,
      ref: "SHIP-OKC-DAL-001",
      originCity: "Oklahoma City",
      originState: "OK",
      destCity: "Dallas",
      destState: "TX",
      weightLb: 10000,
      rateCents: 185000,
      status: "CREATED"
    }
  });

  console.log({ tenantId: tenant.id, loadId: load.id, shipmentId: shipment.id });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
