/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Job Audit Logger
 */

import { PrismaClient, JobEventType } from "@prisma/client";

const prisma = new PrismaClient();

export interface LogJobEventInput {
  jobId: string;
  type: JobEventType;
  actorUserId?: string | null;
  message?: string | null;
}

/**
 * Log a job event to the JobEvent timeline.
 * Provides full auditability of job state transitions and critical actions.
 */
export async function logJobEvent(input: LogJobEventInput) {
  return prisma.jobEvent.create({
    data: {
      jobId: input.jobId,
      type: input.type,
      actorUserId: input.actorUserId ?? null,
      message: input.message ?? null,
    },
  });
}

/**
 * Get full job timeline (all events for a job in chronological order).
 */
export async function getJobTimeline(jobId: string) {
  return prisma.jobEvent.findMany({
    where: { jobId },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Get the most recent event for a job (to check state).
 */
export async function getLatestJobEvent(jobId: string) {
  return prisma.jobEvent.findFirst({
    where: { jobId },
    orderBy: { createdAt: "desc" },
  });
}
