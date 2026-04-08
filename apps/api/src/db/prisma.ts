import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const prismaModule = require("./prisma.cjs") as {
  prisma: any;
  getPrisma: () => any;
  closePrisma: () => Promise<void>;
  createPrismaClient: () => any;
};

export const prisma = prismaModule.prisma;
export const getPrisma = prismaModule.getPrisma;
export const createPrismaClient = prismaModule.createPrismaClient;

export async function closePrisma(): Promise<void> {
  await prismaModule.closePrisma();
}

export default prismaModule;
