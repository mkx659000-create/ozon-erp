import request from '../request';

export interface SyncLog {
  id: string;
  storeAccountId: string;
  syncType: string;
  status: string;
  itemsProcessed: number | null;
  itemsFailed: number | null;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
}

export interface SyncStatusResponse {
  queues: {
    product: any[];
    stock: any[];
    promotion: any[];
  };
  recentLogs: SyncLog[];
}

/** Trigger manual product sync */
export function triggerProductSyncApi(storeAccountId: string) {
  return request.post<any, { jobId: string; message: string }>('/sync/product', {
    storeAccountId,
  });
}

/** Trigger manual promotion sync */
export function triggerPromotionSyncApi(storeAccountId: string) {
  return request.post<any, { jobId: string; message: string }>('/sync/promotion', {
    storeAccountId,
  });
}

/** Trigger manual stock sync */
export function triggerStockSyncApi(storeAccountId: string) {
  return request.post<any, { jobId: string; message: string }>('/sync/stock', {
    storeAccountId,
  });
}

/** Get sync status and recent logs */
export function getSyncStatusApi(storeAccountId: string) {
  return request.get<any, SyncStatusResponse>('/sync/status', {
    params: { storeAccountId },
  });
}

/** Refresh sync schedule */
export function refreshSyncScheduleApi() {
  return request.post<any, { message: string }>('/sync/refresh-schedule');
}
