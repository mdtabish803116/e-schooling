import { Injectable, Logger } from '@nestjs/common';
import { ISmsProvider, INotificationResponse } from '../../interfaces/sms-provider.interface';
import { ISendSmsRequest } from '../../../../interfaces/request/notification/send-sms.request.interface';
import { ISendOtpRequest } from '../../../../interfaces/request/notification/send-otp.request.interface';

@Injectable()
export class Msg91SmsProvider implements ISmsProvider {
  private readonly logger = new Logger(Msg91SmsProvider.name);

  private get authKey(): string {
    return process.env.MSG91_AUTH_KEY || '';
  }

  private get defaultSenderId(): string {
    return process.env.MSG91_SENDER_ID || '';
  }

  private get defaultOtpFlowId(): string {
    return process.env.MSG91_OTP_FLOW_ID || '';
  }

  async sendSms(request: ISendSmsRequest): Promise<INotificationResponse> {
    if (!this.authKey) {
      this.logger.error('MSG91_AUTH_KEY is not defined in environment variables');
      return { success: false, error: 'MSG91_AUTH_KEY missing' };
    }

    const templateId = request.templateId;
    if (!templateId) {
      this.logger.error('Template ID / Flow ID is required for MSG91 SMS');
      return { success: false, error: 'Template ID / Flow ID missing' };
    }

    try {
      const mobile = request.mobile.replace(/^\+/, '');

      const payload = {
        template_id: templateId,
        sender: request.senderId || this.defaultSenderId,
        recipients: [
          {
            mobiles: mobile,
            ...(request.params || {}),
          },
        ],
      };

      const response = await fetch('https://control.msg91.com/api/v5/flow/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authkey: this.authKey,
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();
      this.logger.log(`MSG91 Flow Response: ${JSON.stringify(responseData)}`);

      const isSuccess =
        response.ok && responseData && responseData.type === 'success';

      if (!isSuccess) {
        const errorMsg =
          responseData?.message ||
          responseData?.detail ||
          'Failed to send SMS via MSG91';
        this.logger.error(`MSG91 Send SMS Error: ${JSON.stringify(responseData)}`);
        return {
          success: false,
          error: typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg),
          providerResponse: responseData,
        };
      }

      return {
        success: true,
        messageId: responseData.request_id || responseData.message,
        providerResponse: responseData,
      };
    } catch (error: any) {
      this.logger.error(`MSG91 SMS exception: ${error?.message}`, error?.stack);
      return {
        success: false,
        error: error?.message || 'MSG91 network request failed',
      };
    }
  }

  async sendOtp(request: ISendOtpRequest): Promise<INotificationResponse> {
    if (!this.authKey) {
      this.logger.error('MSG91_AUTH_KEY is not defined in environment variables');
      return { success: false, error: 'MSG91_AUTH_KEY missing' };
    }

    const templateId = request.templateId || this.defaultOtpFlowId;

    if (templateId) {
      return this.sendSms({
        mobile: request.mobile,
        templateId,
        params: {
          otp: request.otp,
          code: request.otp,
          var1: request.otp,
          var: request.otp,
        },
      });
    }

    try {
      const mobile = request.mobile.replace(/^\+/, '');
      const url = `https://control.msg91.com/api/v5/otp?mobile=${encodeURIComponent(mobile)}&otp=${encodeURIComponent(request.otp)}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authkey: this.authKey,
        },
      });

      const responseData = await response.json();
      this.logger.log(`MSG91 OTP API Response: ${JSON.stringify(responseData)}`);

      const isSuccess =
        response.ok && responseData && responseData.type === 'success';

      if (!isSuccess) {
        const errorMsg =
          responseData?.message ||
          responseData?.detail ||
          'Failed to send OTP via MSG91 API';
        this.logger.error(`MSG91 OTP Error: ${JSON.stringify(responseData)}`);
        return {
          success: false,
          error: typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg),
          providerResponse: responseData,
        };
      }

      return {
        success: true,
        messageId: responseData.request_id || responseData.message,
        providerResponse: responseData,
      };
    } catch (error: any) {
      this.logger.error(`MSG91 OTP Exception: ${error?.message}`, error?.stack);
      return {
        success: false,
        error: error?.message || 'MSG91 OTP network request failed',
      };
    }
  }
}
