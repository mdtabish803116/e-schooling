import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { AuthOtp } from '../../../models/entities/auth/auth-otp.entity';
import { SmsService } from './sms.service';
import { EmailService } from './email.service';
import { INotificationResponse } from '../interfaces/sms-provider.interface';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    @InjectRepository(AuthOtp)
    private readonly otpRepository: Repository<AuthOtp>,
    private readonly smsService: SmsService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Generates a 6-digit OTP code, dispatches it via SMS/Email FIRST.
   * Only saves to auth_otps table if the provider dispatch succeeds.
   */
  async sendOtp(params: {
    recipient: string; // Phone number (e.g. '919523855480') or Email address
    channel?: 'sms' | 'email';
    purpose?: string; // e.g. 'LOGIN', 'REGISTER', 'FORGOT_PASSWORD'
    expiryMinutes?: number;
  }): Promise<{
    success: boolean;
    otpId?: string;
    error?: string;
    providerResponse?: any;
  }> {
    const cleanRecipient = params.recipient.trim().toLowerCase().replace(/^\+/, '');
    const channel =
      params.channel || (cleanRecipient.includes('@') ? 'email' : 'sms');
    const purpose = params.purpose || 'LOGIN';
    const expiryMinutes = params.expiryMinutes || 5;

    // 1. Generate 6-digit OTP code & expiration time
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    this.logger.log(
      `Attempting to send OTP to ${cleanRecipient} [Channel: ${channel}, Purpose: ${purpose}]`,
    );

    // 2. Dispatch via SMS or Email service FIRST
    let dispatchResult: INotificationResponse;

    if (channel === 'sms') {
      dispatchResult = await this.smsService.sendOtp({
        mobile: cleanRecipient,
        otp: otpCode,
      });
    } else {
      dispatchResult = await this.emailService.sendEmail({
        to: cleanRecipient,
        subject: `Your Verification Code (${purpose})`,
        body: `<p>Your verification code is <strong>${otpCode}</strong>. Valid for ${expiryMinutes} minutes.</p>`,
      });
    }

    // 3. If provider dispatch failed, do NOT save to DB
    if (!dispatchResult.success) {
      this.logger.error(
        `Failed to dispatch OTP to ${cleanRecipient}: ${dispatchResult.error}`,
      );
      return {
        success: false,
        error: dispatchResult.error || 'Failed to dispatch OTP via provider',
        providerResponse: dispatchResult.providerResponse,
      };
    }

    // 4. Save record to auth_otps table ONLY on successful dispatch
    const otpRecord = this.otpRepository.create({
      recipient: cleanRecipient,
      otpCode,
      channel,
      purpose,
      expiresAt,
      isVerified: false,
    });
    await this.otpRepository.save(otpRecord);

    this.logger.log(
      `OTP dispatched successfully and saved to DB for ${cleanRecipient} [OTP ID: ${otpRecord.id}, Code: ${otpCode}]`,
    );

    return {
      success: true,
      otpId: otpRecord.id,
      providerResponse: dispatchResult.providerResponse,
    };
  }

  /**
   * Verifies an OTP code for a recipient from the auth_otps table.
   * Marks record as verified if valid and not expired.
   */
  async verifyOtp(params: {
    recipient: string;
    otpCode: string;
    purpose?: string;
  }): Promise<{ valid: boolean; message?: string }> {
    const cleanRecipient = params.recipient.trim().toLowerCase().replace(/^\+/, '');
    const cleanOtp = params.otpCode.trim();
    const purpose = params.purpose || 'LOGIN';

    // 1. Query for active, unverified, unexpired OTP records matching recipient variants
    const records = await this.otpRepository.find({
      where: [
        { recipient: cleanRecipient, otpCode: cleanOtp, isVerified: false, expiresAt: MoreThan(new Date()) },
        { recipient: cleanRecipient.replace(/^91/, ''), otpCode: cleanOtp, isVerified: false, expiresAt: MoreThan(new Date()) },
        { recipient: `91${cleanRecipient}`, otpCode: cleanOtp, isVerified: false, expiresAt: MoreThan(new Date()) },
      ],
      order: { createdAt: 'DESC' },
    });

    // 2. Find record matching purpose, or fallback to latest unverified active OTP
    let record = records.find((r) => r.purpose === purpose);
    if (!record && records.length > 0) {
      record = records[0];
    }

    if (!record) {
      this.logger.warn(
        `OTP verification failed for ${params.recipient} [Code: ${cleanOtp}, Purpose: ${purpose}]`,
      );
      return { valid: false, message: 'Invalid or expired OTP' };
    }

    // 3. Mark as verified
    record.isVerified = true;
    record.verifiedAt = new Date();
    await this.otpRepository.save(record);

    this.logger.log(
      `OTP verified successfully for ${params.recipient} [Record ID: ${record.id}]`,
    );
    return { valid: true };
  }
}
