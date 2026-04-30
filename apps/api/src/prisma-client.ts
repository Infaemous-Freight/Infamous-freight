import { PrismaClient } from '@prisma/client';

type AccelerateExtension = Parameters<PrismaClient['$extends']>[0];

let client: PrismaClient | null = null;

function loadAccelerateExtension(): (() => AccelerateExtension) | null {
  try {
    const accelerateModule = require('@prisma/extension-accelerate') as {
      withAccelerate?: () => AccelerateExtension;
    };
    return typeof accelerateModule.withAccelerate === 'function'
      ? accelerateModule.withAccelerate
      : null;
  } catch {
    return null;
  }
}

export function createPrismaClient(): PrismaClient {
  if (client) return client;

  const databaseUrl = process.env.DATABASE_URL;

  if (typeof databaseUrl === 'string' && databaseUrl.trim().length === 0) {
    throw new Error('DATABASE_URL is set but empty.');
  }

  const useAccelerate = typeof databaseUrl === 'string' && databaseUrl.startsWith('prisma+postgres://');

  if (useAccelerate) {
    const withAccelerate = loadAccelerateExtension();

    if (!withAccelerate) {
      throw new Error(
        'DATABASE_URL is configured for Prisma Accelerate, but @prisma/extension-accelerate is not installed.',
      );
    }

    const accelerateBase = new PrismaClient({
      accelerateUrl: databaseUrl,
    } as ConstructorParameters<typeof PrismaClient>[0]);

    client = accelerateBase.$extends(withAccelerate()) as unknown as PrismaClient;
    return client;
  }

  client = new PrismaClient();
  return client;
}
