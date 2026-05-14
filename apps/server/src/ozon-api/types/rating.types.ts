export interface OzonRatingGroup {
  group_name: string;
  items: OzonRatingItem[];
}

export interface OzonRatingItem {
  rating_name: string;
  current_value: number;
  past_value: number;
  status: {
    danger: number;
    warning: number;
  };
  value_type: string;
}

export interface OzonRatingSummaryResponse {
  groups: OzonRatingGroup[];
  premium: boolean;
}

export interface OzonRatingHistoryItem {
  date: string;
  rating: number;
}

export interface OzonRatingHistoryResponse {
  ratings: OzonRatingHistoryItem[];
}

export interface OzonStockOnWarehouseItem {
  sku: number;
  warehouse_name: string;
  item_code: string;
  item_name: string;
  promised_amount: number;
  free_to_sell_amount: number;
  reserved_amount: number;
}

export interface OzonStockOnWarehousesResponse {
  result: {
    rows: OzonStockOnWarehouseItem[];
  };
}
