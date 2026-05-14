import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { RatingService } from '../../modules/rating/rating.service';

export const RATING_SYNC_QUEUE = 'rating-sync';

export interface RatingSyncJobData {
  storeAccountId: string;
}

@Processor(RATING_SYNC_QUEUE)
export class RatingSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(RatingSyncProcessor.name);

  constructor(private ratingService: RatingService) {
    super();
  }

  async process(job: Job<RatingSyncJobData>): Promise<any> {
    const { storeAccountId } = job.data;
    this.logger.log(`[Job ${job.id}] Starting rating sync for store ${storeAccountId}`);

    await job.updateProgress(10);
    const result = await this.ratingService.syncRating(storeAccountId);
    await job.updateProgress(100);

    this.logger.log(`[Job ${job.id}] Rating sync done: ${result.synced} synced`);
    return result;
  }
}
