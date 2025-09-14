import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

declare global {
  var __prisma: PrismaClient | undefined;
}

// Get the DATABASE_URL or use a default
// Temporarily hardcoded due to environment loading issues
const databaseUrl = 'mysql://root:yasserMBA123%23@127.0.0.1:3306/scolink_db';
//const databaseUrl = 'mysql://scolink:yasserMBA123%23@iwcc4cokws4s4scwgg044ow0:3306/scolink_db';

// Prevent multiple instances of Prisma Client in development
export const prisma = globalThis.__prisma || new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

export default prisma;
