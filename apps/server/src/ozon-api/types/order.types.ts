// ===== /v3/posting/fbs/list =====
export interface OzonFbsListRequest {
  dir?: 'ASC' | 'DESC';
  filter?: {
    since?: string;  // ISO date
    to?: string;
    status?: string;
  };
  limit?: number;
  offset?: number;
  with?: {
    analytics_data?: boolean;
    financial_data?: boolean;
  };
}

export interface OzonFbsPosting {
  posting_number: string;
  order_id: number;
  order_number: string;
  status: string;
  substatus: string;
  in_process_at: string;
  shipment_date: string;
  delivering_date: string;
  cancel_reason_id: number;
  created_at: string;
  updated_at: string;
  tracking_number: string;
  products: Array<{
    sku: number;
    name: string;
    quantity: number;
    offer_id: string;
    price: string;
    digital_codes: string[];
    currency_code: string;
  }>;
  analytics_data?: {
    region: string;
    city: string;
    delivery_type: string;
    payment_type_group_name: string;
    warehouse_id: number;
    warehouse_name: string;
  };
  financial_data?: {
    products: Array<{
      commission_amount: number;
      commission_percent: number;
      payout: number;
      product_id: number;
      old_price: number;
      price: number;
      total_discount_value: number;
      total_discount_percent: number;
      actions: string[];
      quantity: number;
    }>;
  };
}

export interface OzonFbsListResponse {
  result: {
    postings: OzonFbsPosting[];
    has_next: boolean;
  };
}

// ===== /v1/analytics/data =====
export interface OzonAnalyticsRequest {
  date_from: string;  // "2024-01-01"
  date_to: string;
  metrics: string[];  // e.g. ["revenue", "ordered_units", "hits_view_pdp"]
  dimension: string[];  // e.g. ["day", "sku"]
  filters?: Array<{
    key: string;
    op: string;
    value: string;
  }>;
  sort?: Array<{
    key: string;
    order: 'ASC' | 'DESC';
  }>;
  limit?: number;
  offset?: number;
}

export interface OzonAnalyticsResponse {
  result: {
    data: Array<{
      dimensions: Array<{
        id: string;
        name: string;
      }>;
      metrics: number[];
    }>;
    totals: number[];
  };
  timestamp: string;
}
