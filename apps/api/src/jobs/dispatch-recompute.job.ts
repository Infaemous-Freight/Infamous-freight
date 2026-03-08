import { prisma } from "../lib/prisma.js";

export async function handleDispatchRecomputeJob(data: {
  organizationId: string;
  loadId: string;
}) {
  const load = await prisma.load.findFirst({
    where: {
      id: data.loadId,
      organizationId: data.organizationId
    }
  });

  if (!load) return;

  console.log("recomputing dispatch state for load", load.id);
}
