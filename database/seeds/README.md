# Database Seeding Guide

This directory contains scripts for seeding the database with initial and comprehensive test data.

## Available Seed Scripts

### 1. Basic Seed (`index.ts` / `simple-seed.ts`)
Creates minimal data for basic functionality:
- Super admin user
- One sample center
- One center admin

### 2. Comprehensive Seed (`comprehensive-seed.ts`) ⭐
Creates a full educational ecosystem with realistic data:
- **4 Educational Centers** across major Moroccan cities
- **400+ Students** with authentic Moroccan names
- **76+ Teachers** with diverse specializations
- **Academic Structure**: 6 years, 26+ fields, 100+ subjects
- **200+ Groups/Classes** with schedules
- **1000+ Student Enrollments**

## Quick Start

### Option 1: Run Comprehensive Seed (Recommended)
```bash
# From the backend directory
node scripts/run-comprehensive-seed.js
```

### Option 2: Manual Compilation and Run
```bash
# From the backend directory
npm run build
node dist/database/seeds/comprehensive-seed.js
```

### Option 3: Using TypeScript directly
```bash
# From the backend directory
npx tsx database/seeds/comprehensive-seed.ts
```

## What Gets Created

### Centers
1. **Casablanca Educational Excellence Center**
   - Location: Hassan II Boulevard, Casablanca
   - Admin: admin@casablancaeducationalexcellencecenter.edu

2. **Rabat Academic Institute**
   - Location: Mohammed V Avenue, Rabat
   - Admin: admin@rabatacademicinstitute.edu

3. **Marrakech Learning Center**
   - Location: Jemaa el-Fnaa Street, Marrakech
   - Admin: admin@marrakechlearningcenter.edu

4. **Fez Heritage Academy**
   - Location: Bab Boujloud, Fez
   - Admin: admin@fezheritageacademy.edu

### Academic Structure

#### Years (6 levels)
- First Year → Sixth Year

#### Fields by Year
- **Year 1**: General Studies, Sciences Foundation, Languages Foundation
- **Year 2**: Sciences, Literature, Languages, Arts
- **Year 3**: Physical Sciences, Life Sciences, Literature & Philosophy, Economics & Management, Languages
- **Year 4**: Mathematical Sciences, Experimental Sciences, Economics & Social Sciences, Literature & Human Sciences, Technology
- **Year 5**: Mathematics, Physics & Chemistry, Natural Sciences, Economics, Literature
- **Year 6**: Advanced Mathematics, Advanced Sciences, Business & Economics, Advanced Literature

#### Subjects (25+ types)
- **STEM**: Mathematics, Physics, Chemistry, Biology, Computer Science
- **Languages**: Arabic, French, English, Spanish, German
- **Social Sciences**: History, Geography, Philosophy, Islamic Studies
- **Economics**: Economics, Management, Accounting, Business Studies
- **Arts**: Fine Arts, Art History, Music
- **General**: Physical Education, Civic Education

### Students (400+)
- Realistic Moroccan names (both male and female)
- Diverse demographics across all years and fields
- Contact information for students and parents
- CNI numbers (70% of students)
- Special schedule tags (10% of students)

### Teachers (76+)
- Specialized in their respective subjects
- Realistic qualifications and biographies
- Contact information
- Distributed across all centers

### Groups & Enrollments
- 200+ class groups with capacity 15-30 students
- Weekly schedules (Monday-Saturday, 8 AM-3 PM)
- Students enrolled in 2-4 subjects based on their field
- 1000+ total enrollments

## Login Credentials

### Super Administrator
- **Email**: admin@admin.com
- **Password**: D8fd5D5694
- **Access**: Full system access

### Center Administrators
- **Email Pattern**: admin@[centername].edu
- **Password**: Admin123! (for all centers)
- **Access**: Center-specific administration

#### Specific Center Admin Emails:
- admin@casablancaeducationalexcellencecenter.edu
- admin@rabatacademicinstitute.edu
- admin@marrakechlearningcenter.edu
- admin@fezheritageacademy.edu

## Data Characteristics

### Realistic Elements
- **Names**: Authentic Moroccan first and last names
- **Locations**: Real Moroccan cities and addresses
- **Phone Numbers**: Moroccan format (+212-XX-XXXXXXXX)
- **Academic Structure**: Based on Moroccan educational system
- **Subject Fees**: Realistic pricing (150-400 MAD/month)

### Distribution
- **Gender**: ~50/50 male/female students
- **Fields**: Even distribution across all available fields
- **Special Cases**: 10% special schedule, 70% have CNI numbers
- **Enrollments**: 2-4 subjects per student based on their field

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   ```bash
   # Check your .env file has correct DATABASE_URL
   # Ensure MySQL server is running
   ```

2. **Permission Errors**
   ```bash
   # Ensure the database user has CREATE/INSERT permissions
   ```

3. **Timeout Errors**
   ```bash
   # The comprehensive seed creates lots of data
   # Increase database timeout settings if needed
   ```

### Verification
After seeding, verify the data was created:
```sql
SELECT 
    (SELECT COUNT(*) FROM students) as students,
    (SELECT COUNT(*) FROM teachers) as teachers,
    (SELECT COUNT(*) FROM subjects) as subjects,
    (SELECT COUNT(*) FROM centers) as centers,
    (SELECT COUNT(*) FROM student_enrollments) as enrollments;
```

## Notes

- The comprehensive seed is idempotent for the super admin (won't create duplicates)
- Each run creates new centers, students, etc. (run on clean database for best results)
- All data is in French/English with Arabic names for authenticity
- Phone numbers follow Moroccan format
- CNI numbers are generated randomly for testing purposes

## Need Help?

- Check the backend logs in `logs/app.log`
- Verify database connection with `scripts/test-db-connection.js`
- For authentication issues, try `scripts/test-login.js`
