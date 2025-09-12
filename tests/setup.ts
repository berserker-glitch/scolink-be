import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || 'mysql://test:test@localhost:3306/scolink_test',
    },
  },
});

beforeAll(async () => {
  // Clean up test database
  await prisma.userSession.deleteMany();
  await prisma.user.deleteMany();
  await prisma.center.deleteMany();
});

afterAll(async () => {
  // Clean up after all tests
  await prisma.userSession.deleteMany();
  await prisma.user.deleteMany();
  await prisma.center.deleteMany();
  await prisma.$disconnect();
});

afterEach(async () => {
  // Clean up after each test
  await prisma.userSession.deleteMany();
  await prisma.user.deleteMany();
  await prisma.center.deleteMany();
});

export { prisma };
