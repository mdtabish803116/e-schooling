export interface ISendOtpRequest {
  mobile: string; // Recipient phone number
  otp: string; // The generated OTP code
  templateId?: string; // Optional custom OTP template / flow ID
  expiryMinutes?: number; // OTP validity duration (default e.g. 10 mins)
}
