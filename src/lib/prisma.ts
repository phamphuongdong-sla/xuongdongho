import type { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';

const cloudflareContextSymbol = Symbol.for("__cloudflare-context__");

let cachedD1Client: PrismaClient | null = null;
let cachedLocalClient: PrismaClient | null = null;

export function getD1Database(): any {
  // 1. Direct check in OpenNext global context
  try {
    const globalCtx = (globalThis as any)[cloudflareContextSymbol];
    if (globalCtx?.env?.DB) {
      return globalCtx.env.DB;
    }
  } catch {
    // Ignore
  }

  // 2. Try OpenNext helper
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require('@opennextjs/cloudflare');
    const ctx = getCloudflareContext();
    if (ctx?.env?.DB) {
      return ctx.env.DB;
    }
  } catch {
    // Ignore
  }

  // 3. Fallback checks
  return (globalThis as any)?.DB || (process.env as any)?.DB;
}

export function getPrismaClient(): PrismaClient {
  const d1 = getD1Database();
  if (d1) {
    if (!cachedD1Client) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { PrismaClient: WasmPrismaClient } = require('@prisma/client/wasm');
      const adapter = new PrismaD1(d1);
      cachedD1Client = new WasmPrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
      });
    }
    return cachedD1Client!;
  }

  // Standard SQLite client for local dev, CI, and test suites
  if (!cachedLocalClient) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaClient: NodePrismaClient } = require('@prisma/client');
    cachedLocalClient = new NodePrismaClient({
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'warn', 'error']
          : ['error'],
    });
  }
  return cachedLocalClient!;
}

/**
 * Dynamic proxy ensuring every Prisma call uses the appropriate engine
 * (Cloudflare D1 adapter in production, local SQLite in development/test).
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client as any, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

/**
 * Configure SQLite PRAGMAs for write concurrency and reliability.
 * Only executed for direct local SQLite.
 */
export async function configureSqlitePragmas(client: PrismaClient = prisma): Promise<void> {
  if (getD1Database()) return;
  try {
    await client.$executeRawUnsafe(`PRAGMA journal_mode = WAL;`);
    await client.$executeRawUnsafe(`PRAGMA busy_timeout = 5000;`);
    await client.$executeRawUnsafe(`PRAGMA foreign_keys = ON;`);
    await client.$executeRawUnsafe(`PRAGMA synchronous = NORMAL;`);
  } catch (error) {
    // D1 managed database manages pragmas automatically
  }
}
