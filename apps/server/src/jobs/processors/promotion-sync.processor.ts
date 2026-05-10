import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ParticipationStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { OzonPromotionApi } from '../../ozon-api/ozon-promotion.api';

export const PROMOTION_SYNC_QUEUE = 'promotion-sync';

export interface PromotionSyncJobData {
  storeAccountId: string;
}

@Processor(PROMOTION_SYNC_QUEUE)
export class PromotionSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(PromotionSyncProcessor.name);

  constructor(
    private prisma: PrismaService,
    private ozonPromotionApi: OzonPromotionApi,
  ) {
    super();
  }

  async process(job: Job<PromotionSyncJobData>): Promise<any> {
    const { storeAccountId } = job.data;
    this.logger.log(`[Job ${job.id}] Starting promotion sync for store ${storeAccountId}`);

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
        syncType: 'PROMOTION',
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });

    let synced = 0;
    let failed = 0;

    try {
      const actions = await this.ozonPromotionApi.listActions(credentials);
      this.logger.log(`Found ${actions.length} promotions on Ozon`);

      for (let idx = 0; idx < actions.length; idx++) {
        const action = actions[idx];
        try {
          const promotion = await this.prisma.promotion.upsert({
            where: {
              storeAccountId_ozonActionId: {
                storeAccountId,
                ozonActionId: BigInt(action.id),
              },
            },
            create: {
              storeAccountId,
              ozonActionId: BigInt(action.id),
              title: action.title,
              startDate: new Date(action.date_start),
              endDate: new Date(action.date_end),
              status: new Date(action.date_end) > new Date() ? 'ACTIVE' : 'ENDED',
              lastSyncAt: new Date(),
            },
            update: {
              title: action.title,
              startDate: new Date(action.date_start),
              endDate: new Date(action.date_end),
              status: new Date(action.date_end) > new Date() ? 'ACTIVE' : 'ENDED',
              lastSyncAt: new Date(),
            },
          });

          const actionProducts = await this.ozonPromotionApi.getActionProducts(
            credentials,
            action.id,
          );

          for (const ap of actionProducts) {
            const localProduct = await this.prisma.product.findFirst({
              where: {
                storeAccountId,
                ozonProductId: BigInt(ap.id),
              },
            });
            if (!localProduct) continue;

            await this.prisma.promotionProduct.upsert({
              where: {
                promotionId_productId: {
                  promotionId: promotion.id,
                  productId: localProduct.id,
                },
              },
              create: {
                promotionId: promotion.id,
                productId: localProduct.id,
                participationStatus:
                  ap.action_price > 0
                    ? ParticipationStatus.JOINED
                    : ParticipationStatus.NOT_JOINED,
                originalPrice: ap.price,
                lowestPromoPrice: ap.max_action_price,
                promoPrice: ap.action_price > 0 ? ap.action_price : null,
                promoStock: ap.stock,
              },
              update: {
                participationStatus:
                  ap.action_price > 0
                    ? ParticipationStatus.JOINED
                    : ParticipationStatus.NOT_JOINED,
                originalPrice: ap.price,
                lowestPromoPrice: ap.max_action_price,
                promoPrice: ap.action_price > 0 ? ap.action_price : null,
                promoStock: ap.stock,
              },
            });
          }

          synced++;
        } catch (error: any) {
          this.logger.error(`Failed to sync promotion ${action.id}: ${error.message}`);
          failed++;
        }

        const progress = Math.round(((idx + 1) / actions.length) * 100);
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

    this.logger.log(`[Job ${job.id}] Promotion sync done: ${synced} synced, ${failed} failed`);
    return { synced, failed };
  }
}
