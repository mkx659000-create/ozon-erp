import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProductService } from './product.service';
import { QueryProductDto } from './dto/query-product.dto';
import { UpdateProductDto, BatchUpdateProductDto, SyncProductDto } from './dto/update-product.dto';

@Controller('products')
@UseGuards(AuthGuard('jwt'))
export class ProductController {
  private readonly logger = new Logger(ProductController.name);

  constructor(private productService: ProductService) {}

  @Get()
  findAll(@Query() query: QueryProductDto) {
    return this.productService.findAll(query);
  }

  @Get('status-counts')
  getStatusCounts(@Query('storeAccountId') storeAccountId?: string) {
    return this.productService.getStatusCounts(storeAccountId);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.productService.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productService.update(id, dto);
  }

  @Post('batch-update')
  batchUpdate(@Body() dto: BatchUpdateProductDto) {
    return this.productService.batchUpdate(dto);
  }

  @Post('sync')
  async sync(@Body() dto: SyncProductDto) {
    try {
      return await this.productService.syncFromOzon(dto.storeAccountId);
    } catch (error: any) {
      this.logger.error(`Product sync controller error: ${error.message}`, error.stack);
      return { synced: 0, failed: 0, error: error.message || '同步失败' };
    }
  }
}
