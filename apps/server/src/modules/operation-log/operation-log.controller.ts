import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OperationLogService } from './operation-log.service';

@Controller('operation-logs')
@UseGuards(AuthGuard('jwt'))
export class OperationLogController {
  constructor(private readonly logService: OperationLogService) {}

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('targetType') targetType?: string,
  ) {
    return this.logService.findAll({
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
      userId,
      action,
      targetType,
    });
  }
}
