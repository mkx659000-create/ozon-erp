import request from '../request';

export interface StoreAccount {
  id: string;
  storeName: string;
  ozonClientId: string;
  status: string;
  lastSyncAt: string | null;
  syncEnabled: boolean;
  createdAt: string;
}

export interface CreateStoreAccountParams {
  storeName: string;
  ozonClientId: string;
  ozonApiKey: string;
}

export function getStoreAccountsApi(): Promise<StoreAccount[]> {
  return request.get('/store-accounts');
}

export function createStoreAccountApi(
  data: CreateStoreAccountParams,
): Promise<StoreAccount> {
  return request.post('/store-accounts', data);
}

export function updateStoreAccountApi(
  id: string,
  data: Partial<CreateStoreAccountParams>,
): Promise<StoreAccount> {
  return request.patch(`/store-accounts/${id}`, data);
}

export function deleteStoreAccountApi(id: string): Promise<void> {
  return request.delete(`/store-accounts/${id}`);
}

export function testConnectionApi(
  id: string,
): Promise<{ success: boolean; message: string }> {
  return request.post(`/store-accounts/${id}/test-connection`);
}
