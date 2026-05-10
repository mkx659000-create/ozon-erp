import request from '../request';

/* ============ Types ============ */

export interface PromotionProduct {
  id: string;
  promotionId: string;
  productId: string;
  participationStatus: 'JOINED' | 'NOT_JOINED' | 'EXITED';
  originalPrice: number | null;
  lowestPromoPrice: number | null;
  promoPrice: number | null;
  promoDiscount: number | null;
  promoStock: number | null;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    offerId: string;
    ozonProductId: string;
    primaryImage: string | null;
    sellingPrice: number | null;
    totalStock: number | null;
    storeAccount?: { id: string; storeName: string };
    skus: Array<{ ozonSku: string }>;
  };
  promotion: {
    id: string;
    title: string;
    ozonActionId: string;
    startDate: string;
    endDate: string;
    status: string;
    participationType: string | null;
  };
}

export interface PromotionQuery {
  page?: number;
  pageSize?: number;
  storeAccountId?: string;
  participationStatus?: 'JOINED' | 'NOT_JOINED' | 'EXITED';
  keyword?: string;
  actionId?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface StatusCounts {
  total: number;
  joined: number;
  notJoined: number;
}

export interface EditProductItem {
  id: string;
  promoPrice?: number;
  promoDiscount?: number;
  promoStock?: number;
}

export interface JoinProduct {
  productId: string;
  actionPrice: number;
  stock: number;
}

/* ============ API Functions ============ */

/** Get promotion products list with pagination + filters */
export function getPromotionProductsApi(params: PromotionQuery) {
  return request.get<any, PaginatedResult<PromotionProduct>>('/promotions', {
    params,
  });
}

/** Get participation status counts */
export function getStatusCountsApi(storeAccountId?: string) {
  return request.get<any, StatusCounts>('/promotions/status-counts', {
    params: storeAccountId ? { storeAccountId } : {},
  });
}

/** Get products for the edit-activity modal */
export function getEditActivityProductsApi(
  promotionId: string,
  page = 1,
  pageSize = 100,
) {
  return request.get<any, PaginatedResult<PromotionProduct>>(
    `/promotions/${promotionId}/products`,
    { params: { page, pageSize } },
  );
}

/** Sync promotions from Ozon */
export function syncPromotionsApi(storeAccountId: string) {
  return request.post<any, { synced: number; failed: number }>(
    '/promotions/sync',
    { storeAccountId },
  );
}

/** Join products to a promotion */
export function joinPromotionApi(
  promotionId: string,
  storeAccountId: string,
  products: JoinProduct[],
) {
  return request.post(`/promotions/${promotionId}/join`, {
    storeAccountId,
    products,
  });
}

/** Exit products from a promotion */
export function exitPromotionApi(
  promotionId: string,
  storeAccountId: string,
  productIds: string[],
) {
  return request.post(`/promotions/${promotionId}/exit`, {
    storeAccountId,
    productIds,
  });
}

/** Batch edit promotion products (price/discount/stock) */
export function batchEditPromotionProductsApi(
  promotionId: string,
  products: EditProductItem[],
) {
  return request.patch(`/promotions/${promotionId}/products`, { products });
}
