import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsString } from 'class-validator';
import { SyncSchedulerService } from './schedulers/sync-scheduler.service';
import { PrismaService } from '../prisma/prisma.service';

class TriggerSyncDto {
  @IsString()
  storeAccountId: string;
}

@Controller('sync')
@UseGuards(AuthGuard('jwt'))
export class SyncController {
  constructor(
    private syncScheduler: SyncSchedulerService,
    private prisma: PrismaService,
  ) {}

  /**
   * POST /sync/product — trigger manual product sync.
   */
  @Post('product')
  async triggerProductSync(@Body() dto: TriggerSyncDto) {
    const job = await this.syncScheduler.triggerProductSync(dto.storeAccountId);
    return { jobId: job.id, message: '产品同步任务已启动' };
  }

  /**
   * POST /sync/promotion — trigger manual promotion sync.
   */
  @Post('promotion')
  async triggerPromotionSync(@Body() dto: TriggerSyncDto) {
    const job = await this.syncScheduler.triggerPromotionSync(dto.storeAccountId);
    return { jobId: job.id, message: '促销同步任务已启动' };
  }

  @Post('stock')
  async triggerStockSync(@Body() dto: TriggerSyncDto) {
    const job = await this.syncScheduler.triggerStockSync(dto.storeAccountId);
    return { jobId: job.id, message: '库存同步任务已启动' };
  }

  @Post('finance')
  async triggerFinanceSync(@Body() dto: TriggerSyncDto) {
    const job = await this.syncScheduler.triggerFinanceSync(dto.storeAccountId);
    return { jobId: job.id, message: '财务同步任务已启动' };
  }

  /**
   * GET /sync/status — get sync job status for a store.
   */
  @Get('status')
  async getSyncStatus(@Query('storeAccountId') storeAccountId: string) {
    const [queueStatus, latestLogs] = await Promise.all([
      this.syncScheduler.getSyncStatus(storeAccountId),
      this.prisma.syncLog.findMany({
        where: { storeAccountId },
        orderBy: { startedAt: 'desc' },
        take: 10,
      }),
    ]);

    return { queues: queueStatus, recentLogs: latestLogs };
  }

  /**
   * POST /sync/refresh-schedule — re-register all scheduled jobs.
   */
  @Post('refresh-schedule')
  async refreshSchedule() {
    await this.syncScheduler.refreshSchedule();
    return { message: '同步计划已刷新' };
  }
}
