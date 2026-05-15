import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PromotionService } from '../../modules/promotion/promotion.service';

export const PROMOTION_SYNC_QUEUE = 'promotion-sync';

export interface PromotionSyncJobData {
  storeAccountId: string;
}

@Processor(PROMOTION_SYNC_QUEUE)
export class PromotionSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(PromotionSyncProcessor.name);

  constructor(private promotionService: PromotionService) {
    super();
  }

  async process(job: Job<PromotionSyncJobData>): Promise<any> {
    const { storeAccountId } = job.data;
    this.logger.log(`[Job ${job.id}] Starting promotion sync for store ${storeAccountId}`);

    const result = await this.promotionService.syncFromOzon(storeAccountId);

    this.logger.log(`[Job ${job.id}] Promotion sync done: ${result.synced} synced, ${result.failed} failed`);
    return result;
  }
}
