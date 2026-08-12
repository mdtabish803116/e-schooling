import { Injectable, Logger } from '@nestjs/common';
import { WorkerJobContext } from '../../worker-job.interface';
import { DataSource } from 'typeorm';
import { SchoolUser } from '../../../../models/entities/school/school-user.entity';
import { StorageService } from '../../../../shared/storage/storage.service';
import { JobTypeEnum } from '../../../../models/enums/enums';

@Injectable()
export class StaffExportProcessor {
  private readonly logger = new Logger(StaffExportProcessor.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly storageService: StorageService,
  ) {}

  async process(job: WorkerJobContext): Promise<unknown> {
    const { schoolId } = job.data || {};
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
    await job.updateProgress(90);

    const filename = `staff-export-school-${schoolId}-${Date.now()}.csv`;
    const file = {
      buffer: Buffer.from(csvContent, 'utf-8'),
      originalname: filename,
      mimetype: 'text/csv',
    } as Express.Multer.File;

    let fileUrl = '';
    try {
      fileUrl = await this.storageService.uploadFile(file);
    } catch (error) {
      this.logger.error(`Cloudinary upload failed: ${error.message}`);
      throw new Error(
        `Failed to upload export to cloud storage: ${error.message}`,
      );
    }

    await job.updateProgress(100);

    return {
      success: true,
      jobType: JobTypeEnum.STAFF_EXPORT,
      totalExported: users.length,
      fileUrl,
      filename,
      message: `Exported ${users.length} staff records successfully.`,
    };
  }
}
