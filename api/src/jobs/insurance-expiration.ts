import { PrismaClient } from "@prisma/client";

const { runExpirationSweep } = require("../modules/insurance/service");

const prisma = new PrismaClient();

export async function runInsuranceExpirationSweep() {
  const organizations = await prisma.organization.findMany({
    select: { id: true, name: true },
  });

  const results = [] as Array<{ orgId: string; name: string; summary: any }>;

  for (const org of organizations) {
    try {
      const summary = await runExpirationSweep({ orgId: org.id });
      results.push({ orgId: org.id, name: org.name, summary });
    } catch (error) {
      console.error(
        `[InsuranceExpiration] Failed for ${org.name}:`,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  return results;
}

if (require.main === module) {
  runInsuranceExpirationSweep()
    .then((results) => {
      console.log("[InsuranceExpiration] Completed sweep", results);
      process.exit(0);
    })
    .catch((error) => {
      console.error("[InsuranceExpiration] Fatal error", error);
      process.exit(1);
    });
}
