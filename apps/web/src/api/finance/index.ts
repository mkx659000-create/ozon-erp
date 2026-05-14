import request from '../request';

export interface FinanceTransaction {
  id: string;
  storeAccountId: string;
  operationId: string;
  operationType: string;
  operationDate: string;
  postingNumber: string | null;
  amount: number;
  commissionAmount: number | null;
  deliveryCharge: number | null;
  accruals: number | null;
  ozonSku: string | null;
  productName: string | null;
  createdAt: string;
}

export interface FinanceSummary {
  id: string;
  storeAccountId: string;
  date: string;
  totalSales: number;
  totalCommissions: number;
  totalDelivery: number;
  totalReturns: number;
  totalPayout: number;
  transactionCount: number;
}

export interface TransactionQuery {
  page?: number;
  pageSize?: number;
  storeAccountId: string;
  dateFrom?: string;
  dateTo?: string;
  operationType?: string;
  postingNumber?: string;
  sortField?: string;
  sortOrder?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SummaryResponse {
  daily: FinanceSummary[];
  totals: {
    totalSales: number;
    totalCommissions: number;
    totalDelivery: number;
    totalReturns: number;
    totalPayout: number;
    transactionCount: number;
  };
}

export interface ProfitItem {
  ozonSku: string;
  productName: string;
  revenue: number;
  commission: number;
  delivery: number;
  costPrice: number;
  profit: number;
  margin: number;
  transactionCount: number;
}

export function getTransactionsApi(params: TransactionQuery) {
  return request.get<any, PaginatedResult<FinanceTransaction>>('/finance/transactions', { params });
}

export function getSummaryApi(params: { storeAccountId: string; dateFrom?: string; dateTo?: string }) {
  return request.get<any, SummaryResponse>('/finance/summary', { params });
}

export function getProfitAnalysisApi(params: { storeAccountId: string; dateFrom: string; dateTo: string }) {
  return request.get<any, ProfitItem[]>('/finance/profit-analysis', { params });
}

export function syncFinanceApi(storeAccountId: string, dateFrom?: string, dateTo?: string) {
  return request.post<any, { synced: number; failed: number }>('/finance/sync', {
    storeAccountId,
    dateFrom,
    dateTo,
  });
}
