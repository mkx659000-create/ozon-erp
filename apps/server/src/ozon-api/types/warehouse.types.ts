export interface OzonWarehouse {
  warehouse_id: number;
  name: string;
  is_rfbs: boolean;
  status: string;
  first_mile_type?: string;
}

export interface OzonWarehouseListResponse {
  result: OzonWarehouse[];
}

export interface OzonDeliveryMethod {
  id: number;
  name: string;
  warehouse_id: number;
  company_id: number;
  status: string;
}

export interface OzonDeliveryMethodListResponse {
  result: OzonDeliveryMethod[];
}
