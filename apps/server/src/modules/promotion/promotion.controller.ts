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

  /**
   * GET /promotions — list promotion products with filters + pagination.
   */
  @Get()
  findAll(@Query() query: QueryPromotionDto) {
    return this.promotionService.findPromotionProducts(query);
  }

  /**
   * GET /promotions/status-counts — participation status counts.
   */
  @Get('status-counts')
  getStatusCounts(@Query('storeAccountId') storeAccountId?: string) {
    return this.promotionService.getStatusCounts(storeAccountId);
  }

  /**
   * GET /promotions/:id/products — products for the edit-activity modal.
   */
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

  /**
   * POST /promotions/sync — sync promotions from Ozon API.
   */
  @Post('sync')
  async sync(@Body() dto: SyncPromotionDto) {
    try {
      return await this.promotionService.syncFromOzon(dto.storeAccountId);
    } catch (error: any) {
      this.logger.error(`Promotion sync controller error: ${error.message}`, error.stack);
      return { synced: 0, failed: 0, error: error.message || '同步失败' };
    }
  }

  /**
   * POST /promotions/:id/join — join products to a promotion.
   */
  @Post(':id/join')
  joinPromotion(@Param('id') id: string, @Body() dto: JoinPromotionDto) {
    return this.promotionService.joinPromotion(id, dto);
  }

  /**
   * POST /promotions/:id/exit — exit products from a promotion.
   */
  @Post(':id/exit')
  exitPromotion(@Param('id') id: string, @Body() dto: ExitPromotionDto) {
    return this.promotionService.exitPromotion(id, dto);
  }

  /**
   * PATCH /promotions/:id/products — batch edit promo prices/discount/stock.
   */
  @Patch(':id/products')
  batchEditProducts(
    @Param('id') _id: string,
    @Body() dto: BatchEditActivityDto,
  ) {
    return this.promotionService.batchEditProducts(dto);
  }
}
