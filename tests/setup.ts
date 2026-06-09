import { PrismaClient } from '@prisma/client';

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'mysql://user:password@localhost:3306/scolink_test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-with-at-least-32-characters';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-with-at-least-32-characters';
process.env.SMTP_HOST = process.env.SMTP_HOST || 'localhost';
process.env.SMTP_USER = process.env.SMTP_USER || 'test@example.com';
process.env.SMTP_PASS = process.env.SMTP_PASS || 'test-password';
process.env.EMAIL_FROM = process.env.EMAIL_FROM || 'test@example.com';
process.env.PADDLE_WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET || 'paddle-test-secret';

const shouldUseDatabase = process.env.RUN_DB_TESTS === 'true';
const prisma = shouldUseDatabase
  ? new PrismaClient({
      datasources: {
        db: {
          url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
        },
      },
    })
  : null;

beforeAll(async () => {
  if (!prisma) {
    return;
  }

  // Clean up test database
  await prisma.userSession.deleteMany();
  await prisma.user.deleteMany();
  await prisma.center.deleteMany();
});

afterAll(async () => {
  if (!prisma) {
    return;
  }

  // Clean up after all tests
  await prisma.userSession.deleteMany();
  await prisma.user.deleteMany();
  await prisma.center.deleteMany();
  await prisma.$disconnect();
});

afterEach(async () => {
  if (!prisma) {
    return;
  }

  // Clean up after each test
  await prisma.userSession.deleteMany();
  await prisma.user.deleteMany();
  await prisma.center.deleteMany();
});

export { prisma };
