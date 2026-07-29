import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { WorkerJobContext } from '../../worker-job.interface';
import { StudentImportProcessor } from './student-import.processor';
import { StudentExportProcessor } from './student-export.processor';
import { StaffExportProcessor } from './staff-export.processor';
import { ClassExportProcessor } from './class-export.processor';

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
    const { name, data, id } = job;
    this.logger.log(`[ImportExportProcessor] Routing job ${id} (${name}) on queue '${job.queueName}'`);

    const entityName = (data?.entityName || data?.entityType || '').toLowerCase().trim();

    // 1. STUDENT IMPORT
    if (
      name === 'student_import' ||
      name === 'import_student_csv' ||
      name === 'import_csv_job' ||
      (name === 'generic_import' && (entityName === 'student' || entityName === 'students'))
    ) {
      return this.studentImportProcessor.process(job);
    }

    // 2. STUDENT EXPORT
    if (
      name === 'student_export' ||
      name === 'export_student_csv' ||
      name === 'export_excel_job' ||
      (name === 'generic_export' && (entityName === 'student' || entityName === 'students'))
    ) {
      return this.studentExportProcessor.process(job);
    }

    // 3. STAFF EXPORT
    if (
      name === 'staff_export' ||
      name === 'export_staff' ||
      (name === 'generic_export' && (entityName === 'staff' || entityName === 'schooluser' || entityName === 'users'))
    ) {
      return this.staffExportProcessor.process(job);
    }

    // 4. CLASS EXPORT
    if (
      name === 'class_export' ||
      name === 'export_class' ||
      (name === 'generic_export' && (entityName === 'class' || entityName === 'classes'))
    ) {
      return this.classExportProcessor.process(job);
    }

    throw new BadRequestException(`Unsupported job action '${name}' for entity '${entityName || 'unspecified'}' inside imports_exports worker queue.`);
  }
}
