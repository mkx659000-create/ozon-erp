import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, ProductStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { OzonProductApi } from '../../ozon-api/ozon-product.api';
import { OzonProductInfo } from '../../ozon-api/types/product.types';
import { QueryProductDto } from './dto/query-product.dto';
import { UpdateProductDto, BatchUpdateProductDto } from './dto/update-product.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    private prisma: PrismaService,
    private ozonProductApi: OzonProductApi,
  ) {}

  async findAll(query: QueryProductDto) {
    const { page, pageSize, storeAccountId, status, keyword, offerId, visible, sortField, sortOrder } = query;
    const skip = (page - 1) * pageSize;

    const where: Prisma.ProductWhereInput = {};

    if (storeAccountId) where.storeAccountId = storeAccountId;
    if (status) where.status = status;
    if (visible !== undefined) where.visible = visible;
    if (offerId) where.offerId = { contains: offerId, mode: 'insensitive' };
    if (keyword) {
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { offerId: { contains: keyword, mode: 'insensitive' } },
        { notes: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput = {};
    if (sortField && sortOrder) {
      (orderBy as any)[sortField] = sortOrder;
    } else {
      orderBy.updatedAt = 'desc';
    }

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          storeAccount: { select: { id: true, storeName: true } },
          skus: { select: { ozonSku: true, stock: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return new PaginatedResult(items, total, page, pageSize);
  }

  async findById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        storeAccount: { select: { id: true, storeName: true } },
        skus: true,
        priceRules: true,
      },
    });
    if (!product) throw new NotFoundException('产品不存在');
    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('产品不存在');

    return this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.costPrice !== undefined && { costPrice: dto.costPrice }),
        ...(dto.visible !== undefined && { visible: dto.visible }),
        ...(dto.categoryName && { categoryName: dto.categoryName }),
        lastModifiedAt: new Date(),
      },
    });
  }

  async batchUpdate(dto: BatchUpdateProductDto) {
    const { productIds, updates } = dto;
    const data: Prisma.ProductUpdateManyMutationInput = {
      lastModifiedAt: new Date(),
    };
    if (updates.notes !== undefined) data.notes = updates.notes;
    if (updates.costPrice !== undefined) data.costPrice = updates.costPrice;
    if (updates.visible !== undefined) data.visible = updates.visible;
    if (updates.categoryName) data.categoryName = updates.categoryName;

    const result = await this.prisma.product.updateMany({
      where: { id: { in: productIds } },
      data,
    });
    return { updated: result.count };
  }

  async getStatusCounts(storeAccountId?: string) {
    const where: Prisma.ProductWhereInput = {};
    if (storeAccountId) where.storeAccountId = storeAccountId;

    const [total, onSale, outOfStock, moderation, moderationFailed, removed, archived] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.count({ where: { ...where, status: ProductStatus.ON_SALE } }),
      this.prisma.product.count({ where: { ...where, status: ProductStatus.OUT_OF_STOCK } }),
      this.prisma.product.count({ where: { ...where, status: ProductStatus.MODERATION } }),
      this.prisma.product.count({ where: { ...where, status: ProductStatus.MODERATION_FAILED } }),
      this.prisma.product.count({ where: { ...where, status: ProductStatus.REMOVED } }),
      this.prisma.product.count({ where: { ...where, status: ProductStatus.ARCHIVED } }),
    ]);

    return { total, onSale, outOfStock, moderation, moderationFailed, removed, archived };
  }

  /**
   * Sync products from Ozon API to local database.
   */
  async syncFromOzon(storeAccountId: string): Promise<{ synced: number; failed: number; error?: string }> {
    const store = await this.prisma.storeAccount.findUnique({
      where: { id: storeAccountId },
    });
    if (!store) throw new NotFoundException('店铺不存在');

    const credentials = { clientId: store.ozonClientId, apiKey: store.ozonApiKey };

    // Create sync log
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
      // Step 1: Get all product IDs
      this.logger.log(`Starting product sync for store ${store.storeName}`);
      const productList = await this.ozonProductApi.listAllProducts(credentials);
      this.logger.log(`Found ${productList.length} products on Ozon`);

      // Step 2: Get detailed info in batches
      const productIds = productList.map((p) => p.product_id);
      const productInfos = await this.ozonProductApi.getProductInfoBatch(
        credentials,
        productIds,
      );

      // Step 3: Upsert into local database
      for (const info of productInfos) {
        try {
          await this.upsertProduct(storeAccountId, info);
          synced++;
        } catch (error: any) {
          this.logger.error(
            `Failed to sync product ${info.id}: ${error.message}`,
          );
          failed++;
        }
      }

      // Update sync log
      await this.prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: failed > 0 ? 'PARTIAL_FAILURE' : 'SUCCESS',
          itemsProcessed: synced,
          itemsFailed: failed,
          completedAt: new Date(),
        },
      });

      // Update store last sync time
      await this.prisma.storeAccount.update({
        where: { id: storeAccountId },
        data: { lastSyncAt: new Date() },
      });

      this.logger.log(
        `Product sync complete: ${synced} synced, ${failed} failed`,
      );
    } catch (error: any) {
      this.logger.error(`Product sync failed: ${error.message}`);
      await this.prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'FAILED',
          errorMessage: error.message?.substring(0, 500),
          itemsProcessed: synced,
          itemsFailed: failed,
          completedAt: new Date(),
        },
      });
      return { synced, failed, error: error.message || '同步失败' };
    }

    return { synced, failed };
  }

  private async upsertProduct(storeAccountId: string, info: any) {
    // Real API: statuses.status (not status.state), primary_image is array
    const ozonStatus = info.statuses?.status || info.status?.state || '';
    const isArchived = info.is_archived || false;
    const status = this.mapOzonStatus(ozonStatus, isArchived);

    // primary_image can be string or array
    const primaryImg = Array.isArray(info.primary_image)
      ? info.primary_image[0]
      : info.primary_image || info.images?.[0] || null;

    // stocks: { has_stock, stocks: [{present, reserved, sku, source}] }
    const stockItems: any[] = info.stocks?.stocks || [];
    const totalStock = stockItems.reduce((s: number, st: any) => s + (st.present || 0), 0);

    // SKU from sources or top-level sku
    const primarySku = info.sku || info.sources?.[0]?.sku || 0;

    await this.prisma.product.upsert({
      where: {
        storeAccountId_ozonProductId: {
          storeAccountId,
          ozonProductId: BigInt(info.id),
        },
      },
      create: {
        storeAccountId,
        ozonProductId: BigInt(info.id),
        offerId: info.offer_id,
        name: info.name || '',
        barcode: info.barcodes?.[0] || null,
        primaryImage: primaryImg,
        images: info.images || [],
        status,
        visible: !isArchived,
        sellingPrice: info.price ? parseFloat(info.price) : null,
        originalPrice: info.old_price ? parseFloat(info.old_price) : null,
        lowestPrice: info.min_price ? parseFloat(info.min_price) : null,
        currencyCode: info.currency_code || 'RUB',
        totalStock,
        ozonCreatedAt: info.created_at ? new Date(info.created_at) : null,
        ozonUpdatedAt: info.updated_at ? new Date(info.updated_at) : null,
        lastSyncAt: new Date(),
        skus: primarySku ? {
          create: [{
            ozonSku: BigInt(primarySku),
            stock: stockItems.find((s: any) => s.sku === primarySku)?.present || 0,
            reserved: stockItems.find((s: any) => s.sku === primarySku)?.reserved || 0,
          }],
        } : undefined,
      },
      update: {
        name: info.name || '',
        barcode: info.barcodes?.[0] || null,
        primaryImage: primaryImg,
        images: info.images || [],
        status,
        visible: !isArchived,
        sellingPrice: info.price ? parseFloat(info.price) : null,
        originalPrice: info.old_price ? parseFloat(info.old_price) : null,
        lowestPrice: info.min_price ? parseFloat(info.min_price) : null,
        currencyCode: info.currency_code || 'RUB',
        totalStock,
        ozonUpdatedAt: info.updated_at ? new Date(info.updated_at) : null,
        lastSyncAt: new Date(),
      },
    });
  }

  private mapOzonStatus(ozonStatus: string, isArchived: boolean): ProductStatus {
    if (isArchived) return ProductStatus.ARCHIVED;
    switch (ozonStatus) {
      case 'price_sent':
      case 'processed':
        return ProductStatus.ON_SALE;
      case 'moderating':
        return ProductStatus.MODERATION;
      case 'failed_moderation':
      case 'failed_validation':
        return ProductStatus.MODERATION_FAILED;
      case 'disabled':
      case 'removed':
        return ProductStatus.REMOVED;
      case 'archived':
        return ProductStatus.ARCHIVED;
      default:
        return ProductStatus.ON_SALE;
    }
  }
}
