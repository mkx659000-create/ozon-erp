import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OzonReturnsApi } from '../../ozon-api/ozon-returns.api';
import { QueryReturnsDto } from './dto/query-returns.dto';

@Injectable()
export class ReturnsService {
  private readonly logger = new Logger(ReturnsService.name);

  constructor(
    private prisma: PrismaService,
    private ozonReturnsApi: OzonReturnsApi,
  ) {}

  async findReturns(query: QueryReturnsDto) {
    const { storeAccountId, returnType, status, keyword, page = 1, pageSize = 20 } = query;

    const where: any = { storeAccountId };
    if (returnType) where.returnType = returnType;
    if (status) where.status = status;
    if (keyword) {
      where.OR = [
        { postingNumber: { contains: keyword, mode: 'insensitive' } },
        { productName: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.return.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.return.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async getReturnStats(storeAccountId: string) {
    const [byType, byStatus] = await Promise.all([
      this.prisma.return.groupBy({
        by: ['returnType'],
        where: { storeAccountId },
        _count: true,
      }),
      this.prisma.return.groupBy({
        by: ['status'],
        where: { storeAccountId },
        _count: true,
      }),
    ]);

    return {
      byType: byType.map((r) => ({ type: r.returnType, count: r._count })),
      byStatus: byStatus.map((r) => ({ status: r.status, count: r._count })),
      total: byType.reduce((sum, r) => sum + r._count, 0),
    };
  }

  async syncReturns(storeAccountId: string) {
    const store = await this.prisma.storeAccount.findUniqueOrThrow({
      where: { id: storeAccountId },
    });

    const credentials = {
      clientId: store.ozonClientId,
      apiKey: store.ozonApiKey,
    };

    const syncLog = await this.prisma.syncLog.create({
      data: {
        storeAccountId,
        syncType: 'RETURNS',
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });

    let synced = 0;
    let failed = 0;

    try {
      const fboReturns = await this.ozonReturnsApi.listFboReturns(credentials);
      for (const r of fboReturns) {
        try {
          await this.prisma.return.upsert({
            where: {
              storeAccountId_ozonReturnId_returnType: {
                storeAccountId,
                ozonReturnId: BigInt(r.return_id),
                returnType: 'FBO',
              },
            },
            update: {
              status: r.status,
              productName: r.product_name,
              quantity: r.quantity,
              returnAmount: r.return_amount,
              commission: r.commission_amount,
              returnReason: r.return_reason_name,
              returnedAt: r.returned_to_ozon_moment ? new Date(r.returned_to_ozon_moment) : undefined,
            },
            create: {
              storeAccountId,
              ozonReturnId: BigInt(r.return_id),
              returnType: 'FBO',
              postingNumber: r.posting_number,
              status: r.status,
              ozonSku: BigInt(r.sku),
              productName: r.product_name,
              quantity: r.quantity,
              returnReason: r.return_reason_name,
              returnAmount: r.return_amount,
              commission: r.commission_amount,
              returnedAt: r.returned_to_ozon_moment ? new Date(r.returned_to_ozon_moment) : null,
            },
          });
          synced++;
        } catch {
          failed++;
        }
      }

      const rfbsReturns = await this.ozonReturnsApi.listRfbsReturns(credentials);
      for (const r of rfbsReturns) {
        try {
          await this.prisma.return.upsert({
            where: {
              storeAccountId_ozonReturnId_returnType: {
                storeAccountId,
                ozonReturnId: BigInt(r.id),
                returnType: 'FBS',
              },
            },
            update: {
              status: r.status,
              productName: r.product_name,
              quantity: r.quantity,
              returnAmount: r.price,
              commission: r.commission,
              returnReason: r.return_reason_name,
            },
            create: {
              storeAccountId,
              ozonReturnId: BigInt(r.id),
              returnType: 'FBS',
              postingNumber: r.posting_number,
              status: r.status,
              ozonSku: BigInt(r.sku),
              productName: r.product_name,
              quantity: r.quantity,
              returnReason: r.return_reason_name,
              returnAmount: r.price,
              commission: r.commission,
            },
          });
          synced++;
        } catch {
          failed++;
        }
      }

      const logStatus = failed > 0 ? 'PARTIAL_FAILURE' : 'SUCCESS';
      await this.prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: logStatus,
          itemsProcessed: synced,
          itemsFailed: failed,
          completedAt: new Date(),
        },
      });

      this.logger.log(`Return sync: ${synced} synced, ${failed} failed`);
      return { synced, failed };
    } catch (error: any) {
      await this.prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'FAILED',
          itemsProcessed: synced,
          itemsFailed: failed,
          errorMessage: error.message?.substring(0, 500),
          completedAt: new Date(),
        },
      });
      throw error;
    }
  }
}
