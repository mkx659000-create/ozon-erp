import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WarehouseService } from './warehouse.service';

@Controller('warehouses')
@UseGuards(AuthGuard('jwt'))
export class WarehouseController {
  constructor(private warehouseService: WarehouseService) {}

  @Get()
  async findAll(@Query('storeAccountId') storeAccountId: string) {
    return this.warehouseService.findAll(storeAccountId);
  }

  @Post('sync')
  async sync(@Body('storeAccountId') storeAccountId: string) {
    return this.warehouseService.syncWarehouses(storeAccountId);
  }
}
