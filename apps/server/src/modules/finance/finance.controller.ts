import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FinanceService } from './finance.service';
import { QueryFinanceDto, SyncFinanceDto, RealizationQueryDto, SummaryQueryDto } from './dto/query-finance.dto';

@Controller('finance')
@UseGuards(AuthGuard('jwt'))
export class FinanceController {
  private readonly logger = new Logger(FinanceController.name);

  constructor(private financeService: FinanceService) {}

  @Get('transactions')
  findTransactions(@Query() query: QueryFinanceDto) {
    return this.financeService.findTransactions(query);
  }

  @Get('summary')
  getSummary(@Query() query: SummaryQueryDto) {
    return this.financeService.getTransactionSummary(query);
  }

  @Get('totals')
  getTotals(
    @Query('storeAccountId') storeAccountId: string,
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ) {
    return this.financeService.getOzonTotals(storeAccountId, dateFrom, dateTo);
  }

  @Get('realization')
  getRealization(@Query() query: RealizationQueryDto) {
    return this.financeService.getRealizationReport(query.storeAccountId, query.month);
  }

  @Get('profit-analysis')
  getProfitAnalysis(
    @Query('storeAccountId') storeAccountId: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.financeService.getProfitAnalysis(storeAccountId, dateFrom, dateTo);
  }

  @Post('sync')
  async sync(@Body() dto: SyncFinanceDto) {
    try {
      return await this.financeService.syncTransactions(dto.storeAccountId, dto.dateFrom, dto.dateTo);
    } catch (error: any) {
      this.logger.error(`Finance sync error: ${error.message}`, error.stack);
      return { synced: 0, failed: 0, error: error.message || '同步失败' };
    }
  }
}
