#!/usr/bin/env node

/**
 * Docker-optimized startup script for Scolink Backend
 * This script handles various deployment scenarios and module resolution issues
 */

console.log('🚀 Scolink Backend - Docker Production Start');
console.log('===============================================');

// Set environment
process.env.NODE_ENV = 'production';

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('💥 UNCAUGHT EXCEPTION:', error.message);
  console.error(error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 UNHANDLED REJECTION:', reason);
  process.exit(1);
});

const fs = require('fs');
const path = require('path');

// Environment diagnostics
console.log('🔍 Environment Check:');
console.log('  Node Version:', process.version);
console.log('  Platform:', process.platform);
console.log('  Architecture:', process.arch);
console.log('  Working Directory:', process.cwd());

// Check required environment variables
const requiredVars = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('💥 Missing environment variables:', missingVars.join(', '));
  process.exit(1);
}

console.log('✅ All required environment variables are set');

// Check application structure
const distPath = path.join(__dirname, 'dist');
const srcIndexPath = path.join(__dirname, 'src', 'index.ts');
const distIndexPath = path.join(distPath, 'index.js');

console.log('📁 File System Check:');

// Try multiple startup strategies
function tryStartup() {
  // Strategy 1: Use compiled JavaScript with path resolution
  if (fs.existsSync(distIndexPath)) {
    console.log('🎯 Strategy 1: Starting from compiled JavaScript');
    
    try {
      // Try with tsconfig-paths first
      require('tsconfig-paths/register');
      console.log('✅ tsconfig-paths registered');
      require('./dist/index.js');
      return true;
    } catch (error) {
      console.warn('⚠️ Strategy 1 failed:', error.message);
      
      // Strategy 2: Try without path resolution
      try {
        console.log('🎯 Strategy 2: Starting without path resolution');
        delete require.cache[require.resolve('./dist/index.js')];
        
        // Create a minimal module loader that handles @/ imports
        const Module = require('module');
        const originalResolveFilename = Module._resolveFilename;
        
        Module._resolveFilename = function (request, parent, isMain) {
          // Handle @/ imports by converting them to relative paths
          if (request.startsWith('@/')) {
            const relativePath = request.replace('@/', './');
            const fullPath = path.resolve(path.dirname(parent.filename), relativePath);
            
            // Try different file extensions
            const extensions = ['.js', '/index.js'];
            for (const ext of extensions) {
              const testPath = fullPath + ext;
              if (fs.existsSync(testPath)) {
                return originalResolveFilename.call(this, testPath, parent, isMain);
              }
            }
          }
          
          return originalResolveFilename.call(this, request, parent, isMain);
        };
        
        require('./dist/index.js');
        return true;
      } catch (error2) {
        console.error('💥 Strategy 2 failed:', error2.message);
        return false;
      }
    }
  }
  
  // Strategy 3: Try TypeScript directly (fallback)
  if (fs.existsSync(srcIndexPath)) {
    console.log('🎯 Strategy 3: Starting from TypeScript source (fallback)');
    
    try {
      require('ts-node/register');
      require('tsconfig-paths/register');
      require('./src/index.ts');
      return true;
    } catch (error) {
      console.error('💥 Strategy 3 failed:', error.message);
      return false;
    }
  }
  
  return false;
}

// Execute startup
console.log('🚀 Attempting to start application...');

if (tryStartup()) {
  console.log('✅ Application started successfully!');
  console.log('🎯 Server is ready to accept connections');
} else {
  console.error('💥 All startup strategies failed!');
  console.error('📂 Available files:', fs.readdirSync(__dirname));
  
  if (fs.existsSync(distPath)) {
    console.error('📂 dist/ contents:', fs.readdirSync(distPath));
  }
  
  process.exit(1);
}
