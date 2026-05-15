import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { OrderService } from '../../modules/order/order.service';

export const ORDER_SYNC_QUEUE = 'order-sync';

export interface OrderSyncJobData {
  storeAccountId: string;
}

@Processor(ORDER_SYNC_QUEUE)
export class OrderSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(OrderSyncProcessor.name);

  constructor(private orderService: OrderService) {
    super();
  }

  async process(job: Job<OrderSyncJobData>): Promise<any> {
    const { storeAccountId } = job.data;
    this.logger.log(`[Job ${job.id}] Starting order sync for store ${storeAccountId}`);

    try {
      await job.updateProgress(10);
      const result = await this.orderService.syncFromOzon(storeAccountId);
      await job.updateProgress(100);
      this.logger.log(`[Job ${job.id}] Order sync done: ${result.synced} synced, ${result.failed} failed`);
      return result;
    } catch (error: any) {
      this.logger.error(`Order sync failed: ${error.message}`);
      throw error;
    }
  }
}
