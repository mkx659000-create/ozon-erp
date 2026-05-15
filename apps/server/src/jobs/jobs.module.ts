import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProductSyncProcessor, PRODUCT_SYNC_QUEUE } from './processors/product-sync.processor';
import { PromotionSyncProcessor, PROMOTION_SYNC_QUEUE } from './processors/promotion-sync.processor';
import { StockSyncProcessor, STOCK_SYNC_QUEUE } from './processors/stock-sync.processor';
import { FinanceSyncProcessor, FINANCE_SYNC_QUEUE } from './processors/finance-sync.processor';
import { ReturnsSyncProcessor, RETURNS_SYNC_QUEUE } from './processors/returns-sync.processor';
import { RatingSyncProcessor, RATING_SYNC_QUEUE } from './processors/rating-sync.processor';
import { OrderSyncProcessor, ORDER_SYNC_QUEUE } from './processors/order-sync.processor';
import { SyncSchedulerService } from './schedulers/sync-scheduler.service';
import { SyncController } from './sync.controller';
import { ProductModule } from '../modules/product/product.module';
import { FinanceModule } from '../modules/finance/finance.module';
import { ReturnsModule } from '../modules/returns/returns.module';
import { RatingModule } from '../modules/rating/rating.module';
import { OrderModule } from '../modules/order/order.module';

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
      { name: FINANCE_SYNC_QUEUE },
      { name: RETURNS_SYNC_QUEUE },
      { name: RATING_SYNC_QUEUE },
      { name: ORDER_SYNC_QUEUE },
    ),

    ProductModule,
    FinanceModule,
    ReturnsModule,
    RatingModule,
    OrderModule,
  ],
  controllers: [SyncController],
  providers: [
    ProductSyncProcessor,
    PromotionSyncProcessor,
    StockSyncProcessor,
    FinanceSyncProcessor,
    ReturnsSyncProcessor,
    RatingSyncProcessor,
    OrderSyncProcessor,
    SyncSchedulerService,
  ],
  exports: [SyncSchedulerService, BullModule],
})
export class JobsModule {}
