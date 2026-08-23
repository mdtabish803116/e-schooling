import { ISendEmailRequest } from '../../../interfaces/request/notification/send-email.request.interface';
import { INotificationResponse } from './sms-provider.interface';

export interface IEmailProvider {
  sendEmail(request: ISendEmailRequest): Promise<INotificationResponse>;
}
