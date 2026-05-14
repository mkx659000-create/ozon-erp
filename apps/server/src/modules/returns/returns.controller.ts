import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReturnsService } from './returns.service';
import { QueryReturnsDto } from './dto/query-returns.dto';

@Controller('returns')
@UseGuards(AuthGuard('jwt'))
export class ReturnsController {
  constructor(private returnsService: ReturnsService) {}

  @Get()
  async findAll(@Query() query: QueryReturnsDto) {
    return this.returnsService.findReturns(query);
  }

  @Get('stats')
  async getStats(@Query('storeAccountId') storeAccountId: string) {
    return this.returnsService.getReturnStats(storeAccountId);
  }

  @Post('sync')
  async sync(@Body('storeAccountId') storeAccountId: string) {
    return this.returnsService.syncReturns(storeAccountId);
  }
}
