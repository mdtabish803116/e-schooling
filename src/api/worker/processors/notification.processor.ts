import { Injectable, Logger } from '@nestjs/common';
import { WorkerJobContext } from '../worker-job.interface';
import { DataSource } from 'typeorm';

@Injectable()
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly dataSource: DataSource) {}

  async process(job: WorkerJobContext): Promise<unknown> {
    const { name, data, id } = job;
    this.logger.log(`[NotificationProcessor] Processing job ${id} (${name})`);

    const { schoolId, phone, email, message } = data || {};

    await job.updateProgress(10);
    await new Promise((resolve) => setTimeout(resolve, 200));

    if (name === 'send_whatsapp_job' || data?.type === 'whatsapp') {
      this.logger.log(`[WhatsApp Reminders] School ${schoolId} sending message to ${phone}: "${message}"`);

      await job.updateProgress(50);
      await new Promise((resolve) => setTimeout(resolve, 300));

      await job.updateProgress(100);

      return { success: true, channel: 'WhatsApp', recipient: phone, sentAt: new Date() };
    }

    if (name === 'send_email_job' || data?.type === 'email') {
      this.logger.log(`[Email System] School ${schoolId} sending email to ${email}: "${message}"`);

      await job.updateProgress(60);
      await new Promise((resolve) => setTimeout(resolve, 300));

      await job.updateProgress(100);

      return { success: true, channel: 'Email', recipient: email, sentAt: new Date() };
    }

    // Default fallback notification dispatcher
    this.logger.log(`[Notification System] School ${schoolId} dispatched notification payload: ${JSON.stringify(data)}`);
    await job.updateProgress(100);
    return { success: true, payload: data, sentAt: new Date() };
  }
}
