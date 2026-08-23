import { Injectable, Inject } from '@nestjs/common';
import { SMS_PROVIDER_TOKEN } from '../constants/notification.tokens';
import type { ISmsProvider, INotificationResponse } from '../interfaces/sms-provider.interface';
import { ISendSmsRequest } from '../../../interfaces/request/notification/send-sms.request.interface';
import { ISendOtpRequest } from '../../../interfaces/request/notification/send-otp.request.interface';

@Injectable()
export class SmsService {
  constructor(
    @Inject(SMS_PROVIDER_TOKEN)
    private readonly smsProvider: any,
  ) {}

  async sendSms(request: ISendSmsRequest): Promise<INotificationResponse> {
    return (this.smsProvider as ISmsProvider).sendSms(request);
  }

  async sendOtp(request: ISendOtpRequest): Promise<INotificationResponse> {
    return (this.smsProvider as ISmsProvider).sendOtp(request);
  }
}
