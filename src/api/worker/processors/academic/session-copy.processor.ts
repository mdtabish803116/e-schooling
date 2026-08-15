import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { WorkerJobContext } from '../../worker-job.interface';
import { AcademicService } from '../../../../services/academic/academic.service';
import { JobTypeEnum } from '../../../../models/enums/enums';
import { CopyAcademicSessionDataDto } from '../../../../interfaces/request/academic/copy-academic-session-data.dto';

@Injectable()
export class SessionCopyProcessor {
  private readonly logger = new Logger(SessionCopyProcessor.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly academicService: AcademicService,
  ) {}

  async process(job: WorkerJobContext): Promise<unknown> {
    const { schoolId, callerId, dto } = job.data as {
      schoolId: string;
      callerId: string;
      dto: CopyAcademicSessionDataDto;
    };
    
    this.logger.log(
      `[SessionCopyProcessor] Processing session copy job ${job.id} for school: ${schoolId} (From: ${dto.fromAcademicSessionId} To: ${dto.toAcademicSessionId})`,
    );

    await job.updateProgress(10);

    // 1. Copy Academic Data (Classes, Sections, Subjects, Mappings, Staff, Students, Fees)
    const academicResult = await this.academicService.copyAcademicSessionData(
      schoolId,
      dto,
      callerId,
    );
    await job.updateProgress(100);

    return {
      success: true,
      jobType: JobTypeEnum.SESSION_COPY,
      message: `Successfully copied session data from ${dto.fromAcademicSessionId} to ${dto.toAcademicSessionId}`,
      summary: academicResult.summary,
    };
  }
}
