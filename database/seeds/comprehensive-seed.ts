import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  datasources: {
    db: {
      //url:'mysql://root:yasserMBA123%23@localhost:3306/scolink_db',
      url: 'mysql://scolink:yasserMBA123%23@iwcc4cokws4s4scwgg044ow0:3306/scolink_db'
    }
  }
});

// Realistic Moroccan names
const maleFirstNames = [
  'Ahmed', 'Mohamed', 'Youssef', 'Omar', 'Ali', 'Hassan', 'Karim', 'Tariq', 'Samir', 'Nabil',
  'Amine', 'Mehdi', 'Rachid', 'Abderrahim', 'Khalid', 'Mustapha', 'Ayoub', 'Hamza', 'Zakaria',
  'Othmane', 'Ismail', 'Bilal', 'Abdellah', 'Hicham', 'Marwan', 'Taha', 'Mouad', 'Yahya',
  'Soufiane', 'Idriss', 'Badr', 'Houssam', 'Anass', 'Reda', 'Imad', 'Farouk', 'Salam',
  'Hakim', 'Jamal', 'Fouad', 'Said', 'Driss', 'Larbi', 'Brahim', 'Hicham', 'Abdessamad'
];

const femaleFirstNames = [
  'Fatima', 'Aisha', 'Khadija', 'Amina', 'Zahra', 'Maryam', 'Yasmin', 'Leila', 'Sara', 'Nour',
  'Zineb', 'Salma', 'Rim', 'Ghita', 'Dounia', 'Meriem', 'Hanane', 'Imane', 'Siham', 'Lamia',
  'Hasna', 'Rajaa', 'Nawal', 'Samira', 'Aicha', 'Houda', 'Souad', 'Latifa', 'Bouchra',
  'Chaimae', 'Oumaima', 'Asma', 'Hayat', 'Karima', 'Malika', 'Nezha', 'Widad', 'Laila',
  'Fatiha', 'Amal', 'Kenza', 'Loubna', 'Hind', 'Najwa', 'Soraya', 'Mouna', 'Hajar'
];

const lastNames = [
  'Benali', 'Hamidi', 'Mansouri', 'Alaoui', 'Kadiri', 'Tazi', 'Fassi', 'Berrada', 'Bennani', 'Chraibi',
  'El Amrani', 'Zouani', 'Baghdadi', 'Marrakchi', 'Slaoui', 'Naciri', 'Benjelloun', 'Lahlou', 'Idrissi',
  'Rahali', 'Sekkat', 'Bensaid', 'Kettani', 'Hassani', 'Ghali', 'Talib', 'Cherkaoui', 'Moussaoui',
  'Filali', 'Benabdeljalil', 'Machichi', 'Lamrini', 'Sqalli', 'Benkirane', 'Sefrioui', 'Hajji',
  'Ouazzani', 'Tangi', 'Baali', 'Sabri', 'El Fassi', 'Hakimi', 'Belkaid', 'Lamrani', 'Bensouda'
];

const parentTypes = ['Father', 'Mother', 'Guardian'];
const tags = ['normal', 'ss']; // ss = special schedule

// Academic structure data
const yearsData = [
  { name: 'First Year', order: 1 },
  { name: 'Second Year', order: 2 },
  { name: 'Third Year', order: 3 },
  { name: 'Fourth Year', order: 4 },
  { name: 'Fifth Year', order: 5 },
  { name: 'Sixth Year', order: 6 }
];

