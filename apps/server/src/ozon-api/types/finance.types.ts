// ===== /v3/finance/transaction/list =====
export interface OzonTransactionListRequest {
  filter: {
    date: {
      from: string; // ISO date "2024-01-01T00:00:00.000Z"
      to: string;
    };
    operation_type?: string[];
    posting_number?: string;
    transaction_type?: string; // "all" | "orders" | "returns" | "services" | "other"
  };
  page: number;
  page_size: number; // max 1000
}

export interface OzonTransactionOperation {
  operation_id: number;
  operation_type: string;
  operation_date: string;
  operation_type_name: string;
  delivery_charge: number;
  return_delivery_charge: number;
  accruals_for_sale: number;
  sale_commission: number;
  amount: number;
  type: string;
  posting: {
    posting_number: string;
  };
  items: Array<{
    name: string;
    sku: number;
  }>;
  services: Array<{
    name: string;
    price: number;
  }>;
}

export interface OzonTransactionListResponse {
  result: {
    operations: OzonTransactionOperation[];
    page_count: number;
    row_count: number;
  };
}

// ===== /v3/finance/transaction/totals =====
export interface OzonTransactionTotalsRequest {
  date: {
    from: string;
    to: string;
  };
  posting_number?: string;
  transaction_type?: string;
}

export interface OzonTransactionTotalsResponse {
  result: {
    accruals_for_sale: number;
    sale_commission: number;
    processing_and_delivery: number;
    return_amount: number;
    compensation_amount: number;
    others_amount: number;
  };
}

// ===== /v2/finance/realization =====
export interface OzonRealizationRequest {
  date: string; // "YYYY-MM" format
}

export interface OzonRealizationRow {
  row_number: number;
  product_id: number;
  product_name: string;
  offer_id: string;
  barcode: string;
  sku: number;
  quantity: number;
  commission_percent: number;
  price: number;
  price_sale: number;
  sale_commission: number;
  sale_amount: number;
  sale_discount: number;
  sale_price_seller: number;
  delivery_commission: number;
  return_commission: number;
  return_amount: number;
  return_quantity: number;
}

export interface OzonRealizationResponse {
  result: {
    header: {
      doc_date: string;
      num: string;
      start_date: string;
      stop_date: string;
    };
    rows: OzonRealizationRow[];
  };
}

// ===== /v1/finance/cash-flow-statement/list =====
export interface OzonCashFlowRequest {
  date: {
    from: string;
    to: string;
  };
  page: number;
  page_size: number;
}

export interface OzonCashFlowItem {
  period: {
    begin: string;
    end: string;
  };
  orders_amount: number;
  returns_amount: number;
  commission_amount: number;
  services_amount: number;
  item_delivery_and_return_amount: number;
  compensation_amount: number;
  money_transfer: number;
}

export interface OzonCashFlowResponse {
  result: {
    cash_flows: OzonCashFlowItem[];
    page_count: number;
  };
}
