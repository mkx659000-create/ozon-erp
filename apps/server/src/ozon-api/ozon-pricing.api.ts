import { Injectable, Logger } from '@nestjs/common';
import { OzonApiService, OzonCredentials } from './ozon-api.service';
import {
  OzonPricingStrategyListResponse,
  OzonPricingStrategyInfoResponse,
  OzonCompetitorListResponse,
  OzonProductPriceDetailsResponse,
  OzonProductPricingInfo,
} from './types/pricing.types';

@Injectable()
export class OzonPricingApi {
  private readonly logger = new Logger(OzonPricingApi.name);

  constructor(private ozonApiService: OzonApiService) {}

  async listStrategies(credentials: OzonCredentials) {
    const client = this.ozonApiService.createClient(credentials);
    const { data } = await client.post<OzonPricingStrategyListResponse>(
      '/v1/pricing-strategy/list',
      {},
    );
    return data.result;
  }

  async getStrategyInfo(credentials: OzonCredentials, strategyId: string) {
    const client = this.ozonApiService.createClient(credentials);
    const { data } = await client.post<OzonPricingStrategyInfoResponse>(
      '/v1/pricing-strategy/info',
      { strategy_id: strategyId },
    );
    return data.result;
  }

  async createStrategy(
    credentials: OzonCredentials,
    name: string,
    type: string,
    settings?: Record<string, any>,
  ) {
    const client = this.ozonApiService.createClient(credentials);
    const { data } = await client.post(
      '/v1/pricing-strategy/create',
      { name, type, ...settings },
    );
    return data.result;
  }

  async addProductsToStrategy(
    credentials: OzonCredentials,
    strategyId: string,
    productIds: number[],
  ) {
    const client = this.ozonApiService.createClient(credentials);
    const { data } = await client.post(
      '/v1/pricing-strategy/products/add',
      { strategy_id: strategyId, product_id: productIds },
    );
    return data.result;
  }

  async listCompetitors(
    credentials: OzonCredentials,
    productId: number,
  ) {
    const client = this.ozonApiService.createClient(credentials);
    const { data } = await client.post<OzonCompetitorListResponse>(
      '/v1/pricing-strategy/competitors/list',
      { product_id: productId },
    );
    return data.result;
  }

  async getProductPriceDetails(
    credentials: OzonCredentials,
    productIds: number[],
  ): Promise<OzonProductPricingInfo[]> {
    const client = this.ozonApiService.createClient(credentials);
    const allItems: OzonProductPricingInfo[] = [];
    const batchSize = 1000;

    for (let i = 0; i < productIds.length; i += batchSize) {
      const batch = productIds.slice(i, i + batchSize);
      const { data } = await client.post<OzonProductPriceDetailsResponse>(
        '/v5/product/info/prices',
        { filter: { product_id: batch }, limit: batchSize },
      );
      allItems.push(...(data.result?.items || []));
    }

    return allItems;
  }
}
