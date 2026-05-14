import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ReturnsService } from '../../modules/returns/returns.service';

export const RETURNS_SYNC_QUEUE = 'returns-sync';

export interface ReturnsSyncJobData {
  storeAccountId: string;
}

@Processor(RETURNS_SYNC_QUEUE)
export class ReturnsSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(ReturnsSyncProcessor.name);

  constructor(private returnsService: ReturnsService) {
    super();
  }

  async process(job: Job<ReturnsSyncJobData>): Promise<any> {
    const { storeAccountId } = job.data;
    this.logger.log(`[Job ${job.id}] Starting returns sync for store ${storeAccountId}`);

    await job.updateProgress(10);
    const result = await this.returnsService.syncReturns(storeAccountId);
    await job.updateProgress(100);

    this.logger.log(`[Job ${job.id}] Returns sync done: ${result.synced} synced, ${result.failed} failed`);
    return result;
  }
}
