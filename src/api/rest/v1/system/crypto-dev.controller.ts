import {
  Controller,
  Post,
  Body,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiCryptoService } from '../../../../shared/crypto/api-crypto.service';

@ApiTags('Crypto Developer Tooling')
@Controller('crypto')
export class CryptoDevController {
  private ensureDevEnvironment(): void {
    if (process.env.NODE_ENV === 'prod' || process.env.NODE_ENV === 'production') {
      throw new ForbiddenException(
        'Developer crypto inspection endpoints are strictly disabled in production.',
      );
    }
  }

  @ApiOperation({
    summary: 'Dev-Only: Decrypt an encrypted Base64 payload captured from network/Postman',
  })
  @ApiResponse({
    status: 200,
    description: 'Decrypted plain payload',
  })
  @Post('dev-decrypt')
  devDecrypt(@Body() body: { data?: string; payload?: string }) {
    this.ensureDevEnvironment();
    const encryptedInput = body.data || body.payload;
    if (!encryptedInput) {
      throw new BadRequestException('Property "data" or "payload" containing Base64 string is required.');
    }
    try {
      const decrypted = ApiCryptoService.decrypt(encryptedInput);
      return {
        success: true,
        decrypted,
      };
    } catch (err: any) {
      throw new BadRequestException(`Decryption failed: ${err.message}`);
    }
  }

  @ApiOperation({
    summary: 'Dev-Only: Encrypt a plain JSON payload for testing with Postman or Curl',
  })
  @ApiResponse({
    status: 200,
    description: 'Encrypted Base64 payload envelope',
  })
  @Post('dev-encrypt')
  devEncrypt(@Body() body: any) {
    this.ensureDevEnvironment();
    const payloadToEncrypt = body.payload !== undefined ? body.payload : body;
    try {
      const encrypted = ApiCryptoService.encrypt(payloadToEncrypt);
      return {
        success: true,
        ...encrypted,
      };
    } catch (err: any) {
      throw new BadRequestException(`Encryption failed: ${err.message}`);
    }
  }
}
