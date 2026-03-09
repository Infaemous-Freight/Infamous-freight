import { PrismaClient } from "@prisma/client";
import { EnforcementLevel } from "@infamous/shared";

export interface EnforcementAction {
  id: string;
  userId: string;
  level: EnforcementLevel;
  reason: string;
  createdAt: string;
}

const prisma = new PrismaClient();
const enforcementLevelValues = new Set(Object.values(EnforcementLevel));

function assertValidInputs(userId: string, level: EnforcementLevel): void {
  if (!userId || userId.trim().length === 0) {
    throw new Error("userId is required");
  }

  if (!enforcementLevelValues.has(level)) {
    throw new Error("Invalid enforcement level");
  }
}

export async function enforce(
  id: string,
  userId: string,
  level: EnforcementLevel,
  reason: string,
): Promise<EnforcementAction> {
  assertValidInputs(userId, level);

  try {
    return await prisma.enforcementAction.create({
      data: {
        id,
        userId,
        level,
        reason,
      },
    });
  } catch (error) {
    console.error("Failed to create enforcement action", {
      userId,
      level,
      error,
    });
    throw new Error("Unable to create enforcement action");
  }
}

export async function createEnforcementAction(
  id: string,
  userId: string,
  level: EnforcementLevel,
  reason: string,
): Promise<EnforcementAction> {
  return enforce(id, userId, level, reason);
}

export async function getEnforcementActionsForUser(userId: string): Promise<EnforcementAction[]> {
  if (!userId || userId.trim().length === 0) {
    return [];
  }

  try {
    return await prisma.enforcementAction.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch (error) {
    console.error("Failed to fetch enforcement actions", {
      userId,
      error,
    });
    throw new Error("Unable to fetch enforcement actions");
  }
}

export function triggerEnforcementWorkflow(
  userId: string,
  reason: string,
  level: EnforcementLevel = "restriction",
): EnforcementAction {
  const id = `enf_${Date.now()}_${actions.size + 1}`;
  return createEnforcementAction(id, userId, level, reason);
}
