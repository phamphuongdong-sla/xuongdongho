import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export function createPrismaClient(d1Binding?: any): PrismaClient {
  // If Cloudflare D1 binding is provided or available on global/env
  const d1 = d1Binding || (globalThis as any).DB || (process.env as any).DB;
  if (d1) {
    const adapter = new PrismaD1(d1);
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
    });
  }

  // Standard SQLite client for local development, CI, and test suites
  return new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'warn', 'error']
        : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Configure SQLite PRAGMAs for write concurrency and reliability.
 * Must be executed once during server boot or initial seed.
 */
export async function configureSqlitePragmas(client: PrismaClient = prisma): Promise<void> {
  try {
    await client.$executeRawUnsafe(`PRAGMA journal_mode = WAL;`);
    await client.$executeRawUnsafe(`PRAGMA busy_timeout = 5000;`);
    await client.$executeRawUnsafe(`PRAGMA foreign_keys = ON;`);
    await client.$executeRawUnsafe(`PRAGMA synchronous = NORMAL;`);
  } catch (error) {
    // D1 managed database manages pragmas automatically
  }
}
