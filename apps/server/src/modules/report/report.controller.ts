import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReportService } from './report.service';

@Controller('reports')
@UseGuards(AuthGuard('jwt'))
export class ReportController {
  constructor(private reportService: ReportService) {}

  @Post('create')
  async createReport(
    @Body() body: { storeAccountId: string; reportType: string; filter?: Record<string, any> },
  ) {
    return this.reportService.createReport(body.storeAccountId, body.reportType, body.filter);
  }

  @Get('status')
  async getReportStatus(
    @Query('storeAccountId') storeAccountId: string,
    @Query('code') code: string,
  ) {
    return this.reportService.getReportStatus(storeAccountId, code);
  }

  @Post('wait')
  async waitForReport(
    @Body() body: { storeAccountId: string; code: string },
  ) {
    return this.reportService.waitForReport(body.storeAccountId, body.code);
  }

  @Get('list')
  async listReports(
    @Query('storeAccountId') storeAccountId: string,
    @Query('reportType') reportType?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.reportService.listReports(
      storeAccountId,
      reportType,
      page ? parseInt(page) : 1,
      pageSize ? parseInt(pageSize) : 20,
    );
  }
}
