import { PrismaClient } from "@prisma/client";
import type { Request, Response } from "express";
import { DISPUTE_STATUS } from "@infamous/shared";

export type DisputeStatus = (typeof DISPUTE_STATUS)[keyof typeof DISPUTE_STATUS];

export interface DisputeRecord {
  id: string;
  userId: string;
  transactionId: string;
  processor: "stripe" | "paypal" | "other";
  status: DisputeStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDisputeInput {
  userId: string;
  transactionId: string;
  processor: "stripe" | "paypal" | "other";
}

export interface UpdateDisputeInput {
  status?: DisputeStatus;
}

const disputes = new Map<string, DisputeRecord>();

const prisma = new PrismaClient();
const ALLOWED_PROCESSORS = ["stripe", "paypal", "other"] as const;

type AllowedProcessor = (typeof ALLOWED_PROCESSORS)[number];

function sanitizeString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isValidId(value: string): boolean {
  return /^[A-Za-z0-9_-]{3,}$/.test(value);
}

function parseProcessor(value: unknown): AllowedProcessor | null {
  const sanitized = sanitizeString(value);
  if (!sanitized) {
    return null;
  }

  const normalized = sanitized.toLowerCase() as AllowedProcessor;
  return ALLOWED_PROCESSORS.includes(normalized) ? normalized : null;
}

export async function createDispute(req: Request, res: Response): Promise<void> {
  const userId = sanitizeString(req.body?.userId);
  const transactionId = sanitizeString(req.body?.transactionId);
  const processor = parseProcessor(req.body?.processor);

  const errors: string[] = [];

  if (!userId || !isValidId(userId)) {
    errors.push("userId must be a valid ID");
  }

  if (!transactionId || !isValidId(transactionId)) {
    errors.push("transactionId must be a valid ID");
  }

  if (!processor) {
    errors.push(`processor must be one of: ${ALLOWED_PROCESSORS.join(", ")}`);
  }

  if (errors.length > 0) {
    res.status(400).json({
      error: "Invalid dispute payload",
      details: errors,
    });
    return;
  }

  try {
    const dispute = await prisma.dispute.create({
      data: {
        userId,
        transactionId,
        processor,
        status: DISPUTE_STATUS.OPEN,
      },
    });

    res.status(201).json({ dispute });
  } catch (error) {
    res.status(500).json({
      error: "Failed to create dispute",
    });
  }
}

export function getDispute(id: string): DisputeRecord | undefined {
  return disputes.get(id);
}

export function updateDispute(id: string, input: UpdateDisputeInput): DisputeRecord | undefined {
  const existing = disputes.get(id);
  if (!existing) {
    return undefined;
  }

  const updated: DisputeRecord = {
    ...existing,
    status: input.status ?? existing.status,
    updatedAt: new Date().toISOString(),
  };

  disputes.set(id, updated);
  return updated;
}

export function deleteDispute(id: string): boolean {
  return disputes.delete(id);
}
