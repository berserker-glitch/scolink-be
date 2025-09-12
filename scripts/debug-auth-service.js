const { AuthService } = require('../dist/services/authService.js');
require('dotenv').config();

console.log('=== Debug Auth Service ===');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');

async function testAuthService() {
  try {
    console.log('Testing AuthService.login...');
    const result = await AuthService.login({
      email: 'admin@admin.com',
      password: 'D8fd5D5694'
    });
    
    console.log('✅ Login successful:', result);
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    console.error('Full error:', error);
  }
}

testAuthService();
