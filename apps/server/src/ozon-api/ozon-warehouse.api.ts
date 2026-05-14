import { Injectable, Logger } from '@nestjs/common';
import { OzonApiService, OzonCredentials } from './ozon-api.service';
import {
  OzonWarehouse,
  OzonWarehouseListResponse,
} from './types/warehouse.types';

@Injectable()
export class OzonWarehouseApi {
  private readonly logger = new Logger(OzonWarehouseApi.name);

  constructor(private ozonApi: OzonApiService) {}

  async listWarehouses(credentials: OzonCredentials): Promise<OzonWarehouse[]> {
    const client = this.ozonApi.createClient(credentials);
    const { data } = await client.get<OzonWarehouseListResponse>(
      '/v1/warehouse/list',
    );
    return data.result;
  }
}