const fieldsData = [
  // First Year Fields
  { name: 'General Studies', yearOrder: 1 },
  { name: 'Sciences Foundation', yearOrder: 1 },
  { name: 'Languages Foundation', yearOrder: 1 },
  
  // Second Year Fields
  { name: 'Sciences', yearOrder: 2 },
  { name: 'Literature', yearOrder: 2 },
  { name: 'Languages', yearOrder: 2 },
  { name: 'Arts', yearOrder: 2 },
  
  // Third Year Fields
  { name: 'Physical Sciences', yearOrder: 3 },
  { name: 'Life Sciences', yearOrder: 3 },
  { name: 'Literature & Philosophy', yearOrder: 3 },
  { name: 'Economics & Management', yearOrder: 3 },
  { name: 'Languages', yearOrder: 3 },
  
  // Fourth Year Fields
  { name: 'Mathematical Sciences', yearOrder: 4 },
  { name: 'Experimental Sciences', yearOrder: 4 },
  { name: 'Economics & Social Sciences', yearOrder: 4 },
  { name: 'Literature & Human Sciences', yearOrder: 4 },
  { name: 'Technology', yearOrder: 4 },
  
  // Fifth Year Fields
  { name: 'Mathematics', yearOrder: 5 },
  { name: 'Physics & Chemistry', yearOrder: 5 },
  { name: 'Natural Sciences', yearOrder: 5 },
  { name: 'Economics', yearOrder: 5 },
  { name: 'Literature', yearOrder: 5 },
  
  // Sixth Year Fields
  { name: 'Advanced Mathematics', yearOrder: 6 },
  { name: 'Advanced Sciences', yearOrder: 6 },
  { name: 'Business & Economics', yearOrder: 6 },
  { name: 'Advanced Literature', yearOrder: 6 }
];

const subjectsData = [
  // Mathematics subjects
  { name: 'Mathematics', fee: 350, fieldNames: ['Sciences Foundation', 'Sciences', 'Physical Sciences', 'Mathematical Sciences', 'Mathematics', 'Advanced Mathematics'] },
  { name: 'Advanced Mathematics', fee: 400, fieldNames: ['Mathematical Sciences', 'Mathematics', 'Advanced Mathematics'] },
  { name: 'Applied Mathematics', fee: 375, fieldNames: ['Economics & Management', 'Economics & Social Sciences', 'Economics', 'Business & Economics'] },
  
  // Sciences subjects
  { name: 'Physics', fee: 320, fieldNames: ['Sciences', 'Physical Sciences', 'Experimental Sciences', 'Physics & Chemistry', 'Advanced Sciences'] },
  { name: 'Chemistry', fee: 300, fieldNames: ['Sciences', 'Physical Sciences', 'Experimental Sciences', 'Physics & Chemistry', 'Advanced Sciences'] },
  { name: 'Biology', fee: 280, fieldNames: ['Life Sciences', 'Experimental Sciences', 'Natural Sciences', 'Advanced Sciences'] },
  { name: 'Earth Sciences', fee: 260, fieldNames: ['Life Sciences', 'Natural Sciences'] },
  { name: 'Computer Science', fee: 400, fieldNames: ['Technology', 'Advanced Sciences'] },
  
  // Languages subjects
  { name: 'Arabic Language', fee: 200, fieldNames: ['Languages Foundation', 'Languages', 'Literature', 'Literature & Philosophy', 'Literature & Human Sciences', 'Advanced Literature'] },
  { name: 'French Language', fee: 250, fieldNames: ['Languages Foundation', 'Languages', 'Literature', 'Literature & Philosophy', 'Literature & Human Sciences', 'Advanced Literature'] },
  { name: 'English Language', fee: 270, fieldNames: ['Languages Foundation', 'Languages', 'Literature', 'Literature & Philosophy', 'Literature & Human Sciences', 'Advanced Literature'] },
  { name: 'Spanish Language', fee: 230, fieldNames: ['Languages', 'Literature & Human Sciences'] },
  { name: 'German Language', fee: 240, fieldNames: ['Languages', 'Literature & Human Sciences'] },
  
  // Social Sciences subjects
  { name: 'History', fee: 200, fieldNames: ['Literature', 'Literature & Philosophy', 'Literature & Human Sciences', 'Advanced Literature'] },
  { name: 'Geography', fee: 200, fieldNames: ['Literature', 'Literature & Philosophy', 'Literature & Human Sciences', 'Advanced Literature'] },
  { name: 'Philosophy', fee: 220, fieldNames: ['Literature & Philosophy', 'Literature & Human Sciences', 'Advanced Literature'] },
  { name: 'Islamic Studies', fee: 180, fieldNames: ['General Studies', 'Literature', 'Literature & Philosophy', 'Literature & Human Sciences'] },
  
  // Economics subjects
  { name: 'Economics', fee: 300, fieldNames: ['Economics & Management', 'Economics & Social Sciences', 'Economics', 'Business & Economics'] },
  { name: 'Management', fee: 320, fieldNames: ['Economics & Management', 'Business & Economics'] },
  { name: 'Accounting', fee: 280, fieldNames: ['Economics & Management', 'Economics & Social Sciences', 'Business & Economics'] },
  { name: 'Business Studies', fee: 350, fieldNames: ['Business & Economics'] },
  
  // Arts subjects
  { name: 'Art History', fee: 190, fieldNames: ['Arts', 'Literature & Human Sciences'] },
  { name: 'Fine Arts', fee: 250, fieldNames: ['Arts'] },
  { name: 'Music', fee: 200, fieldNames: ['Arts'] },
  
  // General subjects for all fields
  { name: 'Physical Education', fee: 120, fieldNames: ['General Studies'] },
  { name: 'Civic Education', fee: 150, fieldNames: ['General Studies'] }
];

