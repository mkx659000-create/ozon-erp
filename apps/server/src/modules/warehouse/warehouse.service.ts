import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OzonWarehouseApi } from '../../ozon-api/ozon-warehouse.api';

@Injectable()
export class WarehouseService {
  private readonly logger = new Logger(WarehouseService.name);

  constructor(
    private prisma: PrismaService,
    private ozonWarehouseApi: OzonWarehouseApi,
  ) {}

  async findAll(storeAccountId: string) {
    return this.prisma.warehouse.findMany({
      where: { storeAccountId },
      orderBy: { name: 'asc' },
    });
  }

  async syncWarehouses(storeAccountId: string) {
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
        syncType: 'WAREHOUSE',
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });

    try {
      const ozonWarehouses = await this.ozonWarehouseApi.listWarehouses(credentials);

      let synced = 0;
      for (const wh of ozonWarehouses) {
        await this.prisma.warehouse.upsert({
          where: {
            storeAccountId_ozonWarehouseId: {
              storeAccountId,
              ozonWarehouseId: BigInt(wh.warehouse_id),
            },
          },
          update: {
            name: wh.name,
            isRfbs: wh.is_rfbs,
            status: wh.status || 'active',
          },
          create: {
            storeAccountId,
            ozonWarehouseId: BigInt(wh.warehouse_id),
            name: wh.name,
            isRfbs: wh.is_rfbs,
            status: wh.status || 'active',
          },
        });
        synced++;
      }

      await this.prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'SUCCESS',
          itemsProcessed: synced,
          completedAt: new Date(),
        },
      });

      this.logger.log(`Synced ${synced} warehouses for store ${storeAccountId}`);
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
