import { Injectable, Logger } from '@nestjs/common';
import { OzonApiService, OzonCredentials } from './ozon-api.service';
import {
  OzonActionListResponse,
  OzonAction,
  OzonActionProductsRequest,
  OzonActionProductsResponse,
  OzonActionProduct,
  OzonActivateProductsRequest,
  OzonActivateProductsResponse,
  OzonDeactivateProductsRequest,
} from './types/promotion.types';

@Injectable()
export class OzonPromotionApi {
  private readonly logger = new Logger(OzonPromotionApi.name);

  constructor(private ozonApiService: OzonApiService) {}

  /**
   * List all available promotions/actions.
   */
  async listActions(credentials: OzonCredentials): Promise<OzonAction[]> {
    const client = this.ozonApiService.createClient(credentials);
    const { data } = await client.get<OzonActionListResponse>('/v1/actions');
    return data.result;
  }

  /**
   * Get all products in a promotion (paginated).
   */
  async getActionProducts(
    credentials: OzonCredentials,
    actionId: number,
  ): Promise<OzonActionProduct[]> {
    const client = this.ozonApiService.createClient(credentials);
    const allProducts: OzonActionProduct[] = [];
    const limit = 100;
    let offset = 0;

    while (true) {
      const body: OzonActionProductsRequest = {
        action_id: actionId,
        limit,
        offset,
      };

      const { data } = await client.post<OzonActionProductsResponse>(
        '/v1/actions/products',
        body,
      );

      allProducts.push(...data.result.products);
      offset += limit;

      if (
        data.result.products.length < limit ||
        allProducts.length >= data.result.total
      ) {
        break;
      }
    }

    return allProducts;
  }

  /**
   * Add products to a promotion with action prices.
   */
  async activateProducts(
    credentials: OzonCredentials,
    request: OzonActivateProductsRequest,
  ): Promise<OzonActivateProductsResponse['result']> {
    const client = this.ozonApiService.createClient(credentials);
    const { data } = await client.post<OzonActivateProductsResponse>(
      '/v1/actions/products/activate',
      request,
    );
    return data.result;
  }

  /**
   * Remove products from a promotion.
   */
  async deactivateProducts(
    credentials: OzonCredentials,
    request: OzonDeactivateProductsRequest,
  ): Promise<void> {
    const client = this.ozonApiService.createClient(credentials);
    await client.post('/v1/actions/products/deactivate', request);
  }
}
