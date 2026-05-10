import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProductPublishService } from './product-publish.service';
import { PublishProductDto } from './dto/publish-product.dto';

@Controller('product-publish')
@UseGuards(AuthGuard('jwt'))
export class ProductPublishController {
  constructor(private readonly publishService: ProductPublishService) {}

  /**
   * POST /product-publish — publish a product to Ozon.
   */
  @Post()
  publish(@Body() dto: PublishProductDto) {
    return this.publishService.publishProduct(dto);
  }

  /**
   * GET /product-publish/import-status — check import task status.
   */
  @Get('import-status')
  checkStatus(
    @Query('storeAccountId') storeAccountId: string,
    @Query('taskId') taskId: string,
  ) {
    return this.publishService.checkImportStatus(storeAccountId, Number(taskId));
  }

  /**
   * GET /product-publish/category-attributes — get attributes for a category.
   */
  @Get('category-attributes')
  getCategoryAttributes(
    @Query('storeAccountId') storeAccountId: string,
    @Query('categoryId') categoryId: string,
  ) {
    return this.publishService.getCategoryAttributes(
      storeAccountId,
      Number(categoryId),
    );
  }
}
