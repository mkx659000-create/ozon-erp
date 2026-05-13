import { Controller, Get, Post, Query, Param, Body, UseGuards, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CategoryService } from './category.service';

@Controller('categories')
@UseGuards(AuthGuard('jwt'))
export class CategoryController {
  private readonly logger = new Logger(CategoryController.name);

  constructor(private readonly categoryService: CategoryService) {}

  /**
   * GET /categories/tree — get category tree (lazy load by parentId).
   */
  @Get('tree')
  getTree(@Query('parentId') parentId?: string) {
    return this.categoryService.getTree(
      parentId !== undefined ? Number(parentId) : undefined,
    );
  }

  /**
   * GET /categories/full-tree — get full nested tree (for cascading selector).
   */
  @Get('full-tree')
  getFullTree() {
    return this.categoryService.getFullTree();
  }

  /**
   * GET /categories/search — search categories by name.
   */
  @Get('search')
  search(@Query('keyword') keyword: string) {
    return this.categoryService.search(keyword || '');
  }

  /**
   * GET /categories/:id — get category with ancestor breadcrumb.
   */
  @Get(':id')
  getWithAncestors(@Param('id') id: string) {
    return this.categoryService.getWithAncestors(Number(id));
  }

  /**
   * POST /categories/sync — sync category tree from Ozon.
   */
  @Post('sync')
  async sync(@Body('storeAccountId') storeAccountId: string) {
    try {
      return await this.categoryService.syncFromOzon(storeAccountId);
    } catch (error: any) {
      this.logger.error(`Category sync error: ${error.message}`, error.stack);
      return { synced: 0, error: error.message || '分类同步失败' };
    }
  }
}
