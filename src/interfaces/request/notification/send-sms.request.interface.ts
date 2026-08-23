export interface ISendSmsRequest {
  mobile: string; // e.g. "919876543210" or "9876543210"
  templateId?: string; // DLT / MSG91 Flow ID
  params?: Record<string, string | number>; // Dynamic template variables e.g. { name: "John", code: "1234" }
  senderId?: string; // Optional custom sender ID override
}
