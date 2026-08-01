import 'dotenv/config';
import { DataSource } from 'typeorm';
import AppDataSource from '../database/postgres/data-source';
import { Class } from '../../models/entities/academic/class.entity';
import { Section } from '../../models/entities/academic/section.entity';
import { Student } from '../../models/entities/student/student.entity';
import { StudentEnrollment } from '../../models/entities/student/student-enrollment.entity';
import { AcademicSession } from '../../models/entities/academic/academic-session.entity';
import { EnrollmentStatusEnum, EnrollmentTypeEnum } from '../../models/enums/enums';

export async function seedStudentsForSchool(dataSource: DataSource, schoolId: string = '2') {
  const classRepo = dataSource.getRepository(Class);
  const sectionRepo = dataSource.getRepository(Section);
  const studentRepo = dataSource.getRepository(Student);
  const enrollmentRepo = dataSource.getRepository(StudentEnrollment);
  const sessionRepo = dataSource.getRepository(AcademicSession);

  // 1. Get or create Academic Session
  let activeSession = await sessionRepo.findOne({
    where: { schoolId, isCurrent: true, isDeleted: false },
  });
  if (!activeSession) {
    activeSession = sessionRepo.create({
      schoolId,
      name: '2025-2026',
      startDate: '2025-04-01',
      endDate: '2026-03-31',
      isCurrent: true,
      isActive: true,
    });
    activeSession = await sessionRepo.save(activeSession);
  }

  const classNames = [
    'Class 1',
    'Class 2',
    'Class 3',
    'Class 4',
    'Class 5',
    'Class 6',
    'Class 7',
    'Class 8',
    'Class 9',
    'Class 10',
  ];

  const studentNamesByClassSec: Record<string, { first: string; last: string; gender: string }[]> = {
    'Class 1-A': [
      { first: 'Aarav', last: 'Verma', gender: 'male' },
      { first: 'Ishaan', last: 'Sharma', gender: 'male' },
      { first: 'Ananya', last: 'Singh', gender: 'female' },
      { first: 'Diya', last: 'Patel', gender: 'female' },
      { first: 'Reyansh', last: 'Kumar', gender: 'male' },
    ],
    'Class 1-B': [
      { first: 'Vihaan', last: 'Mehta', gender: 'male' },
      { first: 'Saanvi', last: 'Joshi', gender: 'female' },
      { first: 'Kabir', last: 'Nair', gender: 'male' },
      { first: 'Myra', last: 'Gupta', gender: 'female' },
      { first: 'Advait', last: 'Saxena', gender: 'male' },
    ],
    'Class 2-A': [
      { first: 'Atharv', last: 'Malhotra', gender: 'male' },
      { first: 'Anaya', last: 'Deshmukh', gender: 'female' },
      { first: 'Rohan', last: 'Trivedi', gender: 'male' },
      { first: 'Ishita', last: 'Chaudhari', gender: 'female' },
      { first: 'Ayush', last: 'Rao', gender: 'male' },
    ],
    'Class 2-B': [
      { first: 'Shlok', last: 'Agrawal', gender: 'male' },
      { first: 'Tara', last: 'Sen', gender: 'female' },
      { first: 'Devansh', last: 'Pillai', gender: 'male' },
      { first: 'Pari', last: 'Iyer', gender: 'female' },
      { first: 'Yug', last: 'Singhal', gender: 'male' },
    ],
    'Class 3-A': [
      { first: 'Arnav', last: 'Bannerjee', gender: 'male' },
      { first: 'Riya', last: 'Pandey', gender: 'female' },
      { first: 'Dhruv', last: 'Sethi', gender: 'male' },
      { first: 'Avani', last: 'Mishra', gender: 'female' },
      { first: 'Parth', last: 'Bhatt', gender: 'male' },
    ],
    'Class 3-B': [
      { first: 'Vivaan', last: 'Kulkarni', gender: 'male' },
      { first: 'Navya', last: 'Prasad', gender: 'female' },
      { first: 'Yash', last: 'Kapoor', gender: 'male' },
      { first: 'Siya', last: 'Bhatnagar', gender: 'female' },
      { first: 'Samar', last: 'Roy', gender: 'male' },
    ],
    'Class 4-A': [
      { first: 'Kavya', last: 'Sinha', gender: 'female' },
      { first: 'Dev', last: 'Tripathi', gender: 'male' },
      { first: 'Prisha', last: 'Reddy', gender: 'female' },
      { first: 'Manan', last: 'Chawla', gender: 'male' },
      { first: 'Kyra', last: 'Bhasin', gender: 'female' },
    ],
    'Class 4-B': [
      { first: 'Ojas', last: 'Vaidya', gender: 'male' },
      { first: 'Mira', last: 'Dutta', gender: 'female' },
      { first: 'Rudra', last: 'Nanda', gender: 'male' },
      { first: 'Ahana', last: 'Mukherjee', gender: 'female' },
      { first: 'Kush', last: 'Mahajan', gender: 'male' },
    ],
    'Class 5-A': [
      { first: 'Rahul', last: 'Deshmukh', gender: 'male' },
      { first: 'Simran', last: 'Kaur', gender: 'female' },
      { first: 'Aman', last: 'Sharma', gender: 'male' },
      { first: 'Sneha', last: 'Patil', gender: 'female' },
      { first: 'Aditya', last: 'Birla', gender: 'male' },
    ],
    'Class 5-B': [
      { first: 'Vijay', last: 'Mallya', gender: 'male' },
      { first: 'Pooja', last: 'Hegde', gender: 'female' },
      { first: 'Rohit', last: 'Varma', gender: 'male' },
      { first: 'Meera', last: 'Krishnan', gender: 'female' },
      { first: 'Kunal', last: 'Grover', gender: 'male' },
    ],
    'Class 9-A': [
      { first: 'Devansh', last: 'Saxena', gender: 'male' },
      { first: 'Priya', last: 'Agarwal', gender: 'female' },
      { first: 'Reyansh', last: 'Malhotra', gender: 'male' },
      { first: 'Avani', last: 'Deshmukh', gender: 'female' },
      { first: 'Siddharth', last: 'Trivedi', gender: 'male' },
    ],
    'Class 9-B': [
      { first: 'Riya', last: 'Chaudhari', gender: 'female' },
      { first: 'Yashwardhan', last: 'Rao', gender: 'male' },
      { first: 'Tanisha', last: 'Mittal', gender: 'female' },
      { first: 'Harshit', last: 'Chawla', gender: 'male' },
      { first: 'Sneha', last: 'Rastogi', gender: 'female' },
    ],
    'Class 10-A': [
      { first: 'Rahul', last: 'Kumar', gender: 'male' },
      { first: 'Simran', last: 'Kaur', gender: 'female' },
      { first: 'Aman', last: 'Sharma', gender: 'male' },
      { first: 'Sneha', last: 'Patil', gender: 'female' },
      { first: 'Vijay', last: 'Mallya', gender: 'male' },
      { first: 'Pooja', last: 'Sharma', gender: 'female' },
    ],
    'Class 10-B': [
      { first: 'Aditya', last: 'Birla', gender: 'male' },
      { first: 'Priya', last: 'Singh', gender: 'female' },
      { first: 'Kanishk', last: 'Goel', gender: 'male' },
      { first: 'Tanvi', last: 'Saxena', gender: 'female' },
      { first: 'Bhavya', last: 'Shah', gender: 'male' },
    ],
  };

  let totalCreated = 0;

  for (let i = 0; i < classNames.length; i++) {
    const cName = classNames[i];
    let cls = await classRepo.findOne({
      where: { schoolId, name: cName, isDeleted: false },
    });
    if (!cls) {
      cls = classRepo.create({
        schoolId,
        academicSessionId: activeSession.id,
        name: cName,
        classCode: `CLS-${i + 1}`,
      });
      cls = await classRepo.save(cls);
    }

    const secNames = ['A', 'B'];
    for (const secLetter of secNames) {
      let sec = await sectionRepo.findOne({
        where: { classId: cls.id, name: secLetter, isDeleted: false },
      });
      if (!sec) {
        sec = sectionRepo.create({
          schoolId,
          academicSessionId: activeSession.id,
          classId: cls.id,
          name: secLetter,
          capacity: 40,
        });
        sec = await sectionRepo.save(sec);
      }

      const existingEnrollments = await enrollmentRepo.find({
        where: { schoolId, classId: cls.id, sectionId: sec.id, isDeleted: false },
      });

      if (existingEnrollments.length >= 3) {
        continue;
      }

      const key = `${cName}-${secLetter}`;
      const templateList = studentNamesByClassSec[key] || [
        { first: `Student_${cName}_${secLetter}_1`, last: 'Kumar', gender: 'male' },
        { first: `Student_${cName}_${secLetter}_2`, last: 'Sharma', gender: 'female' },
        { first: `Student_${cName}_${secLetter}_3`, last: 'Singh', gender: 'male' },
        { first: `Student_${cName}_${secLetter}_4`, last: 'Gupta', gender: 'female' },
      ];

      for (let rIdx = 0; rIdx < templateList.length; rIdx++) {
        const st = templateList[rIdx];
        const rollNum = String(rIdx + 1);
        const admissionNum = `ADM-${cls.classCode}-${secLetter}-${100 + rIdx + 1}`;
        const studentCode = `STU-${cls.classCode}-${secLetter}-${100 + rIdx + 1}`;

        const student = studentRepo.create({
          schoolId,
          firstName: st.first,
          lastName: st.last,
          gender: st.gender,
          dob: '2014-05-15',
          admissionNumber: admissionNum,
          studentCode,
          fatherName: `Mr. ${st.last}`,
          motherName: `Mrs. ${st.last}`,
          phone: '9876543210',
          mobile: '9876543210',
          isActive: true,
          isDeleted: false,
        });
        const savedStudent = await studentRepo.save(student);

        const enrollment = enrollmentRepo.create({
          schoolId,
          studentId: savedStudent.id,
          classId: cls.id,
          sectionId: sec.id,
          academicSessionId: activeSession.id,
          rollNumber: rollNum,
          enrollmentState: EnrollmentStatusEnum.ACTIVE,
          enrollmentType: EnrollmentTypeEnum.ADMISSION,
          isCurrent: true,
          startDate: new Date().toISOString().split('T')[0],
          isActive: true,
          isDeleted: false,
        });
        await enrollmentRepo.save(enrollment);
        totalCreated++;
      }
    }
  }

  return {
    message: `Seeded classes, sections, and ${totalCreated} students successfully!`,
    totalCreated,
  };
}

async function runSeed() {
  console.log('🚀 Initializing Database Connection for Student Seeding...');
  const dataSource = (await AppDataSource) as DataSource;
  if (!dataSource) {
    console.error('❌ Failed to create Data Source');
    process.exit(1);
  }

  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }
  console.log('✅ Database connected successfully!');

  try {
    const targetSchoolId = process.argv[2] || '2';
    console.log(`🌱 Starting Student Data Seeding for School ID: ${targetSchoolId}...`);
    const result = await seedStudentsForSchool(dataSource, targetSchoolId);
    console.log('🎉 Student seeding completed successfully!');
    console.log(result);
  } catch (error) {
    console.error('⚠️ Exception occurred during student seeding:', (error as Error).message);
  } finally {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('🔒 Database connection closed.');
    }
  }
}

if (require.main === module) {
  runSeed();
}
