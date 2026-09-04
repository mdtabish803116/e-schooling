import { Injectable, NestMiddleware, BadRequestException, Logger } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import {
  ApiCryptoService,
  API_CRYPTO_CONSTANTS,
} from '../shared/crypto/api-crypto.service';

@Injectable()
export class ApiDecryptionMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ApiDecryptionMiddleware.name);

  use(req: Request, res: Response, next: NextFunction): void {
    const rawUrl = req.originalUrl || req.url || '';
    const lowerUrl = rawUrl.toLowerCase();

    // Check Excluded URLs
    const isExcluded =
      lowerUrl.includes('/storage/upload') ||
      lowerUrl.includes('/api/docs') ||
      lowerUrl.includes('/swagger') ||
      lowerUrl.includes('/health') ||
      lowerUrl.includes('/crypto/dev-decrypt');

    const contentType = req.headers['content-type'] || '';
    const isMultipart = contentType.includes('multipart/form-data');

    if (isExcluded || isMultipart) {
      return next();
    }

    // 1. Transparent Decryption for Encrypted Authorization Token
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (typeof authHeader === 'string') {
      const trimmedAuth = authHeader.trim();
      if (trimmedAuth.startsWith('Encrypted ') || trimmedAuth.startsWith('encrypted ')) {
        const cipherToken = trimmedAuth.slice(10).trim();
        try {
          const plainJwt = ApiCryptoService.decrypt<string>(cipherToken);
          req.headers.authorization = `Bearer ${plainJwt}`;
          (req as any).isEncryptedPayload = true;
          (req as any).clientRequestedEncryption = true;
        } catch (authDecErr: any) {
          this.logger.error(
            `Failed to decrypt encrypted Authorization header: ${authDecErr.message}`,
          );
          throw new BadRequestException('Invalid or corrupted encrypted authorization header.');
        }
      } else if (trimmedAuth.startsWith('Bearer ') || trimmedAuth.startsWith('bearer ')) {
        const potentialCipher = trimmedAuth.slice(7).trim();
        // If Bearer token is an encrypted Base64 string rather than a raw JWT (which has 2 dots)
        if (
          potentialCipher.length > 30 &&
          !potentialCipher.includes('.') &&
          ApiCryptoService.isEncryptedPayload(potentialCipher)
        ) {
          try {
            const plainJwt = ApiCryptoService.decrypt<string>(potentialCipher);
            req.headers.authorization = `Bearer ${plainJwt}`;
            (req as any).isEncryptedPayload = true;
            (req as any).clientRequestedEncryption = true;
          } catch {
            // If it was a standard token, leave as is
          }
        }
      }
    } else if (typeof req.headers['x-encrypted-token'] === 'string') {
      try {
        const plainJwt = ApiCryptoService.decrypt<string>(req.headers['x-encrypted-token']);
        req.headers.authorization = `Bearer ${plainJwt}`;
        (req as any).isEncryptedPayload = true;
        (req as any).clientRequestedEncryption = true;
      } catch (authDecErr: any) {
        this.logger.error(
          `Failed to decrypt x-encrypted-token header: ${authDecErr.message}`,
        );
        throw new BadRequestException('Invalid or corrupted encrypted token header.');
      }
    }

    // 2. Transparent Decryption for Encrypted Request Body
    const isEncryptedHeader =
      req.headers[API_CRYPTO_CONSTANTS.HEADER_ENCRYPTED] === '1' ||
      req.headers[API_CRYPTO_CONSTANTS.HEADER_ENCRYPTED] === 'true';

    const isEncryptedBody = ApiCryptoService.isEncryptedPayload(req.body);

    if (isEncryptedHeader || isEncryptedBody) {
      try {
        if (req.body) {
          const decrypted = ApiCryptoService.decrypt(req.body);
          req.body = decrypted;
          (req as any).isEncryptedPayload = true;
          (req as any).clientRequestedEncryption = true;
        }
      } catch (err: any) {
        this.logger.error(
          `Failed to decrypt incoming API request payload for ${req.method} ${rawUrl}: ${err.message}`,
        );
        throw new BadRequestException(
          'Failed to decrypt encrypted request payload. Invalid key or corrupted ciphertext.',
        );
      }
    }

    next();
  }
}
