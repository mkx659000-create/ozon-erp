import { Injectable, Logger } from '@nestjs/common';
import { OzonApiService, OzonCredentials } from './ozon-api.service';
import {
  OzonTransactionListResponse,
  OzonTransactionOperation,
  OzonTransactionTotalsRequest,
  OzonTransactionTotalsResponse,
  OzonRealizationResponse,
  OzonRealizationRow,
  OzonCashFlowResponse,
  OzonCashFlowItem,
} from './types/finance.types';

@Injectable()
export class OzonFinanceApi {
  private readonly logger = new Logger(OzonFinanceApi.name);

  constructor(private ozonApi: OzonApiService) {}

  async listTransactions(
    credentials: OzonCredentials,
    dateFrom: string,
    dateTo: string,
    transactionType?: string,
  ): Promise<OzonTransactionOperation[]> {
    const client = this.ozonApi.createClient(credentials);
    const allOperations: OzonTransactionOperation[] = [];
    let page = 1;
    const pageSize = 1000;

    while (true) {
      const { data } = await client.post<OzonTransactionListResponse>(
        '/v3/finance/transaction/list',
        {
          filter: {
            date: { from: dateFrom, to: dateTo },
            ...(transactionType && { transaction_type: transactionType }),
          },
          page,
          page_size: pageSize,
        },
      );

      allOperations.push(...data.result.operations);
      this.logger.debug(
        `Fetched ${allOperations.length}/${data.result.row_count} transactions`,
      );

      if (page >= data.result.page_count) break;
      page++;
    }

    return allOperations;
  }

  async getTransactionTotals(
    credentials: OzonCredentials,
    dateFrom: string,
    dateTo: string,
    transactionType?: string,
  ): Promise<OzonTransactionTotalsResponse['result']> {
    const client = this.ozonApi.createClient(credentials);
    const { data } = await client.post<OzonTransactionTotalsResponse>(
      '/v3/finance/transaction/totals',
      {
        date: { from: dateFrom, to: dateTo },
        ...(transactionType && { transaction_type: transactionType }),
      },
    );
    return data.result;
  }

  async getRealizationReport(
    credentials: OzonCredentials,
    month: string, // "YYYY-MM"
  ): Promise<OzonRealizationRow[]> {
    const client = this.ozonApi.createClient(credentials);
    const { data } = await client.post<OzonRealizationResponse>(
      '/v2/finance/realization',
      { date: month },
    );
    return data.result.rows;
  }

  async getCashFlowStatements(
    credentials: OzonCredentials,
    dateFrom: string,
    dateTo: string,
  ): Promise<OzonCashFlowItem[]> {
    const client = this.ozonApi.createClient(credentials);
    const allItems: OzonCashFlowItem[] = [];
    let page = 1;
    const pageSize = 50;

    while (true) {
      const { data } = await client.post<OzonCashFlowResponse>(
        '/v1/finance/cash-flow-statement/list',
        {
          date: { from: dateFrom, to: dateTo },
          page,
          page_size: pageSize,
        },
      );

      allItems.push(...data.result.cash_flows);
      if (page >= data.result.page_count) break;
      page++;
    }

    return allItems;
  }
}