const teachersData = [
  { name: 'Dr. Ahmed Benali', email: 'a.benali@center.edu', subjects: ['Mathematics', 'Advanced Mathematics'], bio: 'PhD in Mathematics with 15 years of teaching experience.' },
  { name: 'Prof. Fatima Hamidi', email: 'f.hamidi@center.edu', subjects: ['Physics', 'Chemistry'], bio: 'Professor of Physical Sciences, specializing in quantum mechanics.' },
  { name: 'Dr. Mohamed Mansouri', email: 'm.mansouri@center.edu', subjects: ['Biology', 'Earth Sciences'], bio: 'Marine biologist and environmental scientist.' },
  { name: 'Ms. Aisha Alaoui', email: 'a.alaoui@center.edu', subjects: ['Arabic Language', 'Islamic Studies'], bio: 'Arabic literature specialist with master\'s degree.' },
  { name: 'Mr. Youssef Kadiri', email: 'y.kadiri@center.edu', subjects: ['French Language'], bio: 'Native French speaker, certified language instructor.' },
  { name: 'Dr. Khadija Tazi', email: 'k.tazi@center.edu', subjects: ['English Language'], bio: 'PhD in English Literature from Oxford University.' },
  { name: 'Prof. Omar Fassi', email: 'o.fassi@center.edu', subjects: ['History', 'Geography'], bio: 'Historian specializing in North African studies.' },
  { name: 'Dr. Amina Berrada', email: 'a.berrada@center.edu', subjects: ['Philosophy'], bio: 'Philosophy professor with expertise in ethics and logic.' },
  { name: 'Mr. Hassan Bennani', email: 'h.bennani@center.edu', subjects: ['Economics', 'Management'], bio: 'Former business consultant, MBA holder.' },
  { name: 'Ms. Zahra Chraibi', email: 'z.chraibi@center.edu', subjects: ['Accounting'], bio: 'Certified Public Accountant with 10 years experience.' },
  { name: 'Dr. Ali El Amrani', email: 'a.elamrani@center.edu', subjects: ['Computer Science'], bio: 'Software engineer turned educator, PhD in Computer Science.' },
  { name: 'Ms. Maryam Zouani', email: 'm.zouani@center.edu', subjects: ['Fine Arts', 'Art History'], bio: 'Professional artist and art historian.' },
  { name: 'Mr. Karim Baghdadi', email: 'k.baghdadi@center.edu', subjects: ['Spanish Language'], bio: 'Lived in Spain for 5 years, certified Spanish instructor.' },
  { name: 'Dr. Leila Marrakchi', email: 'l.marrakchi@center.edu', subjects: ['Applied Mathematics'], bio: 'Applied mathematics specialist in economics and finance.' },
  { name: 'Prof. Tariq Slaoui', email: 't.slaoui@center.edu', subjects: ['Business Studies'], bio: 'Former CEO turned business educator.' },
  { name: 'Ms. Sara Naciri', email: 's.naciri@center.edu', subjects: ['German Language'], bio: 'German language specialist, studied in Berlin.' },
  { name: 'Mr. Nabil Benjelloun', email: 'n.benjelloun@center.edu', subjects: ['Music'], bio: 'Professional musician and composer.' },
  { name: 'Dr. Yasmin Lahlou', email: 'y.lahlou@center.edu', subjects: ['Physical Education'], bio: 'Sports science PhD, former Olympic coach.' },
  { name: 'Ms. Nour Idrissi', email: 'n.idrissi@center.edu', subjects: ['Civic Education'], bio: 'Political science graduate, civic education specialist.' }
];

