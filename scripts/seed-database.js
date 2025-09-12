const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
require('dotenv').config();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'mysql://root:yasserMBA123%23@localhost:3306/scolink_db',
    },
  },
});

async function seedDatabase() {
  console.log('=== Database Seeding Script ===');
  
  try {
    await prisma.$connect();
    console.log('✅ Connected to database');
    
    // Check if super admin exists
    const existingSuperAdmin = await prisma.user.findUnique({
      where: { email: 'admin@admin.com' }
    });
    
    if (existingSuperAdmin) {
      console.log('✅ Super admin already exists');
      console.log('Super admin details:', {
        id: existingSuperAdmin.id,
        email: existingSuperAdmin.email,
        role: existingSuperAdmin.role,
        isActive: existingSuperAdmin.isActive
      });
      return;
    }
    
    // Hash password
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash('D8fd5D5694', 12);
    
    // Create super admin
    console.log('👤 Creating super admin...');
    const superAdmin = await prisma.user.create({
      data: {
        email: 'admin@admin.com',
        password: hashedPassword,
        fullName: 'Super Administrator',
        role: 'super_admin',
        isActive: true,
      },
    });
    
    console.log('✅ Super admin created successfully:', {
      id: superAdmin.id,
      email: superAdmin.email,
      role: superAdmin.role,
    });
    
    // Create a sample center
    console.log('🏢 Creating sample center...');
    const center = await prisma.center.create({
      data: {
        name: 'Main Center',
        location: 'Downtown',
        phoneNumber: '+1234567890',
        email: 'center@example.com',
      },
    });
    
    console.log('✅ Sample center created:', {
      id: center.id,
      name: center.name,
      location: center.location,
    });
    
    // Create center admin
    console.log('👤 Creating center admin...');
    const centerAdminPassword = await bcrypt.hash('admin123', 12);
    const centerAdmin = await prisma.user.create({
      data: {
        email: 'center.admin@example.com',
        password: centerAdminPassword,
        fullName: 'Center Administrator',
        role: 'center_admin',
        isActive: true,
        centerId: center.id,
      },
    });
    
    console.log('✅ Center admin created:', {
      id: centerAdmin.id,
      email: centerAdmin.email,
      role: centerAdmin.role,
      centerId: centerAdmin.centerId,
    });
    
    console.log('\n🎉 Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase();
