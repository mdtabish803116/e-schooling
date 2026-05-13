import { Module } from '@nestjs/common';
import { EntitlementController } from './entitlement.controller';
import { EntitlementService } from '../../../../services/entitlement/entitlement.service';

@Module({
  controllers: [EntitlementController],
  providers: [EntitlementService],
  exports: [EntitlementService],
})
export class EntitlementModule {}
