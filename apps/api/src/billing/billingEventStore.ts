import type { PrismaClient } from "@prisma/client";
import { getPrisma } from "../db/prisma.js";

const BILLING_EVENT_TABLE_MISSING_CODES = new Set(["P2021", "P2022"]);
let billingEventPersistenceDisabled = false;

function prismaOrThrow(): PrismaClient {
  const prisma = getPrisma();
  if (!prisma) {
    throw new Error("Database is not configured");
  }
  return prisma;
}

function isKnownPrismaCode(error: unknown): error is { code: string } {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      typeof (error as { code: unknown }).code === "string",
  );
}

function shouldDisableBillingEventPersistence(error: unknown): boolean {
  return isKnownPrismaCode(error) && BILLING_EVENT_TABLE_MISSING_CODES.has(error.code);
}

function serializePayload(payload: unknown): unknown {
  return payload ?? null;
}

export type BillingEventState<TResult extends object> =
  | { type: "disabled" }
  | { type: "new" }
  | { type: "completed"; result: TResult };

export async function beginBillingEvent<TResult extends object>(
  organizationId: string,
  eventType: string,
  idempotencyKey: string,
  payload?: unknown,
): Promise<BillingEventState<TResult>> {
  if (billingEventPersistenceDisabled) {
    return { type: "disabled" };
  }

  try {
    const created = await prismaOrThrow().billingEvent.create({
      data: {
        organizationId,
        eventType,
        idempotencyKey,
        payload: serializePayload(payload) as never,
      },
    });

    if (created.status === "COMPLETED" && created.result) {
      return { type: "completed", result: created.result as TResult };
    }

    return { type: "new" };
  } catch (error: unknown) {
    if (shouldDisableBillingEventPersistence(error)) {
      billingEventPersistenceDisabled = true;
      return { type: "disabled" };
    }

    if (isKnownPrismaCode(error) && error.code === "P2002") {
      const existing = await prismaOrThrow().billingEvent.findUnique({
        where: { idempotencyKey },
        select: {
          status: true,
          result: true,
        },
      });

      if (existing?.status === "COMPLETED" && existing.result) {
        return { type: "completed", result: existing.result as TResult };
      }

      return { type: "new" };
    }

    throw error;
  }
}

export async function completeBillingEvent(
  idempotencyKey: string,
  result: unknown,
): Promise<void> {
  if (billingEventPersistenceDisabled) {
    return;
  }

  try {
    await prismaOrThrow().billingEvent.update({
      where: { idempotencyKey },
      data: {
        status: "COMPLETED",
        result: serializePayload(result) as never,
        processedAt: new Date(),
        errorMessage: null,
      },
    });
  } catch (error: unknown) {
    if (shouldDisableBillingEventPersistence(error)) {
      billingEventPersistenceDisabled = true;
      return;
    }

    throw error;
  }
}

export async function failBillingEvent(idempotencyKey: string, errorMessage: string): Promise<void> {
  if (billingEventPersistenceDisabled) {
    return;
  }

  try {
    await prismaOrThrow().billingEvent.update({
      where: { idempotencyKey },
      data: {
        status: "FAILED",
        processedAt: new Date(),
        errorMessage,
      },
    });
  } catch (error: unknown) {
    if (shouldDisableBillingEventPersistence(error)) {
      billingEventPersistenceDisabled = true;
      return;
    }

    throw error;
  }
}
