import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { DataSource } from 'typeorm';
import { SchoolUser } from '../../../../models/entities/school/school-user.entity';

@Injectable()
export class StaffExportProcessor {
  private readonly logger = new Logger(StaffExportProcessor.name);

  constructor(private readonly dataSource: DataSource) {}

  async process(job: Job): Promise<unknown> {
    const { schoolId } = job.data;
    this.logger.log(
      `[StaffExportProcessor] Processing staff export job ${job.id} for school: ${schoolId}`,
    );

    await job.updateProgress(20);

    const userRepo = this.dataSource.getRepository(SchoolUser);
    const users = await userRepo.find({
      where: { schoolId, isDeleted: false },
      order: { createdAt: 'DESC' },
    });

    await job.updateProgress(60);

    const headers = ['ID', 'Name', 'Username', 'Phone', 'User Type', 'Status'];
    const rows = users.map((u) =>
      [
        `"${u.id}"`,
        `"${u.name || ''}"`,
        `"${u.username || ''}"`,
        `"${u.phone || ''}"`,
        `"${u.userType || ''}"`,
        `"${u.isActive ? 'ACTIVE' : 'INACTIVE'}"`,
      ].join(','),
    );

    const csvContent = [headers.join(','), ...rows].join('\n');
    await job.updateProgress(100);

    return {
      success: true,
      jobType: 'staff_export',
      totalExported: users.length,
      csvContent,
      filename: `staff-export-school-${schoolId}-${Date.now()}.csv`,
      message: `Exported ${users.length} staff records successfully.`,
    };
  }
}
