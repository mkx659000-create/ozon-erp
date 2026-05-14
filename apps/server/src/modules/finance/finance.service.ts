import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, SyncType, SyncLogStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { OzonFinanceApi } from '../../ozon-api/ozon-finance.api';
import { QueryFinanceDto, SummaryQueryDto } from './dto/query-finance.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class FinanceService {
  private readonly logger = new Logger(FinanceService.name);

  constructor(
    private prisma: PrismaService,
    private ozonFinanceApi: OzonFinanceApi,
  ) {}

  async findTransactions(query: QueryFinanceDto) {
    const { page, pageSize, storeAccountId, dateFrom, dateTo, operationType, postingNumber, sortField, sortOrder } = query;
    const skip = (page - 1) * pageSize;

    const where: Prisma.FinanceTransactionWhereInput = {};
    if (storeAccountId) where.storeAccountId = storeAccountId;
    if (operationType) where.operationType = operationType;
    if (postingNumber) where.postingNumber = { contains: postingNumber, mode: 'insensitive' };
    if (dateFrom || dateTo) {
      where.operationDate = {};
      if (dateFrom) where.operationDate.gte = new Date(dateFrom);
      if (dateTo) where.operationDate.lte = new Date(dateTo);
    }

    const orderBy: Prisma.FinanceTransactionOrderByWithRelationInput = {};
    if (sortField && sortOrder) {
      (orderBy as any)[sortField] = sortOrder;
    } else {
      orderBy.operationDate = 'desc';
    }

    const [items, total] = await Promise.all([
      this.prisma.financeTransaction.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          storeAccount: { select: { id: true, storeName: true } },
        },
      }),
      this.prisma.financeTransaction.count({ where }),
    ]);

    return new PaginatedResult(items, total, page, pageSize);
  }

  async getTransactionSummary(query: SummaryQueryDto) {
    const { storeAccountId, dateFrom, dateTo } = query;

    const where: Prisma.FinanceSummaryWhereInput = { storeAccountId };
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    const summaries = await this.prisma.financeSummary.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    const totals = summaries.reduce(
      (acc, s) => ({
        totalSales: acc.totalSales + Number(s.totalSales),
        totalCommissions: acc.totalCommissions + Number(s.totalCommissions),
        totalDelivery: acc.totalDelivery + Number(s.totalDelivery),
        totalReturns: acc.totalReturns + Number(s.totalReturns),
        totalPayout: acc.totalPayout + Number(s.totalPayout),
        transactionCount: acc.transactionCount + s.transactionCount,
      }),
      { totalSales: 0, totalCommissions: 0, totalDelivery: 0, totalReturns: 0, totalPayout: 0, transactionCount: 0 },
    );

    return { daily: summaries, totals };
  }

  async getOzonTotals(storeAccountId: string, dateFrom: string, dateTo: string) {
    const store = await this.prisma.storeAccount.findUnique({ where: { id: storeAccountId } });
    if (!store) throw new NotFoundException('店铺不存在');

    const credentials = { clientId: store.ozonClientId, apiKey: store.ozonApiKey };
    return this.ozonFinanceApi.getTransactionTotals(credentials, dateFrom, dateTo);
  }

  async getRealizationReport(storeAccountId: string, month: string) {
    const store = await this.prisma.storeAccount.findUnique({ where: { id: storeAccountId } });
    if (!store) throw new NotFoundException('店铺不存在');

    const credentials = { clientId: store.ozonClientId, apiKey: store.ozonApiKey };
    return this.ozonFinanceApi.getRealizationReport(credentials, month);
  }

  async getProfitAnalysis(storeAccountId: string, dateFrom?: string, dateTo?: string) {
    const where: Prisma.FinanceTransactionWhereInput = {
      storeAccountId,
      operationType: { in: ['OperationAgentDeliveredToCustomer', 'ClientReturnAgentOperation'] },
    };
    if (dateFrom || dateTo) {
      where.operationDate = {};
      if (dateFrom) where.operationDate.gte = new Date(dateFrom);
      if (dateTo) where.operationDate.lte = new Date(dateTo);
    }

    const transactions = await this.prisma.financeTransaction.findMany({ where });

    const productMap = new Map<string, {
      sku: number;
      name: string;
      revenue: number;
      commission: number;
      delivery: number;
      returns: number;
      count: number;
    }>();

    for (const tx of transactions) {
      const sku = tx.ozonSku ? Number(tx.ozonSku) : 0;
      const key = String(sku);
      const existing = productMap.get(key) || {
        sku,
        name: tx.productName || '',
        revenue: 0,
        commission: 0,
        delivery: 0,
        returns: 0,
        count: 0,
      };

      existing.revenue += Number(tx.accruals || 0);
      existing.commission += Math.abs(Number(tx.commissionAmount || 0));
      existing.delivery += Math.abs(Number(tx.deliveryCharge || 0));
      if (Number(tx.amount) < 0) {
        existing.returns += Math.abs(Number(tx.amount));
      }
      existing.count++;
      if (tx.productName && !existing.name) existing.name = tx.productName;

      productMap.set(key, existing);
    }

    const products = await this.prisma.product.findMany({
      where: { storeAccountId },
      select: { ozonProductId: true, costPrice: true, offerId: true },
    });
    const costMap = new Map<string, number>();
    for (const p of products) {
      if (p.costPrice) {
        costMap.set(String(p.ozonProductId), Number(p.costPrice));
      }
    }

    const items = Array.from(productMap.values()).map(item => {
      const costPrice = costMap.get(String(item.sku)) || 0;
      const totalCost = costPrice * item.count;
      const profit = item.revenue - item.commission - item.delivery - item.returns - totalCost;
      return {
        ...item,
        costPrice,
        totalCost,
        profit,
        profitMargin: item.revenue > 0 ? (profit / item.revenue * 100) : 0,
      };
    });

    items.sort((a, b) => b.revenue - a.revenue);
    return items;
  }

  async syncTransactions(storeAccountId: string, dateFrom?: string, dateTo?: string) {
    const store = await this.prisma.storeAccount.findUnique({ where: { id: storeAccountId } });
    if (!store) throw new NotFoundException('店铺不存在');

    const now = new Date();
    const from = dateFrom || new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const to = dateTo || now.toISOString();

    const syncLog = await this.prisma.syncLog.create({
      data: {
        storeAccountId,
        syncType: SyncType.FINANCE,
        status: SyncLogStatus.RUNNING,
        startedAt: now,
      },
    });

    let synced = 0;
    let failed = 0;

    try {
      const credentials = { clientId: store.ozonClientId, apiKey: store.ozonApiKey };
      const operations = await this.ozonFinanceApi.listTransactions(credentials, from, to);

      this.logger.log(`Fetched ${operations.length} transactions for store ${store.storeName}`);

      for (const op of operations) {
        try {
          const firstItem = op.items?.[0];
          await this.prisma.financeTransaction.upsert({
            where: {
              storeAccountId_operationId: {
                storeAccountId,
                operationId: BigInt(op.operation_id),
              },
            },
            create: {
              storeAccountId,
              operationId: BigInt(op.operation_id),
              operationType: op.operation_type,
              operationDate: new Date(op.operation_date),
              postingNumber: op.posting?.posting_number || null,
              amount: op.amount,
              commissionAmount: op.sale_commission || null,
              deliveryCharge: op.delivery_charge || null,
              accruals: op.accruals_for_sale || null,
              ozonSku: firstItem?.sku ? BigInt(firstItem.sku) : null,
              productName: firstItem?.name || null,
              rawData: op as any,
            },
            update: {
              operationType: op.operation_type,
              operationDate: new Date(op.operation_date),
              postingNumber: op.posting?.posting_number || null,
              amount: op.amount,
              commissionAmount: op.sale_commission || null,
              deliveryCharge: op.delivery_charge || null,
              accruals: op.accruals_for_sale || null,
              ozonSku: firstItem?.sku ? BigInt(firstItem.sku) : null,
              productName: firstItem?.name || null,
              rawData: op as any,
            },
          });
          synced++;
        } catch (err: any) {
          this.logger.warn(`Failed to upsert transaction ${op.operation_id}: ${err.message}`);
          failed++;
        }
      }

      await this.rebuildDailySummaries(storeAccountId, from, to);

      await this.prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: failed > 0 ? SyncLogStatus.PARTIAL_FAILURE : SyncLogStatus.SUCCESS,
          itemsProcessed: synced,
          itemsFailed: failed,
          completedAt: new Date(),
        },
      });
    } catch (err: any) {
      this.logger.error(`Finance sync failed: ${err.message}`, err.stack);
      await this.prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: SyncLogStatus.FAILED,
          itemsProcessed: synced,
          itemsFailed: failed,
          errorMessage: (err.message || '').substring(0, 500),
          completedAt: new Date(),
        },
      });
    }

    return { synced, failed };
  }

  private async rebuildDailySummaries(storeAccountId: string, dateFrom: string, dateTo: string) {
    const transactions = await this.prisma.financeTransaction.findMany({
      where: {
        storeAccountId,
        operationDate: { gte: new Date(dateFrom), lte: new Date(dateTo) },
      },
    });

    const dailyMap = new Map<string, {
      sales: number;
      commissions: number;
      delivery: number;
      returns: number;
      payout: number;
      count: number;
    }>();

    for (const tx of transactions) {
      const dateKey = tx.operationDate.toISOString().split('T')[0]!;
      const existing = dailyMap.get(dateKey) || {
        sales: 0, commissions: 0, delivery: 0, returns: 0, payout: 0, count: 0,
      };

      existing.sales += Math.max(0, Number(tx.accruals || 0));
      existing.commissions += Math.abs(Number(tx.commissionAmount || 0));
      existing.delivery += Math.abs(Number(tx.deliveryCharge || 0));
      if (Number(tx.amount) < 0) existing.returns += Math.abs(Number(tx.amount));
      existing.payout += Number(tx.amount);
      existing.count++;

      dailyMap.set(dateKey, existing);
    }

    for (const [dateStr, data] of dailyMap) {
      await this.prisma.financeSummary.upsert({
        where: {
          storeAccountId_date: {
            storeAccountId,
            date: new Date(dateStr),
          },
        },
        create: {
          storeAccountId,
          date: new Date(dateStr),
          totalSales: data.sales,
          totalCommissions: data.commissions,
          totalDelivery: data.delivery,
          totalReturns: data.returns,
          totalPayout: data.payout,
          transactionCount: data.count,
        },
        update: {
          totalSales: data.sales,
          totalCommissions: data.commissions,
          totalDelivery: data.delivery,
          totalReturns: data.returns,
          totalPayout: data.payout,
          transactionCount: data.count,
        },
      });
    }
  }
}
