export interface OzonPricingStrategy {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface OzonPricingStrategyListResponse {
  result: {
    items: OzonPricingStrategy[];
    total: number;
  };
}

export interface OzonPricingStrategyInfoResponse {
  result: OzonPricingStrategy & {
    products_count: number;
    settings: Record<string, any>;
  };
}

export interface OzonCompetitor {
  product_id: number;
  competitor_name: string;
  competitor_price: number;
  competitor_url: string;
}

export interface OzonCompetitorListResponse {
  result: {
    items: OzonCompetitor[];
    total: number;
  };
}

export interface OzonProductPricingInfo {
  product_id: number;
  offer_id: string;
  price: {
    price: string;
    old_price: string;
    min_price: string;
    marketing_price: string;
    marketing_seller_price: string;
    currency_code: string;
  };
  commission: {
    percent: number;
    min_value: number;
    value: number;
    sale_schema: string;
    fbo_fulfillment_amount: number;
    fbs_direct_flow_trans_max_amount: number;
    fbs_direct_flow_trans_min_amount: number;
  };
  price_index: string;
  volume_weight: number;
}

export interface OzonProductPriceDetailsResponse {
  result: {
    items: OzonProductPricingInfo[];
  };
}
