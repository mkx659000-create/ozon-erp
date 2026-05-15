import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get dashboard overview stats.
   */
  async getOverview(storeAccountId?: string) {
    const storeFilter = storeAccountId ? { storeAccountId } : {};

    const [
      totalProducts,
      onSaleProducts,
      totalPromotions,
      joinedPromotions,
      pendingOrders,
      totalOrders,
      totalReturns,
      totalWarehouses,
      lastSync,
      recentLogs,
    ] = await Promise.all([
      this.prisma.product.count({ where: storeFilter }),
      this.prisma.product.count({ where: { ...storeFilter, status: 'ON_SALE' } }),
      this.prisma.promotionProduct.count({
        where: storeAccountId
          ? { promotion: { storeAccountId } }
          : {},
      }),
      this.prisma.promotionProduct.count({
        where: {
          participationStatus: 'JOINED',
          ...(storeAccountId
            ? { promotion: { storeAccountId } }
            : {}),
        },
      }),
      this.prisma.order.count({
        where: {
          ...storeFilter,
          orderStatus: { in: ['AWAITING_PACKAGING', 'AWAITING_DELIVER'] },
        },
      }),
      this.prisma.order.count({ where: storeFilter }),
      this.prisma.return.count({ where: storeFilter }),
      this.prisma.warehouse.count({ where: storeFilter }),
      this.prisma.syncLog.findFirst({
        where: storeAccountId ? { storeAccountId } : {},
        orderBy: { completedAt: 'desc' },
        select: { syncType: true, status: true, completedAt: true },
      }),
      this.prisma.syncLog.findMany({
        where: storeAccountId ? { storeAccountId } : {},
        orderBy: { startedAt: 'desc' },
        take: 8,
        select: {
          id: true,
          syncType: true,
          status: true,
          itemsProcessed: true,
          itemsFailed: true,
          startedAt: true,
          completedAt: true,
        },
      }),
    ]);

    return {
      products: { total: totalProducts, onSale: onSaleProducts },
      promotions: { total: totalPromotions, joined: joinedPromotions },
      orders: { total: totalOrders, pending: pendingOrders },
      returns: { total: totalReturns },
      warehouses: { total: totalWarehouses },
      lastSync,
      recentSyncLogs: recentLogs,
    };
  }
}