const centersData = [
  { 
    name: 'Casablanca Educational Excellence Center', 
    location: '123 Hassan II Boulevard, Casablanca 20000, Morocco',
    phoneNumber: '+212-522-123456',
    email: 'info@casaexcellence.edu'
  },
  { 
    name: 'Rabat Academic Institute', 
    location: '456 Mohammed V Avenue, Rabat 10000, Morocco',
    phoneNumber: '+212-537-654321',
    email: 'contact@rabatacademic.edu'
  },
  { 
    name: 'Marrakech Learning Center', 
    location: '789 Jemaa el-Fnaa Street, Marrakech 40000, Morocco',
    phoneNumber: '+212-524-987654',
    email: 'info@marrakechlearn.edu'
  },
  { 
    name: 'Fez Heritage Academy', 
    location: '321 Bab Boujloud, Fez 30000, Morocco',
    phoneNumber: '+212-535-321654',
    email: 'admin@fezheritage.edu'
  }
];

// Helper functions
function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generatePhoneNumber(): string {
  const prefixes = ['06', '07', '05'];
  const prefix = getRandomElement(prefixes);
  const number = Math.floor(Math.random() * 90000000) + 10000000;
  return `+212-${prefix}-${number.toString().substring(0, 8)}`;
}

function generateCNI(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const letter1 = letters[Math.floor(Math.random() * letters.length)];
  const letter2 = letters[Math.floor(Math.random() * letters.length)];
  const numbers = Math.floor(Math.random() * 900000) + 100000;
  return `${letter1}${letter2}${numbers}`;
}

