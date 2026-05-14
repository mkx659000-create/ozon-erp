import request from '../request';

export interface PricingStrategy {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
  products_count?: number;
  settings?: Record<string, any>;
}

export interface Competitor {
  product_id: number;
  competitor_name: string;
  competitor_price: number;
  competitor_url: string;
}

export interface ProductPricingInfo {
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

export function listStrategiesApi(storeAccountId: string) {
  return request.get<any, { items: PricingStrategy[]; total: number }>('/pricing/strategies', {
    params: { storeAccountId },
  });
}

export function getStrategyInfoApi(storeAccountId: string, strategyId: string) {
  return request.get<any, PricingStrategy>('/pricing/strategy', {
    params: { storeAccountId, strategyId },
  });
}

export function createStrategyApi(storeAccountId: string, name: string, type: string, settings?: Record<string, any>) {
  return request.post('/pricing/strategy/create', { storeAccountId, name, type, settings });
}

export function addProductsToStrategyApi(storeAccountId: string, strategyId: string, productIds: number[]) {
  return request.post('/pricing/strategy/add-products', { storeAccountId, strategyId, productIds });
}

export function getCompetitorsApi(storeAccountId: string, productId: number) {
  return request.get<any, { items: Competitor[]; total: number }>('/pricing/competitors', {
    params: { storeAccountId, productId },
  });
}

export function getProductPriceDetailsApi(storeAccountId: string) {
  return request.get<any, ProductPricingInfo[]>('/pricing/price-details', {
    params: { storeAccountId },
  });
}
