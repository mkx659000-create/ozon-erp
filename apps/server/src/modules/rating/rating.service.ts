import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OzonRatingApi } from '../../ozon-api/ozon-rating.api';

@Injectable()
export class RatingService {
  private readonly logger = new Logger(RatingService.name);

  constructor(
    private prisma: PrismaService,
    private ozonRatingApi: OzonRatingApi,
  ) {}

  async getCurrentRating(storeAccountId: string) {
    const store = await this.prisma.storeAccount.findUniqueOrThrow({
      where: { id: storeAccountId },
    });
    const credentials = { clientId: store.ozonClientId, apiKey: store.ozonApiKey };
    return this.ozonRatingApi.getRatingSummary(credentials);
  }

  async getRatingHistory(storeAccountId: string, dateFrom: string, dateTo: string) {
    const records = await this.prisma.sellerRating.findMany({
      where: {
        storeAccountId,
        recordDate: {
          gte: new Date(dateFrom),
          lte: new Date(dateTo),
        },
      },
      orderBy: { recordDate: 'asc' },
    });
    return records;
  }

  async getStockOnWarehouses(storeAccountId: string) {
    const store = await this.prisma.storeAccount.findUniqueOrThrow({
      where: { id: storeAccountId },
    });
    const credentials = { clientId: store.ozonClientId, apiKey: store.ozonApiKey };
    return this.ozonRatingApi.getStockOnWarehouses(credentials);
  }

  async syncRating(storeAccountId: string) {
    const store = await this.prisma.storeAccount.findUniqueOrThrow({
      where: { id: storeAccountId },
    });
    const credentials = { clientId: store.ozonClientId, apiKey: store.ozonApiKey };

    const syncLog = await this.prisma.syncLog.create({
      data: {
        storeAccountId,
        syncType: 'RATING',
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });

    let synced = 0;
    try {
      const summary = await this.ozonRatingApi.getRatingSummary(credentials);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const group of summary.groups) {
        for (const item of group.items) {
          const dangerThreshold = item.status?.danger ?? 0;
          const warningThreshold = item.status?.warning ?? 0;
          let ratingStatus = 'good';
          if (item.current_value <= dangerThreshold) ratingStatus = 'danger';
          else if (item.current_value <= warningThreshold) ratingStatus = 'warning';

          await this.prisma.sellerRating.upsert({
            where: {
              storeAccountId_ratingGroup_ratingName_recordDate: {
                storeAccountId,
                ratingGroup: group.group_name,
                ratingName: item.rating_name,
                recordDate: today,
              },
            },
            update: {
              currentValue: item.current_value,
              pastValue: item.past_value,
              ratingStatus,
              penalty: item.current_value <= dangerThreshold,
            },
            create: {
              storeAccountId,
              ratingGroup: group.group_name,
              ratingName: item.rating_name,
              currentValue: item.current_value,
              pastValue: item.past_value,
              ratingStatus,
              penalty: item.current_value <= dangerThreshold,
              recordDate: today,
            },
          });
          synced++;
        }
      }

      await this.prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'SUCCESS',
          itemsProcessed: synced,
          completedAt: new Date(),
        },
      });

      this.logger.log(`Synced ${synced} rating items for store ${storeAccountId}`);
      return { synced, failed: 0 };
    } catch (error: any) {
      await this.prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'FAILED',
          errorMessage: error.message?.substring(0, 500),
          completedAt: new Date(),
        },
      });
      throw error;
    }
  }
}
