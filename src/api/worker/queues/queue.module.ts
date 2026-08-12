import { Module } from '@nestjs/common';
import { PgPubSubService } from '../pg-pubsub/pg-pubsub.service';
import { QueueProducerService } from './queue-producer.service';

@Module({
  providers: [PgPubSubService, QueueProducerService],
  exports: [PgPubSubService, QueueProducerService],
})
export class QueueModule {}
