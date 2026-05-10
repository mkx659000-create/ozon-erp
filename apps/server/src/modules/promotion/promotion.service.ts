import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, ParticipationStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { OzonPromotionApi } from '../../ozon-api/ozon-promotion.api';
import { OzonProductApi } from '../../ozon-api/ozon-product.api';
import { QueryPromotionDto } from './dto/query-promotion.dto';
import {
  BatchEditActivityDto,
  JoinPromotionDto,
  ExitPromotionDto,
} from './dto/edit-activity.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class PromotionService {
  private readonly logger = new Logger(PromotionService.name);

  constructor(
    private prisma: PrismaService,
    private ozonPromotionApi: OzonPromotionApi,
    private ozonProductApi: OzonProductApi,
  ) {}

  /**
   * List promotion products with filters (for the promotion table view).
   */
  async findPromotionProducts(query: QueryPromotionDto) {
    const { page, pageSize, storeAccountId, participationStatus, keyword, actionId } = query;
    const skip = (page - 1) * pageSize;

    const where: Prisma.PromotionProductWhereInput = {};

    if (participationStatus) {
      where.participationStatus = participationStatus;
    }
    if (actionId) {
      where.promotionId = actionId;
    }
    if (storeAccountId) {
      where.promotion = { storeAccountId };
    }
    if (keyword) {
      where.product = {
        OR: [
          { name: { contains: keyword, mode: 'insensitive' } },
          { offerId: { contains: keyword, mode: 'insensitive' } },
        ],
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.promotionProduct.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { updatedAt: 'desc' },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              offerId: true,
              ozonProductId: true,
              primaryImage: true,
              sellingPrice: true,
              totalStock: true,
              storeAccount: { select: { id: true, storeName: true } },
              skus: { select: { ozonSku: true } },
            },
          },
          promotion: {
            select: {
              id: true,
              title: true,
              ozonActionId: true,
              startDate: true,
              endDate: true,
              status: true,
              participationType: true,
            },
          },
        },
      }),
      this.prisma.promotionProduct.count({ where }),
    ]);

    return new PaginatedResult(items, total, page, pageSize);
  }

  /**
   * Get participation status counts.
   */
  async getStatusCounts(storeAccountId?: string) {
    const where: Prisma.PromotionProductWhereInput = {};
    if (storeAccountId) {
      where.promotion = { storeAccountId };
    }

    const [total, joined, notJoined] = await Promise.all([
      this.prisma.promotionProduct.count({ where }),
      this.prisma.promotionProduct.count({
        where: { ...where, participationStatus: ParticipationStatus.JOINED },
      }),
      this.prisma.promotionProduct.count({
        where: { ...where, participationStatus: ParticipationStatus.NOT_JOINED },
      }),
    ]);

    return { total, joined, notJoined };
  }

  /**
   * Batch edit promotion products (promo price, discount, stock).
   * This is the Module 3 "编辑活动" modal save action.
   */
  async batchEditProducts(dto: BatchEditActivityDto) {
    const updates = dto.products.map((p) =>
      this.prisma.promotionProduct.update({
        where: { id: p.id },
        data: {
          ...(p.promoPrice !== undefined && { promoPrice: p.promoPrice }),
          ...(p.promoDiscount !== undefined && { promoDiscount: p.promoDiscount }),
          ...(p.promoStock !== undefined && { promoStock: p.promoStock }),
        },
      }),
    );

    await this.prisma.$transaction(updates);
    return { updated: dto.products.length };
  }

  /**
   * Get products for the edit activity modal (one specific promotion).
   */
  async getEditActivityProducts(promotionId: string, page: number = 1, pageSize: number = 100) {
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      this.prisma.promotionProduct.findMany({
        where: { promotionId },
        skip,
        take: pageSize,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              offerId: true,
              ozonProductId: true,
              primaryImage: true,
              storeAccount: { select: { storeName: true } },
              skus: { select: { ozonSku: true } },
            },
          },
          promotion: {
            select: { title: true },
          },
        },
      }),
      this.prisma.promotionProduct.count({ where: { promotionId } }),
    ]);

    return new PaginatedResult(items, total, page, pageSize);
  }

  /**
   * Sync promotions from Ozon API.
   */
  async syncFromOzon(storeAccountId: string) {
    const store = await this.prisma.storeAccount.findUnique({
      where: { id: storeAccountId },
    });
    if (!store) throw new NotFoundException('店铺不存在');

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
      // Step 1: Get all actions from Ozon
      const actions = await this.ozonPromotionApi.listActions(credentials);
      this.logger.log(`Found ${actions.length} promotions on Ozon`);

      for (const action of actions) {
        try {
          // Upsert the promotion
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

          // Step 2: Get products in this action
          const actionProducts = await this.ozonPromotionApi.getActionProducts(
            credentials,
            action.id,
          );

          for (const ap of actionProducts) {
            // Find the local product by ozonProductId
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

    return { synced, failed };
  }

  /**
   * Join products to a promotion via Ozon API.
   */
  async joinPromotion(promotionId: string, dto: JoinPromotionDto) {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id: promotionId },
    });
    if (!promotion) throw new NotFoundException('促销活动不存在');

    const store = await this.prisma.storeAccount.findUnique({
      where: { id: dto.storeAccountId },
    });
    if (!store) throw new NotFoundException('店铺不存在');

    const credentials = { clientId: store.ozonClientId, apiKey: store.ozonApiKey };

    // Map local product IDs to Ozon product IDs
    const products = await Promise.all(
      dto.products.map(async (p) => {
        const product = await this.prisma.product.findUnique({
          where: { id: p.productId },
        });
        if (!product) throw new NotFoundException(`产品 ${p.productId} 不存在`);
        return {
          product_id: Number(product.ozonProductId),
          action_price: p.actionPrice,
          stock: p.stock,
        };
      }),
    );

    const result = await this.ozonPromotionApi.activateProducts(credentials, {
      action_id: Number(promotion.ozonActionId),
      products,
    });

    // Update local participation status
    for (const p of dto.products) {
      await this.prisma.promotionProduct.updateMany({
        where: { promotionId, productId: p.productId },
        data: {
          participationStatus: ParticipationStatus.JOINED,
          promoPrice: p.actionPrice,
          promoStock: p.stock,
        },
      });
    }

    return {
      joined: result.product_ids?.length || 0,
      rejected: result.rejected || [],
    };
  }

  /**
   * Exit products from a promotion via Ozon API.
   */
  async exitPromotion(promotionId: string, dto: ExitPromotionDto) {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id: promotionId },
    });
    if (!promotion) throw new NotFoundException('促销活动不存在');

    const store = await this.prisma.storeAccount.findUnique({
      where: { id: dto.storeAccountId },
    });
    if (!store) throw new NotFoundException('店铺不存在');

    const credentials = { clientId: store.ozonClientId, apiKey: store.ozonApiKey };

    // Map to Ozon product IDs
    const ozonProductIds = await Promise.all(
      dto.productIds.map(async (pid) => {
        const product = await this.prisma.product.findUnique({
          where: { id: pid },
        });
        return product ? Number(product.ozonProductId) : null;
      }),
    );

    await this.ozonPromotionApi.deactivateProducts(credentials, {
      action_id: Number(promotion.ozonActionId),
      product_ids: ozonProductIds.filter(Boolean) as number[],
    });

    // Update local status
    await this.prisma.promotionProduct.updateMany({
      where: {
        promotionId,
        productId: { in: dto.productIds },
      },
      data: { participationStatus: ParticipationStatus.EXITED },
    });

    return { exited: dto.productIds.length };
  }
}
