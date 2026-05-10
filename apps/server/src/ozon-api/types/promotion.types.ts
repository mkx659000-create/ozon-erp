// ===== /v1/actions =====
export interface OzonActionListResponse {
  result: OzonAction[];
}

export interface OzonAction {
  id: number;
  title: string;
  date_start: string;
  date_end: string;
  potential_products_count: number;
  participating_products_count: number;
  is_participating: boolean;
  banned_products_count: number;
  with_targeting: boolean;
  order_amount: number;
  discount_type: string;
  discount_value: number;
  freeze_date: string;
}

// ===== /v1/actions/products =====
export interface OzonActionProductsRequest {
  action_id: number;
  limit: number;
  offset: number;
}

export interface OzonActionProductsResponse {
  result: {
    products: OzonActionProduct[];
    total: number;
  };
}

export interface OzonActionProduct {
  id: number;
  price: number;
  action_price: number;
  max_action_price: number;
  add_mode: string;
  min_stock: number;
  stock: number;
}

// ===== /v1/actions/products/activate =====
export interface OzonActivateProductsRequest {
  action_id: number;
  products: Array<{
    product_id: number;
    action_price: number;
    stock: number;
  }>;
}

export interface OzonActivateProductsResponse {
  result: {
    product_ids: number[];
    rejected: Array<{
      product_id: number;
      reason: string;
    }>;
  };
}

// ===== /v1/actions/products/deactivate =====
export interface OzonDeactivateProductsRequest {
  action_id: number;
  product_ids: number[];
}
