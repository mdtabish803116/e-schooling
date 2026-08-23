import 'dotenv/config';
import { DataSource } from 'typeorm';
import AppDataSource from '../database/postgres/data-source';
import { Class } from '../../models/entities/academic/class.entity';
import { Section } from '../../models/entities/academic/section.entity';
import { AcademicSession } from '../../models/entities/academic/academic-session.entity';

/**
 * Seed Script for Class & Section Modules
 * Seeds default classes and sections using TypeORM DataSource.
 */
export async function seedClassAndSectionModule(
  dataSource: DataSource,
  schoolId: string = '2',
) {
  console.log(
    `[SEED] Initializing Class & Section Module seed for schoolId: ${schoolId}...`,
  );

  const classRepo = dataSource.getRepository(Class);
  const sectionRepo = dataSource.getRepository(Section);
  const sessionRepo = dataSource.getRepository(AcademicSession);

  // Get or create Academic Session
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

  const classesToSeed = [
    {
      name: 'Class 9',
      classCode: 'CLS-09',
      sections: [
        { name: 'A', capacity: 25 },
        { name: 'B', capacity: 20 },
      ],
    },
    {
      name: 'Class 10',
      classCode: 'CLS-10',
      sections: [
        { name: 'A', capacity: 25 },
        { name: 'B', capacity: 25 },
      ],
    },
    {
      name: 'Class 11 - Science',
      classCode: 'CLS-11-SCI',
      sections: [
        { name: 'A', capacity: 20 },
        { name: 'B', capacity: 20 },
      ],
    },
    {
      name: 'Class 12 - Commerce',
      classCode: 'CLS-12-COM',
      sections: [{ name: 'A', capacity: 40 }],
    },
  ];

  try {
    for (const item of classesToSeed) {
      let cls = await classRepo.findOne({
        where: { schoolId, name: item.name, isDeleted: false },
      });

      if (!cls) {
        console.log(`[SEED] Creating Class: ${item.name}...`);
        cls = classRepo.create({
          schoolId,
          academicSessionId: activeSession.id,
          name: item.name,
          classCode: item.classCode,
        });
        cls = await classRepo.save(cls);
      }

      for (const secItem of item.sections) {
        let sec = await sectionRepo.findOne({
          where: { classId: cls.id, name: secItem.name, isDeleted: false },
        });

        if (!sec) {
          console.log(
            `[SEED]   Creating Section ${secItem.name} for Class ${item.name}...`,
          );
          sec = sectionRepo.create({
            schoolId,
            academicSessionId: activeSession.id,
            classId: cls.id,
            name: secItem.name,
            capacity: secItem.capacity,
          });
          await sectionRepo.save(sec);
        }
      }
    }
    console.log('[SEED] Class & Section Module seed completed successfully!');
  } catch (error) {
    console.error('[SEED] Error running Class & Section seed:', error);
  }
}

async function runSeed() {
  console.log('🚀 Initializing Database for Class & Section Seed...');
  const dataSource = (await AppDataSource) as DataSource;

  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }
  console.log('✅ Database connected!');

  try {
    const targetSchoolId = process.argv[2] || '2';
    await seedClassAndSectionModule(dataSource, targetSchoolId);
  } catch (error) {
    console.error('❌ Seed failed:', (error as Error).message);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('🔒 Connection closed.');
    }
  }
}

if (require.main === module) {
  runSeed();
}
