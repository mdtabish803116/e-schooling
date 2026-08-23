import { Injectable, Logger } from '@nestjs/common';
import { ISmsProvider, INotificationResponse } from '../../interfaces/sms-provider.interface';
import { ISendSmsRequest } from '../../../../interfaces/request/notification/send-sms.request.interface';
import { ISendOtpRequest } from '../../../../interfaces/request/notification/send-otp.request.interface';

@Injectable()
export class MockSmsProvider implements ISmsProvider {
  private readonly logger = new Logger(MockSmsProvider.name);

  async sendSms(request: ISendSmsRequest): Promise<INotificationResponse> {
    this.logger.log(`[MOCK SMS] Sending SMS to ${request.mobile} | Template: ${request.templateId || 'N/A'}`);
    this.logger.log(`[MOCK SMS] Params: ${JSON.stringify(request.params || {})}`);

    return {
      success: true,
      messageId: `mock-sms-${Date.now()}`,
      providerResponse: { status: 'mocked', timestamp: new Date().toISOString() },
    };
  }

  async sendOtp(request: ISendOtpRequest): Promise<INotificationResponse> {
    this.logger.log(`[MOCK OTP] ****************************************`);
    this.logger.log(`[MOCK OTP] Sending OTP to Mobile: ${request.mobile}`);
    this.logger.log(`[MOCK OTP] OTP CODE: ${request.otp}`);
    this.logger.log(`[MOCK OTP] ****************************************`);

    return {
      success: true,
      messageId: `mock-otp-${Date.now()}`,
      providerResponse: { status: 'mocked', otp: request.otp },
    };
  }
}
