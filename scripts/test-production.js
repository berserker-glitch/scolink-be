#!/usr/bin/env node
const https = require('https');

// Test 1: Check if server is running (health endpoint)
console.log('🔍 Testing production server...\n');

const testHealthEndpoint = () => {
  return new Promise((resolve, reject) => {
    console.log('1. Testing health endpoint: GET https://api.scolink.ink/health');
    
    const options = {
      hostname: 'api.scolink.ink',
      port: 443,
      path: '/health',
      method: 'GET'
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`   ✅ Status: ${res.statusCode}`);
        console.log(`   📄 Response: ${data}\n`);
        resolve();
      });
    });

    req.on('error', (err) => {
      console.log(`   ❌ Health check failed: ${err.message}\n`);
      reject(err);
    });

    req.end();
  });
};

// Test 2: Check login route specifically
const testLoginRoute = () => {
  return new Promise((resolve, reject) => {
    console.log('2. Testing login endpoint: POST https://api.scolink.ink/api/v1/auth/login');
    
    const postData = JSON.stringify({
      email: 'admin@admin.com',
      password: process.env.SUPER_ADMIN_PASSWORD || ''
    });

    const options = {
      hostname: 'api.scolink.ink',
      port: 443,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`   ✅ Status: ${res.statusCode}`);
        console.log(`   📄 Response: ${data}\n`);
        resolve();
      });
    });

    req.on('error', (err) => {
      console.log(`   ❌ Login test failed: ${err.message}\n`);
      reject(err);
    });

    req.write(postData);
    req.end();
  });
};

// Test 3: Try the problematic GET request that's being logged
const testGETLogin = () => {
  return new Promise((resolve) => {
    console.log('3. Testing GET request (this should fail): GET https://api.scolink.ink/api/v1/auth/login');
    
    const options = {
      hostname: 'api.scolink.ink',
      port: 443,
      path: '/api/v1/auth/login',
      method: 'GET'
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`   ✅ Status: ${res.statusCode}`);
        console.log(`   📄 Response: ${data}\n`);
        resolve();
      });
    });

    req.on('error', (err) => {
      console.log(`   ❌ GET login test failed: ${err.message}\n`);
      resolve();
    });

    req.end();
  });
};

// Run all tests
async function runTests() {
  try {
    await testHealthEndpoint();
    await testLoginRoute();
    await testGETLogin();
    
    console.log('🎯 Test Results Summary:');
    console.log('   - If health endpoint works: Server is running');
    console.log('   - If POST login works: Route is properly configured');  
    console.log('   - If GET login fails with "Route not found": This is expected');
    console.log('\n💡 If POST login also fails, check backend route configuration!');
    
  } catch (error) {
    console.log('❌ Tests failed:', error.message);
  }
}

runTests();
