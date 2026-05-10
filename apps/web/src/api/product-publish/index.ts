import request from '../request';

export interface ProductAttribute {
  attributeId: number;
  values: Array<{
    dictionary_value_id?: number;
    value: string;
  }>;
}

export interface PublishProductParams {
  storeAccountId: string;
  name: string;
  offerId: string;
  descriptionCategoryId: number;
  description?: string;
  barcode?: string;
  price: number;
  oldPrice?: number;
  premiumPrice?: number;
  currencyCode: string;
  vat?: number;
  weightGross?: number;
  dimensionLength?: number;
  dimensionWidth?: number;
  dimensionHeight?: number;
  images?: string[];
  primaryImage?: string;
  attributes?: ProductAttribute[];
}

export interface CategoryAttribute {
  id: number;
  name: string;
  description: string;
  type: string;
  is_collection: boolean;
  is_required: boolean;
  group_id: number;
  group_name: string;
  dictionary_id: number;
  category_dependent: boolean;
}

/** Publish a product to Ozon */
export function publishProductApi(data: PublishProductParams) {
  return request.post<any, { taskId: number; message: string }>(
    '/product-publish',
    data,
  );
}

/** Check import status */
export function checkImportStatusApi(storeAccountId: string, taskId: number) {
  return request.get<any, any>('/product-publish/import-status', {
    params: { storeAccountId, taskId },
  });
}

/** Get category attributes for publish form */
export function getCategoryAttributesApi(
  storeAccountId: string,
  categoryId: number,
) {
  return request.get<any, CategoryAttribute[]>(
    '/product-publish/category-attributes',
    { params: { storeAccountId, categoryId } },
  );
}