async function main() {
  console.log('🌱 Starting comprehensive database seeding...');

  // Create shorter email mappings for centers
  const centerEmailMappings: { [key: string]: string } = {
    'Casablanca Educational Excellence Center': 'casa-excellence',
    'Rabat Academic Institute': 'rabat-academic',
    'Marrakech Learning Center': 'marrakech-learn',
    'Fez Heritage Academy': 'fez-heritage'
  };

  try {
    // Check if super admin exists
    const existingSuperAdmin = await prisma.user.findUnique({
      where: { email: 'admin@admin.com' },
    });

    let superAdmin;
    if (!existingSuperAdmin) {
      const superAdminPassword = await bcrypt.hash('D8fd5D5694', 12);
      superAdmin = await prisma.user.create({
        data: {
          email: 'admin@admin.com',
          passwordHash: superAdminPassword,
          fullName: 'Super Administrator',
          role: UserRole.super_admin,
          isActive: true,
        },
      });
      console.log('✅ Super admin created');
    } else {
      superAdmin = existingSuperAdmin;
      console.log('ℹ️ Super admin already exists');
    }

    // Create Centers
    console.log('🏢 Creating centers...');
    const centers = [];
    
    // Create shorter email mappings for centers
    const centerEmailMappings: { [key: string]: string } = {
      'Casablanca Educational Excellence Center': 'casa-excellence',
      'Rabat Academic Institute': 'rabat-academic',
      'Marrakech Learning Center': 'marrakech-learn',
      'Fez Heritage Academy': 'fez-heritage'
    };
    
    for (const centerData of centersData) {
      const center = await prisma.center.create({
        data: {
          ...centerData,
          createdBy: superAdmin.id,
        },
      });
      centers.push(center);

      // Create center admin for each center with shorter email
      const centerAdminPassword = await bcrypt.hash('Admin123!', 12);
      const emailPrefix = centerEmailMappings[center.name] || center.name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 15);
      
      // Check if admin already exists
      const existingAdmin = await prisma.user.findUnique({
        where: { email: `admin@${emailPrefix}.edu` },
      });

      if (!existingAdmin) {
        await prisma.user.create({
          data: {
            email: `admin@${emailPrefix}.edu`,
            passwordHash: centerAdminPassword,
            fullName: `${center.name} Administrator`,
            phoneNumber: generatePhoneNumber(),
            role: UserRole.center_admin,
            centerId: center.id,
            isActive: true,
          },
        });
      } else {
        console.log(`ℹ️ Admin already exists for ${center.name}`);
      }
    }
    console.log(`✅ Created ${centers.length} centers with admins`);

    // For each center, create the academic structure
    for (const center of centers) {
      console.log(`🎓 Setting up academic structure for ${center.name}...`);

      // Create Years
      const createdYears = [];
      for (const yearData of yearsData) {
        const year = await prisma.year.create({
          data: {
            name: yearData.name,
            order: yearData.order,
            centerId: center.id,
          },
        });
        createdYears.push(year);
      }

      // Create Fields
      const createdFields = [];
      for (const fieldData of fieldsData) {
        const yearForField = createdYears.find(y => y.order === fieldData.yearOrder);
        if (yearForField) {
          const field = await prisma.field.create({
            data: {
              name: fieldData.name,
              yearId: yearForField.id,
              centerId: center.id,
            },
          });
          createdFields.push(field);
        }
      }

      // Create Subjects
      const createdSubjects = [];
      for (const subjectData of subjectsData) {
        for (const fieldName of subjectData.fieldNames) {
          const field = createdFields.find(f => f.name === fieldName);
          if (field) {
            const year = createdYears.find(y => y.id === field.yearId);
            if (year) {
              const subject = await prisma.subject.create({
                data: {
                  name: subjectData.name,
                  monthlyFee: subjectData.fee,
                  yearId: year.id,
                  fieldId: field.id,
                  centerId: center.id,
                },
              });
              createdSubjects.push(subject);
            }
          }
        }
      }

      // Create Teachers
      const createdTeachers = [];
      const emailPrefix = centerEmailMappings[center.name] || center.name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 15);
      
      for (const teacherData of teachersData) {
        const teacher = await prisma.teacher.create({
          data: {
            name: teacherData.name,
            email: teacherData.email.replace('@center.edu', `@${emailPrefix}.edu`),
            phone: generatePhoneNumber(),
            bio: teacherData.bio,
            centerId: center.id,
          },
        });
        createdTeachers.push(teacher);
      }

      // Create Groups (connecting subjects and teachers)
      const createdGroups = [];
      for (const subject of createdSubjects) {
        // Find teachers who can teach this subject
        const compatibleTeachers = teachersData.filter(t => t.subjects.includes(subject.name));
        if (compatibleTeachers.length > 0) {
          const teacherData = getRandomElement(compatibleTeachers);
          const teacher = createdTeachers.find(t => t.name === teacherData.name);
          
          if (teacher) {
            // Create 1-3 groups per subject
            const groupCount = Math.floor(Math.random() * 3) + 1;
            for (let i = 1; i <= groupCount; i++) {
              const group = await prisma.group.create({
                data: {
                  name: `${subject.name} - Group ${i}`,
                  capacity: Math.floor(Math.random() * 15) + 15, // 15-30 students
                  classNumber: `${subject.name.substring(0, 3).toUpperCase()}${String(i).padStart(2, '0')}`,
                  subjectId: subject.id,
                  teacherId: teacher.id,
                  centerId: center.id,
                },
              });
              createdGroups.push(group);

              // Create schedule for each group
              const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
              const randomDay = getRandomElement(days);
              const startHour = Math.floor(Math.random() * 6) + 8; // 8 AM to 1 PM
              const endHour = startHour + 2; // 2 hour classes
              
              await prisma.groupSchedule.create({
                data: {
                  groupId: group.id,
                  day: randomDay,
                  startTime: `${startHour.toString().padStart(2, '0')}:00`,
                  endTime: `${endHour.toString().padStart(2, '0')}:00`,
                },
              });
            }
          }
        }
      }

      // Create Students (distribute across centers)
      console.log(`👥 Creating students for ${center.name}...`);
      const studentsPerCenter = Math.floor(400 / centers.length); // Distribute ~400 students across centers
      
      for (let i = 0; i < studentsPerCenter; i++) {
        const sex = Math.random() > 0.5 ? 'M' : 'F';
        const firstName = sex === 'M' ? getRandomElement(maleFirstNames) : getRandomElement(femaleFirstNames);
        const lastName = getRandomElement(lastNames);
        const randomField = getRandomElement(createdFields);
        const year = createdYears.find(y => y.id === randomField.yearId);
        
        const student = await prisma.student.create({
          data: {
            firstName,
            lastName,
            sex,
            yearId: year!.id,
            fieldId: randomField.id,
            phone: generatePhoneNumber(),
            parentPhone: generatePhoneNumber(),
            parentType: getRandomElement(parentTypes),
            tag: Math.random() > 0.9 ? 'ss' : 'normal', // 10% special schedule
            cni: Math.random() > 0.3 ? generateCNI() : null, // 70% have CNI
            centerId: center.id,
          },
        });

        // Enroll student in 2-4 random groups from their field
        const fieldSubjects = createdSubjects.filter(s => s.fieldId === randomField.id);
        const availableGroups = createdGroups.filter(g => 
          fieldSubjects.some(s => s.id === g.subjectId)
        );
        
        if (availableGroups.length > 0) {
          const numEnrollments = Math.min(Math.floor(Math.random() * 3) + 2, availableGroups.length);
          const shuffledGroups = [...availableGroups].sort(() => 0.5 - Math.random());
          
          for (let j = 0; j < numEnrollments; j++) {
            const group = shuffledGroups[j];
            try {
              await prisma.studentEnrollment.create({
                data: {
                  studentId: student.id,
                  groupId: group.id,
                },
              });
            } catch (error) {
              // Skip if enrollment already exists
            }
          }
        }
      }
      
      console.log(`✅ Created academic structure for ${center.name}`);
    }

    // Final count
    const totalStudents = await prisma.student.count();
    const totalTeachers = await prisma.teacher.count();
    const totalSubjects = await prisma.subject.count();
    const totalGroups = await prisma.group.count();
    const totalEnrollments = await prisma.studentEnrollment.count();

    console.log('\n🎉 Comprehensive seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   • Centers: ${centers.length}`);
    console.log(`   • Students: ${totalStudents}`);
    console.log(`   • Teachers: ${totalTeachers}`);
    console.log(`   • Subjects: ${totalSubjects}`);
    console.log(`   • Groups: ${totalGroups}`);
    console.log(`   • Enrollments: ${totalEnrollments}`);
    console.log(`   • Years: ${yearsData.length} per center`);
    console.log(`   • Fields: ${fieldsData.length} per center`);

  } catch (error) {
    console.error('❌ Comprehensive seeding failed:', error);
    throw error;
  }
}

main()
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
