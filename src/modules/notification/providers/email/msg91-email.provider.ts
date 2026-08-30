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
        recipients: [
          {
            to: toArray,
            variables: request.variables || {},
          },
        ],
        from: {
          name: this.fromName,
          email: this.fromEmail,
        },
        domain: this.domain || (this.fromEmail ? this.fromEmail.split('@')[1] : ''),
      };
      
      payload.template_id = request.templateId;

      const response = await fetch('https://control.msg91.com/api/v5/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authkey: this.authKey,
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok || (responseData && responseData.type === 'error') || responseData.hasError) {
        this.logger.error(`MSG91 Email Error: ${JSON.stringify(responseData)}`);
        
        let detailedError = responseData.message || 'Failed to send Email via MSG91';
        if (responseData.errors && typeof responseData.errors === 'object') {
          const errorDetails = Object.values(responseData.errors).flat().join(' | ');
          detailedError = `${detailedError} - ${errorDetails}`;
        }
        
        return {
          success: false,
          error: detailedError,
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
