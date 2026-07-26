import { Module } from '@nestjs/common';
import { DocumentMasterController } from './document-master.controller';
import { DocumentMasterService } from '../../../../services/document/document-master.service';

@Module({
  controllers: [DocumentMasterController],
  providers: [DocumentMasterService],
  exports: [DocumentMasterService],
})
export class DocumentModule {}
