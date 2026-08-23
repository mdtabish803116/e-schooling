import { ISendSmsRequest } from '../../../interfaces/request/notification/send-sms.request.interface';
import { ISendOtpRequest } from '../../../interfaces/request/notification/send-otp.request.interface';

export interface INotificationResponse {
  success: boolean;
  messageId?: string;
  providerResponse?: any;
  error?: string;
}

export interface ISmsProvider {
  sendSms(request: ISendSmsRequest): Promise<INotificationResponse>;
  sendOtp(request: ISendOtpRequest): Promise<INotificationResponse>;
}
