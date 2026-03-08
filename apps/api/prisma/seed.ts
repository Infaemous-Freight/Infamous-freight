import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function seedAdmin(orgId: string) {
  await prisma.user.upsert({
    where: { email: "admin@infamousfreight.com" },
    update: {},
    create: {
      email: "admin@infamousfreight.com",
      name: "Demo Admin",
      role: UserRole.ORG_ADMIN,
      scopes: [
        "load.read",
        "load.create",
        "dispatch.recommend",
        "dispatch.assign",
        "anomaly.evaluate",
        "audit.read"
      ],
      organizationId: orgId
    }
  });
}

void seedAdmin("org_demo");
