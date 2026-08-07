import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { DataSource } from 'typeorm';

@Injectable()
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly dataSource: DataSource) {}

  async process(job: Job): Promise<unknown> {
    const { name, data, id } = job;
    this.logger.log(`[NotificationProcessor] Processing job ${id} (${name})`);

    const { schoolId, phone, email, message, type } = data;

    // Simulate sending messages with sequential progress updates
    await job.updateProgress(10);
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (name === 'send_whatsapp_job') {
      this.logger.log(
        `[WhatsApp Reminders] School ${schoolId} sending message to ${phone}: "${message}"`,
      );

      await job.updateProgress(50);
      await new Promise((resolve) => setTimeout(resolve, 800));

      await job.updateProgress(90);
      await new Promise((resolve) => setTimeout(resolve, 300));

      return {
        success: true,
        channel: 'WhatsApp',
        recipient: phone,
        sentAt: new Date(),
      };
    }

    if (name === 'send_email_job') {
      this.logger.log(
        `[Email System] School ${schoolId} sending email to ${email}: "${message}"`,
      );

      await job.updateProgress(60);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return {
        success: true,
        channel: 'Email',
        recipient: email,
        sentAt: new Date(),
      };
    }

    throw new Error(
      `Unsupported job action: ${name} inside notifications queue`,
    );
  }
}
