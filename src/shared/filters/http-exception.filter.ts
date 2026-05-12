import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

/**
 * GlobalHttpExceptionFilter
 *
 * Catches all HttpException instances and serialises them into a
 * consistent error envelope for REST responses:
 *
 * ```json
 * {
 *   "success": false,
 *   "statusCode": 409,
 *   "error": "CONFLICT",
 *   "message": "A record already exists."
 * }
 * ```
 */
@Catch(HttpException)
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalHttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception.getStatus
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = exception.getResponse();

    let customError: string | undefined;
    let message: string | string[];

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null
    ) {
      const res = exceptionResponse as Record<string, unknown>;

      if (typeof res['error'] === 'string') {
        customError = res['error'];
      }

      message = (res['message'] as string | string[]) || exception.message;
    } else {
      message = exception.message;
    }

    const errorCode = customError ?? this.httpStatusToDefaultCode(status);

    this.logger.debug(
      `[${status}] ${errorCode} ${request.method} ${request.url}: ${Array.isArray(message) ? message.join(', ') : message}`,
    );

    response.status(status).json({
      success: false,
      statusCode: status,
      error: errorCode,
      message,
    });
  }

  private httpStatusToDefaultCode(status: number): string {
    const map: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
    };
    return map[status] ?? 'INTERNAL_SERVER_ERROR';
  }
}
