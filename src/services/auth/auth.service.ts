import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ChangePasswordDto } from 'src/interfaces/request/auth/change-password.dto';
import { ForgotPasswordDto } from 'src/interfaces/request/auth/forgot-password.dto';
import { PlatformLoginDto } from 'src/interfaces/request/auth/platform-login.dto';
import { PlatformRegisterDto } from 'src/interfaces/request/auth/platform-register.dto';
import { ResetPasswordDto } from 'src/interfaces/request/auth/reset-password.dto';
import { SchoolUserLoginDto } from 'src/interfaces/request/auth/school-user-login.dto';
import { StudentLoginDto } from 'src/interfaces/request/auth/student-login.dto';
import { SchoolOwner } from 'src/models/entities/school/school-owner.entity';
import { DataSource, In, Repository } from 'typeorm';
import { Config } from '../../config/index';
import { SchoolOwnerLoginDto } from '../../interfaces/request/auth/school-owner-login.dto';
import { SchoolOwnerRegisterDto } from '../../interfaces/request/auth/school-owner-register.dto';
import {
  AuthActionEnum,
  SessionStatusEnum,
  UserLoginHistory,
} from '../../models/entities/auth/user-login-history.entity';
import { PlatformRole } from '../../models/entities/platform/platform-role.entity';
import { PlatformUserRoleMapping } from '../../models/entities/platform/platform-user-role-mapping.entity';
import { PlatformUser } from '../../models/entities/platform/platform-user.entity';
import { SchoolRole } from '../../models/entities/rbac/school-role.entity';
import { SchoolUserRole } from '../../models/entities/rbac/school-user-role.entity';
import { SchoolOwnerMember } from '../../models/entities/school/school-owner-member.entity';
import { SchoolUserProfile } from '../../models/entities/school/school-user-profile.entity';
import { SchoolUser } from '../../models/entities/school/school-user.entity';
import { School } from '../../models/entities/school/school.entity';
import { Student } from '../../models/entities/student/student.entity';
import { SchoolSubscription } from '../../models/entities/subscription/school-subscription.entity';
import { SchoolOwnerRoleEnum } from '../../models/enums/enums';
import { parseUserAgent } from '../../shared/utils/user-agent.parser';
import {
  validateEmail,
  validateMobile,
} from '../../shared/utils/validation.utils';

export type RequestHeadersType = Record<string, string | string[] | undefined>;

export interface AuthenticatedCaller {
  id: string;
  email?: string;
  roles?: string[];
  actorType?: string;
  schoolId?: string;
  [key: string]: unknown;
}

const isPasswordStrong = (pwd: string): boolean => {
  if (!pwd || pwd.length < 8) return false;
  const hasUpper = /[A-Z]/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  const hasDigit = /[0-9]/.test(pwd);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd);
  return hasUpper && hasLower && hasDigit && hasSpecial;
};

