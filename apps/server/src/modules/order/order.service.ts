import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, OrderStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { OzonOrderApi } from '../../ozon-api/ozon-order.api';
import { QueryOrderDto } from './dto/query-order.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private prisma: PrismaService,
    private ozonOrderApi: OzonOrderApi,
  ) {}

  /**
   * List orders with filters + pagination.
   */
  async findAll(query: QueryOrderDto) {
    const { page, pageSize, storeAccountId, status, keyword, dateFrom, dateTo } = query;
    const skip = (page - 1) * pageSize;

    const where: Prisma.OrderWhereInput = {};

    if (storeAccountId) where.storeAccountId = storeAccountId;
    if (status) where.orderStatus = status as OrderStatus;
    if (keyword) {
      where.OR = [
        { ozonPostingNumber: { contains: keyword, mode: 'insensitive' } },
        { trackingNumber: { contains: keyword, mode: 'insensitive' } },
      ];
    }
    if (dateFrom || dateTo) {
      where.ozonCreatedAt = {};
      if (dateFrom) where.ozonCreatedAt.gte = new Date(dateFrom);
      if (dateTo) where.ozonCreatedAt.lte = new Date(dateTo);
    }

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { ozonCreatedAt: 'desc' },
        include: {
          items: true,
          storeAccount: { select: { id: true, storeName: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return new PaginatedResult(items, total, page, pageSize);
  }

  /**
   * Get a single order by ID.
   */
  async findById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        storeAccount: { select: { id: true, storeName: true } },
      },
    });
    if (!order) throw new NotFoundException('订单不存在');
    return order;
  }

  /**
   * Get order status counts.
   */
  async getStatusCounts(storeAccountId?: string) {
    const where: Prisma.OrderWhereInput = {};
    if (storeAccountId) where.storeAccountId = storeAccountId;

    const statuses = Object.values(OrderStatus);

    const counts = await Promise.all(
      statuses.map(async (status) => ({
        status,
        count: await this.prisma.order.count({
          where: { ...where, orderStatus: status },
        }),
      })),
    );

    const total = await this.prisma.order.count({ where });

    return { total, statuses: counts };
  }

  /**
   * Sync orders from Ozon (incremental — since last sync).
   */
  async syncFromOzon(storeAccountId: string) {
    const store = await this.prisma.storeAccount.findUnique({
      where: { id: storeAccountId },
    });
    if (!store) throw new NotFoundException('店铺不存在');

    const credentials = { clientId: store.ozonClientId, apiKey: store.ozonApiKey };

    // Use the last successful ORDER sync time, NOT store.lastSyncAt (which is shared with product sync)
    const lastOrderSync = await this.prisma.syncLog.findFirst({
      where: {
        storeAccountId,
        syncType: 'ORDER',
        status: { in: ['SUCCESS', 'PARTIAL_FAILURE'] },
      },
      orderBy: { completedAt: 'desc' },
      select: { completedAt: true },
    });
    const lastSyncTime = lastOrderSync?.completedAt || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const since = lastSyncTime.toISOString();
    const to = new Date().toISOString();

    const syncLog = await this.prisma.syncLog.create({
      data: {
        storeAccountId,
        syncType: 'ORDER',
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });

    let synced = 0;
    let failed = 0;

    try {
      const postings = await this.ozonOrderApi.listAllFbsPostingsSince(credentials, since, to);
      this.logger.log(`Found ${postings.length} postings from ${since} to ${to}`);

      for (const posting of postings) {
        try {
          const totalAmount = posting.products.reduce(
            (sum, p) => sum + parseFloat(p.price) * p.quantity,
            0,
          );

          const statusMap: Record<string, OrderStatus> = {
            awaiting_packaging: OrderStatus.AWAITING_PACKAGING,
            awaiting_deliver: OrderStatus.AWAITING_DELIVER,
            delivering: OrderStatus.DELIVERING,
            delivered: OrderStatus.DELIVERED,
            cancelled: OrderStatus.CANCELLED,
            returned: OrderStatus.RETURNED,
          };
          const mappedStatus = statusMap[posting.status] || OrderStatus.AWAITING_PACKAGING;

          const order = await this.prisma.order.upsert({
            where: {
              storeAccountId_ozonPostingNumber: {
                storeAccountId,
                ozonPostingNumber: posting.posting_number,
              },
            },
            create: {
              storeAccountId,
              ozonPostingNumber: posting.posting_number,
              orderStatus: mappedStatus,
              totalAmount,
              trackingNumber: posting.tracking_number || null,
              ozonCreatedAt: new Date(posting.created_at),
            },
            update: {
              orderStatus: mappedStatus,
              totalAmount,
              trackingNumber: posting.tracking_number || null,
            },
          });

          // Sync order items — delete existing and recreate
          await this.prisma.orderItem.deleteMany({
            where: { orderId: order.id },
          });

          for (const product of posting.products) {
            await this.prisma.orderItem.create({
              data: {
                orderId: order.id,
                ozonSku: BigInt(product.sku),
                name: product.name,
                quantity: product.quantity,
                price: parseFloat(product.price),
                offerId: product.offer_id || null,
              },
            });
          }

          synced++;
        } catch (error: any) {
          this.logger.error(`Failed to sync posting ${posting.posting_number}: ${error.message}`);
          failed++;
        }
      }

      // Update store lastSyncAt
      await this.prisma.storeAccount.update({
        where: { id: storeAccountId },
        data: { lastSyncAt: new Date() },
      });

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
      this.logger.error(`Order sync failed: ${error.message}`, error.stack);
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
      // Return partial result instead of throwing — the frontend shows synced/failed counts
      return { synced, failed, error: error.message || '同步失败' };
    }

    return { synced, failed };
  }

  /**
   * Get analytics data (revenue, orders per day).
   */
  async getAnalytics(storeAccountId: string, dateFrom: string, dateTo: string) {
    const store = await this.prisma.storeAccount.findUnique({
      where: { id: storeAccountId },
    });
    if (!store) throw new NotFoundException('店铺不存在');

    const credentials = { clientId: store.ozonClientId, apiKey: store.ozonApiKey };

    try {
      const result = await this.ozonOrderApi.getAnalytics(
        credentials,
        dateFrom,
        dateTo,
        ['revenue', 'ordered_units', 'returns', 'session_view_pdp', 'conv_todirect_percentage'],
        ['day'],
      );
      return result;
    } catch (error: any) {
      this.logger.warn(`Analytics API failed: ${error.message}, falling back to local data`);
      // Fallback: compute from local order data
      return this.getLocalAnalytics(storeAccountId, dateFrom, dateTo);
    }
  }

  /**
   * Local analytics fallback from DB orders.
   */
  private async getLocalAnalytics(storeAccountId: string, dateFrom: string, dateTo: string) {
    const orders = await this.prisma.order.findMany({
      where: {
        storeAccountId,
        ozonCreatedAt: {
          gte: new Date(dateFrom),
          lte: new Date(dateTo),
        },
      },
      include: { items: true },
      orderBy: { ozonCreatedAt: 'asc' },
    });

    // Group by day
    const dayMap = new Map<string, { revenue: number; units: number; orders: number }>();
    for (const order of orders) {
      const day = order.ozonCreatedAt
        ? order.ozonCreatedAt.toISOString().split('T')[0]
        : 'unknown';
      if (!dayMap.has(day)) {
        dayMap.set(day, { revenue: 0, units: 0, orders: 0 });
      }
      const d = dayMap.get(day)!;
      d.revenue += Number(order.totalAmount || 0);
      d.units += order.items.reduce((s, i) => s + i.quantity, 0);
      d.orders += 1;
    }

    const data = Array.from(dayMap.entries()).map(([day, metrics]) => ({
      dimensions: [{ id: day, name: day }],
      metrics: [metrics.revenue, metrics.units, 0, 0, 0],
    }));

    const totals = data.reduce(
      (acc, d) => acc.map((v, i) => v + d.metrics[i]),
      [0, 0, 0, 0, 0],
    );

    return { data, totals };
  }
}
