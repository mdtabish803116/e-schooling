export interface ISendEmailRequest {
  to: string | string[]; // Recipient email address(es)
  subject?: string;
  body?: string; // HTML or plain text body
  html?: string;
  templateId?: string; // MSG91 or provider email template ID
  variables?: Record<string, string | number>; // Template variables
  attachments?: Array<{
    filename: string;
    content?: string | Buffer;
    path?: string;
    contentType?: string;
  }>;
}