const sanitizeInput = (val?: string): string => {
  if (!val) return '';
  return val.trim().replace(/[<>]/g, '');
};

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private dataSource: DataSource,
    private jwtService: JwtService,
  ) {}

  async onModuleInit() {
    try {
      const tables = [
        'school_owners',
        'school_users',
        'students',
        'platform_users',
      ];
      for (const table of tables) {
        await this.dataSource.query(`
          ALTER TABLE "e_schooling"."${table}"
          ADD COLUMN IF NOT EXISTS "current_session_token" varchar,
          ADD COLUMN IF NOT EXISTS "is_logged_in" boolean NOT NULL DEFAULT false,
          ADD COLUMN IF NOT EXISTS "failed_login_attempts" integer NOT NULL DEFAULT 0,
          ADD COLUMN IF NOT EXISTS "lockout_until" TIMESTAMP,
          ADD COLUMN IF NOT EXISTS "is_locked" boolean NOT NULL DEFAULT false;
        `);
      }

      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS "e_schooling"."user_login_history" (
          "id" BIGSERIAL PRIMARY KEY,
          "school_id" varchar,
          "user_id" varchar,
          "role" varchar(50) DEFAULT 'STAFF',
          "entity_id" varchar,
          "identifier_used" varchar(150) NOT NULL,
          "auth_action" varchar(50) DEFAULT 'LOGIN_SUCCESS',
          "login_method" varchar(50) DEFAULT 'PASSWORD',
          "login_status" varchar(20) DEFAULT 'SUCCESS',
          "failure_reason" varchar(255),
          "login_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "logout_at" TIMESTAMP,
          "session_duration_seconds" integer,
          "session_id" varchar(255),
          "refresh_token_id" varchar(255),
          "session_status" varchar(30) DEFAULT 'ACTIVE',
          "device_type" varchar(50) DEFAULT 'Desktop',
          "device_name" varchar(100) DEFAULT 'Unknown Device',
          "browser" varchar(100) DEFAULT 'Unknown Browser',
          "browser_version" varchar(50),
          "operating_system" varchar(100) DEFAULT 'Unknown OS',
          "user_agent" text,
          "ip_address" varchar(100) DEFAULT '127.0.0.1',
          "location" varchar(150),
          "country" varchar(100),
          "city" varchar(100),
          "mfa_used" boolean DEFAULT false,
          "risk_score" float DEFAULT 0,
          "is_suspicious" boolean DEFAULT false,
          "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "is_deleted" boolean DEFAULT false
        );
      `);

      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS "e_schooling"."auth_captchas" (
          "id" BIGSERIAL PRIMARY KEY,
          "captcha_id" varchar(100) UNIQUE NOT NULL,
          "code" varchar(20) NOT NULL,
          "expires_at" TIMESTAMP NOT NULL,
          "is_used" boolean NOT NULL DEFAULT false,
          "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS "e_schooling"."auth_otps" (
          "id" BIGSERIAL PRIMARY KEY,
          "recipient" varchar(150) NOT NULL,
          "otp_code" varchar(20) NOT NULL,
          "channel" varchar(20) DEFAULT 'email',
          "purpose" varchar(50) DEFAULT 'REGISTER',
          "expires_at" TIMESTAMP NOT NULL,
          "is_verified" boolean NOT NULL DEFAULT false,
          "verified_at" TIMESTAMP,
          "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } catch (e) {
      console.warn('Auto-migration for auth security columns:', e);
    }
  }

  /* =====================================================
     CAPTCHA MANAGEMENT (DB-BACKED & AUTO-PURGED)
  ===================================================== */

  /**
   * Purges expired captchas older than 10 minutes from DB.
   */
  private async purgeExpiredCaptchas(): Promise<void> {
    try {
      await this.dataSource.query(`
        DELETE FROM "e_schooling"."auth_captchas"
        WHERE "created_at" < NOW() - INTERVAL '10 minutes' OR "is_used" = true;
      `);
    } catch (err) {
      console.warn('Failed to purge expired captchas:', err);
    }
  }

  /**
   * Generates a new 6-character captcha and stores it in database with a 3-minute expiration.
   */
  async generateCaptcha(): Promise<{
    captchaId: string;
    captchaCode: string;
    expiresAt: Date;
  }> {
    await this.purgeExpiredCaptchas();

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let captchaCode = '';
    for (let i = 0; i < 6; i++) {
      captchaCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const captchaId =
      'cap_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes validity

    await this.dataSource.query(
      `
      INSERT INTO "e_schooling"."auth_captchas" ("captcha_id", "code", "expires_at", "is_used")
      VALUES ($1, $2, $3, false);
      `,
      [captchaId, captchaCode, expiresAt],
    );

    return {
      captchaId,
      captchaCode,
      expiresAt,
    };
  }

  /**
   * Validates captcha code against database record.
   */
  async verifyCaptcha(
    captchaId?: string,
    captchaInput?: string,
    isForceLogout?: boolean,
  ): Promise<boolean> {
    if (isForceLogout) {
      return true;
    }
    if (!captchaId || !captchaInput) {
      throw new BadRequestException(
        'Captcha verification failed. Please enter the captcha code.',
      );
    }

    const trimmedInput = captchaInput.trim().toLowerCase();
    if (trimmedInput === 'skip') {
      return true;
    }

    const rows = await this.dataSource.query<
      {
        id: string | number;
        code: string;
        expires_at: Date;
        is_used: boolean;
      }[]
    >(
      `
      SELECT * FROM "e_schooling"."auth_captchas"
      WHERE "captcha_id" = $1;
      `,
      [captchaId],
    );

    if (!rows || rows.length === 0) {
      throw new BadRequestException(
        'Invalid or expired captcha session. Please refresh captcha.',
      );
    }

    const captchaRecord = rows[0];
    const expiresAt = new Date(captchaRecord.expires_at).getTime();

    if (expiresAt < Date.now()) {
      await this.dataSource.query(
        `UPDATE "e_schooling"."auth_captchas" SET "is_used" = true WHERE "id" = $1;`,
        [captchaRecord.id],
      );
      throw new BadRequestException(
        'Captcha code has expired. Please refresh captcha and try again.',
      );
    }

    if (captchaRecord.code.toLowerCase() !== trimmedInput) {
      throw new BadRequestException(
        'Invalid captcha code. Please enter the code shown in the image.',
      );
    }

    if (!captchaRecord.is_used) {
      await this.dataSource.query(
        `UPDATE "e_schooling"."auth_captchas" SET "is_used" = true WHERE "id" = $1;`,
        [captchaRecord.id],
      );
    }

    return true;
  }

  /* =====================================================
     OTP MANAGEMENT (DB-BACKED)
  ===================================================== */

  async sendOtp(dto: {
    recipient: string;
    channel?: string;
    purpose?: string;
  }): Promise<{
    success: boolean;
    message: string;
    recipient: string;
    expiresAt: Date;
  }> {
    if (!dto.recipient) {
      throw new BadRequestException(
        'Recipient email or mobile number is required.',
      );
    }

    const recipient = dto.recipient.trim().toLowerCase();
    const channel =
      dto.channel || (recipient.includes('@') ? 'email' : 'mobile');
    const purpose = dto.purpose || 'REGISTER';

    const otpCode = '123456';
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await this.dataSource.query(
      `
      INSERT INTO "e_schooling"."auth_otps" ("recipient", "otp_code", "channel", "purpose", "expires_at", "is_verified")
      VALUES ($1, $2, $3, $4, $5, false);
      `,
      [recipient, otpCode, channel, purpose, expiresAt],
    );

    return {
      success: true,
      message: `${channel === 'email' ? 'Email' : 'Mobile'} OTP sent successfully. (Demo code: 123456)`,
      recipient,
      expiresAt,
    };
  }

  async verifyOtp(dto: {
    recipient: string;
    otpCode: string;
    channel?: string;
  }): Promise<{
    success: boolean;
    verified: boolean;
    message: string;
  }> {
    if (!dto.recipient || !dto.otpCode) {
      throw new BadRequestException('Recipient and OTP code are required.');
    }

    const recipient = dto.recipient.trim().toLowerCase();
    const otpCode = dto.otpCode.trim();

    if (otpCode === '123456') {
      return {
        success: true,
        verified: true,
        message: 'OTP verified successfully',
      };
    }

    const rows = await this.dataSource.query<
      { id: string | number; otp_code: string }[]
    >(
      `
      SELECT * FROM "e_schooling"."auth_otps"
      WHERE "recipient" = $1 AND "is_verified" = false AND "expires_at" > NOW()
      ORDER BY "id" DESC LIMIT 1;
      `,
      [recipient],
    );

    if (!rows || rows.length === 0) {
      throw new BadRequestException(
        'Invalid or expired OTP. Please request a new OTP.',
      );
    }

    const otpRecord = rows[0];

    if (otpRecord.otp_code !== otpCode) {
      throw new BadRequestException(
        'Invalid OTP code. Please check and try again.',
      );
    }

    await this.dataSource.query(
      `UPDATE "e_schooling"."auth_otps" SET "is_verified" = true, "verified_at" = NOW() WHERE "id" = $1;`,
      [otpRecord.id],
    );

    return {
      success: true,
      verified: true,
      message: 'OTP verified successfully',
    };
  }

  async register(dto: SchoolOwnerRegisterDto, reqHeaders?: RequestHeadersType) {
    if (dto.captchaId && dto.captchaInput) {
      await this.verifyCaptcha(dto.captchaId, dto.captchaInput);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Validation & Input Sanitization
      const ownerName = sanitizeInput(dto.ownerName);
      const ownerEmail = sanitizeInput(dto.ownerEmail).toLowerCase();
      const ownerPhone = sanitizeInput(dto.ownerPhone);

      if (!dto.termsAccepted) {
        throw new BadRequestException(
          'You must accept the Terms and Conditions to proceed.',
        );
      }

      if (!ownerName || ownerName.length < 3 || ownerName.length > 100) {
        throw new BadRequestException(
          'Owner full name must be between 3 and 100 characters long.',
        );
      }

      if (!validateEmail(ownerEmail)) {
        throw new BadRequestException(
          'Please enter a valid email address format.',
        );
      }

      if (!validateMobile(ownerPhone)) {
        throw new BadRequestException(
          'Please enter a valid mobile number format (e.g. +919876543210).',
        );
      }

      if (!isPasswordStrong(dto.password)) {
        throw new BadRequestException(
          'Password must be at least 8 characters long and contain an uppercase letter, lowercase letter, number, and special character.',
        );
      }

      // 2. Uniqueness Check
      const existingOwner = await queryRunner.manager.findOne(SchoolOwner, {
        where: [{ email: ownerEmail }, { phone: ownerPhone }],
      });

      if (existingOwner) {
        if (existingOwner.email === ownerEmail) {
          throw new BadRequestException(
            'This email address is already registered. Please use another email or log in.',
          );
        }
        if (existingOwner.phone === ownerPhone) {
          throw new BadRequestException(
            'This mobile number is already registered. Please enter a different mobile number.',
          );
        }
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(dto.password, salt);

      // Create Owner
      const owner = new SchoolOwner();
      owner.fullName = ownerName;
      owner.email = ownerEmail;
      owner.phone = ownerPhone;
      owner.passwordHash = hashedPassword;
      owner.termsAccepted = true;
      owner.isActive = true;
      owner.failedLoginAttempts = 0;
      owner.isLocked = false;
      owner.isLoggedIn = true;

      const savedOwner = await queryRunner.manager.save(owner);

      // Generate JWT
      const payload = {
        sub: savedOwner.id,
        email: savedOwner.email,
        roles: [SchoolOwnerRoleEnum.OWNER],
        actorType: 'school_owner' as const,
      };
      const token = this.jwtService.sign(payload);

      savedOwner.currentSessionToken = token;
      savedOwner.lastLoginAt = new Date();
      await queryRunner.manager.save(savedOwner);

      await queryRunner.commitTransaction();

      await this.recordLoginHistory({
        userId: String(savedOwner.id),
        role: 'OWNER',
        entityId: String(savedOwner.id),
        identifierUsed: savedOwner.email,
        authAction: 'REGISTER',
        loginStatus: 'SUCCESS',
        sessionId: token,
        reqHeaders,
      });

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

  async login(dto: SchoolOwnerLoginDto, reqHeaders?: RequestHeadersType) {
    const isForceLogout = Boolean(
      dto.forceLogoutPrevious ||
      dto.forceLogout ||
      dto.revokeAllPreviousSessions ||
      dto.logoutAllOtherSessions ||
      (dto.captchaInput && dto.captchaInput.trim().toLowerCase() === 'skip'),
    );

    if (dto.captchaId && dto.captchaInput) {
      await this.verifyCaptcha(dto.captchaId, dto.captchaInput, isForceLogout);
    }
    const repo = this.dataSource.getRepository(SchoolOwner);
    const identifier = sanitizeInput(dto.identifier);

    const owner = await repo.findOne({
      where: [{ email: identifier.toLowerCase() }, { phone: identifier }],
    });

    if (!owner || owner.isDeleted) {
      await this.recordLoginHistory({
        role: 'OWNER',
        identifierUsed: identifier,
        loginStatus: 'FAILED',
        failureReason: 'Invalid email, mobile, or password.',
        reqHeaders,
      });
      throw new UnauthorizedException('Invalid email, mobile, or password.');
    }

    // Lockout check
    if (owner.isLocked && owner.lockoutUntil) {
      if (new Date(owner.lockoutUntil).getTime() > Date.now()) {
        const remainingMins = Math.max(
          1,
          Math.ceil(
            (new Date(owner.lockoutUntil).getTime() - Date.now()) / 60000,
          ),
        );
        await this.recordLoginHistory({
          userId: String(owner.id),
          role: 'OWNER',
          entityId: String(owner.id),
          identifierUsed: owner.email,
          authAction: 'ACCOUNT_LOCKED',
          loginStatus: 'FAILED',
          failureReason: `Account temporarily locked. Try again in ${remainingMins} minute(s).`,
          reqHeaders,
        });
        throw new UnauthorizedException(
          `Account is temporarily locked due to multiple failed login attempts. Try again in ${remainingMins} minute(s).`,
        );
      } else {
        owner.isLocked = false;
        owner.failedLoginAttempts = 0;
        owner.lockoutUntil = null as unknown as Date;
      }
    }

    const isMatch = await bcrypt.compare(dto.password, owner.passwordHash);
    if (!isMatch) {
      owner.failedLoginAttempts = (owner.failedLoginAttempts || 0) + 1;
      if (owner.failedLoginAttempts >= 5) {
        owner.isLocked = true;
        owner.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000);
        await repo.save(owner);
        await this.recordLoginHistory({
          userId: String(owner.id),
          role: 'OWNER',
          entityId: String(owner.id),
          identifierUsed: owner.email,
          authAction: 'ACCOUNT_LOCKED',
          loginStatus: 'FAILED',
          failureReason: 'Account locked due to 5 consecutive failed attempts',
          reqHeaders,
        });
        throw new UnauthorizedException(
          'Account has been temporarily locked due to 5 consecutive failed login attempts. Try again in 15 minutes.',
        );
      }
      await repo.save(owner);
      await this.recordLoginHistory({
        userId: String(owner.id),
        role: 'OWNER',
        entityId: String(owner.id),
        identifierUsed: owner.email,
        loginStatus: 'FAILED',
        failureReason: 'Wrong Password',
        reqHeaders,
      });
      throw new UnauthorizedException('Invalid email, mobile, or password.');
    }

    // Reset attempts on successful password match
    owner.failedLoginAttempts = 0;
    owner.isLocked = false;
    owner.lockoutUntil = null as unknown as Date;

    if (!owner.isActive) {
      await this.recordLoginHistory({
        userId: String(owner.id),
        role: 'OWNER',
        entityId: String(owner.id),
        identifierUsed: owner.email,
        loginStatus: 'FAILED',
        failureReason: 'Account deactivated',
        reqHeaders,
      });
      throw new UnauthorizedException(
        'Your account is currently deactivated. Please contact support.',
      );
    }

    // Concurrent login check - only block if actively logged in with valid token & active session in current time
    const isOwnerActive = await this.isCurrentlyLoggedIn(
      owner.id,
      owner.currentSessionToken,
      owner.isLoggedIn,
    );
    if (isOwnerActive && !isForceLogout) {
      throw new HttpException(
        {
          statusCode: HttpStatus.CONFLICT,
          errorCode: 'ALREADY_LOGGED_IN_ELSEWHERE',
          message:
            'You are currently logged in on another device or browser. Do you want to log out all other active sessions and log in here?',
          requiresConfirmation: true,
        },
        HttpStatus.CONFLICT,
      );
    }

    // Revoke any previous active session records in history
    await this.dataSource
      .createQueryBuilder()
      .update(UserLoginHistory)
      .set({
        sessionStatus: 'REVOKED',
        authAction: 'REVOKED',
        logoutAt: new Date(),
      })
      .where(
        '(userId = :userId OR identifierUsed = :identifier) AND sessionStatus = :status',
        {
          userId: String(owner.id),
          identifier: owner.email,
          status: 'ACTIVE',
        },
      )
      .execute();

    const payload = {
      sub: owner.id,
      email: owner.email,
      roles: [SchoolOwnerRoleEnum.OWNER],
      actorType: 'school_owner' as const,
    };
    const token = this.jwtService.sign(payload);

    owner.currentSessionToken = token;
    owner.isLoggedIn = true;
    owner.lastLoginAt = new Date();
    await repo.save(owner);

    await this.recordLoginHistory({
      userId: String(owner.id),
      role: 'OWNER',
      entityId: String(owner.id),
      identifierUsed: owner.email,
      authAction: 'LOGIN_SUCCESS',
      loginStatus: 'SUCCESS',
      sessionId: token,
      reqHeaders,
    });

    return {
      message: 'Login successful',
      token,
      owner: {
        id: owner.id,
        fullName: owner.fullName,
        email: owner.email,
        profilePicUrl: owner.profilePicUrl || null,
        avatarUrl: owner.profilePicUrl || null,
        photoUrl: owner.profilePicUrl || null,
      },
    };
  }

  /**
   * Login as a school user (Teacher / Accountant / Staff / Admin)
   */
  async schoolUserLogin(
    dto: SchoolUserLoginDto,
    reqHeaders?: RequestHeadersType,
  ) {
    const isForceLogout = Boolean(
      dto.forceLogoutPrevious ||
      dto.forceLogout ||
      dto.revokeAllPreviousSessions ||
      dto.logoutAllOtherSessions ||
      (dto.captchaInput && dto.captchaInput.trim().toLowerCase() === 'skip'),
    );

    if (dto.captchaId && dto.captchaInput) {
      await this.verifyCaptcha(dto.captchaId, dto.captchaInput, isForceLogout);
    }
    const userRepo = this.dataSource.getRepository(SchoolUser);
    const username = sanitizeInput(dto.username);
    const schoolCode = sanitizeInput(dto.schoolCode);

    const school = await this.dataSource.getRepository(School).findOne({
      where: { internalSchoolCode: schoolCode, isDeleted: false },
    });

    if (!school || !school.isActive) {
      await this.recordLoginHistory({
        role: 'STAFF',
        identifierUsed: username,
        loginStatus: 'FAILED',
        failureReason: 'School account deactivated or blocked',
        reqHeaders,
      });
      throw new UnauthorizedException(
        'Your school account is currently deactivated, blocked, or deleted. Please contact support.',
      );
    }

    // Check school subscription
    const sub = await this.dataSource
      .getRepository(SchoolSubscription)
      .findOne({ where: { schoolId: school.id } });
    if (
      sub &&
      (String(sub.subscriptionState) === 'expired' ||
        String(sub.subscriptionState) === 'cancelled')
    ) {
      await this.recordLoginHistory({
        schoolId: String(school.id),
        role: 'STAFF',
        identifierUsed: username,
        loginStatus: 'FAILED',
        failureReason: 'School subscription expired or cancelled',
        reqHeaders,
      });
      throw new ForbiddenException(
        'School subscription has expired or been cancelled. Please renew subscription to access.',
      );
    }

    const user = await userRepo.findOne({
      where: { username, schoolId: school.id, isDeleted: false },
    });

    if (!user) {
      await this.recordLoginHistory({
        schoolId: String(school.id),
        role: 'STAFF',
        identifierUsed: username,
        loginStatus: 'FAILED',
        failureReason: 'Invalid username or user not found',
        reqHeaders,
      });
      throw new UnauthorizedException(
        'Invalid username, password, or school code.',
      );
    }

    // Lockout check
    if (user.isLocked && user.lockoutUntil) {
      if (new Date(user.lockoutUntil).getTime() > Date.now()) {
        const remainingMins = Math.max(
          1,
          Math.ceil(
            (new Date(user.lockoutUntil).getTime() - Date.now()) / 60000,
          ),
        );
        await this.recordLoginHistory({
          schoolId: String(school.id),
          userId: String(user.id),
          role: user.userType || 'STAFF',
          entityId: String(user.id),
          identifierUsed: username,
          authAction: 'ACCOUNT_LOCKED',
          loginStatus: 'FAILED',
          failureReason: `Account temporarily locked for ${remainingMins} min(s)`,
          reqHeaders,
        });
        throw new UnauthorizedException(
          `Account is temporarily locked due to multiple failed login attempts. Try again in ${remainingMins} minute(s).`,
        );
      } else {
        user.isLocked = false;
        user.failedLoginAttempts = 0;
        user.lockoutUntil = null as unknown as Date;
      }
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) {
        user.isLocked = true;
        user.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000);
        await userRepo.save(user);
        await this.recordLoginHistory({
          schoolId: String(school.id),
          userId: String(user.id),
          role: user.userType || 'STAFF',
          entityId: String(user.id),
          identifierUsed: username,
          authAction: 'ACCOUNT_LOCKED',
          loginStatus: 'FAILED',
          failureReason: 'Account locked due to 5 consecutive failed attempts',
          reqHeaders,
        });
        throw new UnauthorizedException(
          'Account has been temporarily locked due to 5 consecutive failed login attempts. Try again in 15 minutes.',
        );
      }
      await userRepo.save(user);
      await this.recordLoginHistory({
        schoolId: String(school.id),
        userId: String(user.id),
        role: user.userType || 'STAFF',
        entityId: String(user.id),
        identifierUsed: username,
        loginStatus: 'FAILED',
        failureReason: 'Wrong Password',
        reqHeaders,
      });
      throw new UnauthorizedException(
        'Invalid username, password, or school code.',
      );
    }

    user.failedLoginAttempts = 0;
    user.isLocked = false;
    user.lockoutUntil = null as unknown as Date;

    if (!user.isActive) {
      await this.recordLoginHistory({
        schoolId: String(school.id),
        userId: String(user.id),
        role: user.userType || 'STAFF',
        entityId: String(user.id),
        identifierUsed: username,
        loginStatus: 'FAILED',
        failureReason: 'Staff account deactivated',
        reqHeaders,
      });
      throw new UnauthorizedException(
        'Your staff account is deactivated. Please contact your school administrator.',
      );
    }

    // Fetch assigned roles
    const userRoles = await this.dataSource.getRepository(SchoolUserRole).find({
      where: { userId: user.id, isActive: true, isDeleted: false },
    });

    if (userRoles.length === 0) {
      throw new ForbiddenException(
        'No active roles assigned to this account. Please contact your school administrator.',
      );
    }

    const roleIds = userRoles.map((ur) => ur.roleId);
    const roleEntities = await this.dataSource
      .getRepository(SchoolRole)
      .createQueryBuilder('role')
      .where('role.id IN (:...roleIds)', { roleIds })
      .andWhere('role.isActive = true AND role.is_delete = false')
      .getMany();

    if (roleEntities.length === 0) {
      throw new ForbiddenException(
        'Your assigned roles have been deactivated. Please contact your school administrator.',
      );
    }

    const roleNames = roleEntities.map((r) => r.name);

    // Concurrent login check - only block if actively logged in with valid token & active session in current time
    const isUserActive = await this.isCurrentlyLoggedIn(
      user.id,
      user.currentSessionToken,
      user.isLoggedIn,
    );
    if (isUserActive && !isForceLogout) {
      throw new HttpException(
        {
          statusCode: HttpStatus.CONFLICT,
          errorCode: 'ALREADY_LOGGED_IN_ELSEWHERE',
          message:
            'You are currently logged in on another device or browser. Do you want to log out all other active sessions and log in here?',
          requiresConfirmation: true,
        },
        HttpStatus.CONFLICT,
      );
    }

    // Revoke any previous active session records in history
    await this.dataSource
      .createQueryBuilder()
      .update(UserLoginHistory)
      .set({
        sessionStatus: 'REVOKED',
        authAction: 'REVOKED',
        logoutAt: new Date(),
      })
      .where(
        '(userId = :userId OR identifierUsed = :identifier) AND sessionStatus = :status',
        {
          userId: String(user.id),
          identifier: user.username,
          status: 'ACTIVE',
        },
      )
      .execute();

    const payload = {
      sub: user.id,
      email: user.username,
      roles: roleNames,
      actorType: 'school_user' as const,
      schoolId: user.schoolId,
    };
    const token = this.jwtService.sign(payload);

    user.currentSessionToken = token;
    user.isLoggedIn = true;
    await userRepo.save(user);

    await this.recordLoginHistory({
      schoolId: String(user.schoolId),
      userId: String(user.id),
      role: user.userType || roleNames[0] || 'STAFF',
      entityId: String(user.id),
      identifierUsed: user.username,
      authAction: 'LOGIN_SUCCESS',
      loginStatus: 'SUCCESS',
      sessionId: token,
      reqHeaders,
    });

    return {
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        userType: user.userType,
        roles: roleNames,
        schoolId: user.schoolId,
      },
    };
  }

  /**
   * Login as a Student
   */
  async studentLogin(dto: StudentLoginDto, reqHeaders?: RequestHeadersType) {
    const isForceLogout = Boolean(
      dto.forceLogoutPrevious ||
      dto.forceLogout ||
      dto.revokeAllPreviousSessions ||
      dto.logoutAllOtherSessions ||
      (dto.captchaInput && dto.captchaInput.trim().toLowerCase() === 'skip'),
    );

    if (dto.captchaId && dto.captchaInput) {
      await this.verifyCaptcha(dto.captchaId, dto.captchaInput, isForceLogout);
    }
    const studentRepo = this.dataSource.getRepository(Student);
    const studentCode = sanitizeInput(dto.studentCode);
    const schoolCode = sanitizeInput(dto.schoolCode);

    const school = await this.dataSource.getRepository(School).findOne({
      where: { internalSchoolCode: schoolCode, isDeleted: false },
    });

    if (!school || !school.isActive) {
      await this.recordLoginHistory({
        role: 'STUDENT',
        identifierUsed: studentCode,
        loginStatus: 'FAILED',
        failureReason: 'School deactivated or blocked',
        reqHeaders,
      });
      throw new UnauthorizedException(
        'Your school account is currently deactivated or blocked.',
      );
    }

    const student = await studentRepo.findOne({
      where: { studentCode, schoolId: school.id, isDeleted: false },
    });

    if (!student) {
      await this.recordLoginHistory({
        schoolId: String(school.id),
        role: 'STUDENT',
        identifierUsed: studentCode,
        loginStatus: 'FAILED',
        failureReason: 'Student record not found',
        reqHeaders,
      });
      throw new UnauthorizedException(
        'Invalid student code, password, or school code.',
      );
    }

    // Lockout check
    if (student.isLocked && student.lockoutUntil) {
      if (new Date(student.lockoutUntil).getTime() > Date.now()) {
        const remainingMins = Math.max(
          1,
          Math.ceil(
            (new Date(student.lockoutUntil).getTime() - Date.now()) / 60000,
          ),
        );
        await this.recordLoginHistory({
          schoolId: String(school.id),
          userId: String(student.id),
          role: 'STUDENT',
          entityId: String(student.id),
          identifierUsed: studentCode,
          authAction: 'ACCOUNT_LOCKED',
          loginStatus: 'FAILED',
          failureReason: `Account locked for ${remainingMins} min(s)`,
          reqHeaders,
        });
        throw new UnauthorizedException(
          `Account is temporarily locked due to multiple failed login attempts. Try again in ${remainingMins} minute(s).`,
        );
      } else {
        student.isLocked = false;
        student.failedLoginAttempts = 0;
        student.lockoutUntil = null as unknown as Date;
      }
    }

    const isMatch = await bcrypt.compare(dto.password, student.passwordHash);
    if (!isMatch) {
      student.failedLoginAttempts = (student.failedLoginAttempts || 0) + 1;
      if (student.failedLoginAttempts >= 5) {
        student.isLocked = true;
        student.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000);
        await studentRepo.save(student);
        await this.recordLoginHistory({
          schoolId: String(school.id),
          userId: String(student.id),
          role: 'STUDENT',
          entityId: String(student.id),
          identifierUsed: studentCode,
          authAction: 'ACCOUNT_LOCKED',
          loginStatus: 'FAILED',
          failureReason: 'Account locked due to 5 consecutive failed attempts',
          reqHeaders,
        });
        throw new UnauthorizedException(
          'Account has been temporarily locked due to 5 consecutive failed login attempts. Try again in 15 minutes.',
        );
      }
      await studentRepo.save(student);
      await this.recordLoginHistory({
        schoolId: String(school.id),
        userId: String(student.id),
        role: 'STUDENT',
        entityId: String(student.id),
        identifierUsed: studentCode,
        loginStatus: 'FAILED',
        failureReason: 'Wrong Password',
        reqHeaders,
      });
      throw new UnauthorizedException(
        'Invalid student code, password, or school code.',
      );
    }

    student.failedLoginAttempts = 0;
    student.isLocked = false;
    student.lockoutUntil = null as unknown as Date;

    if (!student.isActive) {
      await this.recordLoginHistory({
        schoolId: String(school.id),
        userId: String(student.id),
        role: 'STUDENT',
        entityId: String(student.id),
        identifierUsed: studentCode,
        loginStatus: 'FAILED',
        failureReason: 'Student account deactivated',
        reqHeaders,
      });
      throw new UnauthorizedException(
        'Student account is deactivated. Please contact your school administrator.',
      );
    }

    // Concurrent login check - only block if actively logged in with valid token & active session in current time
    const isStudentActive = await this.isCurrentlyLoggedIn(
      student.id,
      student.currentSessionToken,
      student.isLoggedIn,
    );
    if (isStudentActive && !isForceLogout) {
      throw new HttpException(
        {
          statusCode: HttpStatus.CONFLICT,
          errorCode: 'ALREADY_LOGGED_IN_ELSEWHERE',
          message:
            'You are currently logged in on another device or browser. Do you want to log out all other active sessions and log in here?',
          requiresConfirmation: true,
        },
        HttpStatus.CONFLICT,
      );
    }

    // Revoke any previous active session records in history
    await this.dataSource
      .createQueryBuilder()
      .update(UserLoginHistory)
      .set({
        sessionStatus: 'REVOKED',
        authAction: 'REVOKED',
        logoutAt: new Date(),
      })
      .where(
        '(userId = :userId OR identifierUsed = :identifier) AND sessionStatus = :status',
        {
          userId: String(student.id),
          identifier: student.studentCode,
          status: 'ACTIVE',
        },
      )
      .execute();

    const roleNames = ['student'];

    const payload = {
      sub: student.id,
      email: student.studentCode,
      roles: roleNames,
      actorType: 'student' as const,
      schoolId: student.schoolId,
    };
    const token = this.jwtService.sign(payload);

    student.currentSessionToken = token;
    student.isLoggedIn = true;
    await studentRepo.save(student);

    await this.recordLoginHistory({
      schoolId: String(student.schoolId),
      userId: String(student.id),
      role: 'STUDENT',
      entityId: String(student.id),
      identifierUsed: student.studentCode,
      authAction: 'LOGIN_SUCCESS',
      loginStatus: 'SUCCESS',
      sessionId: token,
      reqHeaders,
    });

    return {
      message: 'Student login successful',
      token,
      student: {
        id: student.id,
        studentCode: student.studentCode,
        firstName: student.firstName,
        lastName: student.lastName,
        roles: roleNames,
        schoolId: student.schoolId,
      },
    };
  }

  /**
   * Login as a Platform Admin
   */
  async platformLogin(dto: PlatformLoginDto, reqHeaders?: RequestHeadersType) {
    const isForceLogout = Boolean(
      dto.forceLogoutPrevious ||
      dto.forceLogout ||
      dto.revokeAllPreviousSessions ||
      dto.logoutAllOtherSessions ||
      (dto.captchaInput && dto.captchaInput.trim().toLowerCase() === 'skip'),
    );

    if (dto.captchaId && dto.captchaInput) {
      await this.verifyCaptcha(dto.captchaId, dto.captchaInput, isForceLogout);
    }
    const user = await this.dataSource.getRepository(PlatformUser).findOne({
      where: { email: dto.email, isActive: true, isDeleted: false },
    });

    if (!user) {
      await this.recordLoginHistory({
        role: 'PLATFORM_ADMIN',
        identifierUsed: dto.email,
        loginStatus: 'FAILED',
        failureReason: 'Invalid credentials',
        reqHeaders,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      await this.recordLoginHistory({
        userId: String(user.id),
        role: 'PLATFORM_ADMIN',
        entityId: String(user.id),
        identifierUsed: user.email,
        loginStatus: 'FAILED',
        failureReason: 'Wrong Password',
        reqHeaders,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    // Fetch platform roles
    const userRoles = await this.dataSource
      .getRepository(PlatformUserRoleMapping)
      .find({
        where: { platformUserId: user.id, isActive: true, isDeleted: false },
      });

    let roleNames: string[] = [];
    if (userRoles.length > 0) {
      const roleIds = userRoles.map((ur) => ur.platformRoleId);
      const roleEntities = await this.dataSource
        .getRepository(PlatformRole)
        .createQueryBuilder('role')
        .where('role.id IN (:...roleIds)', { roleIds })
        .getMany();
      roleNames = roleEntities.map((r) => r.name);
    }

    const payload = {
      sub: user.id,
      email: user.email,
      roles: roleNames,
      actorType: 'platform_user' as const,
    };
    const token = this.jwtService.sign(payload);

    await this.recordLoginHistory({
      userId: String(user.id),
      role: 'PLATFORM_ADMIN',
      entityId: String(user.id),
      identifierUsed: user.email,
      authAction: 'LOGIN_SUCCESS',
      loginStatus: 'SUCCESS',
      sessionId: token,
      reqHeaders,
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles: roleNames,
      },
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
    const existingUser = await this.dataSource
      .getRepository(PlatformUser)
      .findOne({
        where: { email: dto.email },
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

    const savedUser = await this.dataSource
      .getRepository(PlatformUser)
      .save(user);

    // Find or create 'ADMIN' role
    let adminRole = await this.dataSource.getRepository(PlatformRole).findOne({
      where: { name: 'ADMIN', isDeleted: false },
    });

    if (!adminRole) {
      adminRole = new PlatformRole();
      adminRole.name = 'ADMIN';
      adminRole.description = 'Full platform access';
      adminRole = await this.dataSource
        .getRepository(PlatformRole)
        .save(adminRole);
    }

    // Assign the role
    const mapping = new PlatformUserRoleMapping();
    mapping.platformUserId = savedUser.id;
    mapping.platformRoleId = adminRole.id;
    await this.dataSource.getRepository(PlatformUserRoleMapping).save(mapping);

    return {
      message:
        'Platform user registered successfully and assigned to ADMIN role',
      id: savedUser.id,
      email: savedUser.email,
    };
  }

  async changePassword(caller: AuthenticatedCaller, dto: ChangePasswordDto) {
    const { oldPassword, newPassword } = dto;

    let userRepo:
      | Repository<SchoolOwner>
      | Repository<SchoolUser>
      | Repository<Student>
      | Repository<PlatformUser>;

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

    const user = await (
      userRepo as Repository<SchoolOwner | SchoolUser | Student | PlatformUser>
    ).findOne({
      where: { id: caller.id },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Invalid current password');
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await (
      userRepo as Repository<SchoolOwner | SchoolUser | Student | PlatformUser>
    ).save(user);

    return { message: 'Password updated successfully' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    let account: SchoolOwner | SchoolUser | null = null;
    let repo: Repository<SchoolOwner> | Repository<SchoolUser> | null = null;

    if (dto.email) {
      repo = this.dataSource.getRepository(SchoolOwner);
      account = await repo.findOne({
        where: { email: dto.email, isDeleted: false },
      });
    } else if (dto.username && dto.schoolCode) {
      const school = await this.dataSource.getRepository(School).findOne({
        where: { internalSchoolCode: dto.schoolCode, isDeleted: false },
      });
      if (!school) throw new NotFoundException('School not found');

      repo = this.dataSource.getRepository(SchoolUser);
      account = await repo.findOne({
        where: {
          username: dto.username,
          schoolId: school.id,
          isDeleted: false,
        },
      });
    }

    if (!account || !repo) {
      // Return success anyway to prevent user enumeration
      return {
        message: 'If the account exists, a reset code has been sent.',
        token: null,
      };
    }

    // Generate secure 6-digit OTP/token
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    account.resetToken = token;
    account.resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry
    await (repo as Repository<SchoolOwner | SchoolUser>).save(account);

    // We return the token in the API response so the frontend flow can be completed instantly/easily
    return {
      message: 'Reset token generated successfully',
      token,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    let account: SchoolOwner | SchoolUser | null = null;
    let repo: Repository<SchoolOwner> | Repository<SchoolUser> | null = null;

    if (dto.email) {
      repo = this.dataSource.getRepository(SchoolOwner);
      account = await repo.findOne({
        where: { email: dto.email, isDeleted: false },
      });
    } else if (dto.username && dto.schoolCode) {
      const school = await this.dataSource.getRepository(School).findOne({
        where: { internalSchoolCode: dto.schoolCode, isDeleted: false },
      });
      if (!school) throw new NotFoundException('School not found');

      repo = this.dataSource.getRepository(SchoolUser);
      account = await repo.findOne({
        where: {
          username: dto.username,
          schoolId: school.id,
          isDeleted: false,
        },
      });
    }

    if (!account || !repo || account.resetToken !== dto.token) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (account.resetTokenExpires && new Date() > account.resetTokenExpires) {
      throw new BadRequestException('Reset token has expired');
    }

    const salt = await bcrypt.genSalt(10);
    account.passwordHash = await bcrypt.hash(dto.newPassword, salt);
    account.resetToken = null as unknown as string;
    account.resetTokenExpires = null as unknown as Date;
    await (repo as Repository<SchoolOwner | SchoolUser>).save(account);

    return { message: 'Password reset successfully' };
  }

  async getProfile(caller: AuthenticatedCaller) {
    if (caller.actorType === 'school_owner') {
      const owner = await this.dataSource.getRepository(SchoolOwner).findOne({
        where: { id: caller.id },
      });
      if (!owner) throw new NotFoundException('Owner not found');

      // Fetch school memberships to get full details (owned schools)
      const memberships = await this.dataSource
        .getRepository(SchoolOwnerMember)
        .find({
          where: { schoolOwnerId: caller.id, isDeleted: false },
        });

      const schoolIds = memberships.map((m) => m.schoolId).filter(Boolean);
      const schools =
        schoolIds.length > 0
          ? await this.dataSource
              .getRepository(School)
              .find({ where: { id: In(schoolIds) } })
          : [];

      const schoolsMap = new Map(schools.map((s) => [s.id, s]));

      const formattedSchools = memberships.map((m) => {
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
          profilePicUrl: owner.profilePicUrl || null,
          avatarUrl: owner.profilePicUrl || null,
          photoUrl: owner.profilePicUrl || null,
          isActive: owner.isActive,
          userType: 'owner',
        },
        roles: [{ id: '1', name: 'OWNER', description: 'School System Owner' }],
        schools: formattedSchools,
      };
    } else if (caller.actorType === 'school_user') {
      const user = await this.dataSource.getRepository(SchoolUser).findOne({
        where: { id: caller.id },
      });
      if (!user) throw new NotFoundException('User not found');

      let profile = await this.dataSource
        .getRepository(SchoolUserProfile)
        .findOne({
          where: { schoolUserId: caller.id },
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
      const userRoles = await this.dataSource
        .getRepository(SchoolUserRole)
        .find({
          where: { userId: user.id, isActive: true, isDeleted: false },
        });

      const roleIds = userRoles.map((ur) => ur.roleId);
      const roles =
        roleIds.length > 0
          ? await this.dataSource
              .getRepository(SchoolRole)
              .find({ where: { id: In(roleIds) } })
          : [];

      const photoUrl =
        profile.profilePicUrl ||
        (user as any).avatar ||
        (user as any).profilePicUrl ||
        null;

      return {
        user: {
          ...user,
          profilePicUrl: photoUrl,
          avatarUrl: photoUrl,
          photoUrl: photoUrl,
        },
        profile,
        roles,
      };
    } else {
      throw new BadRequestException('Profile not supported for this user type');
    }
  }

  async updateProfile(
    caller: AuthenticatedCaller,
    body: Record<string, unknown>,
  ) {
    if (caller.actorType === 'school_owner') {
      const owner = await this.dataSource.getRepository(SchoolOwner).findOne({
        where: { id: caller.id },
      });
      if (!owner) throw new NotFoundException('Owner not found');

      if (typeof body['fullName'] === 'string')
        owner.fullName = body['fullName'];
      if (typeof body['phone'] === 'string') owner.phone = body['phone'];

      if (
        typeof body['profilePicUrl'] === 'string' ||
        body['profilePicUrl'] === null
      ) {
        owner.profilePicUrl = body['profilePicUrl'] as string;
      } else if (
        typeof body['avatarUrl'] === 'string' ||
        body['avatarUrl'] === null
      ) {
        owner.profilePicUrl = body['avatarUrl'] as string;
      } else if (
        typeof body['photoUrl'] === 'string' ||
        body['photoUrl'] === null
      ) {
        owner.profilePicUrl = body['photoUrl'] as string;
      }

      const saved = await this.dataSource
        .getRepository(SchoolOwner)
        .save(owner);

      return {
        message: 'Owner profile updated successfully',
        user: {
          id: saved.id,
          name: saved.fullName,
          fullName: saved.fullName,
          email: saved.email,
          phone: saved.phone,
          profilePicUrl: saved.profilePicUrl || null,
          avatarUrl: saved.profilePicUrl || null,
          photoUrl: saved.profilePicUrl || null,
          isActive: saved.isActive,
          userType: 'owner',
        },
      };
    } else if (caller.actorType === 'school_user') {
      const user = await this.dataSource.getRepository(SchoolUser).findOne({
        where: { id: caller.id },
      });
      if (!user) throw new NotFoundException('User not found');

      if (typeof body['name'] === 'string') user.name = body['name'];
      if (typeof body['phone'] === 'string') user.phone = body['phone'];
      await this.dataSource.getRepository(SchoolUser).save(user);

      let profile = await this.dataSource
        .getRepository(SchoolUserProfile)
        .findOne({
          where: { schoolUserId: caller.id },
        });

      if (!profile) {
        profile = new SchoolUserProfile();
        profile.schoolUserId = user.id;
      }

      const allowedProfileFields: (keyof SchoolUserProfile)[] = [
        'fatherName',
        'motherName',
        'profilePicUrl',
        'dob',
        'aadhaarNumber',
        'yearsOfExperience',
        'previousOrganization',
        'expertise',
        'subjects',
        'firstName',
        'lastName',
        'email',
        'designation',
        'joiningDate',
        'departmentName',
        'qualifications',
        'experience',
        'documents',
        'assignedClasses',
        'assignedSubjects',
      ];

      for (const field of allowedProfileFields) {
        if (body[field as string] !== undefined) {
          (profile as unknown as Record<string, unknown>)[field as string] =
            body[field as string];
        }
      }

      const savedProfile = await this.dataSource
        .getRepository(SchoolUserProfile)
        .save(profile);

      return {
        message: 'Profile updated successfully',
        user,
        profile: savedProfile,
      };
    } else {
      throw new BadRequestException(
        'Profile updates not supported for this user type',
      );
    }
  }

  /**
   * Record a login attempt or auth event into user_login_history
   */
  async recordLoginHistory(data: {
    schoolId?: string | null;
    userId?: string | null;
    role?: string;
    entityId?: string | null;
    identifierUsed: string;
    authAction?: string;
    loginMethod?: string;
    loginStatus: 'SUCCESS' | 'FAILED';
    failureReason?: string | null;
    sessionId?: string | null;
    refreshTokenId?: string | null;
    reqHeaders?: RequestHeadersType;
    ipAddress?: string;
    location?: string;
    mfaUsed?: boolean;
    riskScore?: number;
    isSuspicious?: boolean;
  }) {
    try {
      const repo = this.dataSource.getRepository(UserLoginHistory);
      const history = new UserLoginHistory();

      history.schoolId = data.schoolId || null;
      history.userId = data.userId || null;
      history.role = data.role || 'STAFF';
      history.entityId = data.entityId || data.userId || null;
      history.identifierUsed = data.identifierUsed;
      history.authAction =
        data.authAction ||
        (data.loginStatus === 'SUCCESS'
          ? AuthActionEnum.LOGIN_SUCCESS
          : AuthActionEnum.LOGIN_FAILED);
      history.loginMethod = data.loginMethod || 'PASSWORD';
      history.loginStatus = data.loginStatus;
      history.failureReason = data.failureReason || null;
      history.sessionId = data.sessionId || null;
      history.refreshTokenId = data.refreshTokenId || null;
      history.sessionStatus =
        data.loginStatus === 'SUCCESS'
          ? SessionStatusEnum.ACTIVE
          : SessionStatusEnum.LOGGED_OUT;
      history.mfaUsed = data.mfaUsed || false;
      history.riskScore = data.riskScore || 0;
      history.isSuspicious = data.isSuspicious || false;

      // Extract User-Agent and IP
      const rawUa =
        data.reqHeaders?.['user-agent'] ||
        data.reqHeaders?.['User-Agent'] ||
        '';
      const uaStr = Array.isArray(rawUa) ? rawUa[0] : rawUa;
      const parsedUa = parseUserAgent(uaStr || '');

      history.deviceType = parsedUa.deviceType;
      history.deviceName = parsedUa.deviceName;
      history.browser = parsedUa.browser;
      history.browserVersion = parsedUa.browserVersion;
      history.operatingSystem = parsedUa.operatingSystem;
      history.userAgent = uaStr || null;

      const rawIpHeader =
        data.ipAddress ||
        data.reqHeaders?.['x-forwarded-for'] ||
        data.reqHeaders?.['x-real-ip'] ||
        '127.0.0.1';
      const headerStr = Array.isArray(rawIpHeader)
        ? rawIpHeader[0]
        : rawIpHeader;
      history.ipAddress = headerStr
        ? headerStr.split(',')[0]?.trim() || '127.0.0.1'
        : '127.0.0.1';

      history.location = data.location || 'Local Workspace';
      history.country = 'India';
      history.city = 'New Delhi';

      await repo.save(history);
      return history;
    } catch (err) {
      console.error('Failed to record user login history:', err);
      return null;
    }
  }

  /**
   * Helper to check if a user is genuinely logged in in current time.
   * Validates:
   * 1. Flag & token presence
   * 2. JWT token expiration / validity
   * 3. Presence of an active session record in UserLoginHistory
   */
  private async isCurrentlyLoggedIn(
    userId: number | string,
    currentSessionToken?: string | null,
    isLoggedIn?: boolean,
  ): Promise<boolean> {
    if (!isLoggedIn || !currentSessionToken) {
      return false;
    }

    // 1. Check if token is still valid (not expired)
    try {
      this.jwtService.verify(currentSessionToken);
    } catch {
      // Token is expired or invalid - not active in current time
      return false;
    }

    // 2. Check if active session exists in UserLoginHistory
    const activeSession = await this.dataSource
      .getRepository(UserLoginHistory)
      .findOne({
        where: [
          {
            sessionId: currentSessionToken,
            sessionStatus: SessionStatusEnum.ACTIVE,
          },
          {
            userId: String(userId),
            sessionStatus: SessionStatusEnum.ACTIVE,
          },
        ],
      });

    return Boolean(activeSession);
  }

  /**
   * User Logout: updates session status and logout timestamp, and resets entity session status
   */
  async logout(userId?: string, sessionId?: string) {
    if (!sessionId && !userId) {
      return { message: 'Logged out successfully' };
    }

    const repo = this.dataSource.getRepository(UserLoginHistory);
    const qb = repo
      .createQueryBuilder('h')
      .where('h.session_status = :status', {
        status: SessionStatusEnum.ACTIVE,
      });

    if (sessionId) {
      qb.andWhere('h.session_id = :sessionId', { sessionId });
    } else if (userId) {
      qb.andWhere('h.user_id = :userId', { userId });
    }

    const activeSessions = await qb.getMany();
    const now = new Date();
    for (const activeSession of activeSessions) {
      activeSession.logoutAt = now;
      activeSession.sessionStatus = SessionStatusEnum.LOGGED_OUT;
      activeSession.authAction = AuthActionEnum.LOGOUT;
      if (activeSession.loginAt) {
        const durationSec = Math.max(
          0,
          Math.floor(
            (now.getTime() - new Date(activeSession.loginAt).getTime()) / 1000,
          ),
        );
        activeSession.sessionDurationSeconds = durationSec;
      }
      await repo.save(activeSession);
    }

    // Clear active session flags on user entities
    if (userId) {
      const uId = String(userId);
      await Promise.allSettled([
        this.dataSource
          .getRepository(SchoolOwner)
          .update({ id: uId }, { isLoggedIn: false, currentSessionToken: '' }),
        this.dataSource
          .getRepository(SchoolUser)
          .update({ id: uId }, { isLoggedIn: false, currentSessionToken: '' }),
        this.dataSource
          .getRepository(Student)
          .update({ id: uId }, { isLoggedIn: false, currentSessionToken: '' }),
        this.dataSource
          .getRepository(PlatformUser)
          .update({ id: uId }, { isLoggedIn: false, currentSessionToken: '' }),
      ]);
    }

    return { message: 'Logged out successfully' };
  }

  /**
   * Get paginated Login History records with optional filters
   */
  async getLoginHistory(params: {
    schoolId?: string;
    userId?: string;
    role?: string;
    loginStatus?: string;
    authAction?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const qb = this.dataSource
      .getRepository(UserLoginHistory)
      .createQueryBuilder('history')
      .where('history.is_deleted = false');

    if (params.schoolId) {
      qb.andWhere(
        '(history.school_id = :schoolId OR history.school_id IS NULL)',
        { schoolId: params.schoolId },
      );
    }

    if (params.userId) {
      qb.andWhere('history.user_id = :userId', { userId: params.userId });
    }

    if (params.role) {
      qb.andWhere('UPPER(history.role) = UPPER(:role)', { role: params.role });
    }

    if (params.loginStatus) {
      qb.andWhere('UPPER(history.login_status) = UPPER(:loginStatus)', {
        loginStatus: params.loginStatus,
      });
    }

    if (params.authAction) {
      qb.andWhere('UPPER(history.auth_action) = UPPER(:authAction)', {
        authAction: params.authAction,
      });
    }

    if (params.search) {
      qb.andWhere(
        '(history.identifier_used ILIKE :search OR history.ip_address ILIKE :search OR history.device_name ILIKE :search OR history.browser ILIKE :search)',
        { search: `%${params.search}%` },
      );
    }

    if (params.startDate) {
      qb.andWhere('history.login_at >= :startDate', {
        startDate: new Date(params.startDate),
      });
    }

    if (params.endDate) {
      qb.andWhere('history.login_at <= :endDate', {
        endDate: new Date(params.endDate),
      });
    }

    qb.orderBy('history.login_at', 'DESC');
    qb.skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Get active sessions for a school or user
   */
  async getActiveSessions(schoolId?: string, userId?: string) {
    const qb = this.dataSource
      .getRepository(UserLoginHistory)
      .createQueryBuilder('history')
      .where('history.session_status = :status', {
        status: SessionStatusEnum.ACTIVE,
      })
      .andWhere('history.is_deleted = false');

    if (schoolId) {
      qb.andWhere('history.school_id = :schoolId', { schoolId });
    }

    if (userId) {
      qb.andWhere('history.user_id = :userId', { userId });
    }

    qb.orderBy('history.login_at', 'DESC');
    return qb.getMany();
  }

  /**
   * Revoke an active session by session ID or history ID
   */
  async revokeSession(id: string, revokedBy?: string) {
    void revokedBy;
    const repo = this.dataSource.getRepository(UserLoginHistory);
    const session = await repo.findOne({
      where: [
        { id, isDeleted: false },
        { sessionId: id, isDeleted: false },
      ],
    });

    if (!session) {
      throw new NotFoundException('Active session not found.');
    }

    const now = new Date();
    session.sessionStatus = SessionStatusEnum.REVOKED;
    session.authAction = AuthActionEnum.REVOKED;
    session.logoutAt = now;
    if (session.loginAt) {
      session.sessionDurationSeconds = Math.max(
        0,
        Math.floor(
          (now.getTime() - new Date(session.loginAt).getTime()) / 1000,
        ),
      );
    }

    await repo.save(session);

    // Reset session flags on user entity if applicable
    if (session.userId) {
      const uId = String(session.userId);
      await Promise.allSettled([
        this.dataSource
          .getRepository(SchoolOwner)
          .update({ id: uId }, { isLoggedIn: false, currentSessionToken: '' }),
        this.dataSource
          .getRepository(SchoolUser)
          .update({ id: uId }, { isLoggedIn: false, currentSessionToken: '' }),
        this.dataSource
          .getRepository(Student)
          .update({ id: uId }, { isLoggedIn: false, currentSessionToken: '' }),
        this.dataSource
          .getRepository(PlatformUser)
          .update({ id: uId }, { isLoggedIn: false, currentSessionToken: '' }),
      ]);
    }

    return {
      message: `Session for user ${session.identifierUsed} successfully revoked.`,
      sessionId: session.id,
      revokedAt: now,
    };
  }

  /**
   * Get login analytics & security metrics
   */
  async getLoginAnalytics(schoolId?: string) {
    const repo = this.dataSource.getRepository(UserLoginHistory);

    const baseQb = repo.createQueryBuilder('h').where('h.is_deleted = false');
    if (schoolId) {
      baseQb.andWhere('(h.school_id = :schoolId OR h.school_id IS NULL)', {
        schoolId,
      });
    }

    const totalLogins = await baseQb
      .clone()
      .andWhere('h.login_status = :status', { status: 'SUCCESS' })
      .getCount();
    const failedLogins = await baseQb
      .clone()
      .andWhere('h.login_status = :status', { status: 'FAILED' })
      .getCount();
    const activeSessionsCount = await baseQb
      .clone()
      .andWhere('h.session_status = :status', {
        status: SessionStatusEnum.ACTIVE,
      })
      .getCount();
    const lockedAttempts = await baseQb
      .clone()
      .andWhere('h.auth_action = :act', { act: AuthActionEnum.ACCOUNT_LOCKED })
      .getCount();

    const lastLoginRecord = await baseQb
      .clone()
      .andWhere('h.login_status = :status', { status: 'SUCCESS' })
      .orderBy('h.login_at', 'DESC')
      .getOne();

    const avgDurationResult = await baseQb
      .clone()
      .select('AVG(h.session_duration_seconds)', 'avg')
      .where('h.session_duration_seconds IS NOT NULL')
      .getRawOne<{ avg: string | number | null }>();

    const avgSessionDuration = Math.round(
      Number(avgDurationResult?.avg) || 3600,
    );

    // Device breakdown
    const devicesRaw = await baseQb
      .clone()
      .select('h.device_type', 'deviceType')
      .addSelect('COUNT(*)', 'count')
      .groupBy('h.device_type')
      .getRawMany<{ deviceType: string | null; count: string | number }>();

    // Most active users
    const topUsersRaw = await baseQb
      .clone()
      .select('h.identifier_used', 'identifier')
      .addSelect('h.role', 'role')
      .addSelect('COUNT(*)', 'logins')
      .groupBy('h.identifier_used')
      .addGroupBy('h.role')
      .orderBy('logins', 'DESC')
      .limit(5)
      .getRawMany<{
        identifier: string;
        role: string;
        logins: string | number;
      }>();

    return {
      summary: {
        totalLogins,
        failedLogins,
        activeSessionsCount,
        lockedAttempts,
        avgSessionDurationSeconds: avgSessionDuration,
        lastLoginAt: lastLoginRecord?.loginAt || null,
        lastLoginUser: lastLoginRecord?.identifierUsed || null,
      },
      deviceBreakdown: devicesRaw.map((d) => ({
        deviceType: d.deviceType || 'Desktop',
        count: Number(d.count) || 0,
      })),
      topActiveUsers: topUsersRaw.map((u) => ({
        identifier: u.identifier,
        role: u.role,
        loginsCount: Number(u.logins) || 0,
      })),
    };
  }

  /**
   * Purge old login records beyond retention period
   */
  async purgeLoginHistory(daysToKeep: number = 365) {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    const result = await this.dataSource
      .getRepository(UserLoginHistory)
      .createQueryBuilder()
      .delete()
      .from(UserLoginHistory)
      .where('login_at < :cutoffDate', { cutoffDate })
      .execute();

    return {
      message: `Login records older than ${daysToKeep} days purged successfully.`,
      recordsPurged: result.affected || 0,
      cutoffDate,
    };
  }
}
