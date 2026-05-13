import request from '../request';

export interface Product {
  id: string;
  ozonProductId: string;
  offerId: string;
  name: string;
  primaryImage: string | null;
  images: string[];
  status: string;
  visible: boolean;
  sellingPrice: number | null;
  originalPrice: number | null;
  lowestPrice: number | null;
  costPrice: number | null;
  currencyCode: string;
  priceIndex: string | null;
  totalStock: number;
  sales14d: number;
  reviewCount: number;
  rating: number | null;
  weightGross: number | null;
  dimensionLength: number | null;
  dimensionWidth: number | null;
  dimensionHeight: number | null;
  volumeWeight: number | null;
  mergeCount: number;
  mergeNumber: string | null;
  categoryName: string | null;
  notes: string | null;
  ozonCreatedAt: string | null;
  ozonUpdatedAt: string | null;
  lastModifiedAt: string | null;
  lastSyncAt: string | null;
  storeAccount: { id: string; storeName: string };
  skus: Array<{ ozonSku: string; stock: number }>;
}

export interface ProductQuery {
  page?: number;
  pageSize?: number;
  storeAccountId?: string;
  status?: string;
  keyword?: string;
  offerId?: string;
  visible?: boolean;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface StatusCounts {
  total: number;
  onSale: number;
  outOfStock: number;
  moderation: number;
  moderationFailed: number;
  removed: number;
  archived: number;
}

export function getProductsApi(query: ProductQuery): Promise<PaginatedResult<Product>> {
  return request.get('/products', { params: query });
}

export function getProductByIdApi(id: string): Promise<Product> {
  return request.get(`/products/${id}`);
}

export function updateProductApi(id: string, data: Partial<Product>): Promise<Product> {
  return request.patch(`/products/${id}`, data);
}

export function batchUpdateProductsApi(
  productIds: string[],
  updates: Record<string, any>,
): Promise<{ updated: number }> {
  return request.post('/products/batch-update', { productIds, updates });
}

export function syncProductsApi(storeAccountId: string): Promise<{ synced: number; failed: number }> {
  return request.post('/products/sync', { storeAccountId });
}

export function getStatusCountsApi(storeAccountId?: string): Promise<StatusCounts> {
  return request.get('/products/status-counts', {
    params: storeAccountId ? { storeAccountId } : {},
  });
}

export function exportProductsApi(params: {
  storeAccountId?: string;
  status?: string;
  keyword?: string;
}): Promise<any[]> {
  return request.get('/products/export', { params });
}

export function archiveProductsApi(productIds: string[]): Promise<{ updated: number }> {
  return request.post('/products/batch-update', {
    productIds,
    updates: { status: 'ARCHIVED', visible: false },
  });
}
