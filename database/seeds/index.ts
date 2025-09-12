import { PrismaClient, UserRole } from '@prisma/client';
import { hashPassword } from '../../src/utils/password';
import env from '../../src/config/env';
import { logger } from '../../src/utils/logger';

const prisma = new PrismaClient();

async function main() {
  logger.info('Starting database seeding...');

  try {
    // Check if super admin already exists
    const existingSuperAdmin = await prisma.user.findUnique({
      where: { email: env.SUPER_ADMIN_EMAIL },
    });

    if (existingSuperAdmin) {
      logger.info('Super admin already exists, skipping creation');
      return;
    }

    // Create super admin user
    const superAdminPassword = await hashPassword(env.SUPER_ADMIN_PASSWORD);
    
    const superAdmin = await prisma.user.create({
      data: {
        email: env.SUPER_ADMIN_EMAIL,
        passwordHash: superAdminPassword,
        fullName: 'Super Administrator',
        role: UserRole.super_admin,
        isActive: true,
      },
    });

    logger.info('Super admin created successfully', {
      id: superAdmin.id,
      email: superAdmin.email,
    });

    // Create sample center for testing
    const sampleCenter = await prisma.center.create({
      data: {
        name: 'Sample Educational Center',
        location: '123 Education Street, Learning City, LC 12345',
        phoneNumber: '+1-555-0123',
        email: 'info@samplecenter.edu',
        createdBy: superAdmin.id,
      },
    });

    logger.info('Sample center created successfully', {
      id: sampleCenter.id,
      name: sampleCenter.name,
    });

    // Create sample center admin
    const centerAdminPassword = await hashPassword('Admin123!');
    
    const centerAdmin = await prisma.user.create({
      data: {
        email: 'admin@samplecenter.edu',
        passwordHash: centerAdminPassword,
        fullName: 'Center Administrator',
        phoneNumber: '+1-555-0124',
        role: UserRole.center_admin,
        centerId: sampleCenter.id,
        isActive: true,
      },
    });

    logger.info('Sample center admin created successfully', {
      id: centerAdmin.id,
      email: centerAdmin.email,
      centerId: sampleCenter.id,
    });

    logger.info('Database seeding completed successfully');
  } catch (error) {
    logger.error('Database seeding failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    throw error;
  }
}

main()
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
