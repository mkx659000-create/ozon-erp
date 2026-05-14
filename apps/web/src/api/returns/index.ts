import request from '../request';

export interface ReturnItem {
  id: string;
  storeAccountId: string;
  ozonReturnId: string;
  postingNumber: string | null;
  returnType: string;
  status: string;
  ozonSku: string | null;
  productName: string | null;
  quantity: number;
  returnReason: string | null;
  returnAmount: number | null;
  commission: number | null;
  returnedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReturnQuery {
  storeAccountId: string;
  returnType?: string;
  status?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface ReturnStats {
  byType: { type: string; count: number }[];
  byStatus: { status: string; count: number }[];
  total: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export function getReturnsApi(params: ReturnQuery) {
  return request.get<any, PaginatedResult<ReturnItem>>('/returns', { params });
}

export function getReturnStatsApi(storeAccountId: string) {
  return request.get<any, ReturnStats>('/returns/stats', { params: { storeAccountId } });
}

export function syncReturnsApi(storeAccountId: string) {
  return request.post<any, { synced: number; failed: number }>('/returns/sync', { storeAccountId });
}
