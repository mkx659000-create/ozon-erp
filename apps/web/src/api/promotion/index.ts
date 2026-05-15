import request from '../request';

/* ============ Activity Types ============ */

export interface PromotionActivity {
  id: string;
  storeAccountId: string;
  ozonActionId: string;
  title: string;
  startDate: string;
  endDate: string;
  freezeDate: string | null;
  status: string;
  discountType: string | null;
  discountValue: number | null;
  potentialProductsCount: number;
  participatingProductsCount: number;
  bannedProductsCount: number;
  orderAmount: number | null;
  isParticipating: boolean;
  participationType: string | null;
  lastSyncAt: string | null;
  localProductsCount: number;
  storeAccount?: { id: string; storeName: string };
}

export interface ActivityDetail extends PromotionActivity {
  products: PromotionProduct[];
  stats: { joined: number; notJoined: number; exited: number; total: number };
}

export interface CandidateProduct {
  id: string;
  name: string;
  offerId: string;
  ozonProductId: string;
  primaryImage: string | null;
  sellingPrice: number | null;
  totalStock: number | null;
  skus: Array<{ ozonSku: string }>;
}

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
  productId?: string,
) {
  return request.get<any, PaginatedResult<PromotionProduct>>(
    `/promotions/${promotionId}/products`,
    { params: { page, pageSize, productId } },
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

/** Get activities list */
export function getActivitiesApi(storeAccountId?: string, status?: string) {
  return request.get<any, PromotionActivity[]>('/promotions/activities', {
    params: { storeAccountId, status },
  });
}

/** Get activity detail */
export function getActivityDetailApi(id: string) {
  return request.get<any, ActivityDetail>(`/promotions/activities/${id}`);
}

/** Get candidate products for joining a promotion */
export function getCandidateProductsApi(promotionId: string, keyword?: string) {
  return request.get<any, CandidateProduct[]>(
    `/promotions/activities/${promotionId}/candidates`,
    { params: keyword ? { keyword } : {} },
  );
}
