const axios = require('axios');

async function testLogin() {
  console.log('=== Testing Login Endpoint ===');
  
  try {
    // Test health endpoint first
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get('http://localhost:3001/health');
    console.log('✅ Health check passed:', healthResponse.data);
    
    // Test login endpoint
    console.log('\n2. Testing login endpoint...');
    const loginResponse = await axios.post('http://localhost:3001/api/v1/auth/login', {
      email: 'admin@admin.com',
      password: 'D8fd5D5694'
    });
    
    console.log('✅ Login successful!');
    console.log('Status:', loginResponse.status);
    console.log('Response:', loginResponse.data);
    
  } catch (error) {
    console.error('❌ Login test failed');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testLogin();
