import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { SchoolOwnerRegisterDto } from '../../interfaces/request/auth/school-owner-register.dto';
import { SchoolOwnerLoginDto } from '../../interfaces/request/auth/school-owner-login.dto';
import { SchoolOwner } from '../../models/entities/school/school-owner.entity';
import { SchoolOwnerRoleEnum, StatusEnum } from '../../models/enums/enums';

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
      owner.status = StatusEnum.ACTIVE;

      const savedOwner = await queryRunner.manager.save(owner);

      await queryRunner.commitTransaction();

      // Generate JWT
      const payload = { sub: savedOwner.id, email: savedOwner.email, role: SchoolOwnerRoleEnum.OWNER, actorType: 'school_owner' as const };
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

    if (owner.status !== StatusEnum.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    // Update last login
    owner.lastLoginAt = new Date();
    await this.dataSource.getRepository(SchoolOwner).save(owner);

    const payload = { sub: owner.id, email: owner.email, role: SchoolOwnerRoleEnum.OWNER, actorType: 'school_owner' as const };
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
}
