import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  try {
    // Check if super admin already exists
    const existingSuperAdmin = await prisma.user.findUnique({
      where: { email: 'admin@admin.com' },
    });

    if (existingSuperAdmin) {
      console.log('Super admin already exists, skipping creation');
      return;
    }

    // Create super admin user
    const superAdminPassword = await bcrypt.hash('D8fd5D5694', 12);
    
    const superAdmin = await prisma.user.create({
      data: {
        email: 'admin@admin.com',
        passwordHash: superAdminPassword,
        fullName: 'Super Administrator',
        role: UserRole.super_admin,
        isActive: true,
      },
    });

    console.log('Super admin created successfully:', {
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

    console.log('Sample center created successfully:', {
      id: sampleCenter.id,
      name: sampleCenter.name,
    });

    // Create sample center admin
    const centerAdminPassword = await bcrypt.hash('Admin123!', 12);
    
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

    console.log('Sample center admin created successfully:', {
      id: centerAdmin.id,
      email: centerAdmin.email,
      centerId: sampleCenter.id,
    });

    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Database seeding failed:', error);
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
