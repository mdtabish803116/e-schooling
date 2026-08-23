import { Injectable, Logger } from '@nestjs/common';
import { IEmailProvider } from '../../interfaces/email-provider.interface';
import { INotificationResponse } from '../../interfaces/sms-provider.interface';
import { ISendEmailRequest } from '../../../../interfaces/request/notification/send-email.request.interface';

@Injectable()
export class MockEmailProvider implements IEmailProvider {
  private readonly logger = new Logger(MockEmailProvider.name);

  async sendEmail(request: ISendEmailRequest): Promise<INotificationResponse> {
    this.logger.log(`[MOCK EMAIL] Sending Email to: ${Array.isArray(request.to) ? request.to.join(', ') : request.to}`);
    this.logger.log(`[MOCK EMAIL] Subject: ${request.subject}`);
    this.logger.log(`[MOCK EMAIL] Body: ${request.body || request.html || 'N/A'}`);

    return {
      success: true,
      messageId: `mock-email-${Date.now()}`,
      providerResponse: { status: 'mocked', timestamp: new Date().toISOString() },
    };
  }
}
