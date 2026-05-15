import request from '../request';

export interface DashboardOverview {
  products: { total: number; onSale: number };
  promotions: { total: number; joined: number };
  orders: { total: number; pending: number };
  returns: { total: number };
  warehouses: { total: number };
  lastSync: {
    syncType: string;
    status: string;
    completedAt: string | null;
  } | null;
  recentSyncLogs: Array<{
    id: string;
    syncType: string;
    status: string;
    itemsProcessed: number | null;
    itemsFailed: number | null;
    startedAt: string;
    completedAt: string | null;
  }>;
}

export function getDashboardOverviewApi(storeAccountId?: string) {
  return request.get<any, DashboardOverview>('/dashboard/overview', {
    params: storeAccountId ? { storeAccountId } : {},
  });
}
