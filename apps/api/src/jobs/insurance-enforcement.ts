import { PrismaClient } from "@prisma/client";
import { logger } from "../lib/logger.js";

const { evaluateOrgCompliance } = require("../modules/insurance/service");
const { createEventLog } = require("../modules/insurance/storage");

const prisma = new PrismaClient();

export async function runInsuranceEnforcementSweep() {
  const organizations = await prisma.organization.findMany({
    select: { id: true, name: true },
  });

  const results = [] as Array<{ orgId: string; name: string; evaluated: number }>;
  const ORG_BATCH_SIZE = 10;

  for (let i = 0; i < organizations.length; i += ORG_BATCH_SIZE) {
    const batch = organizations.slice(i, i + ORG_BATCH_SIZE);

    await Promise.all(
      batch.map(async (org) => {
        try {
          const evaluations = await evaluateOrgCompliance({ orgId: org.id });

          const logPromises = evaluations.map(async (evaluation: any) => {
            if (evaluation.result?.state === "SUSPENDED") {
              await createEventLog({
                orgId: org.id,
                carrierId: evaluation.carrierId,
                eventType: "SUSPEND",
                payloadJson: {
                  reasons: evaluation.result?.reasonsJson,
                },
              });
            }

            if (evaluation.result?.state === "NON_COMPLIANT") {
              await createEventLog({
                orgId: org.id,
                carrierId: evaluation.carrierId,
                eventType: "NON_COMPLIANT_SET",
                payloadJson: {
                  reasons: evaluation.result?.reasonsJson,
                },
              });
            }
          });

          await Promise.all(logPromises);

          results.push({
            orgId: org.id,
            name: org.name,
            evaluated: evaluations.length,
          });
        } catch (error) {
          logger.error(
            { orgId: org.id, orgName: org.name, err: error },
            "[InsuranceEnforcement] Failed for organization",
          );
        }
      }),
    );
  }

  return results;
}

if (require.main === module) {
  runInsuranceEnforcementSweep()
    .then((results) => {
      logger.info({ results }, "[InsuranceEnforcement] Completed sweep");
      process.exit(0);
    })
    .catch((error) => {
      logger.error({ err: error }, "[InsuranceEnforcement] Fatal error");
      process.exit(1);
    });
}
