import * as crypto from 'crypto';
import { Injectable, Logger } from '@nestjs/common';

export const API_CRYPTO_CONSTANTS = {
  KEY_VERSION_BYTE: 0x01,
  KEY_VERSION_STRING: 'v1',
  IV_LENGTH: 12, // 96-bit IV for AES-GCM
  TAG_LENGTH: 16, // 128-bit Auth Tag
  HEADER_ENCRYPTED: 'x-payload-encrypted',
  HEADER_VERSION: 'x-encryption-version',
};

@Injectable()
export class ApiCryptoService {
  private static readonly logger = new Logger(ApiCryptoService.name);

  // Default Master Key in Hex (32 bytes / 256 bits)
  private static readonly DEFAULT_KEY_HEX =
    process.env.API_ENCRYPTION_KEY_V1 ||
    process.env.API_ENCRYPTION_KEY ||
    process.env.API_ENCRYPTION_SECRET ||
    'c7f4a2d8e9b1c3a5f6e8d0c2b4a69781f3e5d7c9b1a38567240f1e3d5c7b9a0f';

  // Versioned Key Map for seamless zero-downtime key rotation
  private static readonly KEY_MAP: Record<number, Buffer> = {
    0x01: ApiCryptoService.parseKey(
      process.env.API_ENCRYPTION_KEY_V1 || ApiCryptoService.DEFAULT_KEY_HEX,
    ),
  };

  /**
   * Parse hex or raw string into 32-byte Buffer
   */
  private static parseKey(keyStr: string): Buffer {
    const cleanHex = keyStr.replace(/[^0-9a-fA-F]/g, '');
    const paddedHex = cleanHex.padEnd(64, '0').slice(0, 64);
    return Buffer.from(paddedHex, 'hex');
  }

  /**
   * Check if payload is an encrypted payload or envelope
   */
  public static isEncryptedPayload(value: unknown): boolean {
    if (!value) return false;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 30 && /^[A-Za-z0-9+/=]+$/.test(trimmed);
    }
    if (typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      return Boolean(
        (typeof obj.data === 'string' && obj.data.length > 20) ||
          obj.isEncrypted === true ||
          obj.__encrypted === true,
      );
    }
    return false;
  }

  /**
   * Extract raw Base64 string from data or envelope
   */
  public static extractEncryptedBase64(value: unknown): string | null {
    if (!value) return null;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    }
    if (typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      if (typeof obj.data === 'string') {
        return obj.data.trim();
      }
    }
    return null;
  }

  /**
   * Encrypt plain JavaScript data into an authenticated Base64 string
   * Layout: [1-byte Version][12-byte IV][16-byte Auth Tag][Ciphertext]
   */
  public static encrypt(
    payload: unknown,
    version: number = API_CRYPTO_CONSTANTS.KEY_VERSION_BYTE,
  ): { data: string } {
    if (payload === undefined || payload === null) {
      return { data: '' };
    }

    const jsonString =
      typeof payload === 'string' ? payload : JSON.stringify(payload);
    const key =
      ApiCryptoService.KEY_MAP[version] ||
      ApiCryptoService.KEY_MAP[API_CRYPTO_CONSTANTS.KEY_VERSION_BYTE];

    const iv = crypto.randomBytes(API_CRYPTO_CONSTANTS.IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv, {
      authTagLength: API_CRYPTO_CONSTANTS.TAG_LENGTH,
    });

    const ciphertext = Buffer.concat([
      cipher.update(jsonString, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    const versionBuf = Buffer.from([version]);
    const packedBuffer = Buffer.concat([versionBuf, iv, authTag, ciphertext]);

    return { data: packedBuffer.toString('base64') };
  }

  /**
   * Decrypt an authenticated Base64 string into plain JavaScript object/primitive
   */
  public static decrypt<T = any>(encryptedInput: unknown): T {
    const base64Payload = ApiCryptoService.extractEncryptedBase64(encryptedInput);
    if (!base64Payload) {
      return encryptedInput as T;
    }

    const packedBuffer = Buffer.from(base64Payload, 'base64');
    const minLength =
      1 +
      API_CRYPTO_CONSTANTS.IV_LENGTH +
      API_CRYPTO_CONSTANTS.TAG_LENGTH;

    if (packedBuffer.length < minLength) {
      throw new Error('Encrypted payload too short to be valid.');
    }

    const version = packedBuffer[0];
    const iv = packedBuffer.subarray(1, 1 + API_CRYPTO_CONSTANTS.IV_LENGTH);
    const authTag = packedBuffer.subarray(
      1 + API_CRYPTO_CONSTANTS.IV_LENGTH,
      1 +
        API_CRYPTO_CONSTANTS.IV_LENGTH +
        API_CRYPTO_CONSTANTS.TAG_LENGTH,
    );
    const ciphertext = packedBuffer.subarray(
      1 +
        API_CRYPTO_CONSTANTS.IV_LENGTH +
        API_CRYPTO_CONSTANTS.TAG_LENGTH,
    );

    const key =
      ApiCryptoService.KEY_MAP[version] ||
      ApiCryptoService.KEY_MAP[API_CRYPTO_CONSTANTS.KEY_VERSION_BYTE];

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv, {
      authTagLength: API_CRYPTO_CONSTANTS.TAG_LENGTH,
    });
    decipher.setAuthTag(authTag);

    const decryptedBuffer = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    const decryptedString = decryptedBuffer.toString('utf8');

    try {
      return JSON.parse(decryptedString) as T;
    } catch {
      return decryptedString as unknown as T;
    }
  }

  /**
   * Check if global encryption is enabled in configuration
   */
  public static isEncryptionEnabled(): boolean {
    return process.env.API_ENCRYPTION_ENABLED !== 'false';
  }
}
