import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OzonPricingApi } from '../../ozon-api/ozon-pricing.api';

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);

  constructor(
    private prisma: PrismaService,
    private ozonPricingApi: OzonPricingApi,
  ) {}

  private async getCredentials(storeAccountId: string) {
    const store = await this.prisma.storeAccount.findUniqueOrThrow({
      where: { id: storeAccountId },
    });
    return { clientId: store.ozonClientId, apiKey: store.ozonApiKey };
  }

  async listStrategies(storeAccountId: string) {
    const credentials = await this.getCredentials(storeAccountId);
    return this.ozonPricingApi.listStrategies(credentials);
  }

  async getStrategyInfo(storeAccountId: string, strategyId: string) {
    const credentials = await this.getCredentials(storeAccountId);
    return this.ozonPricingApi.getStrategyInfo(credentials, strategyId);
  }

  async createStrategy(
    storeAccountId: string,
    name: string,
    type: string,
    settings?: Record<string, any>,
  ) {
    const credentials = await this.getCredentials(storeAccountId);
    return this.ozonPricingApi.createStrategy(credentials, name, type, settings);
  }

  async addProductsToStrategy(
    storeAccountId: string,
    strategyId: string,
    productIds: number[],
  ) {
    const credentials = await this.getCredentials(storeAccountId);
    return this.ozonPricingApi.addProductsToStrategy(credentials, strategyId, productIds);
  }

  async getCompetitors(storeAccountId: string, productId: number) {
    const credentials = await this.getCredentials(storeAccountId);
    return this.ozonPricingApi.listCompetitors(credentials, productId);
  }

  async getProductPriceDetails(storeAccountId: string, productIds?: number[]) {
    const credentials = await this.getCredentials(storeAccountId);

    if (!productIds || productIds.length === 0) {
      const products = await this.prisma.product.findMany({
        where: { storeAccountId },
        select: { ozonProductId: true },
        take: 1000,
      });
      productIds = products.map((p) => Number(p.ozonProductId));
    }

    return this.ozonPricingApi.getProductPriceDetails(credentials, productIds);
  }
}
