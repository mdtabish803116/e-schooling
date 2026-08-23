import { Injectable, Logger } from '@nestjs/common';
import { ISmsProvider, INotificationResponse } from '../../interfaces/sms-provider.interface';
import { ISendSmsRequest } from '../../../../interfaces/request/notification/send-sms.request.interface';
import { ISendOtpRequest } from '../../../../interfaces/request/notification/send-otp.request.interface';

@Injectable()
export class TwilioSmsProvider implements ISmsProvider {
  private readonly logger = new Logger(TwilioSmsProvider.name);

  async sendSms(request: ISendSmsRequest): Promise<INotificationResponse> {
    this.logger.warn('TwilioSmsProvider is a stub. Configure Twilio credentials to activate.');
    return {
      success: false,
      error: 'Twilio provider not yet configured',
    };
  }

  async sendOtp(request: ISendOtpRequest): Promise<INotificationResponse> {
    this.logger.warn('TwilioSmsProvider is a stub. Configure Twilio credentials to activate.');
    return {
      success: false,
      error: 'Twilio provider not yet configured',
    };
  }
}
