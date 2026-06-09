const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting comprehensive database seeding...\n');

try {
  // Change to backend directory
  const backendDir = path.join(__dirname, '..');
  process.chdir(backendDir);
  
  console.log('📦 Installing/updating dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  console.log('\n🔨 Compiling TypeScript...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('\n🌱 Running comprehensive seed...');
  execSync('node dist/database/seeds/comprehensive-seed.js', { stdio: 'inherit' });
  
  console.log('\n✅ Comprehensive seeding completed successfully!');
  console.log('\n📋 What was created:');
  console.log('   • 4 Educational Centers across Morocco (Casablanca, Rabat, Marrakech, Fez)');
  console.log('   • 400+ Students with realistic Moroccan names and data');
  console.log('   • 76+ Teachers with diverse specializations');
  console.log('   • 6 Academic Years (First Year to Sixth Year)');
  console.log('   • 26+ Fields of Study across all years');
  console.log('   • 100+ Subjects with realistic monthly fees');
  console.log('   • 200+ Groups/Classes with schedules');
  console.log('   • 1000+ Student Enrollments in various subjects');
  console.log('   • Center Administrators for each center');
  console.log('\n🔑 Login Credentials:');
  console.log('   Super Admin: admin@admin.com / [configured SUPER_ADMIN_PASSWORD]');
  console.log('   Center Admins: admin@[centername].edu / Admin123!');
  console.log('\n🎯 The database is now ready for comprehensive testing!');
  
} catch (error) {
  console.error('❌ Error during seeding process:', error.message);
  process.exit(1);
}
