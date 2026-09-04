import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { Request, Response } from 'express';
import {
  ApiCryptoService,
  API_CRYPTO_CONSTANTS,
} from '../crypto/api-crypto.service';

@Injectable()
export class ApiEncryptionInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ApiEncryptionInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const rawUrl = req.originalUrl || req.url || '';
    const lowerUrl = rawUrl.toLowerCase();

    // Excluded endpoints
    const isExcluded =
      lowerUrl.includes('/storage/upload') ||
      lowerUrl.includes('/api/docs') ||
      lowerUrl.includes('/swagger') ||
      lowerUrl.includes('/health') ||
      lowerUrl.includes('/crypto/dev-decrypt');

    const shouldEncrypt =
      !isExcluded &&
      ApiCryptoService.isEncryptionEnabled() &&
      ((req as any).isEncryptedPayload === true ||
        (req as any).clientRequestedEncryption === true ||
        req.headers[API_CRYPTO_CONSTANTS.HEADER_ENCRYPTED] === '1' ||
        req.headers[API_CRYPTO_CONSTANTS.HEADER_ENCRYPTED] === 'true');

    return next.handle().pipe(
      map((data) => {
        if (!shouldEncrypt || data === undefined || data === null) {
          return data;
        }

        // Skip binary streams or buffers
        if (Buffer.isBuffer(data) || typeof (data as any)?.pipe === 'function') {
          return data;
        }

        try {
          const encrypted = ApiCryptoService.encrypt(data);
          res.setHeader(API_CRYPTO_CONSTANTS.HEADER_ENCRYPTED, '1');
          res.setHeader(
            API_CRYPTO_CONSTANTS.HEADER_VERSION,
            API_CRYPTO_CONSTANTS.KEY_VERSION_STRING,
          );
          return encrypted;
        } catch (err: any) {
          this.logger.error(
            `Failed to encrypt outgoing API response payload for ${req.method} ${rawUrl}: ${err.message}`,
          );
          return data;
        }
      }),
    );
  }
}
