import request from '../request';

export interface Warehouse {
  id: string;
  storeAccountId: string;
  ozonWarehouseId: string;
  name: string;
  isRfbs: boolean;
  status: string;
}

export function getWarehousesApi(storeAccountId: string) {
  return request.get<any, Warehouse[]>('/warehouses', { params: { storeAccountId } });
}

export function syncWarehousesApi(storeAccountId: string) {
  return request.post<any, { synced: number; failed: number }>('/warehouses/sync', { storeAccountId });
}
