import request from '../request';

export interface RatingGroup {
  group_name: string;
  items: RatingItem[];
}

export interface RatingItem {
  rating_name: string;
  current_value: number;
  past_value: number;
  status: {
    danger: number;
    warning: number;
  };
  value_type: string;
}

export interface RatingSummary {
  groups: RatingGroup[];
  premium: boolean;
}

export interface SellerRatingRecord {
  id: string;
  ratingGroup: string;
  ratingName: string;
  currentValue: number;
  pastValue: number;
  ratingStatus: string;
  penalty: boolean;
  recordDate: string;
}

export interface StockOnWarehouseItem {
  sku: number;
  warehouse_name: string;
  item_code: string;
  item_name: string;
  promised_amount: number;
  free_to_sell_amount: number;
  reserved_amount: number;
}

export function getCurrentRatingApi(storeAccountId: string) {
  return request.get<any, RatingSummary>('/rating/current', { params: { storeAccountId } });
}

export function getRatingHistoryApi(storeAccountId: string, dateFrom: string, dateTo: string) {
  return request.get<any, SellerRatingRecord[]>('/rating/history', {
    params: { storeAccountId, dateFrom, dateTo },
  });
}

export function getStockDistributionApi(storeAccountId: string) {
  return request.get<any, StockOnWarehouseItem[]>('/rating/stock-distribution', {
    params: { storeAccountId },
  });
}

export function syncRatingApi(storeAccountId: string) {
  return request.post<any, { synced: number; failed: number }>('/rating/sync', { storeAccountId });
}
