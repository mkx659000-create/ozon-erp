// ===== /v3/product/list =====
export interface OzonProductListRequest {
  filter?: {
    offer_id?: string[];
    product_id?: number[];
    visibility?: 'ALL' | 'VISIBLE' | 'INVISIBLE' | 'EMPTY_STOCK' | 'NOT_MODERATED' | 'MODERATED' | 'DISABLED' | 'STATE_FAILED' | 'READY_TO_SUPPLY' | 'FBYPLUS_ONLY';
  };
  last_id?: string;
  limit?: number;
}

export interface OzonProductListResponse {
  result: {
    items: Array<{
      product_id: number;
      offer_id: string;
    }>;
    total: number;
    last_id: string;
  };
}

// ===== /v3/product/info/list =====
export interface OzonProductInfoListRequest {
  offer_id?: string[];
  product_id?: number[];
  sku?: number[];
}

export interface OzonProductInfo {
  id: number;
  name: string;
  offer_id: string;
  barcode: string;
  barcodes: string[];
  buybox_price: string;
  category_id: number;
  created_at: string;
  images: string[];
  marketing_price: string;
  min_ozon_price: string;
  old_price: string;
  premium_price: string;
  price: string;
  recommended_price: string;
  min_price: string;
  sources: Array<{ source: string; sku: number }>;
  stocks: {
    coming: number;
    present: number;
    reserved: number;
  };
  errors: any[];
  vat: string;
  visible: boolean;
  visibility_details: {
    has_price: boolean;
    has_stock: boolean;
    active_product: boolean;
  };
  price_index: string;
  images270x270: string[];
  color_image: string;
  primary_image: string;
  status: {
    state: string;
    state_failed: string;
    moderate_status: string;
    decline_reasons: string[];
    validation_state: string;
    state_name: string;
    state_description: string;
    is_failed: boolean;
    is_created: boolean;
    state_tooltip: string;
    item_errors: any[];
    state_updated_at: string;
  };
  state: string;
  service_type: string;
  fbo_sku: number;
  fbs_sku: number;
  currency_code: string;
  is_prepayment: boolean;
  is_prepayment_allowed: boolean;
  sku: number;
  description_category_id: number;
  type_id: number;
  is_kgt: boolean;
  rating: number;
  updated_at: string;
}

export interface OzonProductInfoListResponse {
  items: OzonProductInfo[];
}

// ===== /v1/product/import/prices =====
export interface OzonPriceUpdateItem {
  auto_action_enabled?: string;
  currency_code?: string;
  min_price?: string;
  offer_id?: string;
  old_price?: string;
  price?: string;
  product_id?: number;
}

export interface OzonPriceUpdateRequest {
  prices: OzonPriceUpdateItem[];
}

export interface OzonPriceUpdateResponse {
  result: Array<{
    product_id: number;
    offer_id: string;
    updated: boolean;
    errors: any[];
  }>;
}

// ===== /v2/products/stocks =====
export interface OzonStockUpdateItem {
  offer_id?: string;
  product_id?: number;
  stock: number;
  warehouse_id: number;
}

export interface OzonStockUpdateRequest {
  stocks: OzonStockUpdateItem[];
}

export interface OzonStockUpdateResponse {
  result: Array<{
    product_id: number;
    offer_id: string;
    updated: boolean;
    errors: any[];
  }>;
}

// ===== /v4/product/info/stocks =====
// Real API returns items/total/cursor at top level (not nested in result)
export interface OzonStockInfoRequest {
  filter?: {
    offer_id?: string[];
    product_id?: number[];
    visibility?: string;
  };
  cursor?: string;
  limit?: number;
}

export interface OzonStockInfoResponse {
  items: Array<{
    product_id: number;
    offer_id: string;
    stocks: Array<{
      present: number;
      reserved: number;
      type: string;
      sku: number;
      shipment_type: string;
      warehouse_ids: number[];
    }>;
  }>;
  cursor: string;
  total: number;
}
