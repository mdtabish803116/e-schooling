import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { StudentAdmissionsService } from '../../../services/student/student-admissions.service';
import { BulkProgressionDto } from '../../../interfaces/request/student/bulk-progression.dto';
import { AuthContext } from '../../../interfaces/auth-context.interface';

@Injectable()
export class StudentProgressionProcessor {
  private readonly logger = new Logger(StudentProgressionProcessor.name);

  constructor(private readonly admissionsService: StudentAdmissionsService) {}

  async process(job: Job): Promise<unknown> {
    const { name, data, id } = job;
    this.logger.log(`[StudentProgressionProcessor] Processing job ${id} (${name})`);

    if (name === 'bulk_progression_job') {
      const { schoolId, caller, dto } = data as {
        schoolId: string;
        caller: AuthContext;
        dto: BulkProgressionDto;
      };

      this.logger.log(
        `[Bulk Progression] Processing ${dto.studentIds.length} students for school ${schoolId} with action ${dto.actionType}`
      );

      await job.updateProgress(10);
      
      const result = await this.admissionsService.bulkProgressStudents(caller, schoolId, dto);

      await job.updateProgress(100);

      return {
        success: true,
        ...result,
      };
    }

    throw new Error(`Unsupported job action: ${name} inside student_progression queue`);
  }
}
