import { Controller, Get, Post, Query, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CategoryService } from './category.service';

@Controller('categories')
@UseGuards(AuthGuard('jwt'))
export class CategoryController {
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
  sync(@Body('storeAccountId') storeAccountId: string) {
    return this.categoryService.syncFromOzon(storeAccountId);
  }
}
