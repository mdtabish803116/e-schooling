import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { Client } from 'pg';
import { Config } from '../../../config/index';

export const PG_BACKGROUND_JOB_CHANNEL = 'background_jobs_channel';

export interface PgJobNotification {
  jobId: string;
  queueName: string;
  jobType: string;
}

@Injectable()
export class PgPubSubService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PgPubSubService.name);
  private listenerClient: Client | null = null;
  private notifierClient: Client | null = null;
  private readonly notificationSubscribers: Array<
    (notification: PgJobNotification) => void
  > = [];
  private isListening = false;

  async onModuleInit() {
    const postgresConfig = Config.getPostGresConfig();
    const connectionOptions = {
      host: postgresConfig.host,
      port: postgresConfig.port,
      user: postgresConfig.username,
      password: postgresConfig.password,
      database: postgresConfig.database,
    };

    try {
      // 1. Setup persistent NOTIFY client
      this.notifierClient = new Client(connectionOptions);
      await this.notifierClient.connect();
      this.logger.log(
        '[PgPubSubService] Connected notifier Postgres client successfully.',
      );

      // 2. Setup persistent LISTEN client for worker mode
      const serverMode = Config.getSecret('SERVER_MODE', String) || 'rest';
      if (serverMode === 'worker') {
        this.listenerClient = new Client(connectionOptions);
        await this.listenerClient.connect();

        this.listenerClient.on('notification', (msg) => {
          if (msg.channel === PG_BACKGROUND_JOB_CHANNEL && msg.payload) {
            try {
              const payloadData: PgJobNotification = JSON.parse(msg.payload);
              this.logger.debug(
                `[PgPubSub] Notification received: ${payloadData.jobId} on queue ${payloadData.queueName}`,
              );
              this.notifySubscribers(payloadData);
            } catch (err: any) {
              this.logger.error(
                `Failed to parse NOTIFY payload: ${msg.payload}`,
                err.stack,
              );
            }
          }
        });

        this.listenerClient.on('error', (err) => {
          this.logger.error('[PgPubSub] Listener Postgres client error:', err);
          this.reconnectListener(connectionOptions);
        });

        await this.listenerClient.query(`LISTEN ${PG_BACKGROUND_JOB_CHANNEL}`);
        this.isListening = true;
        this.logger.log(
          `[PgPubSubService] Listening to PostgreSQL channel: ${PG_BACKGROUND_JOB_CHANNEL}`,
        );
      }
    } catch (err: any) {
      this.logger.error(
        `[PgPubSubService] Failed to initialize PostgreSQL Pub/Sub client: ${err.message}`,
        err.stack,
      );
    }
  }

  /**
   * Publishes NOTIFY event across PostgreSQL TCP sockets
   */
  async notifyJobCreated(notification: PgJobNotification): Promise<void> {
    if (!this.notifierClient) {
      this.logger.warn(
        '[PgPubSubService] Notifier client uninitialized; falling back to DB query triggers.',
      );
      return;
    }

    try {
      const payloadString = JSON.stringify(notification);
      // Escape single quotes for SQL string literal
      const safePayload = payloadString.replace(/'/g, "''");
      await this.notifierClient.query(
        `NOTIFY ${PG_BACKGROUND_JOB_CHANNEL}, '${safePayload}'`,
      );
      this.logger.log(
        `[PgPubSubService] Sent NOTIFY signal for job ${notification.jobId} (${notification.jobType})`,
      );
    } catch (err: any) {
      this.logger.error(
        `[PgPubSubService] Failed to send NOTIFY signal for job ${notification.jobId}: ${err.message}`,
      );
    }
  }

  /**
   * Subscribes worker listener callbacks
   */
  subscribe(callback: (notification: PgJobNotification) => void): void {
    this.notificationSubscribers.push(callback);
  }

  private notifySubscribers(notification: PgJobNotification): void {
    for (const sub of this.notificationSubscribers) {
      try {
        sub(notification);
      } catch (err: any) {
        this.logger.error(
          '[PgPubSubService] Error executing notification subscriber callback:',
          err,
        );
      }
    }
  }

  private async reconnectListener(connectionOptions: any) {
    if (this.listenerClient) {
      try {
        await this.listenerClient.end();
      } catch {}
    }
    setTimeout(async () => {
      try {
        this.listenerClient = new Client(connectionOptions);
        await this.listenerClient.connect();
        await this.listenerClient.query(`LISTEN ${PG_BACKGROUND_JOB_CHANNEL}`);
        this.logger.log(
          '[PgPubSubService] Reconnected listener client successfully.',
        );
      } catch (err: any) {
        this.logger.error(
          '[PgPubSubService] Reconnection attempt failed:',
          err,
        );
      }
    }, 5000);
  }

  async onModuleDestroy() {
    this.logger.log(
      '[PgPubSubService] Shutting down Postgres Pub/Sub clients...',
    );
    if (this.listenerClient) {
      await this.listenerClient.end();
    }
    if (this.notifierClient) {
      await this.notifierClient.end();
    }
  }
}
