#!/usr/bin/env node

// Production startup script with better error handling
console.log('🚀 Starting production server...');

// Set environment variables
process.env.NODE_ENV = 'production';

// Register tsconfig-paths for path resolution
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

try {
  // Start the server
  console.log('📦 Loading main application...');
  require('./dist/index.js');
  console.log('✅ Application loaded successfully');
} catch (error) {
  console.error('💥 Failed to start server:', error.message);
  console.error(error.stack);
  process.exit(1);
}
