import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PricingService } from './pricing.service';

@Controller('pricing')
@UseGuards(AuthGuard('jwt'))
export class PricingController {
  constructor(private pricingService: PricingService) {}

  @Get('strategies')
  async listStrategies(@Query('storeAccountId') storeAccountId: string) {
    return this.pricingService.listStrategies(storeAccountId);
  }

  @Get('strategy')
  async getStrategyInfo(
    @Query('storeAccountId') storeAccountId: string,
    @Query('strategyId') strategyId: string,
  ) {
    return this.pricingService.getStrategyInfo(storeAccountId, strategyId);
  }

  @Post('strategy/create')
  async createStrategy(
    @Body() body: { storeAccountId: string; name: string; type: string; settings?: Record<string, any> },
  ) {
    return this.pricingService.createStrategy(body.storeAccountId, body.name, body.type, body.settings);
  }

  @Post('strategy/add-products')
  async addProductsToStrategy(
    @Body() body: { storeAccountId: string; strategyId: string; productIds: number[] },
  ) {
    return this.pricingService.addProductsToStrategy(body.storeAccountId, body.strategyId, body.productIds);
  }

  @Get('competitors')
  async getCompetitors(
    @Query('storeAccountId') storeAccountId: string,
    @Query('productId') productId: string,
  ) {
    return this.pricingService.getCompetitors(storeAccountId, parseInt(productId));
  }

  @Get('price-details')
  async getProductPriceDetails(@Query('storeAccountId') storeAccountId: string) {
    return this.pricingService.getProductPriceDetails(storeAccountId);
  }
}
