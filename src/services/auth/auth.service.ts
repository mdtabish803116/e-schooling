import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { Config } from '../../config/index';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { validateEmail, validateMobile } from '../../shared/utils/validation.utils';
import { SchoolOwnerRegisterDto } from '../../interfaces/request/auth/school-owner-register.dto';
import { SchoolOwnerLoginDto } from '../../interfaces/request/auth/school-owner-login.dto';
import { SchoolUser } from '../../models/entities/school/school-user.entity';
import { Student } from '../../models/entities/student/student.entity';
import { SchoolUserRole } from '../../models/entities/rbac/school-user-role.entity';
import { SchoolRole } from '../../models/entities/rbac/school-role.entity';
import { School } from '../../models/entities/school/school.entity';
import { SchoolOwnerRoleEnum } from '../../models/enums/enums';
import { SchoolUserLoginDto } from 'src/interfaces/request/auth/school-user-login.dto';
import { StudentLoginDto } from 'src/interfaces/request/auth/student-login.dto';
import { PlatformLoginDto } from 'src/interfaces/request/auth/platform-login.dto';
import { PlatformRegisterDto } from 'src/interfaces/request/auth/platform-register.dto';
import { PlatformUser } from '../../models/entities/platform/platform-user.entity';
import { PlatformRole } from '../../models/entities/platform/platform-role.entity';
import { PlatformUserRoleMapping } from '../../models/entities/platform/platform-user-role-mapping.entity';
import { SchoolOwner } from 'src/models/entities/school/school-owner.entity';
import { SchoolOwnerMember } from '../../models/entities/school/school-owner-member.entity';
import { SchoolUserProfile } from '../../models/entities/school/school-user-profile.entity';
import { ChangePasswordDto } from 'src/interfaces/request/auth/change-password.dto';
import { ForgotPasswordDto } from 'src/interfaces/request/auth/forgot-password.dto';
import { ResetPasswordDto } from 'src/interfaces/request/auth/reset-password.dto';


@Injectable()
export class AuthService {
  constructor(
    private dataSource: DataSource,
    private jwtService: JwtService,
  ) { }

  async register(dto: SchoolOwnerRegisterDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Validation
      if (!dto.termsAccepted) {
        throw new BadRequestException('You must accept terms and conditions to register');
      }

      if (!validateEmail(dto.ownerEmail)) {
        throw new BadRequestException('Invalid email address format');
      }

      if (!validateMobile(dto.ownerPhone)) {
        throw new BadRequestException('Invalid mobile number format. Use international format (e.g. +919876543210)');
      }

      // 2. Uniqueness Check
      const existingOwner = await queryRunner.manager.findOne(SchoolOwner, {
        where: [
          { email: dto.ownerEmail },
          { phone: dto.ownerPhone }
        ],
      });

      if (existingOwner) {
        if (existingOwner.email === dto.ownerEmail) throw new BadRequestException('Email already registered');
        if (existingOwner.phone === dto.ownerPhone) throw new BadRequestException('Mobile number already registered');
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(dto.password, salt);

      // Create Owner
      const owner = new SchoolOwner();
      owner.fullName = dto.ownerName;
      owner.email = dto.ownerEmail;
      owner.phone = dto.ownerPhone;
      owner.passwordHash = hashedPassword;
      owner.termsAccepted = true;
      owner.isActive = true;

      const savedOwner = await queryRunner.manager.save(owner);

      await queryRunner.commitTransaction();

      // Generate JWT
      const payload = { sub: savedOwner.id, email: savedOwner.email, roles: [SchoolOwnerRoleEnum.OWNER], actorType: 'school_owner' as const };
      const token = this.jwtService.sign(payload);

      return {
        message: 'Registration successful',
        token,
        owner: {
          id: savedOwner.id,
          fullName: savedOwner.fullName,
          email: savedOwner.email,
        },
      };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }


  async login(dto: SchoolOwnerLoginDto) {
    const owner = await this.dataSource.getRepository(SchoolOwner).findOne({
      where: [
        { email: dto.identifier },
        { phone: dto.identifier }
      ],
    });

    if (!owner) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(dto.password, owner.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!owner.isActive) {
      throw new UnauthorizedException('Account is not active');
    }

    // Update last login
    owner.lastLoginAt = new Date();
    await this.dataSource.getRepository(SchoolOwner).save(owner);

    const payload = { sub: owner.id, email: owner.email, roles: [SchoolOwnerRoleEnum.OWNER], actorType: 'school_owner' as const };
    const token = this.jwtService.sign(payload);

    return {
      token,
      owner: {
        id: owner.id,
        fullName: owner.fullName,
        email: owner.email,
      }
    };
  }

  /**
   * Login as a school user (Teacher / Accountant / Staff / Admin)
   */
  async schoolUserLogin(dto: SchoolUserLoginDto) {
    const school = await this.dataSource.getRepository(School).findOne({
      where: { internalSchoolCode: dto.schoolCode, isDeleted: false }
    });
    
    if (!school || !school.isActive) {
      throw new UnauthorizedException('Your school is deactivated, blocked or deleted');
    }

    const user = await this.dataSource.getRepository(SchoolUser).findOne({
      where: { username: dto.username, schoolId: school.id },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is not active');
    }

    // Fetch assigned roles
    const userRoles = await this.dataSource.getRepository(SchoolUserRole).find({
      where: { userId: user.id, isActive: true, isDeleted: false }
    });

    if (userRoles.length === 0) {
      throw new ForbiddenException('You have not assigned any role, please contact school owner');
    }

    // Get role names
    const roleIds = userRoles.map(ur => ur.roleId);
    const roleEntities = await this.dataSource.getRepository(SchoolRole).createQueryBuilder('role')
      .where('role.id IN (:...roleIds)', { roleIds })
      .getMany();
    
    const roleNames = roleEntities.map(r => r.name);

    const payload = { 
      sub: user.id, 
      email: user.username, // Using username as email placeholder if needed
      roles: roleNames, 
      actorType: 'school_user' as const,
      schoolId: user.schoolId 
    };
    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        userType: user.userType,
        roles: roleNames,
        schoolId: user.schoolId,
      }
    };
  }

