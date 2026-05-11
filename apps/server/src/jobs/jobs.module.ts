import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProductSyncProcessor, PRODUCT_SYNC_QUEUE } from './processors/product-sync.processor';
import { PromotionSyncProcessor, PROMOTION_SYNC_QUEUE } from './processors/promotion-sync.processor';
import { StockSyncProcessor, STOCK_SYNC_QUEUE } from './processors/stock-sync.processor';
import { SyncSchedulerService } from './schedulers/sync-scheduler.service';
import { SyncController } from './sync.controller';
import { ProductModule } from '../modules/product/product.module';

@Module({
  imports: [
    // BullMQ root configuration with Redis connection
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        },
      }),
    }),

    // Register individual queues
    BullModule.registerQueue(
      { name: PRODUCT_SYNC_QUEUE },
      { name: PROMOTION_SYNC_QUEUE },
      { name: STOCK_SYNC_QUEUE },
    ),

    // Import ProductModule so ProductSyncProcessor can use ProductService
    ProductModule,
  ],
  controllers: [SyncController],
  providers: [
    ProductSyncProcessor,
    PromotionSyncProcessor,
    StockSyncProcessor,
    SyncSchedulerService,
  ],
  exports: [SyncSchedulerService, BullModule],
})
export class JobsModule {}
