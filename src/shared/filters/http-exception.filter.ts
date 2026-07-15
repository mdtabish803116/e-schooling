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
@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let errorCode = 'INTERNAL_SERVER_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const res = exceptionResponse as Record<string, unknown>;
        if (typeof res['error'] === 'string') {
          errorCode = res['error'];
        }
        message = (res['message'] as string | string[]) || exception.message;
      } else {
        message = exception.message;
      }

      const msgStr = Array.isArray(message) ? message.join(', ') : (typeof message === 'string' ? message : '');
      if (
        msgStr.includes('invalid input syntax for type bigint') ||
        msgStr.includes('invalid input syntax for integer') ||
        msgStr.includes('invalid input syntax for type uuid')
      ) {
        status = HttpStatus.BAD_REQUEST;
        errorCode = 'BAD_REQUEST';
        message = 'Invalid parameter format (expected numeric ID)';
      }
    } else {
      const err = exception as Error;
      const errMsg = err.message || '';

      if (
        errMsg.includes('invalid input syntax for type bigint') ||
        errMsg.includes('invalid input syntax for integer') ||
        errMsg.includes('invalid input syntax for type uuid')
      ) {
        status = HttpStatus.BAD_REQUEST;
        errorCode = 'BAD_REQUEST';
        message = 'Invalid parameter format (expected numeric ID)';
      } else {
        this.logger.error(err.stack || err);
        message = err.message || 'Internal server error';
      }
    }

    const errorCodeFinal =
      errorCode === 'INTERNAL_SERVER_ERROR' && exception instanceof HttpException
        ? this.httpStatusToDefaultCode(status)
        : errorCode;

    this.logger.debug(
      `[${status}] ${errorCodeFinal} ${request.method} ${request.url}: ${Array.isArray(message) ? message.join(', ') : message}`,
    );

    response.status(status).json({
      success: false,
      statusCode: status,
      error: errorCodeFinal,
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
