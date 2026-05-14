import { Injectable, Logger } from '@nestjs/common';
import { OzonApiService, OzonCredentials } from './ozon-api.service';
import {
  OzonRatingSummaryResponse,
  OzonRatingHistoryResponse,
  OzonStockOnWarehousesResponse,
  OzonStockOnWarehouseItem,
} from './types/rating.types';

@Injectable()
export class OzonRatingApi {
  private readonly logger = new Logger(OzonRatingApi.name);

  constructor(private ozonApiService: OzonApiService) {}

  async getRatingSummary(credentials: OzonCredentials): Promise<OzonRatingSummaryResponse> {
    const client = this.ozonApiService.createClient(credentials);
    const { data } = await client.post<OzonRatingSummaryResponse>(
      '/v1/rating/summary',
      {},
    );
    return data;
  }

  async getRatingHistory(
    credentials: OzonCredentials,
    dateFrom: string,
    dateTo: string,
    ratings: string[] = ['rating_on_time', 'rating_shipment', 'rating_cancellations'],
  ): Promise<OzonRatingHistoryResponse> {
    const client = this.ozonApiService.createClient(credentials);
    const { data } = await client.post<OzonRatingHistoryResponse>(
      '/v1/rating/history',
      {
        date_from: dateFrom,
        date_to: dateTo,
        ratings,
        with_premium_scores: true,
      },
    );
    return data;
  }

  async getStockOnWarehouses(
    credentials: OzonCredentials,
    limit = 1000,
    offset = 0,
  ): Promise<OzonStockOnWarehouseItem[]> {
    const client = this.ozonApiService.createClient(credentials);
    const { data } = await client.post<OzonStockOnWarehousesResponse>(
      '/v2/analytics/stock_on_warehouses',
      { limit, offset },
    );
    return data.result?.rows || [];
  }
}
