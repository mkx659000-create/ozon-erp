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
    if (status) {
      const flagMap: Record<string, string> = {
        OUT_OF_STOCK: 'EMPTY_STOCK',
        MODERATION_FAILED: 'STATE_FAILED',
        MODERATION: 'NOT_MODERATED',
        REMOVED: 'DISABLED',
      };
      if (status === ProductStatus.ON_SALE) {
        where.ozonFlags = { isEmpty: true };
        where.status = { not: ProductStatus.ARCHIVED };
      } else if (flagMap[status]) {
        where.ozonFlags = { has: flagMap[status] };
      } else {
        where.status = status;
      }
    }
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
    if (updates.status) data.status = updates.status;

    const result = await this.prisma.product.updateMany({
      where: { id: { in: productIds } },
      data,
    });
    return { updated: result.count };
  }

  /**
   * Export products as JSON array (frontend converts to CSV).
   */
  async exportProducts(storeAccountId?: string, status?: string, keyword?: string) {
    const where: Prisma.ProductWhereInput = {};
    if (storeAccountId) where.storeAccountId = storeAccountId;
    if (status) where.status = status as any;
    if (keyword) {
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { offerId: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const products = await this.prisma.product.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 5000,
      include: {
        storeAccount: { select: { storeName: true } },
      },
    });

    return products.map((p) => ({
      name: p.name,
      offerId: p.offerId,
      ozonProductId: p.ozonProductId.toString(),
      status: p.status,
      sellingPrice: p.sellingPrice ? Number(p.sellingPrice) : null,
      originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
      lowestPrice: p.lowestPrice ? Number(p.lowestPrice) : null,
      costPrice: p.costPrice ? Number(p.costPrice) : null,
      currencyCode: p.currencyCode,
      totalStock: p.totalStock,
      sales14d: p.sales14d,
      weightGross: p.weightGross ? Number(p.weightGross) : null,
      dimensionLength: p.dimensionLength ? Number(p.dimensionLength) : null,
      dimensionWidth: p.dimensionWidth ? Number(p.dimensionWidth) : null,
      dimensionHeight: p.dimensionHeight ? Number(p.dimensionHeight) : null,
      categoryName: p.categoryName,
      notes: p.notes,
      storeName: p.storeAccount?.storeName,
      ozonCreatedAt: p.ozonCreatedAt?.toISOString(),
      lastSyncAt: p.lastSyncAt?.toISOString(),
    }));
  }

  async getStatusCounts(storeAccountId?: string) {
    const where: Prisma.ProductWhereInput = {};
    if (storeAccountId) where.storeAccountId = storeAccountId;

    // Count by ozonFlags (independent, overlapping counts — matches Ozon dashboard)
    const [total, outOfStock, moderationFailed, moderation, removed, archived] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.count({ where: { ...where, ozonFlags: { has: 'EMPTY_STOCK' } } }),
      this.prisma.product.count({ where: { ...where, ozonFlags: { has: 'STATE_FAILED' } } }),
      this.prisma.product.count({ where: { ...where, ozonFlags: { has: 'NOT_MODERATED' } } }),
      this.prisma.product.count({ where: { ...where, ozonFlags: { has: 'DISABLED' } } }),
      this.prisma.product.count({ where: { ...where, status: ProductStatus.ARCHIVED } }),
    ]);

    // onSale = products with no problem flags (VISIBLE in Ozon terms)
    const onSale = await this.prisma.product.count({
      where: {
        ...where,
        ozonFlags: { isEmpty: true },
        status: { not: ProductStatus.ARCHIVED },
      },
    });

    return { total, onSale, outOfStock, moderation, moderationFailed, removed, archived };
  }

  async diagnosticCounts(storeAccountId: string) {
    const store = await this.prisma.storeAccount.findUnique({
      where: { id: storeAccountId },
    });
    if (!store) throw new NotFoundException('店铺不存在');

    const credentials = { clientId: store.ozonClientId, apiKey: store.ozonApiKey };
    const ozonCounts = await this.ozonProductApi.getVisibilityCounts(credentials);
    const localCounts = await this.getStatusCounts(storeAccountId);

    // Sample raw status from different visibility categories
    const samples: Record<string, any[]> = {};
    for (const vis of ['STATE_FAILED', 'NOT_MODERATED', 'DISABLED']) {
      try {
        const ids = await this.ozonProductApi.listAllProducts(credentials, vis);
        if (ids.length > 0) {
          const sampleIds = ids.slice(0, 2).map(p => p.product_id);
          const infos = await this.ozonProductApi.getProductInfoBatch(credentials, sampleIds);
          samples[vis] = infos.map((info: any) => ({
            id: info.id,
            name: info.name?.substring(0, 30),
            state: info.status?.state,
            state_failed: info.status?.state_failed,
            moderate_status: info.status?.moderate_status,
            validation_state: info.status?.validation_state,
            is_failed: info.status?.is_failed,
            visible: info.visible,
            is_archived: (info as any).is_archived,
          }));
        }
      } catch { /* skip */ }
    }

    return { ozon: ozonCounts, local: localCounts, samples };
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
      this.logger.log(`Starting product sync for store ${store.storeName}`);

      // Step 1: Get all product IDs
      const productList = await this.ozonProductApi.listAllProducts(credentials, 'ALL');
      this.logger.log(`Found ${productList.length} products on Ozon`);

      // Step 2: Build flags map by querying each visibility category
      const flagsMap = new Map<number, string[]>();
      const visCategories = ['EMPTY_STOCK', 'DISABLED', 'NOT_MODERATED', 'STATE_FAILED'];
      for (const vis of visCategories) {
        try {
          const ids = await this.ozonProductApi.listAllProducts(credentials, vis);
          for (const p of ids) {
            const existing = flagsMap.get(p.product_id) || [];
            existing.push(vis);
            flagsMap.set(p.product_id, existing);
          }
          this.logger.log(`  ${vis}: ${ids.length} products`);
        } catch { /* skip */ }
      }

      // Step 3: Get detailed info in batches
      const productIds = productList.map((p) => p.product_id);
      const productInfos = await this.ozonProductApi.getProductInfoBatch(
        credentials,
        productIds,
      );

      // Step 4: Get accurate stock info from /v4/product/info/stocks
      const stockInfos = await this.ozonProductApi.getStockInfo(credentials);
      const stockMap = new Map<number, number>();
      for (const item of stockInfos) {
        const total = item.stocks.reduce((s, st) => s + (st.present || 0), 0);
        stockMap.set(item.product_id, total);
      }
      this.logger.log(`Fetched stock info for ${stockInfos.length} products`);

      // Step 5: Upsert into local database
      for (const info of productInfos) {
        try {
          await this.upsertProduct(storeAccountId, info, stockMap, flagsMap);
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

      // Log status breakdown after sync
      const counts = await this.getStatusCounts(storeAccountId);
      this.logger.log(
        `Product sync complete: ${synced} synced, ${failed} failed. Status breakdown: total=${counts.total}, onSale=${counts.onSale}, outOfStock=${counts.outOfStock}, moderation=${counts.moderation}, moderationFailed=${counts.moderationFailed}, removed=${counts.removed}, archived=${counts.archived}`,
      );
    } catch (error: any) {
      this.logger.error(`Product sync failed: ${error.message}`, error.stack);
      try {
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
      } catch (logError: any) {
        this.logger.error(`Failed to update sync log: ${logError.message}`);
      }
      return { synced, failed, error: error.message || '同步失败' };
    }

    return { synced, failed };
  }

  private async upsertProduct(storeAccountId: string, info: any, stockMap?: Map<number, number>, flagsMap?: Map<number, string[]>) {
    const primaryImg = Array.isArray(info.primary_image)
      ? info.primary_image[0]
      : info.primary_image || info.images?.[0] || null;

    let totalStock = stockMap?.get(info.id) ?? 0;
    if (!stockMap?.has(info.id) && info.stocks) {
      if (Array.isArray(info.stocks.stocks)) {
        totalStock = info.stocks.stocks.reduce((s: number, st: any) => s + (st.present || 0), 0);
      } else if (typeof info.stocks.present === 'number') {
        totalStock = info.stocks.present;
      }
    }

    const ozonFlags = flagsMap?.get(info.id) || [];
    const isArchived = info.is_archived || false;

    // Primary status: highest priority flag wins (for single-status filtering)
    let status: ProductStatus = ProductStatus.ON_SALE;
    if (isArchived) status = ProductStatus.ARCHIVED;
    else if (ozonFlags.includes('STATE_FAILED')) status = ProductStatus.MODERATION_FAILED;
    else if (ozonFlags.includes('NOT_MODERATED')) status = ProductStatus.MODERATION;
    else if (ozonFlags.includes('DISABLED')) status = ProductStatus.REMOVED;
    else if (ozonFlags.includes('EMPTY_STOCK')) status = ProductStatus.OUT_OF_STOCK;

    const primarySku = info.sku || info.sources?.[0]?.sku || 0;

    // Look up category name from local DB
    const descCatId = info.description_category_id || info.category_id || null;
    let categoryName: string | null = null;
    if (descCatId) {
      const cat = await this.prisma.category.findUnique({ where: { id: descCatId } });
      if (cat) {
        categoryName = cat.nameZh ? `${cat.nameZh}` : cat.name;
      }
    }

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
        categoryId: descCatId,
        categoryName,
        primaryImage: primaryImg,
        images: info.images || [],
        status,
        ozonFlags,
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
            stock: totalStock,
            reserved: (info.stocks && typeof info.stocks.reserved === 'number') ? info.stocks.reserved : 0,
          }],
        } : undefined,
      },
      update: {
        name: info.name || '',
        barcode: info.barcodes?.[0] || null,
        categoryId: descCatId,
        categoryName,
        primaryImage: primaryImg,
        images: info.images || [],
        status,
        ozonFlags,
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

  private mapOzonStatus(ozonStatus: string, isArchived: boolean, totalStock: number, isFailed: boolean = false): ProductStatus {
    if (isArchived) return ProductStatus.ARCHIVED;
    if (isFailed) return ProductStatus.MODERATION_FAILED;
    switch (ozonStatus) {
      case 'price_sent':
      case 'processed':
        return totalStock === 0 ? ProductStatus.OUT_OF_STOCK : ProductStatus.ON_SALE;
      case 'moderating':
      case 'processing':
        return ProductStatus.MODERATION;
      case 'failed_moderation':
      case 'failed_validation':
      case 'failed':
        return ProductStatus.MODERATION_FAILED;
      case 'disabled':
      case 'removed':
        return ProductStatus.REMOVED;
      case 'archived':
        return ProductStatus.ARCHIVED;
      default:
        return totalStock === 0 ? ProductStatus.OUT_OF_STOCK : ProductStatus.ON_SALE;
    }
  }
}
