describe('createPrismaClient', () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;
  const mockAccelerateModule = (withAccelerate: unknown) => {
    jest.doMock('@prisma/extension-accelerate', () => ({ withAccelerate }), { virtual: true });
  };

  afterEach(() => {
    process.env.DATABASE_URL = originalDatabaseUrl;
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('throws when accelerate URL is configured but extension is unavailable', () => {
    process.env.DATABASE_URL = 'prisma+postgres://example';

    jest.doMock('@prisma/client', () => {
      class PrismaClient {
        $extends = jest.fn();
      }
      return { PrismaClient };
    });

    mockAccelerateModule(undefined);

    const { createPrismaClient } = require('../src/prisma-client') as typeof import('../src/prisma-client');

    expect(() => createPrismaClient()).toThrow(
      'DATABASE_URL is configured for Prisma Accelerate, but @prisma/extension-accelerate is not installed.',
    );
  });

  test('uses accelerate extension when accelerate URL is configured and extension exists', () => {
    process.env.DATABASE_URL = 'prisma+postgres://example';

    const extendedClient = { marker: 'accelerated-client' };
    const extendsSpy = jest.fn(() => extendedClient);

    jest.doMock('@prisma/client', () => {
      class PrismaClient {
        $extends = extendsSpy;
      }
      return { PrismaClient };
    });

    const withAccelerate = jest.fn(() => ({ name: 'accelerate-extension' }));
    mockAccelerateModule(withAccelerate);

    const { createPrismaClient } = require('../src/prisma-client') as typeof import('../src/prisma-client');

    expect(createPrismaClient()).toBe(extendedClient);
    expect(withAccelerate).toHaveBeenCalledTimes(1);
    expect(extendsSpy).toHaveBeenCalledTimes(1);
  });

  test('creates default prisma client when accelerate is not configured', () => {
    process.env.DATABASE_URL = 'postgres://example';

    const prismaInstance = { marker: 'default-prisma-client' };

    jest.doMock('@prisma/client', () => ({
      PrismaClient: jest.fn(() => prismaInstance),
    }));

    const { createPrismaClient } = require('../src/prisma-client') as typeof import('../src/prisma-client');

    expect(createPrismaClient()).toBe(prismaInstance);
    expect(createPrismaClient()).toBe(prismaInstance);
  });
});
