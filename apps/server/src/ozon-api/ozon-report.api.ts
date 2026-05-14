import { Injectable, Logger } from '@nestjs/common';
import { OzonApiService, OzonCredentials } from './ozon-api.service';
import {
  OzonCreateReportRequest,
  OzonCreateReportResponse,
  OzonReportListResponse,
  OzonReportInfoResponse,
  OzonReportInfo,
} from './types/report.types';

@Injectable()
export class OzonReportApi {
  private readonly logger = new Logger(OzonReportApi.name);

  constructor(private ozonApiService: OzonApiService) {}

  async createProductsReport(
    credentials: OzonCredentials,
    params?: { offer_id?: string[]; sku?: number[]; visibility?: string },
  ): Promise<string> {
    const client = this.ozonApiService.createClient(credentials);
    const body: OzonCreateReportRequest = {
      ...params,
      language: 'DEFAULT',
    };
    const { data } = await client.post<OzonCreateReportResponse>(
      '/v1/report/products/create',
      body,
    );
    return data.result.code;
  }

  async createPostingsReport(
    credentials: OzonCredentials,
    filter: OzonCreateReportRequest['filter'],
  ): Promise<string> {
    const client = this.ozonApiService.createClient(credentials);
    const { data } = await client.post<OzonCreateReportResponse>(
      '/v1/report/postings/create',
      { filter, language: 'DEFAULT' },
    );
    return data.result.code;
  }

  async createReturnsReport(
    credentials: OzonCredentials,
    filter?: { return_date_from?: string; return_date_to?: string },
  ): Promise<string> {
    const client = this.ozonApiService.createClient(credentials);
    const { data } = await client.post<OzonCreateReportResponse>(
      '/v2/report/returns/create',
      { filter },
    );
    return data.result.code;
  }

  async listReports(
    credentials: OzonCredentials,
    reportType?: string,
    page = 1,
    pageSize = 20,
  ): Promise<OzonReportListResponse['result']> {
    const client = this.ozonApiService.createClient(credentials);
    const body: any = {
      page,
      page_size: pageSize,
    };
    if (reportType) body.report_type = reportType;
    const { data } = await client.post<OzonReportListResponse>(
      '/v1/report/list',
      body,
    );
    return data.result;
  }

  async getReportInfo(
    credentials: OzonCredentials,
    code: string,
  ): Promise<OzonReportInfo> {
    const client = this.ozonApiService.createClient(credentials);
    const { data } = await client.post<OzonReportInfoResponse>(
      '/v1/report/info',
      { code },
    );
    return data.result;
  }

  async waitForReport(
    credentials: OzonCredentials,
    code: string,
    maxWaitMs = 120000,
    pollIntervalMs = 5000,
  ): Promise<OzonReportInfo> {
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
      const info = await this.getReportInfo(credentials, code);
      if (info.status === 'success' || info.status === 'failed') {
        return info;
      }
      await new Promise((r) => setTimeout(r, pollIntervalMs));
    }
    throw new Error(`Report ${code} timed out after ${maxWaitMs}ms`);
  }
}
