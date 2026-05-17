import * as dotenv from 'dotenv';

export class Config {
  static getSecret(key: string, type: NumberConstructor): number | undefined;
  static getSecret(key: string, type: BooleanConstructor): boolean | undefined;
  static getSecret(key: string, type?: StringConstructor): string | undefined;
  static getSecret(key: string, type: unknown = String): unknown {
    const value = process.env[key];
    if (value === undefined) {
      return undefined;
    }
    
    if (type === Number) {
      return Number(value);
    }
    if (type === Boolean) {
      return value === 'true';
    }
    return value;
  }

  static getPostGresConfig() {
    return {
      host: this.getSecret('POSTGRES_HOST', String),
      port: Number(this.getSecret('POSTGRES_PORT', String)),
      database: this.getSecret('POSTGRES_DATABASE', String),
      username: this.getSecret('POSTGRES_USERNAME', String),
      password: this.getSecret('POSTGRES_PASSWORD', String),
    };
  }

  static getPostgresPoolConfig() {
    const poolConfigRaw = process.env.POSTGRES_CONNECTION_POOL_CONFIG || '{}';
    let parsedConfig: Record<string, unknown> = {};

    try {
      parsedConfig = JSON.parse(poolConfigRaw) as Record<string, unknown>;
    } catch {
      parsedConfig = {};
    }

    return {
      max: typeof parsedConfig.max === 'number' ? parsedConfig.max : 10,
      min: typeof parsedConfig.min === 'number' ? parsedConfig.min : 2,
      idleTimeoutMillis:
        typeof parsedConfig.idleTimeoutMillis === 'number'
          ? parsedConfig.idleTimeoutMillis
          : 30000,
      connectionTimeoutMillis:
        typeof parsedConfig.connectionTimeoutMillis === 'number'
          ? parsedConfig.connectionTimeoutMillis
          : 3000,
    };
  }

  static getCloudinaryConfig() {
    const cloudName = this.getSecret('CLOUDINARY_CLOUD_NAME', String);
    const apiKey = this.getSecret('CLOUDINARY_API_KEY', String);
    const apiSecret = this.getSecret('CLOUDINARY_API_SECRET', String);

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error('Cloudinary configuration is missing. Please ensure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are set.');
    }

    return {
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    };
  }

  static getPlatformRegisterApiKey(): string {
    const key = this.getSecret('PLATFORM_REGISTRATION_KEY', String);
    if (!key) {
      throw new Error('PLATFORM_REGISTRATION_KEY is not defined in environment variables');
    }
    return key;
  }

  static getRedisConfig() {
    return {
      host: this.getSecret('REDIS_HOST', String) || '127.0.0.1',
      port: Number(this.getSecret('REDIS_PORT', String) || '6379'),
      password: this.getSecret('REDIS_PASSWORD', String) || undefined
    };
  }
}
