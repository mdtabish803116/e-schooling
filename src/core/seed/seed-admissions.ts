import 'dotenv/config';
import { DataSource } from 'typeorm';
import AppDataSource from '../database/postgres/data-source';
import { AdmissionEnquiry } from '../../models/entities/student/admission-enquiry.entity';
import { AdmissionApplication } from '../../models/entities/student/admission-application.entity';

export async function seedAdmissionsData(
  dataSource: DataSource,
  schoolId: string = '2',
) {
  console.log(
    `📋 Starting Admission Enquiries & Pipeline Data Seeding for School #${schoolId}...`,
  );

  const enquiryRepo = dataSource.getRepository(AdmissionEnquiry);
  const appRepo = dataSource.getRepository(AdmissionApplication);

  // 1. Seed Sample Admission Enquiries
  const sampleEnquiries = [
    {
      schoolId,
      enquiryNo: 'ENQ-2026-001',
      studentName: 'Aarav Sharma',
      parentName: 'Ramesh Sharma',
      contactNumber: '9876543210',
      email: 'ramesh.sharma@example.com',
      targetClassId: '1',
      targetClassName: 'Class 1',
      gender: 'MALE',
      previousSchool: 'St. Mary Pre-School',
      source: 'WALK_IN',
      stage: 'ENQUIRY',
      enquiryStatus: 'NEW',
      notes: 'Parent requested morning batch info and prospectus.',
      assignedToStaffName: 'Admission Counselor',
    },
    {
      schoolId,
      enquiryNo: 'ENQ-2026-002',
      studentName: 'Diya Patel',
      parentName: 'Suresh Patel',
      contactNumber: '9812345678',
      email: 'suresh.patel@example.com',
      targetClassId: '2',
      targetClassName: 'Class 2',
      gender: 'FEMALE',
      previousSchool: 'Little Angels Primary',
      source: 'WEBSITE',
      stage: 'ENQUIRY',
      enquiryStatus: 'CONTACTED',
      notes: 'Called parent. Entrance assessment test scheduled.',
      assignedToStaffName: 'Admission Counselor',
    },
    {
      schoolId,
      enquiryNo: 'ENQ-2026-003',
      studentName: 'Kabir Verma',
      parentName: 'Vikram Verma',
      contactNumber: '9899887766',
      email: 'vikram.verma@example.com',
      targetClassId: '3',
      targetClassName: 'Class 3',
      gender: 'MALE',
      previousSchool: 'City Model Academy',
      source: 'REFERRAL',
      stage: 'APPROVAL',
      enquiryStatus: 'CONVERTED',
      notes: 'Application submitted and verified.',
      assignedToStaffName: 'Senior Administrator',
    },
  ];

  for (const item of sampleEnquiries) {
    const existing = await enquiryRepo.findOne({
      where: { schoolId, enquiryNo: item.enquiryNo },
    });
    if (!existing) {
      const created = enquiryRepo.create(item);
      await enquiryRepo.save(created);
      console.log(
        `  ✅ Seeded Admission Enquiry: ${item.enquiryNo} - ${item.studentName}`,
      );
    }
  }

  // 2. Seed Sample Admission Applications
  const sampleApplications = [
    {
      schoolId,
      applicationNo: 'APP-2026-101',
      firstName: 'Kabir',
      lastName: 'Verma',
      gender: 'MALE',
      dob: '2018-05-15',
      fatherName: 'Vikram Verma',
      fatherPhone: '9899887766',
      motherName: 'Sunita Verma',
      targetClassId: '3',
      targetClassName: 'Class 3',
      stage: 'APPROVAL',
      verificationStatus: 'VERIFIED',
      verifiedDocuments: [
        'Birth Certificate',
        'Transfer Certificate',
        'Address Proof',
        'Passport Photos',
      ],
      approvalRemarks: 'Documents verified and seat allocated in Class 3-A.',
      approvedBy: 'Principal Office',
    },
    {
      schoolId,
      applicationNo: 'APP-2026-102',
      firstName: 'Ananya',
      lastName: 'Gupta',
      gender: 'FEMALE',
      dob: '2019-09-20',
      fatherName: 'Rajesh Gupta',
      fatherPhone: '9711223344',
      motherName: 'Pooja Gupta',
      targetClassId: '2',
      targetClassName: 'Class 2',
      stage: 'VERIFICATION',
      verificationStatus: 'PENDING',
      verifiedDocuments: ['Birth Certificate', 'Address Proof'],
      approvalRemarks:
        'Awaiting original Transfer Certificate from previous school.',
      approvedBy: 'Admission Counselor',
    },
  ];

  for (const appItem of sampleApplications) {
    const existingApp = await appRepo.findOne({
      where: { schoolId, applicationNo: appItem.applicationNo },
    });
    if (!existingApp) {
      const createdApp = appRepo.create(appItem);
      await appRepo.save(createdApp);
      console.log(
        `  ✅ Seeded Admission Application: ${appItem.applicationNo} - ${appItem.firstName} ${appItem.lastName}`,
      );
    }
  }

  console.log('🎉 Admission Data Seeding Completed Successfully!\n');
}

async function runStandaloneSeed() {
  const dataSource = (await AppDataSource) as DataSource;
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }
  try {
    await seedAdmissionsData(dataSource, '2');
  } catch (error) {
    console.error('❌ Standalone Admissions Seed Failed:', error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

if (require.main === module) {
  void runStandaloneSeed();
}
