import { PrismaClient } from '@prisma/client';

export { PrismaClient } from '@prisma/client';
export * from '@prisma/client';
export * from './audit-chain';

/**
 * Shared Prisma client factory. A single instance should be created per process and
 * injected where needed (the API app wraps this in a Nest provider with lifecycle hooks).
 */
export function createPrismaClient(databaseUrl?: string): PrismaClient {
  return new PrismaClient(
    databaseUrl ? { datasources: { db: { url: databaseUrl } } } : undefined,
  );
}
