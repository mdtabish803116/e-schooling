import { HttpException } from '@nestjs/common';

export interface ApiResponseEnvelope<T = any> {
  success: boolean;
  error: any;
  message: string;
  status: number;
  data: T;
}

export class ApiResponse {
  static success<T>(data: T, message = 'Success', status = 200): ApiResponseEnvelope<T> {
    return {
      success: true,
      error: null,
      message,
      status,
      data,
    };
  }

  static error(error: any, message = 'An error occurred', status = 500): ApiResponseEnvelope<null> {
    return {
      success: false,
      error: error || 'INTERNAL_SERVER_ERROR',
      message,
      status,
      data: null,
    };
  }
}

export class ApiResponseException extends HttpException {
  constructor(message: string, status: number, errorDetails: any = null) {
    super(
      {
        success: false,
        error: errorDetails || 'ERROR',
        message,
        status,
        data: null,
      },
      status,
    );
  }
}
