import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PromotionService } from './promotion.service';
import { QueryPromotionDto } from './dto/query-promotion.dto';
import {
  BatchEditActivityDto,
  JoinPromotionDto,
  ExitPromotionDto,
  SyncPromotionDto,
} from './dto/edit-activity.dto';

@Controller('promotions')
@UseGuards(AuthGuard('jwt'))
export class PromotionController {
  private readonly logger = new Logger(PromotionController.name);

  constructor(private readonly promotionService: PromotionService) {}

  @Get()
  findAll(@Query() query: QueryPromotionDto) {
    return this.promotionService.findPromotionProducts(query);
  }

  @Get('status-counts')
  getStatusCounts(@Query('storeAccountId') storeAccountId?: string) {
    return this.promotionService.getStatusCounts(storeAccountId);
  }

  @Get('activities')
  findActivities(
    @Query('storeAccountId') storeAccountId?: string,
    @Query('status') status?: string,
  ) {
    return this.promotionService.findActivities(storeAccountId, status);
  }

  @Get('activities/:id')
  findActivityById(@Param('id') id: string) {
    return this.promotionService.findActivityById(id);
  }

  @Get('activities/:id/candidates')
  getCandidateProducts(
    @Param('id') id: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.promotionService.getCandidateProducts(id, keyword);
  }

  @Get(':id/products')
  getEditActivityProducts(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('productId') productId?: string,
  ) {
    return this.promotionService.getEditActivityProducts(
      id,
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 100,
      productId,
    );
  }

  @Post('sync')
  async sync(@Body() dto: SyncPromotionDto) {
    try {
      return await this.promotionService.syncFromOzon(dto.storeAccountId);
    } catch (error: any) {
      this.logger.error(`Promotion sync controller error: ${error.message}`, error.stack);
      return { synced: 0, failed: 0, error: error.message || '同步失败' };
    }
  }

  @Post(':id/join')
  joinPromotion(@Param('id') id: string, @Body() dto: JoinPromotionDto) {
    return this.promotionService.joinPromotion(id, dto);
  }

  @Post(':id/exit')
  exitPromotion(@Param('id') id: string, @Body() dto: ExitPromotionDto) {
    return this.promotionService.exitPromotion(id, dto);
  }

  @Patch(':id/products')
  batchEditProducts(
    @Param('id') _id: string,
    @Body() dto: BatchEditActivityDto,
  ) {
    return this.promotionService.batchEditProducts(dto);
  }
}
