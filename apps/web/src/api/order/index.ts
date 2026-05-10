import request from '../request';

export interface OrderItem {
  id: string;
  orderId: string;
  ozonSku: string;
  name: string;
  quantity: number;
  price: number;
  offerId: string | null;
}

export interface Order {
  id: string;
  storeAccountId: string;
  ozonPostingNumber: string;
  ozonOrderId: string | null;
  orderStatus: string;
  totalAmount: number;
  currencyCode: string;
  shippingProvider: string | null;
  trackingNumber: string | null;
  customerName: string | null;
  customerRegion: string | null;
  ozonCreatedAt: string;
  shipByDate: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  storeAccount?: { id: string; storeName: string };
}

export interface OrderQuery {
  page?: number;
  pageSize?: number;
  storeAccountId?: string;
  status?: string;
  keyword?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface OrderStatusCounts {
  total: number;
  statuses: Array<{ status: string; count: number }>;
}

export interface AnalyticsData {
  data: Array<{
    dimensions: Array<{ id: string; name: string }>;
    metrics: number[];
  }>;
  totals: number[];
}

/** Get orders list */
export function getOrdersApi(params: OrderQuery) {
  return request.get<any, PaginatedResult<Order>>('/orders', { params });
}

/** Get order by ID */
export function getOrderByIdApi(id: string) {
  return request.get<any, Order>(`/orders/${id}`);
}

/** Get order status counts */
export function getOrderStatusCountsApi(storeAccountId?: string) {
  return request.get<any, OrderStatusCounts>('/orders/status-counts', {
    params: storeAccountId ? { storeAccountId } : {},
  });
}

/** Sync orders from Ozon */
export function syncOrdersApi(storeAccountId: string) {
  return request.post<any, { synced: number; failed: number }>('/orders/sync', {
    storeAccountId,
  });
}

/** Get analytics data */
export function getAnalyticsApi(
  storeAccountId: string,
  dateFrom: string,
  dateTo: string,
) {
  return request.get<any, AnalyticsData>('/orders/analytics', {
    params: { storeAccountId, dateFrom, dateTo },
  });
}
