#!/usr/bin/env node

// Production startup script with better error handling
console.log('🚀 Starting production server...');
console.log('📍 Current working directory:', process.cwd());
console.log('📁 Directory contents:', require('fs').readdirSync('.'));

// Set environment variables
process.env.NODE_ENV = 'production';

// Register tsconfig-paths for path resolution
console.log('🔧 Registering tsconfig-paths...');
require('tsconfig-paths/register');

// Enhanced error handling
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error.message);
  console.error(error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Check if compiled files exist
console.log('🔍 Checking for compiled files...');
const fs = require('fs');
const path = require('path');

const distPath = path.join(process.cwd(), 'dist');
const indexPath = path.join(distPath, 'index.js');

if (!fs.existsSync(distPath)) {
  console.error('💥 Dist directory not found!');
  console.log('📁 Available directories:', fs.readdirSync('.'));
  process.exit(1);
}

if (!fs.existsSync(indexPath)) {
  console.error('💥 index.js not found in dist!');
  console.log('📁 Dist contents:', fs.readdirSync(distPath));
  process.exit(1);
}

try {
  // Start the server
  console.log('📦 Loading main application...');
  require('./dist/index.js');
  console.log('✅ Application loaded successfully');
} catch (error) {
  console.error('💥 Failed to start server:', error.message);
  console.error(error.stack);
  
  // Additional debugging info
  console.log('🔍 Environment variables:');
  console.log('  NODE_ENV:', process.env.NODE_ENV);
  console.log('  DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Missing');
  console.log('  PORT:', process.env.PORT);
  
  process.exit(1);
}
