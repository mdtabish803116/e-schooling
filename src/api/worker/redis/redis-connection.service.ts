import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import Redis from 'ioredis';
import { Config } from '../../../config/index';

@Injectable()
export class RedisConnectionService implements OnApplicationShutdown {
  private readonly logger = new Logger(RedisConnectionService.name);
  private redisConnection: Redis;

  constructor() {
    const redisConfig = Config.getRedisConfig();

    this.logger.log(`Initializing Redis Connection to ${redisConfig.host}:${redisConfig.port}`);

    this.redisConnection = new Redis({
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password,
      maxRetriesPerRequest: null, // Critical requirement for BullMQ workers!
      retryStrategy: (times) => {
        const delay = Math.min(times * 100, 3000);
        this.logger.warn(`Redis connection lost. Reconnection attempt #${times} in ${delay}ms`);
        return delay;
      },
    });

    this.redisConnection.on('connect', () => {
      this.logger.log('Successfully connected to Redis server.');
    });

    this.redisConnection.on('error', (err) => {
      this.logger.error(`Redis Connection Error: ${err.message}`, err.stack);
    });
  }

  /**
   * Get the active Redis client connection
   */
  getConnection(): Redis {
    return this.redisConnection;
  }

  async onApplicationShutdown() {
    this.logger.log('Closing Redis connection...');
    await this.redisConnection.quit();
  }
}
