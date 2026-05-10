import { Injectable, Logger } from '@nestjs/common';
import { AxiosInstance } from 'axios';
import { OzonApiService, OzonCredentials } from './ozon-api.service';
import {
  OzonProductListRequest,
  OzonProductListResponse,
  OzonProductInfoListRequest,
  OzonProductInfoListResponse,
  OzonProductInfo,
  OzonPriceUpdateRequest,
  OzonPriceUpdateResponse,
  OzonStockUpdateRequest,
  OzonStockUpdateResponse,
  OzonStockInfoRequest,
  OzonStockInfoResponse,
} from './types/product.types';

@Injectable()
export class OzonProductApi {
  private readonly logger = new Logger(OzonProductApi.name);

  constructor(private ozonApiService: OzonApiService) {}

  /**
   * Fetch all product IDs using cursor pagination.
   * Returns all product_id + offer_id pairs.
   */
  async listAllProducts(
    credentials: OzonCredentials,
  ): Promise<Array<{ product_id: number; offer_id: string }>> {
    const client = this.ozonApiService.createClient(credentials);
    const allItems: Array<{ product_id: number; offer_id: string }> = [];
    let lastId = '';
    const limit = 1000;

    while (true) {
      const body: OzonProductListRequest = {
        filter: {},
        limit,
        ...(lastId ? { last_id: lastId } : {}),
      };

      const { data } = await client.post<OzonProductListResponse>(
        '/v3/product/list',
        body,
      );

      allItems.push(...data.result.items);
      lastId = data.result.last_id;

      this.logger.debug(
        `Fetched ${allItems.length}/${data.result.total} product IDs`,
      );

      if (
        data.result.items.length < limit ||
        allItems.length >= data.result.total
      ) {
        break;
      }
    }

    return allItems;
  }

  /**
   * Fetch detailed info for a batch of product IDs (max 1000 per call).
   */
  async getProductInfoBatch(
    credentials: OzonCredentials,
    productIds: number[],
  ): Promise<OzonProductInfo[]> {
    const client = this.ozonApiService.createClient(credentials);
    const allInfos: OzonProductInfo[] = [];
    const batchSize = 1000;

    for (let i = 0; i < productIds.length; i += batchSize) {
      const batch = productIds.slice(i, i + batchSize);
      const body: OzonProductInfoListRequest = { product_id: batch };

      const { data } = await client.post<OzonProductInfoListResponse>(
        '/v3/product/info/list',
        body,
      );

      allInfos.push(...data.result.items);
      this.logger.debug(
        `Fetched info for ${allInfos.length}/${productIds.length} products`,
      );
    }

    return allInfos;
  }

  /**
   * Update prices for multiple products (max 1000 per call).
   */
  async updatePrices(
    credentials: OzonCredentials,
    prices: OzonPriceUpdateRequest['prices'],
  ): Promise<OzonPriceUpdateResponse['result']> {
    const client = this.ozonApiService.createClient(credentials);
    const allResults: OzonPriceUpdateResponse['result'] = [];
    const batchSize = 1000;

    for (let i = 0; i < prices.length; i += batchSize) {
      const batch = prices.slice(i, i + batchSize);
      const { data } = await client.post<OzonPriceUpdateResponse>(
        '/v1/product/import/prices',
        { prices: batch },
      );
      allResults.push(...data.result);
    }

    return allResults;
  }

  /**
   * Update stock quantities.
   */
  async updateStocks(
    credentials: OzonCredentials,
    stocks: OzonStockUpdateRequest['stocks'],
  ): Promise<OzonStockUpdateResponse['result']> {
    const client = this.ozonApiService.createClient(credentials);
    const allResults: OzonStockUpdateResponse['result'] = [];
    const batchSize = 100;

    for (let i = 0; i < stocks.length; i += batchSize) {
      const batch = stocks.slice(i, i + batchSize);
      const { data } = await client.post<OzonStockUpdateResponse>(
        '/v2/products/stocks',
        { stocks: batch },
      );
      allResults.push(...data.result);
    }

    return allResults;
  }

  /**
   * Get stock info with cursor pagination.
   */
  async getStockInfo(
    credentials: OzonCredentials,
  ): Promise<OzonStockInfoResponse['result']['items']> {
    const client = this.ozonApiService.createClient(credentials);
    const allItems: OzonStockInfoResponse['result']['items'] = [];
    let lastId = '';
    const limit = 1000;

    while (true) {
      const body: OzonStockInfoRequest = {
        filter: {},
        limit,
        ...(lastId ? { last_id: lastId } : {}),
      };

      const { data } = await client.post<OzonStockInfoResponse>(
        '/v4/product/info/stocks',
        body,
      );

      allItems.push(...data.result.items);
      lastId = data.result.last_id;

      if (
        data.result.items.length < limit ||
        allItems.length >= data.result.total
      ) {
        break;
      }
    }

    return allItems;
  }
}
