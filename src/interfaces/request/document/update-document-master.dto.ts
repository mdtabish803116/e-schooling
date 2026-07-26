import { PartialType } from '@nestjs/swagger';
import { CreateDocumentMasterDto } from './create-document-master.dto';

export class UpdateDocumentMasterDto extends PartialType(CreateDocumentMasterDto) {}
