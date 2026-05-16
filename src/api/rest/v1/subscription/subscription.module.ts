import { Module } from '@nestjs/common';
import { SubscriptionsController } from './subscription.controller';
import { SubscriptionsService } from '../../../../services/subscription/subscription.service';
import { PaymentService } from '../../../../services/payment/payment.service';

@Module({
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, PaymentService],
  exports: [SubscriptionsService, PaymentService],
})
export class SubscriptionModule {}
