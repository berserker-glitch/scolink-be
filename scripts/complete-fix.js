const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

console.log('=== Complete Backend Fix Script ===');

async function completeFix() {
  try {
    // 1. Stop all Node processes
    console.log('1. Stopping all Node processes...');
    try {
      await execAsync('taskkill /f /im node.exe');
      console.log('✅ Node processes stopped');
    } catch (error) {
      console.log('ℹ️  No Node processes to stop');
    }
    
    // 2. Create clean .env file
    console.log('2. Creating clean .env file...');
    const envContent = `DATABASE_URL=mysql://root:yasserMBA123%23@localhost:3306/scolink_db

# JWT Configuration
JWT_SECRET=7fG9kL2pXzQw1hT6bV4rN8mYcJ5sD0aE7fG9kL2pXzQw1hT6bV4rN8mYcJ5sD0aE
JWT_REFRESH_SECRET=R8yL3vWqZ5tB1xK9pH2mF6jN0sD4cG7aR8yL3vWqZ5tB1xK9pH2mF6jN0sD4cG7a
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:8080

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Super Admin Credentials
SUPER_ADMIN_EMAIL=admin@admin.com
SUPER_ADMIN_PASSWORD=D8fd5D5694
`;
    fs.writeFileSync('.env', envContent);
    console.log('✅ Clean .env file created');
    
    // 3. Clean Prisma cache
    console.log('3. Cleaning Prisma cache...');
    try {
      if (fs.existsSync('node_modules/.prisma')) {
        fs.rmSync('node_modules/.prisma', { recursive: true, force: true });
        console.log('✅ Prisma cache cleaned');
      }
    } catch (error) {
      console.log('ℹ️  No Prisma cache to clean');
    }
    
    // 4. Regenerate Prisma client
    console.log('4. Regenerating Prisma client...');
    const { stdout: prismaOutput } = await execAsync('npx prisma generate');
    console.log('✅ Prisma client regenerated');
    
    // 5. Test database connection
    console.log('5. Testing database connection...');
    const { PrismaClient } = require('@prisma/client');
    require('dotenv').config();
    
    const testPrisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
    
    await testPrisma.$connect();
    const userCount = await testPrisma.user.count();
    await testPrisma.$disconnect();
    console.log(`✅ Database connection successful (${userCount} users found)`);
    
    console.log('\n🎉 Complete fix completed successfully!');
    console.log('Now you can run: npm run dev');
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
}

completeFix();
