import prisma from "../db";

export async function scoreRisk(userId: string, score: number, factors: unknown) {
  return prisma.riskScore.create({
    data: { userId, score, factors },
  });
}
