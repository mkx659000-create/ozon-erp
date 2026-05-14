import { Injectable, Logger } from '@nestjs/common';
import { OzonApiService, OzonCredentials } from './ozon-api.service';
import {
  OzonReturnItem,
  OzonFboReturnsResponse,
  OzonRfbsReturnItem,
  OzonRfbsReturnsResponse,
  OzonFboPosting,
  OzonFboListResponse,
} from './types/returns.types';

@Injectable()
export class OzonReturnsApi {
  private readonly logger = new Logger(OzonReturnsApi.name);

  constructor(private ozonApi: OzonApiService) {}

  async listFboReturns(
    credentials: OzonCredentials,
    options: { lastId?: number; limit?: number } = {},
  ): Promise<OzonReturnItem[]> {
    const client = this.ozonApi.createClient(credentials);
    const allReturns: OzonReturnItem[] = [];
    let lastId = options.lastId || 0;
    const limit = options.limit || 500;

    while (true) {
      const { data } = await client.post<OzonFboReturnsResponse>(
        '/v3/returns/company/fbo',
        { last_id: lastId, limit },
      );

      allReturns.push(...data.returns);
      if (data.returns.length < limit) break;
      lastId = data.last_id;
    }

    return allReturns;
  }

  async listRfbsReturns(
    credentials: OzonCredentials,
    options: { lastId?: number; limit?: number } = {},
  ): Promise<OzonRfbsReturnItem[]> {
    const client = this.ozonApi.createClient(credentials);
    const allReturns: OzonRfbsReturnItem[] = [];
    let lastId = options.lastId || 0;
    const limit = options.limit || 500;

    while (true) {
      const { data } = await client.post<OzonRfbsReturnsResponse>(
        '/v2/returns/company/fbs',
        { last_id: lastId, limit },
      );

      allReturns.push(...data.returns);
      if (data.returns.length < limit) break;
      lastId = data.last_id;
    }

    return allReturns;
  }

  async listFboPostings(
    credentials: OzonCredentials,
    options: {
      since?: string;
      to?: string;
      status?: string;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<{ postings: OzonFboPosting[]; hasNext: boolean }> {
    const client = this.ozonApi.createClient(credentials);
    const { since, to, status, limit = 100, offset = 0 } = options;

    const { data } = await client.post<OzonFboListResponse>(
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
        with: { analytics_data: true, financial_data: true },
      },
    );

    return {
      postings: data.result.postings,
      hasNext: data.result.has_next,
    };
  }
}
