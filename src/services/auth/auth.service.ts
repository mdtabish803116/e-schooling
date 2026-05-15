import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { SchoolOwnerRegisterDto } from '../../interfaces/request/auth/school-owner-register.dto';
import { SchoolOwnerLoginDto } from '../../interfaces/request/auth/school-owner-login.dto';
import { SchoolOwner } from '../../models/entities/school/school-owner.entity';
import { SchoolUser } from '../../models/entities/school/school-user.entity';
import { Student } from '../../models/entities/student/student.entity';
import { UserRole } from '../../models/entities/rbac/user-role.entity';
import { Role } from '../../models/entities/rbac/role.entity';
import { School } from '../../models/entities/school/school.entity';
import { SchoolOwnerRoleEnum } from '../../models/enums/enums';
import { SchoolUserLoginDto } from 'src/interfaces/request/auth/school-user-login.dto';
import { StudentLoginDto } from 'src/interfaces/request/auth/student-login.dto';

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
      const existingOwner = await queryRunner.manager.findOne(SchoolOwner, {
        where: { email: dto.ownerEmail },
      });

      if (existingOwner) {
        throw new BadRequestException('Email already registered');
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(dto.password, salt);

      // Create Owner
      const owner = new SchoolOwner();
      owner.fullName = dto.ownerName;
      owner.email = dto.ownerEmail;
      owner.phone = dto.ownerPhone;
      owner.passwordHash = hashedPassword;
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
      where: { email: dto.email },
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
      where: { internalSchoolCode: dto.schoolCode, isActive: true, isDeleted: false }
    });
    if (!school) {
      throw new UnauthorizedException('Invalid school code');
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
    const userRoles = await this.dataSource.getRepository(UserRole).find({
      where: { userId: user.id, isActive: true, isDeleted: false }
    });

    if (userRoles.length === 0) {
      throw new ForbiddenException('Login failed: No roles assigned to your account. Please contact your school administrator.');
    }

    // Get role names
    const roleIds = userRoles.map(ur => ur.roleId);
    const roleEntities = await this.dataSource.getRepository(Role).createQueryBuilder('role')
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
      }
    };
  }

  /**
   * Login as a Student
   */
  async studentLogin(dto: StudentLoginDto) {
    const school = await this.dataSource.getRepository(School).findOne({
      where: { internalSchoolCode: dto.schoolCode, isActive: true, isDeleted: false }
    });
    if (!school) {
      throw new UnauthorizedException('Invalid school code');
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
      }
    };
  }
}
