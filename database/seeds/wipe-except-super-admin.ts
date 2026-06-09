import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function wipeDataExceptSuperAdmin() {
  console.log('🧹 Starting database wipe (keeping super admin)...');

  try {
    // Get super admin ID first
    const superAdmin = await prisma.user.findUnique({
      where: { email: 'admin@admin.com' }
    });

    if (!superAdmin) {
      throw new Error('Super admin not found! Cannot proceed with wipe.');
    }

    console.log('✅ Super admin found, proceeding with data wipe...');

    // Delete in order to respect foreign key constraints
    console.log('📋 Deleting attendance records...');
    await prisma.attendanceRecord.deleteMany();

    console.log('💳 Deleting payment subjects...');
    await prisma.paymentSubject.deleteMany();

    console.log('💰 Deleting payments...');
    await prisma.payment.deleteMany();

    console.log('🎟️ Deleting event enrollments...');
    await prisma.eventEnrollment.deleteMany();

    console.log('👥 Deleting event groups...');
    await prisma.eventGroup.deleteMany();

    console.log('📅 Deleting event schedules...');
    await prisma.eventSchedule.deleteMany();

    console.log('🎯 Deleting events...');
    await prisma.event.deleteMany();

    console.log('📚 Deleting student enrollments...');
    await prisma.studentEnrollment.deleteMany();

    console.log('🎓 Deleting students...');
    await prisma.student.deleteMany();

    console.log('⏰ Deleting group schedules...');
    await prisma.groupSchedule.deleteMany();

    console.log('👨‍🏫 Deleting groups...');
    await prisma.group.deleteMany();

    console.log('📖 Deleting subjects...');
    await prisma.subject.deleteMany();

    console.log('👩‍🏫 Deleting teachers...');
    await prisma.teacher.deleteMany();

    console.log('🏛️ Deleting fields...');
    await prisma.field.deleteMany();

    console.log('📈 Deleting years...');
    await prisma.year.deleteMany();

    console.log('🔐 Deleting user sessions...');
    await prisma.userSession.deleteMany();

    console.log('👤 Deleting users (except super admin)...');
    await prisma.user.deleteMany({
      where: {
        NOT: {
          id: superAdmin.id
        }
      }
    });

    console.log('🏢 Deleting centers...');
    await prisma.center.deleteMany();

    // Verify super admin still exists
    const verifyAdmin = await prisma.user.findUnique({
      where: { email: 'admin@admin.com' }
    });

    if (!verifyAdmin) {
      throw new Error('Super admin was accidentally deleted!');
    }

    console.log('✅ Database wipe completed successfully!');
    console.log('🔑 Super admin preserved: admin@admin.com');
    
    // Show final counts
    const counts = {
      users: await prisma.user.count(),
      centers: await prisma.center.count(),
      students: await prisma.student.count(),
      teachers: await prisma.teacher.count(),
      subjects: await prisma.subject.count(),
      groups: await prisma.group.count(),
    };

    console.log('📊 Final counts:');
    Object.entries(counts).forEach(([table, count]) => {
      console.log(`   • ${table}: ${count}`);
    });

  } catch (error) {
    console.error('❌ Database wipe failed:', error);
    throw error;
  }
}

wipeDataExceptSuperAdmin()
  .catch((error) => {
    console.error('Wipe failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
