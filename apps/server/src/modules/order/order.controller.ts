import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OrderService } from './order.service';
import { QueryOrderDto } from './dto/query-order.dto';

@Controller('orders')
@UseGuards(AuthGuard('jwt'))
export class OrderController {
  private readonly logger = new Logger(OrderController.name);

  constructor(private readonly orderService: OrderService) {}

  @Get()
  findAll(@Query() query: QueryOrderDto) {
    return this.orderService.findAll(query);
  }

  @Get('status-counts')
  getStatusCounts(@Query('storeAccountId') storeAccountId?: string) {
    return this.orderService.getStatusCounts(storeAccountId);
  }

  @Get('analytics')
  getAnalytics(
    @Query('storeAccountId') storeAccountId: string,
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ) {
    return this.orderService.getAnalytics(storeAccountId, dateFrom, dateTo);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.orderService.findById(id);
  }

  @Post('sync')
  async sync(@Body('storeAccountId') storeAccountId: string) {
    try {
      return await this.orderService.syncFromOzon(storeAccountId);
    } catch (error: any) {
      this.logger.error(`Order sync controller error: ${error.message}`, error.stack);
      return { synced: 0, failed: 0, error: error.message || '同步失败' };
    }
  }
}
