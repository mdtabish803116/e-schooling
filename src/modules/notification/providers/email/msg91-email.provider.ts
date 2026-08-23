import { Injectable, Logger } from '@nestjs/common';
import { IEmailProvider } from '../../interfaces/email-provider.interface';
import { INotificationResponse } from '../../interfaces/sms-provider.interface';
import { ISendEmailRequest } from '../../../../interfaces/request/notification/send-email.request.interface';

@Injectable()
export class Msg91EmailProvider implements IEmailProvider {
  private readonly logger = new Logger(Msg91EmailProvider.name);

  private get authKey(): string {
    return process.env.MSG91_AUTH_KEY || '';
  }

  private get domain(): string {
    return process.env.MSG91_EMAIL_DOMAIN || '';
  }

  private get fromEmail(): string {
    return process.env.MSG91_EMAIL_FROM_ADDRESS || 'no-reply@eschooling.com';
  }

  private get fromName(): string {
    return process.env.MSG91_EMAIL_FROM_NAME || 'e-Schooling';
  }

  async sendEmail(request: ISendEmailRequest): Promise<INotificationResponse> {
    if (!this.authKey) {
      this.logger.error('MSG91_AUTH_KEY is not defined in environment variables');
      return { success: false, error: 'MSG91_AUTH_KEY missing' };
    }

    try {
      const recipients = Array.isArray(request.to) ? request.to : [request.to];
      const toArray = recipients.map((email) => ({ email }));

      const payload: Record<string, any> = {
        to: toArray,
        from: {
          name: this.fromName,
          email: this.fromEmail,
        },
        domain: this.domain,
        subject: request.subject,
      };

      if (request.html || request.body) {
        payload.body = request.html || request.body;
      }

      if (request.templateId) {
        payload.template_id = request.templateId;
        payload.variables = request.variables || {};
      }

      const response = await fetch('https://control.msg91.com/api/v5/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authkey: this.authKey,
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok || (responseData && responseData.type === 'error')) {
        this.logger.error(`MSG91 Email Error: ${JSON.stringify(responseData)}`);
        return {
          success: false,
          error: responseData.message || 'Failed to send Email via MSG91',
          providerResponse: responseData,
        };
      }

      this.logger.log(`MSG91 Email sent successfully to ${recipients.join(', ')}`);
      return {
        success: true,
        messageId: responseData.request_id || responseData.message,
        providerResponse: responseData,
      };
    } catch (error: any) {
      this.logger.error(`MSG91 Email exception: ${error?.message}`, error?.stack);
      return {
        success: false,
        error: error?.message || 'MSG91 email request failed',
      };
    }
  }
}
