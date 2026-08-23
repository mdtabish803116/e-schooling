import { Injectable, Logger } from '@nestjs/common';
import { IEmailProvider } from '../../interfaces/email-provider.interface';
import { INotificationResponse } from '../../interfaces/sms-provider.interface';
import { ISendEmailRequest } from '../../../../interfaces/request/notification/send-email.request.interface';

@Injectable()
export class NodemailerEmailProvider implements IEmailProvider {
  private readonly logger = new Logger(NodemailerEmailProvider.name);

  async sendEmail(request: ISendEmailRequest): Promise<INotificationResponse> {
    this.logger.warn('NodemailerEmailProvider is a stub. Install nodemailer and configure SMTP settings to activate.');
    return {
      success: false,
      error: 'Nodemailer provider not yet configured',
    };
  }
}
