import { Module, Global, Provider } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthOtp } from '../../models/entities/auth/auth-otp.entity';
import { SMS_PROVIDER_TOKEN, EMAIL_PROVIDER_TOKEN } from './constants/notification.tokens';
import { MockSmsProvider } from './providers/sms/mock-sms.provider';
import { Msg91SmsProvider } from './providers/sms/msg91-sms.provider';
import { TwilioSmsProvider } from './providers/sms/twilio-sms.provider';
import { MockEmailProvider } from './providers/email/mock-email.provider';
import { Msg91EmailProvider } from './providers/email/msg91-email.provider';
import { NodemailerEmailProvider } from './providers/email/nodemailer-email.provider';
import { SmsService } from './services/sms.service';
import { EmailService } from './services/email.service';
import { OtpService } from './services/otp.service';

const smsProviderFactory: Provider = {
  provide: SMS_PROVIDER_TOKEN,
  useFactory: (mockSms: MockSmsProvider, msg91Sms: Msg91SmsProvider, twilioSms: TwilioSmsProvider) => {
    const provider = (process.env.SMS_PROVIDER || 'mock').toLowerCase();
    switch (provider) {
      case 'msg91':
        return msg91Sms;
      case 'twilio':
        return twilioSms;
      case 'mock':
      default:
        return mockSms;
    }
  },
  inject: [MockSmsProvider, Msg91SmsProvider, TwilioSmsProvider],
};

const emailProviderFactory: Provider = {
  provide: EMAIL_PROVIDER_TOKEN,
  useFactory: (mockEmail: MockEmailProvider, msg91Email: Msg91EmailProvider, nodemailerEmail: NodemailerEmailProvider) => {
    const provider = (process.env.EMAIL_PROVIDER || 'mock').toLowerCase();
    switch (provider) {
      case 'msg91':
        return msg91Email;
      case 'nodemailer':
      case 'smtp':
        return nodemailerEmail;
      case 'mock':
      default:
        return mockEmail;
    }
  },
  inject: [MockEmailProvider, Msg91EmailProvider, NodemailerEmailProvider],
};

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AuthOtp])],
  providers: [
    MockSmsProvider,
    Msg91SmsProvider,
    TwilioSmsProvider,
    MockEmailProvider,
    Msg91EmailProvider,
    NodemailerEmailProvider,
    smsProviderFactory,
    emailProviderFactory,
    SmsService,
    EmailService,
    OtpService,
  ],
  exports: [
    SmsService,
    EmailService,
    OtpService,
    SMS_PROVIDER_TOKEN,
    EMAIL_PROVIDER_TOKEN,
  ],
})
export class NotificationModule {}
