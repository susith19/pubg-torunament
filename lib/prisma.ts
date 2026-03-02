// lib/prisma.ts (or wherever you export prisma)
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('❌ DATABASE_URL is not set in .env');
}

const pool = new Pool({ connectionString });

const adapter = new PrismaPg(pool); // or pass more options like { max: 10 }

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({
  adapter, // ← this is required in Prisma 7+
  log: ['info', 'warn', 'error'], // optional for debugging
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}