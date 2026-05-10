import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { OzonProductApi } from '../../ozon-api/ozon-product.api';

export const PRODUCT_SYNC_QUEUE = 'product-sync';

export interface ProductSyncJobData {
  storeAccountId: string;
}

@Processor(PRODUCT_SYNC_QUEUE)
export class ProductSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(ProductSyncProcessor.name);

  constructor(
    private prisma: PrismaService,
    private ozonProductApi: OzonProductApi,
  ) {
    super();
  }

  async process(job: Job<ProductSyncJobData>): Promise<any> {
    const { storeAccountId } = job.data;
    this.logger.log(`[Job ${job.id}] Starting product sync for store ${storeAccountId}`);

    const store = await this.prisma.storeAccount.findUnique({
      where: { id: storeAccountId },
    });
    if (!store) {
      this.logger.warn(`Store ${storeAccountId} not found, skipping`);
      return { skipped: true };
    }

    const credentials = { clientId: store.ozonClientId, apiKey: store.ozonApiKey };

    const syncLog = await this.prisma.syncLog.create({
      data: {
        storeAccountId,
        syncType: 'PRODUCT',
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });

    let synced = 0;
    let failed = 0;

    try {
      // Step 1: List all product IDs via cursor pagination
      const allProducts = await this.ozonProductApi.listAllProducts(credentials);
      this.logger.log(`Found ${allProducts.length} products on Ozon`);

      await job.updateProgress(10);

      // Step 2: Batch get product details (1000 per batch)
      const batchSize = 1000;
      for (let i = 0; i < allProducts.length; i += batchSize) {
        const batch = allProducts.slice(i, i + batchSize);
        const productIds = batch.map((p) => p.product_id);

        try {
          const details = await this.ozonProductApi.getProductInfoBatch(credentials, productIds);

          for (const item of details) {
            try {
              const statusMap: Record<string, string> = {
                moderating: 'MODERATION',
                moderation_failed: 'MODERATION_FAILED',
                processed: 'ON_SALE',
                archived: 'ARCHIVED',
                removed: 'REMOVED',
              };

              await this.prisma.product.upsert({
                where: {
                  storeAccountId_ozonProductId: {
                    storeAccountId,
                    ozonProductId: BigInt(item.id),
                  },
                },
                create: {
                  storeAccountId,
                  ozonProductId: BigInt(item.id),
                  offerId: item.offer_id,
                  name: item.name || '',
                  primaryImage: item.primary_image || null,
                  images: item.images || [],
                  status: (statusMap[item.status?.state_name || ''] || 'ON_SALE') as any,
                  visible: item.visible ?? true,
                  sellingPrice: item.marketing_price ? parseFloat(item.marketing_price) : null,
                  originalPrice: item.old_price ? parseFloat(item.old_price) : null,
                  lowestPrice: item.min_price ? parseFloat(item.min_price) : null,
                  currencyCode: item.currency_code || 'RUB',
                  totalStock: item.stocks?.present || 0,
                  ozonCreatedAt: item.created_at ? new Date(item.created_at) : null,
                  ozonUpdatedAt: item.updated_at ? new Date(item.updated_at) : null,
                  lastSyncAt: new Date(),
                },
                update: {
                  offerId: item.offer_id,
                  name: item.name || '',
                  primaryImage: item.primary_image || null,
                  images: item.images || [],
                  status: (statusMap[item.status?.state_name || ''] || 'ON_SALE') as any,
                  visible: item.visible ?? true,
                  sellingPrice: item.marketing_price ? parseFloat(item.marketing_price) : null,
                  originalPrice: item.old_price ? parseFloat(item.old_price) : null,
                  lowestPrice: item.min_price ? parseFloat(item.min_price) : null,
                  currencyCode: item.currency_code || 'RUB',
                  totalStock: item.stocks?.present || 0,
                  ozonUpdatedAt: item.updated_at ? new Date(item.updated_at) : null,
                  lastSyncAt: new Date(),
                },
              });
              synced++;
            } catch (err: any) {
              this.logger.error(`Failed to upsert product ${item.id}: ${err.message}`);
              failed++;
            }
          }
        } catch (err: any) {
          this.logger.error(`Failed to get product info batch: ${err.message}`);
          failed += batch.length;
        }

        const progress = Math.min(10 + Math.round(((i + batchSize) / allProducts.length) * 90), 100);
        await job.updateProgress(progress);
      }

      await this.prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: failed > 0 ? 'PARTIAL_FAILURE' : 'SUCCESS',
          itemsProcessed: synced,
          itemsFailed: failed,
          completedAt: new Date(),
        },
      });
    } catch (error: any) {
      await this.prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'FAILED',
          errorMessage: error.message,
          completedAt: new Date(),
        },
      });
      throw error;
    }

    this.logger.log(`[Job ${job.id}] Product sync done: ${synced} synced, ${failed} failed`);
    return { synced, failed };
  }
}
