import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OzonReportApi } from '../../ozon-api/ozon-report.api';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(
    private prisma: PrismaService,
    private ozonReportApi: OzonReportApi,
  ) {}

  private async getCredentials(storeAccountId: string) {
    const store = await this.prisma.storeAccount.findUniqueOrThrow({
      where: { id: storeAccountId },
    });
    return { clientId: store.ozonClientId, apiKey: store.ozonApiKey };
  }

  async createReport(
    storeAccountId: string,
    reportType: string,
    filter?: Record<string, any>,
  ) {
    const credentials = await this.getCredentials(storeAccountId);
    let code: string;

    switch (reportType) {
      case 'products':
        code = await this.ozonReportApi.createProductsReport(credentials, filter);
        break;
      case 'postings':
        code = await this.ozonReportApi.createPostingsReport(credentials, filter);
        break;
      case 'returns':
        code = await this.ozonReportApi.createReturnsReport(credentials, filter);
        break;
      default:
        throw new NotFoundException(`Unknown report type: ${reportType}`);
    }

    this.logger.log(`Created ${reportType} report: ${code}`);
    return { code, reportType };
  }

  async getReportStatus(storeAccountId: string, code: string) {
    const credentials = await this.getCredentials(storeAccountId);
    return this.ozonReportApi.getReportInfo(credentials, code);
  }

  async waitForReport(storeAccountId: string, code: string) {
    const credentials = await this.getCredentials(storeAccountId);
    return this.ozonReportApi.waitForReport(credentials, code);
  }

  async listReports(storeAccountId: string, reportType?: string, page = 1, pageSize = 20) {
    const credentials = await this.getCredentials(storeAccountId);
    return this.ozonReportApi.listReports(credentials, reportType, page, pageSize);
  }
}
