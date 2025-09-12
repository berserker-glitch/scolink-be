const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

console.log('=== Database Connection Test ===');
console.log('DATABASE_URL from env:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('DATABASE_URL value:', process.env.DATABASE_URL);

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'mysql://root:yasserMBA123%23@localhost:3306/scolink_db',
    },
  },
});

async function testConnection() {
  try {
    console.log('\n=== Testing Prisma Connection ===');
    await prisma.$connect();
    console.log('✅ Connected to database successfully!');
    
    console.log('\n=== Testing User Query ===');
    const userCount = await prisma.user.count();
    console.log(`✅ Found ${userCount} users in database`);
    
    console.log('\n=== Testing Super Admin Query ===');
    const superAdmin = await prisma.user.findUnique({
      where: { email: 'admin@admin.com' }
    });
    
    if (superAdmin) {
      console.log('✅ Super admin found:', {
        id: superAdmin.id,
        email: superAdmin.email,
        role: superAdmin.role,
        isActive: superAdmin.isActive
      });
    } else {
      console.log('❌ Super admin not found');
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
