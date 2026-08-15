import { DataSource } from 'typeorm';
import { SchoolUser } from '../../models/entities/school/school-user.entity';
import { SchoolUserProfile } from '../../models/entities/school/school-user-profile.entity';
import { UserTypeEnum } from '../../models/enums/enums';

export async function seedSchoolUserProfiles(
  dataSource: DataSource,
  schoolId?: string,
) {
  const userRepo = dataSource.getRepository(SchoolUser);
  const profileRepo = dataSource.getRepository(SchoolUserProfile);

  const whereCond: any = { isDeleted: false };
  if (schoolId) {
    whereCond.schoolId = schoolId;
  }

  const users = await userRepo.find({ where: whereCond });
  console.log(
    `👤 Found ${users.length} school users to verify profiles for...`,
  );

  let createdCount = 0;
  let updatedCount = 0;

  for (const user of users) {
    let profile = await profileRepo.findOne({
      where: { schoolUserId: user.id },
    });

    const nameParts = (user.name || '').trim().split(/\s+/);
    const firstName = nameParts[0] || 'Staff';
    const lastName = nameParts.slice(1).join(' ') || 'Member';

    const defaultDesignation =
      user.userType === UserTypeEnum.ACADEMIC
        ? 'Senior Teacher'
        : 'Staff Member';

    const defaultDepartment =
      user.userType === UserTypeEnum.ACADEMIC
        ? 'Academics & Science'
        : 'General Support';

    if (!profile) {
      profile = new SchoolUserProfile();
      profile.schoolUserId = user.id;
      profile.firstName = firstName;
      profile.lastName = lastName;
      profile.fatherName = `${firstName}'s Father`;
      profile.motherName = `${firstName}'s Mother`;
      profile.designation = defaultDesignation;
      profile.departmentName = defaultDepartment;
      profile.gender = 'Male';
      profile.emergencyContact = user.phone || '+91 9876543210';
      profile.address = 'Campus Quarters, Institutional Area';
      profile.employmentStatus = 'Full-time';
      profile.salaryType = 'Monthly';
      profile.baseSalary = 45000;
      profile.allowances = 5000;
      profile.bankName = 'State Bank of India';
      profile.accountNumber = `30198472910${user.id}`;
      profile.ifscCode = 'SBIN0001234';
      profile.panNumber = `ABCDE123${user.id}F`;
      profile.aadhaarNumber = `5678-1234-90${user.id.padStart(2, '0')}`;
      profile.yearsOfExperience = 4;
      profile.previousOrganization = 'Greenwood International';
      profile.expertise = 'Curriculum Planning, Student Counseling';
      profile.subjects = 'Mathematics, Physics';
      profile.qualifications = [
        { degree: 'B.Ed', university: 'Central University', year: '2020' },
        { degree: 'M.Sc', university: 'State University', year: '2018' },
      ];
      profile.experience = [
        {
          role: 'Teacher',
          institution: 'St. Xavier School',
          duration: '2020 - 2023',
        },
      ];
      profile.documents = [];
      profile.assignedClasses = [];
      profile.assignedSubjects = [];

      await profileRepo.save(profile);
      createdCount++;
    } else {
      let isChanged = false;
      if (!profile.firstName) {
        profile.firstName = firstName;
        isChanged = true;
      }
      if (!profile.lastName) {
        profile.lastName = lastName;
        isChanged = true;
      }
      if (!profile.designation) {
        profile.designation = defaultDesignation;
        isChanged = true;
      }
      if (!profile.departmentName) {
        profile.departmentName = defaultDepartment;
        isChanged = true;
      }
      if (isChanged) {
        await profileRepo.save(profile);
        updatedCount++;
      }
    }
  }

  console.log(
    `✅ School User Profiles Seeding Complete: ${createdCount} created, ${updatedCount} updated.`,
  );
  return { createdCount, updatedCount };
}
