import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

declare global {
  var __prisma: PrismaClient | undefined;
}

// Hard coded DATABASE_URL for MySQL
//const databaseUrl = 'mysql://root:yasserMBA123%23@localhost:3306/scolink_db';
const databaseUrl = 'mysql://scolink:yasserMBA123%23@iwcc4cokws4s4scwgg044ow0:3306/scolink_db';

console.log('✅ Using DATABASE_URL:', databaseUrl.replace(/:[^:@]*@/, ':***@')); // Log with masked password

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
