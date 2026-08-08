import { Injectable, Logger } from '@nestjs/common';
import { WorkerJobContext } from '../../worker-job.interface';
import { DataSource } from 'typeorm';
import { Class } from '../../../../models/entities/academic/class.entity';

@Injectable()
export class ClassExportProcessor {
  private readonly logger = new Logger(ClassExportProcessor.name);

  constructor(private readonly dataSource: DataSource) {}

  async process(job: WorkerJobContext): Promise<unknown> {
    const { schoolId } = job.data || {};
    this.logger.log(`[ClassExportProcessor] Processing class export job ${job.id} for school: ${schoolId}`);

    await job.updateProgress(20);

    const classRepo = this.dataSource.getRepository(Class);
    const classes = await classRepo.find({
      where: { schoolId, isDeleted: false },
      order: { createdAt: 'DESC' },
    });

    await job.updateProgress(70);

    const headers = [
      'ID',
      'Class Name',
      'Class Code',
      'Daily Attendance Limit',
      'Status',
    ];
    const rows = classes.map((c) =>
      [
        `"${c.id}"`,
        `"${c.name || ''}"`,
        `"${c.classCode || ''}"`,
        `"${c.dailyAttendanceLimit || 1}"`,
        `"${c.isActive ? 'ACTIVE' : 'INACTIVE'}"`,
      ].join(','),
    );

    const csvContent = [headers.join(','), ...rows].join('\n');
    await job.updateProgress(100);

    return {
      success: true,
      jobType: 'class_export',
      totalExported: classes.length,
      csvContent,
      filename: `classes-export-school-${schoolId}-${Date.now()}.csv`,
      message: `Exported ${classes.length} class records successfully.`,
    };
  }
}
