#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🧹 Starting database wipe process...');

try {
  // Change to backend directory
  const backendDir = path.resolve(__dirname, '..');
  process.chdir(backendDir);

  console.log('📦 Installing/updating dependencies...');
  execSync('npm install --production=false', { stdio: 'inherit' });

  console.log('🔨 Compiling TypeScript...');
  execSync('npm run build', { stdio: 'inherit' });

  console.log('🧹 Running database wipe...');
  execSync('node dist/database/seeds/wipe-except-super-admin.js', { stdio: 'inherit' });

  console.log('✅ Database wipe completed successfully!');
  console.log();
  console.log('📋 What was removed:');
  console.log('   • All centers and their data');
  console.log('   • All students and enrollments');
  console.log('   • All teachers and groups');
  console.log('   • All subjects and academic structure');
  console.log('   • All payments and events');
  console.log('   • All center administrators');
  console.log('   • All user sessions');
  console.log();
  console.log('🔑 What was preserved:');
  console.log('   • Super Admin: admin@admin.com / [configured SUPER_ADMIN_PASSWORD]');
  console.log();
  console.log('🎯 Database is now clean and ready for fresh data!');

} catch (error) {
  console.error('❌ Error during wipe process:', error.message);
  process.exit(1);
}
