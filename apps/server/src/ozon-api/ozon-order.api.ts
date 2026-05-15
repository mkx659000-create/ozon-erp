import { Injectable, Logger } from '@nestjs/common';
import { OzonApiService, OzonCredentials } from './ozon-api.service';
import {
  OzonFbsListResponse,
  OzonFbsPosting,
  OzonAnalyticsResponse,
} from './types/order.types';

@Injectable()
export class OzonOrderApi {
  private readonly logger = new Logger(OzonOrderApi.name);

  constructor(private ozonApi: OzonApiService) {}

  /**
   * Get FBS postings list with pagination.
   * POST /v3/posting/fbs/list
   */
  async listFbsPostings(
    credentials: OzonCredentials,
    options: {
      since?: string;
      to?: string;
      status?: string;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<{ postings: OzonFbsPosting[]; hasNext: boolean }> {
    const client = this.ozonApi.createClient(credentials);
    const { since, to, status, limit = 100, offset = 0 } = options;

    const response = await client.post<OzonFbsListResponse>(
      '/v3/posting/fbs/list',
      {
        dir: 'DESC',
        filter: {
          ...(since && { since }),
          ...(to && { to }),
          ...(status && { status }),
        },
        limit,
        offset,
        with: {
          analytics_data: true,
          financial_data: true,
        },
      },
    );

    return {
      postings: response.data.result.postings,
      hasNext: response.data.result.has_next,
    };
  }

  /**
   * Get all FBS postings since a given date (handles pagination).
   */
  async listAllFbsPostingsSince(
    credentials: OzonCredentials,
    since: string,
    to?: string,
  ): Promise<OzonFbsPosting[]> {
    const allPostings: OzonFbsPosting[] = [];
    let offset = 0;
    const limit = 100;
    let hasNext = true;

    while (hasNext) {
      const result = await this.listFbsPostings(credentials, {
        since,
        to,
        limit,
        offset,
      });
      allPostings.push(...result.postings);
      hasNext = result.hasNext;
      offset += limit;
    }

    return allPostings;
  }

  /**
   * Get FBO postings list with pagination.
   * POST /v2/posting/fbo/list
   */
  async listFboPostings(
    credentials: OzonCredentials,
    options: {
      since?: string;
      to?: string;
      status?: string;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<{ postings: OzonFbsPosting[]; hasNext: boolean }> {
    const client = this.ozonApi.createClient(credentials);
    const { since, to, status, limit = 100, offset = 0 } = options;

    const response = await client.post(
      '/v2/posting/fbo/list',
      {
        dir: 'DESC',
        filter: {
          ...(since && { since }),
          ...(to && { to }),
          ...(status && { status }),
        },
        limit,
        offset,
        with: {
          analytics_data: true,
          financial_data: true,
        },
      },
    );

    return {
      postings: response.data.result || [],
      hasNext: response.data.result?.length >= limit,
    };
  }

  /**
   * Get all FBO postings since a given date (handles pagination).
   */
  async listAllFboPostingsSince(
    credentials: OzonCredentials,
    since: string,
    to?: string,
  ): Promise<OzonFbsPosting[]> {
    const allPostings: OzonFbsPosting[] = [];
    let offset = 0;
    const limit = 100;
    let hasNext = true;

    while (hasNext) {
      const result = await this.listFboPostings(credentials, {
        since,
        to,
        limit,
        offset,
      });
      allPostings.push(...result.postings);
      hasNext = result.hasNext;
      offset += limit;
    }

    return allPostings;
  }

  /**
   * Get analytics data from Ozon.
   * POST /v1/analytics/data
   */
  async getAnalytics(
    credentials: OzonCredentials,
    dateFrom: string,
    dateTo: string,
    metrics: string[] = ['revenue', 'ordered_units'],
    dimensions: string[] = ['day'],
  ): Promise<OzonAnalyticsResponse['result']> {
    const client = this.ozonApi.createClient(credentials);
    const response = await client.post<OzonAnalyticsResponse>(
      '/v1/analytics/data',
      {
        date_from: dateFrom,
        date_to: dateTo,
        metrics,
        dimension: dimensions,
        limit: 1000,
        offset: 0,
      },
    );
    return response.data.result;
  }
}
