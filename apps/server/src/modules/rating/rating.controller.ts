import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RatingService } from './rating.service';

@Controller('rating')
@UseGuards(AuthGuard('jwt'))
export class RatingController {
  constructor(private ratingService: RatingService) {}

  @Get('current')
  async getCurrentRating(@Query('storeAccountId') storeAccountId: string) {
    return this.ratingService.getCurrentRating(storeAccountId);
  }

  @Get('history')
  async getRatingHistory(
    @Query('storeAccountId') storeAccountId: string,
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ) {
    return this.ratingService.getRatingHistory(storeAccountId, dateFrom, dateTo);
  }

  @Get('stock-distribution')
  async getStockOnWarehouses(@Query('storeAccountId') storeAccountId: string) {
    return this.ratingService.getStockOnWarehouses(storeAccountId);
  }

  @Post('sync')
  async syncRating(@Body('storeAccountId') storeAccountId: string) {
    return this.ratingService.syncRating(storeAccountId);
  }
}