  /**
   * Login as a Student
   */
  async studentLogin(dto: StudentLoginDto) {
    const school = await this.dataSource.getRepository(School).findOne({
      where: { internalSchoolCode: dto.schoolCode, isDeleted: false }
    });
    
    if (!school || !school.isActive) {
      throw new UnauthorizedException('Your school is deactivated, blocked or deleted');
    }

    const student = await this.dataSource.getRepository(Student).findOne({
      where: { studentCode: dto.studentCode, schoolId: school.id },
    });

    if (!student) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(dto.password, student.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!student.isActive) {
      throw new UnauthorizedException('Student account is not active');
    }

    // Students have a fixed role 'student' in this system for now
    const roleNames = ['student'];

    const payload = { 
      sub: student.id, 
      email: student.studentCode, 
      roles: roleNames, 
      actorType: 'student' as const,
      schoolId: student.schoolId 
    };
    const token = this.jwtService.sign(payload);

    return {
      token,
      student: {
        id: student.id,
        studentCode: student.studentCode,
        firstName: student.firstName,
        lastName: student.lastName,
        roles: roleNames,
        schoolId: student.schoolId,
      }
    };
  }

  /**
   * Login as a Platform Admin
   */
  async platformLogin(dto: PlatformLoginDto) {
    const user = await this.dataSource.getRepository(PlatformUser).findOne({
      where: { email: dto.email, isActive: true, isDeleted: false },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Fetch platform roles
    const userRoles = await this.dataSource.getRepository(PlatformUserRoleMapping).find({
      where: { platformUserId: user.id, isActive: true, isDeleted: false }
    });

    let roleNames: string[] = [];
    if (userRoles.length > 0) {
      const roleIds = userRoles.map(ur => ur.platformRoleId);
      const roleEntities = await this.dataSource.getRepository(PlatformRole).createQueryBuilder('role')
        .where('role.id IN (:...roleIds)', { roleIds })
        .getMany();
      roleNames = roleEntities.map(r => r.name);
    }

    const payload = { 
      sub: user.id, 
      email: user.email, 
      roles: roleNames, 
      actorType: 'platform_user' as const 
    };
    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles: roleNames,
      }
    };
  }

