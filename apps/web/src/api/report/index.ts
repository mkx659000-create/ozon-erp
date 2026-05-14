import request from '../request';

export interface ReportInfo {
  code: string;
  status: string;
  error: string;
  file: string;
  report_type: string;
  params: Record<string, any>;
  created_at: string;
}

export interface ReportListResult {
  reports: ReportInfo[];
  total: number;
}

export function createReportApi(storeAccountId: string, reportType: string, filter?: Record<string, any>) {
  return request.post<any, { code: string; reportType: string }>('/reports/create', {
    storeAccountId,
    reportType,
    filter,
  });
}

export function getReportStatusApi(storeAccountId: string, code: string) {
  return request.get<any, ReportInfo>('/reports/status', {
    params: { storeAccountId, code },
  });
}

export function waitForReportApi(storeAccountId: string, code: string) {
  return request.post<any, ReportInfo>('/reports/wait', {
    storeAccountId,
    code,
  });
}

export function listReportsApi(storeAccountId: string, reportType?: string, page = 1, pageSize = 20) {
  return request.get<any, ReportListResult>('/reports/list', {
    params: { storeAccountId, reportType, page, pageSize },
  });
}
