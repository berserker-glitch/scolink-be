#!/usr/bin/env node

/**
 * Production startup script for Scolink Backend
 * Handles module resolution and provides detailed error logging
 */

console.log('🚀 Scolink Backend - Production Startup');
console.log('==========================================');

// Set production environment
process.env.NODE_ENV = 'production';

// Add comprehensive error handling
process.on('uncaughtException', (error) => {
  console.error('💥 UNCAUGHT EXCEPTION - Server shutting down...');
  console.error('Error Name:', error.name);
  console.error('Error Message:', error.message);
  console.error('Stack Trace:', error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 UNHANDLED PROMISE REJECTION - Server shutting down...');
  console.error('Promise:', promise);
  console.error('Reason:', reason);
  process.exit(1);
});

// Diagnostic information
console.log('📍 Working Directory:', process.cwd());
console.log('🌍 Node Environment:', process.env.NODE_ENV);
console.log('🔢 Node Version:', process.version);
console.log('💾 Memory Usage:', process.memoryUsage());

// Check critical environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET'
];

console.log('\n🔧 Environment Variable Check:');
let missingVars = [];
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`  ✅ ${varName}: [CONFIGURED]`);
  } else {
    console.log(`  ❌ ${varName}: [MISSING]`);
    missingVars.push(varName);
  }
});

if (missingVars.length > 0) {
  console.error(`💥 Missing critical environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

// Check file system
const fs = require('fs');
const path = require('path');

console.log('\n📁 File System Check:');
const distPath = path.join(__dirname, 'dist');
const indexPath = path.join(distPath, 'index.js');

if (!fs.existsSync(distPath)) {
  console.error('💥 dist/ directory not found');
  console.log('📂 Available files:', fs.readdirSync(__dirname));
  process.exit(1);
}

if (!fs.existsSync(indexPath)) {
  console.error('💥 dist/index.js not found');
  console.log('📂 dist/ contents:', fs.readdirSync(distPath));
  process.exit(1);
}

console.log('  ✅ dist/index.js found');

// Check package.json and dependencies
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  const pkg = require('./package.json');
  console.log(`  ✅ Package: ${pkg.name}@${pkg.version}`);
} else {
  console.warn('  ⚠️ package.json not found');
}

// Check node_modules
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  console.log('  ✅ node_modules directory found');
} else {
  console.error('💥 node_modules directory not found');
  process.exit(1);
}

console.log('\n🔧 Loading TypeScript path resolver...');
try {
  // Register tsconfig-paths for module resolution
  require('tsconfig-paths/register');
  console.log('  ✅ tsconfig-paths registered');
} catch (error) {
  console.error('💥 Failed to register tsconfig-paths:', error.message);
  // Continue without path resolution - compiled JS should work
}

console.log('\n📦 Starting application server...');
try {
  // Load and start the main application
  require('./dist/index.js');
  console.log('✅ Application server started successfully');
} catch (error) {
  console.error('💥 FAILED TO START APPLICATION');
  console.error('Error Type:', typeof error);
  console.error('Error Name:', error.name);
  console.error('Error Message:', error.message);
  console.error('Error Stack:', error.stack);
  
  if (error.code === 'MODULE_NOT_FOUND') {
    console.error('\n🔍 MODULE RESOLUTION DEBUG:');
    console.error('Missing module:', error.message);
    
    // Try to provide helpful information
    if (error.message.includes('@/')) {
      console.error('⚠️ Path alias detected - this indicates TypeScript path mapping failed');
      console.error('💡 Check tsconfig.json baseUrl and paths configuration');
    }
    
    // List available modules in dist
    try {
      const distContents = fs.readdirSync(distPath, { withFileTypes: true });
      console.error('📂 Available in dist/:');
      distContents.forEach(item => {
        console.error(`  ${item.isDirectory() ? '📁' : '📄'} ${item.name}`);
      });
    } catch (e) {
      console.error('Could not list dist contents:', e.message);
    }
  }
  
  process.exit(1);
}

// Keep the process alive
console.log('🎯 Server is running and ready to accept connections');
