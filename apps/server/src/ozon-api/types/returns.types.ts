export interface OzonReturnItem {
  return_id: number;
  order_id: number;
  posting_number: string;
  status: string;
  return_reason_name: string;
  sku: number;
  product_name: string;
  quantity: number;
  return_amount: number;
  commission_amount: number;
  is_opened: boolean;
  place_id: number;
  moving_to_place_name: string;
  accepted_from_customer_moment?: string;
  returned_to_ozon_moment?: string;
  last_free_waiting_day?: string;
}

export interface OzonFboReturnsResponse {
  returns: OzonReturnItem[];
  last_id: number;
}

export interface OzonRfbsReturnItem {
  id: number;
  clearing_id: number;
  posting_number: string;
  status: string;
  return_reason_name: string;
  sku: number;
  product_name: string;
  quantity: number;
  price: number;
  commission: number;
  is_opened: boolean;
  created_at: string;
  approved_at?: string;
}

export interface OzonRfbsReturnsResponse {
  returns: OzonRfbsReturnItem[];
  last_id: number;
}

export interface OzonFboPosting {
  posting_number: string;
  order_id: number;
  order_number: string;
  status: string;
  in_process_at: string;
  created_at: string;
  analytics_data?: {
    region: string;
    city: string;
    delivery_type: string;
    warehouse_name: string;
  };
  financial_data?: {
    products: Array<{
      commission_amount: number;
      payout: number;
      product_id: number;
      old_price: number;
      price: number;
      total_discount_value: number;
      total_discount_percent: number;
      quantity: number;
    }>;
  };
  products: Array<{
    sku: number;
    name: string;
    quantity: number;
    offer_id: string;
    price: string;
  }>;
}

export interface OzonFboListResponse {
  result: {
    postings: OzonFboPosting[];
    has_next: boolean;
  };
}
