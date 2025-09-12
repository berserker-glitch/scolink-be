const fs = require('fs');
const { exec } = require('child_process');

console.log('=== Environment Fix and Restart Script ===');

// Create a clean .env file
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

try {
  // Write clean .env file
  fs.writeFileSync('.env', envContent);
  console.log('✅ Created clean .env file');
  
  // Test environment loading
  require('dotenv').config();
  console.log('✅ Environment variables loaded');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
  console.log('JWT_SECRET length:', process.env.JWT_SECRET?.length || 0);
  
  console.log('\n=== Regenerating Prisma Client ===');
  exec('npx prisma generate', (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Prisma generate failed:', error);
      return;
    }
    console.log('✅ Prisma client regenerated');
    console.log(stdout);
    
    console.log('\n=== Environment fix completed ===');
    console.log('Now run: npm run dev');
  });
  
} catch (error) {
  console.error('❌ Script failed:', error);
}
