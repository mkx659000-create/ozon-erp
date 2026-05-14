import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { FinanceService } from '../../modules/finance/finance.service';

export const FINANCE_SYNC_QUEUE = 'finance-sync';

export interface FinanceSyncJobData {
  storeAccountId: string;
}

@Processor(FINANCE_SYNC_QUEUE)
export class FinanceSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(FinanceSyncProcessor.name);

  constructor(private financeService: FinanceService) {
    super();
  }

  async process(job: Job<FinanceSyncJobData>): Promise<any> {
    const { storeAccountId } = job.data;
    this.logger.log(`[Job ${job.id}] Starting finance sync for store ${storeAccountId}`);

    await job.updateProgress(10);
    const result = await this.financeService.syncTransactions(storeAccountId);
    await job.updateProgress(100);

    this.logger.log(`[Job ${job.id}] Finance sync done: ${result.synced} synced, ${result.failed} failed`);
    return result;
  }
}
