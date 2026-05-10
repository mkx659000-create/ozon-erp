import { Injectable, Logger } from '@nestjs/common';
import { OzonApiService, OzonCredentials } from './ozon-api.service';
import {
  OzonCategoryTreeResponse,
  OzonCategoryTreeNode,
  OzonCategoryAttributeResponse,
  OzonCategoryAttribute,
} from './types/category.types';

@Injectable()
export class OzonCategoryApi {
  private readonly logger = new Logger(OzonCategoryApi.name);

  constructor(private ozonApi: OzonApiService) {}

  /**
   * Get category tree from Ozon.
   * POST /v1/description-category/tree
   */
  async getCategoryTree(
    credentials: OzonCredentials,
    language: string = 'DEFAULT',
  ): Promise<OzonCategoryTreeNode[]> {
    const client = this.ozonApi.createClient(credentials);
    const response = await client.post<OzonCategoryTreeResponse>(
      '/v1/description-category/tree',
      { language },
    );
    return response.data.result;
  }

  /**
   * Get attributes for a specific category.
   * POST /v1/description-category/attribute
   */
  async getCategoryAttributes(
    credentials: OzonCredentials,
    descriptionCategoryId: number,
    typeId: number = 0,
    language: string = 'DEFAULT',
  ): Promise<OzonCategoryAttribute[]> {
    const client = this.ozonApi.createClient(credentials);
    const response = await client.post<OzonCategoryAttributeResponse>(
      '/v1/description-category/attribute',
      {
        description_category_id: descriptionCategoryId,
        language,
        type_id: typeId,
      },
    );
    return response.data.result;
  }
}
