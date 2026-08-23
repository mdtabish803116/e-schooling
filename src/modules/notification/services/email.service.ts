import { Injectable, Inject } from '@nestjs/common';
import { EMAIL_PROVIDER_TOKEN } from '../constants/notification.tokens';
import type { IEmailProvider } from '../interfaces/email-provider.interface';
import type { INotificationResponse } from '../interfaces/sms-provider.interface';
import { ISendEmailRequest } from '../../../interfaces/request/notification/send-email.request.interface';

@Injectable()
export class EmailService {
  constructor(
    @Inject(EMAIL_PROVIDER_TOKEN)
    private readonly emailProvider: any,
  ) {}

  async sendEmail(request: ISendEmailRequest): Promise<INotificationResponse> {
    return (this.emailProvider as IEmailProvider).sendEmail(request);
  }
}
