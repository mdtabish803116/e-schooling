import { Module } from '@nestjs/common';
import { RedisConnectionService } from '../redis/redis-connection.service';
import { QueueProducerService } from './queue-producer.service';

@Module({
  providers: [RedisConnectionService, QueueProducerService],
  exports: [RedisConnectionService, QueueProducerService],
})
export class QueueModule {}
