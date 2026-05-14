import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { PRODUCT_SYNC_QUEUE } from '../processors/product-sync.processor';
import { PROMOTION_SYNC_QUEUE } from '../processors/promotion-sync.processor';
import { STOCK_SYNC_QUEUE } from '../processors/stock-sync.processor';
import { FINANCE_SYNC_QUEUE } from '../processors/finance-sync.processor';

@Injectable()
export class SyncSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SyncSchedulerService.name);

  constructor(
    @InjectQueue(PRODUCT_SYNC_QUEUE) private productSyncQueue: Queue,
    @InjectQueue(PROMOTION_SYNC_QUEUE) private promotionSyncQueue: Queue,
    @InjectQueue(STOCK_SYNC_QUEUE) private stockSyncQueue: Queue,
    @InjectQueue(FINANCE_SYNC_QUEUE) private financeSyncQueue: Queue,
    private prisma: PrismaService,
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing sync scheduler...');
    await this.registerScheduledJobs();
  }

  /**
   * Register repeatable jobs for each active store with syncEnabled = true.
   */
  async registerScheduledJobs() {
    // Clean existing repeatable jobs first
    await this.cleanRepeatableJobs();

    const stores = await this.prisma.storeAccount.findMany({
      where: { status: 'ACTIVE', syncEnabled: true },
    });

    this.logger.log(`Registering sync jobs for ${stores.length} active stores`);

    for (const store of stores) {
      const jobOptions = {
        removeOnComplete: { count: 50 },
        removeOnFail: { count: 100 },
      };

      // Product sync — every 30 minutes
      await this.productSyncQueue.add(
        `product-sync-${store.id}`,
        { storeAccountId: store.id },
        {
          ...jobOptions,
          repeat: {
            pattern: '*/30 * * * *', // every 30 min
          },
          jobId: `product-sync-${store.id}`,
        },
      );

      // Stock sync — every 10 minutes
      await this.stockSyncQueue.add(
        `stock-sync-${store.id}`,
        { storeAccountId: store.id },
        {
          ...jobOptions,
          repeat: {
            pattern: '*/10 * * * *', // every 10 min
          },
          jobId: `stock-sync-${store.id}`,
        },
      );

      // Promotion sync — every 1 hour
      await this.promotionSyncQueue.add(
        `promotion-sync-${store.id}`,
        { storeAccountId: store.id },
        {
          ...jobOptions,
          repeat: {
            pattern: '0 * * * *', // every hour at :00
          },
          jobId: `promotion-sync-${store.id}`,
        },
      );

      // Finance sync — every 2 hours
      await this.financeSyncQueue.add(
        `finance-sync-${store.id}`,
        { storeAccountId: store.id },
        {
          ...jobOptions,
          repeat: {
            pattern: '0 */2 * * *', // every 2 hours at :00
          },
          jobId: `finance-sync-${store.id}`,
        },
      );

      this.logger.log(`Registered sync jobs for store "${store.storeName}" (${store.id})`);
    }
  }

  /**
   * Add a one-off sync job (triggered by manual sync button).
   */
  async triggerProductSync(storeAccountId: string) {
    const job = await this.productSyncQueue.add(
      `manual-product-sync-${storeAccountId}`,
      { storeAccountId },
      {
        removeOnComplete: { count: 10 },
        removeOnFail: { count: 20 },
      },
    );
    this.logger.log(`Triggered manual product sync job ${job.id} for store ${storeAccountId}`);
    return job;
  }

  async triggerPromotionSync(storeAccountId: string) {
    const job = await this.promotionSyncQueue.add(
      `manual-promotion-sync-${storeAccountId}`,
      { storeAccountId },
      {
        removeOnComplete: { count: 10 },
        removeOnFail: { count: 20 },
      },
    );
    this.logger.log(`Triggered manual promotion sync job ${job.id} for store ${storeAccountId}`);
    return job;
  }

  async triggerStockSync(storeAccountId: string) {
    const job = await this.stockSyncQueue.add(
      `manual-stock-sync-${storeAccountId}`,
      { storeAccountId },
      {
        removeOnComplete: { count: 10 },
        removeOnFail: { count: 20 },
      },
    );
    this.logger.log(`Triggered manual stock sync job ${job.id} for store ${storeAccountId}`);
    return job;
  }

  async triggerFinanceSync(storeAccountId: string) {
    const job = await this.financeSyncQueue.add(
      `manual-finance-sync-${storeAccountId}`,
      { storeAccountId },
      {
        removeOnComplete: { count: 10 },
        removeOnFail: { count: 20 },
      },
    );
    this.logger.log(`Triggered manual finance sync job ${job.id} for store ${storeAccountId}`);
    return job;
  }

  /**
   * Get sync job status for a store.
   */
  async getSyncStatus(storeAccountId: string) {
    const [productJobs, stockJobs, promoJobs, financeJobs] = await Promise.all([
      this.productSyncQueue.getJobs(['active', 'waiting', 'delayed']),
      this.stockSyncQueue.getJobs(['active', 'waiting', 'delayed']),
      this.promotionSyncQueue.getJobs(['active', 'waiting', 'delayed']),
      this.financeSyncQueue.getJobs(['active', 'waiting', 'delayed']),
    ]);

    const filter = (jobs: any[]) =>
      jobs.filter((j) => j.data?.storeAccountId === storeAccountId).map((j) => ({
        id: j.id,
        name: j.name,
        state: j.state,
        progress: j.progress,
        attemptsMade: j.attemptsMade,
        timestamp: j.timestamp,
      }));

    return {
      product: filter(productJobs),
      stock: filter(stockJobs),
      promotion: filter(promoJobs),
      finance: filter(financeJobs),
    };
  }

  /**
   * Remove all repeatable jobs to allow re-registration.
   */
  private async cleanRepeatableJobs() {
    const queues = [this.productSyncQueue, this.promotionSyncQueue, this.stockSyncQueue, this.financeSyncQueue];
    for (const queue of queues) {
      const repeatables = await queue.getRepeatableJobs();
      for (const r of repeatables) {
        await queue.removeRepeatableByKey(r.key);
      }
    }
  }

  /**
   * Refresh scheduled jobs (e.g. after store settings change).
   */
  async refreshSchedule() {
    this.logger.log('Refreshing sync schedule...');
    await this.registerScheduledJobs();
  }
}
