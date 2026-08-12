import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { WorkerJobContext } from '../../worker-job.interface';
import { StudentImportProcessor } from './student-import.processor';
import { StudentExportProcessor } from './student-export.processor';
import { StaffExportProcessor } from './staff-export.processor';
import { ClassExportProcessor } from './class-export.processor';
import { JobTypeEnum } from '../../../../models/enums/enums';

@Injectable()
export class ImportExportProcessor {
  private readonly logger = new Logger(ImportExportProcessor.name);

  constructor(
    private readonly studentImportProcessor: StudentImportProcessor,
    private readonly studentExportProcessor: StudentExportProcessor,
    private readonly staffExportProcessor: StaffExportProcessor,
    private readonly classExportProcessor: ClassExportProcessor,
  ) {}

  async process(job: WorkerJobContext): Promise<unknown> {
    const { jobType, data, id } = job;
    this.logger.log(
      `[ImportExportProcessor] Routing job ${id} (${jobType}) on queue '${job.queueName}'`,
    );

    // 1. STUDENT IMPORT
    if (jobType === JobTypeEnum.STUDENT_IMPORT) {
      return this.studentImportProcessor.process(job);
    }

    // 2. STUDENT EXPORT
    if (jobType === JobTypeEnum.STUDENT_EXPORT) {
      return this.studentExportProcessor.process(job);
    }

    // 3. STAFF EXPORT
    if (jobType === JobTypeEnum.STAFF_EXPORT) {
      return this.staffExportProcessor.process(job);
    }

    // 4. CLASS EXPORT
    if (jobType === JobTypeEnum.CLASS_EXPORT) {
      return this.classExportProcessor.process(job);
    }

    throw new BadRequestException(
      `Unsupported job action '${jobType}' inside imports_exports worker queue.`,
    );
  }
}
