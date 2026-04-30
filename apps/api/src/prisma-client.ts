import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

let client: PrismaClient | null = null;

export function createPrismaClient(): PrismaClient {
  if (client) return client;

  const databaseUrl = process.env.DATABASE_URL;

  if (typeof databaseUrl === 'string' && databaseUrl.trim().length === 0) {
    throw new Error('DATABASE_URL is set but empty.');
  }
  const useAccelerate = typeof databaseUrl === 'string' && databaseUrl.startsWith('prisma+postgres://');

  if (useAccelerate) {
    const accelerateBase = new PrismaClient({
      accelerateUrl: databaseUrl,
    } as ConstructorParameters<typeof PrismaClient>[0]);

    client = accelerateBase.$extends(withAccelerate()) as unknown as PrismaClient;
    return client;
  }

  client = new PrismaClient();
  return client;
}
