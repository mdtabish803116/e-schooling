import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { WorkerJobContext } from '../worker-job.interface';
import { StudentAdmissionsService } from '../../../services/student/student-admissions.service';
import { BulkProgressionDto } from '../../../interfaces/request/student/bulk-progression.dto';
import { AuthContext } from '../../../interfaces/auth-context.interface';
import { JobTypeEnum } from '../../../models/enums/enums';

@Injectable()
export class StudentProgressionProcessor {
  private readonly logger = new Logger(StudentProgressionProcessor.name);

  constructor(private readonly admissionsService: StudentAdmissionsService) {}

  async process(job: WorkerJobContext): Promise<unknown> {
    const { jobType, data, id } = job;
    this.logger.log(
      `[StudentProgressionProcessor] Processing job ${id} (${jobType})`,
    );

    // 1. Bulk Student Promotion Processing
    if (
      jobType === JobTypeEnum.PROMOTION ||
      jobType === JobTypeEnum.DEMOTION ||
      jobType === JobTypeEnum.SECTION_TRANSFER ||
      jobType === 'bulk_progression_job' ||
      job.data?.dto
    ) {
      const { schoolId, caller, dto } = data as {
        schoolId: string;
        caller: AuthContext;
        dto: BulkProgressionDto;
      };

      this.logger.log(
        `[Bulk Progression] Processing ${dto.studentIds.length} students for school ${schoolId} with action ${dto.actionType}`,
      );

      await job.updateProgress(10);

      const result = await this.admissionsService.bulkProgressStudents(caller, schoolId, dto);

      await job.updateProgress(100);

      return {
        success: true,
        ...result,
      };
    }

    throw new BadRequestException(
      `Unsupported job action: ${jobType} inside student_progression queue`,
    );
  }
}
