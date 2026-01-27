const { PrismaClient, JobEventType } = require("@prisma/client");

const prisma = new PrismaClient();

async function logJobEvent(input) {
  return prisma.jobEvent.create({
    data: {
      jobId: input.jobId,
      type: input.type,
      actorUserId: input.actorUserId ?? null,
      message: input.message ?? null,
    },
  });
}

async function getJobTimeline(jobId) {
  return prisma.jobEvent.findMany({
    where: { jobId },
    orderBy: { createdAt: "asc" },
  });
}

async function getLatestJobEvent(jobId) {
  return prisma.jobEvent.findFirst({
    where: { jobId },
    orderBy: { createdAt: "desc" },
  });
}

module.exports = {
  logJobEvent,
  getJobTimeline,
  getLatestJobEvent,
  JobEventType,
};
