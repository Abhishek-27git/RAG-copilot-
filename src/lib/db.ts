import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../prisma/generated/prisma";
import { Pool } from "pg";

/**
 * Singleton PrismaClient instance using pg driver adapter.
 *
 * In Prisma 7, a driver adapter is mandatory when using engine type "client".
 * In development, the client is cached on `globalThis` to survive HMR reloads.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
};

const getPrismaClient = (): PrismaClient => {
  // Use a fallback URL if DATABASE_URL is not set to prevent crash during builds
  const connectionString =
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/dd_copilot";

  if (process.env.NODE_ENV === "production") {
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  }

  // Cache pool and prisma in development to avoid leaking connections on hot-reload
  if (!globalForPrisma.pgPool) {
    globalForPrisma.pgPool = new Pool({ connectionString });
  }

  if (!globalForPrisma.prisma) {
    const adapter = new PrismaPg(globalForPrisma.pgPool);
    globalForPrisma.prisma = new PrismaClient({
      adapter,
      log: ["error", "warn"],
    });
  }

  return globalForPrisma.prisma;
};

export const db = getPrismaClient();
export type { PrismaClient };
