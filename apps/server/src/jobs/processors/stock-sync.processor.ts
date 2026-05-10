import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { OzonProductApi } from '../../ozon-api/ozon-product.api';

export const STOCK_SYNC_QUEUE = 'stock-sync';

export interface StockSyncJobData {
  storeAccountId: string;
}

@Processor(STOCK_SYNC_QUEUE)
export class StockSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(StockSyncProcessor.name);

  constructor(
    private prisma: PrismaService,
    private ozonProductApi: OzonProductApi,
  ) {
    super();
  }

  async process(job: Job<StockSyncJobData>): Promise<any> {
    const { storeAccountId } = job.data;
    this.logger.log(`[Job ${job.id}] Starting stock sync for store ${storeAccountId}`);

    const store = await this.prisma.storeAccount.findUnique({
      where: { id: storeAccountId },
    });
    if (!store) {
      this.logger.warn(`Store ${storeAccountId} not found, skipping`);
      return { skipped: true };
    }

    const credentials = { clientId: store.ozonClientId, apiKey: store.ozonApiKey };

    let synced = 0;
    let failed = 0;

    try {
      // Get stock info from Ozon with cursor pagination
      const stockItems = await this.ozonProductApi.getStockInfo(credentials);
      this.logger.log(`Found ${stockItems.length} stock entries from Ozon`);

      await job.updateProgress(20);

      for (const stockItem of stockItems) {
        try {
          const product = await this.prisma.product.findFirst({
            where: {
              storeAccountId,
              ozonProductId: BigInt(stockItem.product_id),
            },
          });

          if (!product) continue;

          // Calculate total stock from all warehouse types
          const totalStock = stockItem.stocks?.reduce(
            (sum: number, s: { present: number; reserved: number; type: string }) =>
              sum + (s.present || 0),
            0,
          ) || 0;

          const totalReserved = stockItem.stocks?.reduce(
            (sum: number, s: { present: number; reserved: number; type: string }) =>
              sum + (s.reserved || 0),
            0,
          ) || 0;

          await this.prisma.product.update({
            where: { id: product.id },
            data: {
              totalStock,
              lastSyncAt: new Date(),
            },
          });

          // Update existing SKUs with aggregated stock
          await this.prisma.productSku.updateMany({
            where: { productId: product.id },
            data: {
              stock: totalStock,
              reserved: totalReserved,
            },
          });

          synced++;
        } catch (err: any) {
          this.logger.error(`Failed to sync stock for product ${stockItem.product_id}: ${err.message}`);
          failed++;
        }
      }

      await job.updateProgress(100);
    } catch (error: any) {
      this.logger.error(`Stock sync failed: ${error.message}`);
      throw error;
    }

    this.logger.log(`[Job ${job.id}] Stock sync done: ${synced} synced, ${failed} failed`);
    return { synced, failed };
  }
}
