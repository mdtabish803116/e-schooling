import { Module } from '@nestjs/common';
import { SchoolsController } from './schools.controller';
import { SchoolsService } from '../../../../services/schools/schools.service';

@Module({
  controllers: [SchoolsController],
  providers: [SchoolsService]
})
export class SchoolsModule {}
