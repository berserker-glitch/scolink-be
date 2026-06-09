const { AuthService } = require('../dist/services/authService.js');
require('dotenv').config();

console.log('=== Debug Auth Service ===');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');

async function testAuthService() {
  try {
    if (!process.env.SUPER_ADMIN_PASSWORD) {
      throw new Error('SUPER_ADMIN_PASSWORD is required');
    }

    console.log('Testing AuthService.login...');
    const result = await AuthService.login({
      email: 'admin@admin.com',
      password: process.env.SUPER_ADMIN_PASSWORD
    });
    
    console.log('✅ Login successful:', result);
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    console.error('Full error:', error);
  }
}

testAuthService();
