import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { DataSource, MoreThan } from 'typeorm';
import { SubscriptionsService } from '../../../services/subscription/subscription.service';
import { Order } from '../../../models/entities/finance/order.entity';
import { OrderStatusEnum } from '../../../models/enums/enums';

@Injectable()
export class PaymentReconciliationProcessor {
  private readonly logger = new Logger(PaymentReconciliationProcessor.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  async process(job: Job): Promise<unknown> {
    const { name, id } = job;
    this.logger.log(
      `[PaymentReconciliationProcessor] Processing job ${id} (${name})`,
    );

    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    this.logger.log(
      `[Payment Reconciliation] Scanning for PENDING orders created after ${fifteenDaysAgo.toISOString()}`,
    );

    // Retrieve all pending orders in the last 15 days
    const pendingOrders = await this.dataSource.getRepository(Order).find({
      where: {
        status: OrderStatusEnum.PENDING,
        createdAt: MoreThan(fifteenDaysAgo),
      },
    });

    this.logger.log(
      `[Payment Reconciliation] Found ${pendingOrders.length} PENDING orders to reconcile.`,
    );
    await job.updateProgress(10);

    const reconciledOrdersList: Record<string, unknown>[] = [];
    const unchangedOrdersList: Record<string, unknown>[] = [];
    const errorsList: Record<string, unknown>[] = [];

    let processedCount = 0;

    for (const order of pendingOrders) {
      processedCount++;
      const currentProgress = Math.min(
        10 + Math.floor((processedCount / pendingOrders.length) * 80),
        90,
      );
      await job.updateProgress(currentProgress);

      if (!order.razorpayOrderId) {
        this.logger.warn(
          `Order ${order.id} has no razorpayOrderId attached, skipping...`,
        );
        unchangedOrdersList.push({
          orderId: order.id,
          schoolId: order.schoolId,
          reason: 'No razorpayOrderId',
        });
        continue;
      }

      this.logger.log(
        `[Payment Reconciliation] Reconciling Order ${order.id} (Razorpay Order ID: ${order.razorpayOrderId})`,
      );

      try {
        const result = await this.subscriptionsService.reconcileOrder(order.id);

        if (result.message && result.message.includes('activated')) {
          this.logger.log(
            `[Payment Reconciliation] Successfully reconciled and activated Order ${order.id}`,
          );
          reconciledOrdersList.push({
            orderId: order.id,
            schoolId: order.schoolId,
            razorpayOrderId: order.razorpayOrderId,
            amount: order.amount,
            status: 'fulfilled',
            result: result.message,
          });
        } else {
          this.logger.log(
            `[Payment Reconciliation] Order ${order.id} status unchanged: ${result.message}`,
          );
          unchangedOrdersList.push({
            orderId: order.id,
            schoolId: order.schoolId,
            razorpayOrderId: order.razorpayOrderId,
            status: 'pending',
            result: result.message,
          });
        }
      } catch (err: unknown) {
        const errorObj = err as Error;
        this.logger.error(
          `[Payment Reconciliation] Error reconciling Order ${order.id}: ${errorObj.message}`,
        );
        errorsList.push({
          orderId: order.id,
          schoolId: order.schoolId,
          error: errorObj.message,
        });
      }
    }

    await job.updateProgress(100);

    const finalSummary = {
      timestamp: new Date(),
      totalScanned: pendingOrders.length,
      reconciledCount: reconciledOrdersList.length,
      unchangedCount: unchangedOrdersList.length,
      failedCount: errorsList.length,
      reconciledOrders: reconciledOrdersList,
      unchangedOrders: unchangedOrdersList,
      errors: errorsList,
    };

    this.logger.log(
      `[Payment Reconciliation] Completed. Reconciled: ${reconciledOrdersList.length}, Unchanged: ${unchangedOrdersList.length}, Failed: ${errorsList.length}`,
    );
    return finalSummary;
  }
}