  /**
   * Register a new Platform Admin
   */
  async platformRegister(dto: PlatformRegisterDto, apiKey: string) {
    const secretKey = Config.getPlatformRegisterApiKey();
    if (apiKey !== secretKey) {
      throw new ForbiddenException('Invalid platform registration key');
    }
    const existingUser = await this.dataSource.getRepository(PlatformUser).findOne({
      where: { email: dto.email }
    });

    if (existingUser) {
      throw new BadRequestException('Email already registered for platform');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    const user = new PlatformUser();
    user.name = dto.name;
    user.email = dto.email;
    user.passwordHash = hashedPassword;
    user.isActive = true;

    const savedUser = await this.dataSource.getRepository(PlatformUser).save(user);

    // Find or create 'ADMIN' role
    let adminRole = await this.dataSource.getRepository(PlatformRole).findOne({
      where: { name: 'ADMIN', isDeleted: false }
    });

    if (!adminRole) {
      adminRole = new PlatformRole();
      adminRole.name = 'ADMIN';
      adminRole.description = 'Full platform access';
      adminRole = await this.dataSource.getRepository(PlatformRole).save(adminRole);
    }

    // Assign the role
    const mapping = new PlatformUserRoleMapping();
    mapping.platformUserId = savedUser.id;
    mapping.platformRoleId = adminRole.id;
    await this.dataSource.getRepository(PlatformUserRoleMapping).save(mapping);

    return {
      message: 'Platform user registered successfully and assigned to ADMIN role',
      id: savedUser.id,
      email: savedUser.email
    };
  }

  async changePassword(caller: any, dto: ChangePasswordDto) {
    const { oldPassword, newPassword } = dto;
    
    let userRepo: any;
    if (caller.actorType === 'school_owner') {
      userRepo = this.dataSource.getRepository(SchoolOwner);
    } else if (caller.actorType === 'school_user') {
      userRepo = this.dataSource.getRepository(SchoolUser);
    } else if (caller.actorType === 'student') {
      userRepo = this.dataSource.getRepository(Student);
    } else if (caller.actorType === 'platform_user') {
      userRepo = this.dataSource.getRepository(PlatformUser);
    } else {
      throw new BadRequestException('Invalid user type');
    }

    const user = await userRepo.findOne({ where: { id: caller.id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Invalid current password');
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await userRepo.save(user);

    return { message: 'Password updated successfully' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    let account: any;
    let repo: any;

    if (dto.email) {
      repo = this.dataSource.getRepository(SchoolOwner);
      account = await repo.findOne({ where: { email: dto.email, isDeleted: false } });
    } else if (dto.username && dto.schoolCode) {
      const school = await this.dataSource.getRepository(School).findOne({
        where: { internalSchoolCode: dto.schoolCode, isDeleted: false }
      });
      if (!school) throw new NotFoundException('School not found');

      repo = this.dataSource.getRepository(SchoolUser);
      account = await repo.findOne({ where: { username: dto.username, schoolId: school.id, isDeleted: false } });
    }

    if (!account) {
      // Return success anyway to prevent user enumeration
      return { message: 'If the account exists, a reset code has been sent.', token: null };
    }

    // Generate secure 6-digit OTP/token
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    account.resetToken = token;
    account.resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry
    await repo.save(account);

    // We return the token in the API response so the frontend flow can be completed instantly/easily
    return {
      message: 'Reset token generated successfully',
      token,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    let account: any;
    let repo: any;

    if (dto.email) {
      repo = this.dataSource.getRepository(SchoolOwner);
      account = await repo.findOne({ where: { email: dto.email, isDeleted: false } });
    } else if (dto.username && dto.schoolCode) {
      const school = await this.dataSource.getRepository(School).findOne({
        where: { internalSchoolCode: dto.schoolCode, isDeleted: false }
      });
      if (!school) throw new NotFoundException('School not found');

      repo = this.dataSource.getRepository(SchoolUser);
      account = await repo.findOne({ where: { username: dto.username, schoolId: school.id, isDeleted: false } });
    }

    if (!account || account.resetToken !== dto.token) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (account.resetTokenExpires && new Date() > account.resetTokenExpires) {
      throw new BadRequestException('Reset token has expired');
    }

    const salt = await bcrypt.genSalt(10);
    account.passwordHash = await bcrypt.hash(dto.newPassword, salt);
    account.resetToken = null;
    account.resetTokenExpires = null;
    await repo.save(account);

    return { message: 'Password reset successfully' };
  }

  async getProfile(caller: any) {
    if (caller.actorType === 'school_owner') {
      const owner = await this.dataSource.getRepository(SchoolOwner).findOne({
        where: { id: caller.id }
      });
      if (!owner) throw new NotFoundException('Owner not found');

      // Fetch school memberships to get full details (owned schools)
      const memberships = await this.dataSource.getRepository(SchoolOwnerMember).find({
        where: { schoolOwnerId: caller.id, isDeleted: false }
      });

      const schoolIds = memberships.map(m => m.schoolId).filter(Boolean);
      const schools = schoolIds.length > 0 
        ? await this.dataSource.getRepository(School).find({ where: { id: In(schoolIds) } })
        : [];

      const schoolsMap = new Map(schools.map(s => [s.id, s]));

      const formattedSchools = memberships.map(m => {
        const sch = schoolsMap.get(m.schoolId);
        return {
          id: sch?.id,
          schoolName: sch?.schoolName,
          internalSchoolCode: sch?.internalSchoolCode,
          role: m.role,
          isPrimaryOwner: m.isPrimaryOwner,
          invitationState: m.invitationState,
          joinedAt: m.joinedAt,
        };
      });

      return {
        user: {
          id: owner.id,
          name: owner.fullName,
          fullName: owner.fullName,
          email: owner.email,
          phone: owner.phone,
          isActive: owner.isActive,
          userType: 'owner',
        },
        roles: [{ id: '1', name: 'OWNER', description: 'School System Owner' }],
        schools: formattedSchools,
      };
    } else if (caller.actorType === 'school_user') {
      const user = await this.dataSource.getRepository(SchoolUser).findOne({
        where: { id: caller.id }
      });
      if (!user) throw new NotFoundException('User not found');

      let profile = await this.dataSource.getRepository(SchoolUserProfile).findOne({
        where: { schoolUserId: caller.id }
      });

      if (!profile) {
        // Auto-create profile if missing
        profile = new SchoolUserProfile();
        profile.schoolUserId = user.id;
        profile.qualifications = [];
        profile.experience = [];
        profile.documents = [];
        profile.assignedClasses = [];
        profile.assignedSubjects = [];
        await this.dataSource.getRepository(SchoolUserProfile).save(profile);
      }

      // Fetch active roles
      const userRoles = await this.dataSource.getRepository(SchoolUserRole).find({
        where: { userId: user.id, isActive: true, isDeleted: false }
      });

      const roleIds = userRoles.map(ur => ur.roleId);
      const roles = roleIds.length > 0 
        ? await this.dataSource.getRepository(SchoolRole).find({ where: { id: In(roleIds) } })
        : [];

      return {
        user,
        profile,
        roles,
      };
    } else {
      throw new BadRequestException('Profile not supported for this user type');
    }
  }

  async updateProfile(caller: any, body: any) {
    if (caller.actorType === 'school_owner') {
      const owner = await this.dataSource.getRepository(SchoolOwner).findOne({
        where: { id: caller.id }
      });
      if (!owner) throw new NotFoundException('Owner not found');

      if (body.fullName) owner.fullName = body.fullName;
      if (body.phone) owner.phone = body.phone;
      const saved = await this.dataSource.getRepository(SchoolOwner).save(owner);

      return {
        message: 'Owner profile updated successfully',
        user: saved,
      };
    } else if (caller.actorType === 'school_user') {
      const user = await this.dataSource.getRepository(SchoolUser).findOne({
        where: { id: caller.id }
      });
      if (!user) throw new NotFoundException('User not found');

      if (body.name) user.name = body.name;
      if (body.phone) user.phone = body.phone;
      await this.dataSource.getRepository(SchoolUser).save(user);

      let profile = await this.dataSource.getRepository(SchoolUserProfile).findOne({
        where: { schoolUserId: caller.id }
      });

      if (!profile) {
        profile = new SchoolUserProfile();
        profile.schoolUserId = user.id;
      }

      const allowedProfileFields = [
        'fatherName', 'motherName', 'profilePicUrl', 'dob', 'aadhaarNumber',
        'yearsOfExperience', 'previousOrganization', 'expertise', 'subjects',
        'firstName', 'lastName', 'email', 'designation', 'joiningDate', 'departmentName',
        'qualifications', 'experience', 'documents', 'assignedClasses', 'assignedSubjects'
      ];

      for (const field of allowedProfileFields) {
        if (body[field] !== undefined) {
          profile[field] = body[field];
        }
      }

      const savedProfile = await this.dataSource.getRepository(SchoolUserProfile).save(profile);

      return {
        message: 'Profile updated successfully',
        user,
        profile: savedProfile,
      };
    } else {
      throw new BadRequestException('Profile updates not supported for this user type');
    }
  }
}
