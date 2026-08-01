import { Module } from '@nestjs/common';
import { FeesController } from './fees.controller';
import { FeesService } from '../../../../services/fees/fees.service';

@Module({
  controllers: [FeesController],
  providers: [FeesService],
})
export class FeesModule {}
