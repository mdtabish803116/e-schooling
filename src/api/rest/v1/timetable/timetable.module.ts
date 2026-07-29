import { Module } from '@nestjs/common';
import { TimetableController } from './timetable.controller';
import { TimetableService } from '../../../../services/timetable/timetable.service';

@Module({
  controllers: [TimetableController],
  providers: [TimetableService],
  exports: [TimetableService],
})
export class TimetableModule {}
