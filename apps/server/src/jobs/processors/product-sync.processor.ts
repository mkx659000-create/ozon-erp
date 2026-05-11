import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ProductService } from '../../modules/product/product.service';

export const PRODUCT_SYNC_QUEUE = 'product-sync';

export interface ProductSyncJobData {
  storeAccountId: string;
}

@Processor(PRODUCT_SYNC_QUEUE)
export class ProductSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(ProductSyncProcessor.name);

  constructor(private productService: ProductService) {
    super();
  }

  async process(job: Job<ProductSyncJobData>): Promise<any> {
    const { storeAccountId } = job.data;
    this.logger.log(`[Job ${job.id}] Starting product sync for store ${storeAccountId}`);

    try {
      await job.updateProgress(10);
      const result = await this.productService.syncFromOzon(storeAccountId);
      await job.updateProgress(100);
      this.logger.log(`[Job ${job.id}] Product sync done: ${result.synced} synced, ${result.failed} failed`);
      return result;
    } catch (error: any) {
      this.logger.error(`Product sync failed: ${error.message}`);
      throw error;
    }
  }
}
