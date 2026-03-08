import { prisma } from "../../lib/prisma.js";

export class AuditService {
  async list(organizationId: string) {
    return prisma.auditLog.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 200
    });
  }
}
