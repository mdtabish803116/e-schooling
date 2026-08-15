import { Module } from '@nestjs/common';
import { FeesController } from './fees.controller';
import { FeesService } from '../../../../services/fees/fees.service';

@Module({
  controllers: [FeesController],
  providers: [FeesService],
  exports: [FeesService],
})
export class FeesModule {}
