import { prisma } from "../lib/prisma.js";

export async function handleAnomalyScanJob(data: {
  organizationId: string;
  driverId: string;
}) {
  const driver = await prisma.driver.findFirst({
    where: {
      id: data.driverId,
      organizationId: data.organizationId
    }
  });

  if (!driver) return;

  console.log("running anomaly scan for driver", driver.id);
}
