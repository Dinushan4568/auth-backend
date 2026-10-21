import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

export const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

export async function initDb() {
  try {
    await prisma.$connect();
    const res = await prisma.$queryRaw<Array<{ current_database: string; current_user: string }>>`SELECT current_database(), current_user;`;
    console.log(`[Prisma ORM] Connected to PostgreSQL: ${res[0]?.current_database} as ${res[0]?.current_user}`);
    console.log('[Prisma ORM] Database models loaded and ready.');
  } catch (error) {
    console.error('[Prisma ORM] Connection failed:', error);
    throw error;
  }
}
