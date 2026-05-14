export type OzonReportType = 'products' | 'postings' | 'returns';

export interface OzonCreateReportRequest {
  report_type?: string;
  params?: Record<string, any>;
  // Products report
  offer_id?: string[];
  sku?: number[];
  visibility?: string;
  // Postings report
  filter?: {
    processed_at_from?: string;
    processed_at_to?: string;
    delivery_schema?: string[];
    status?: string[];
    sku?: number[];
    cancel_reason_id?: number[];
    offer_id?: string;
    status_alias?: string[];
    statuses?: string[];
    title?: string;
  };
  language?: string;
}

export interface OzonCreateReportResponse {
  result: {
    code: string;
  };
}

export interface OzonReportInfo {
  code: string;
  status: string; // 'waiting' | 'processing' | 'success' | 'failed'
  error: string;
  file: string; // download URL
  report_type: string;
  params: Record<string, any>;
  created_at: string;
}

export interface OzonReportListResponse {
  result: {
    reports: OzonReportInfo[];
    total: number;
  };
}

export interface OzonReportInfoResponse {
  result: OzonReportInfo;
}
