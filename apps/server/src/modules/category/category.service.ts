import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OzonCategoryApi } from '../../ozon-api/ozon-category.api';
import { OzonCategoryTreeNode } from '../../ozon-api/types/category.types';

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);

  constructor(
    private prisma: PrismaService,
    private ozonCategoryApi: OzonCategoryApi,
  ) {}

  /**
   * Get the category tree from local DB, optionally filtered by parentId.
   */
  async getTree(parentId?: number) {
    if (parentId !== undefined) {
      // Get children of a specific parent
      return this.prisma.category.findMany({
        where: { parentId },
        orderBy: { name: 'asc' },
      });
    }
    // Get root categories
    return this.prisma.category.findMany({
      where: { parentId: null },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get full nested tree (useful for cascading selector — limited depth).
   */
  async getFullTree() {
    const allCategories = await this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });

    // Build a nested tree structure
    const map = new Map<number, any>();
    const roots: any[] = [];

    for (const cat of allCategories) {
      map.set(cat.id, { ...cat, children: [] });
    }

    for (const cat of allCategories) {
      const node = map.get(cat.id)!;
      if (cat.parentId !== null && map.has(cat.parentId)) {
        map.get(cat.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  /**
   * Search categories by name (supports Chinese).
   */
  async search(keyword: string) {
    return this.prisma.category.findMany({
      where: {
        OR: [
          { name: { contains: keyword, mode: 'insensitive' } },
          { nameZh: { contains: keyword, mode: 'insensitive' } },
        ],
      },
      take: 50,
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get a single category by ID with its ancestors (breadcrumb).
   */
  async getWithAncestors(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });
    if (!category) throw new NotFoundException('分类不存在');

    // Walk up the tree to build ancestor path
    const ancestors: any[] = [];
    let current = category;
    while (current.parentId !== null) {
      const parent = await this.prisma.category.findUnique({
        where: { id: current.parentId },
      });
      if (!parent) break;
      ancestors.unshift(parent);
      current = parent;
    }

    return { category, ancestors };
  }

  /**
   * Sync category tree from Ozon API. Uses any store's credentials.
   */
  async syncFromOzon(storeAccountId: string) {
    const store = await this.prisma.storeAccount.findUnique({
      where: { id: storeAccountId },
    });
    if (!store) throw new NotFoundException('店铺不存在');

    const credentials = { clientId: store.ozonClientId, apiKey: store.ozonApiKey };

    this.logger.log('Starting category tree sync from Ozon');

    // Get tree in default language (Russian names)
    let treeDefault: OzonCategoryTreeNode[];
    try {
      treeDefault = await this.ozonCategoryApi.getCategoryTree(credentials, 'DEFAULT');
    } catch (error: any) {
      this.logger.error(`Failed to get category tree: ${error.message}`);
      // Try without language param
      try {
        treeDefault = await this.ozonCategoryApi.getCategoryTree(credentials, 'RU');
      } catch (retryError: any) {
        this.logger.error(`Category tree retry failed: ${retryError.message}`);
        throw new Error(`无法获取分类树: ${error.message}`);
      }
    }

    if (!treeDefault || treeDefault.length === 0) {
      this.logger.warn('Empty category tree from Ozon');
      return { synced: 0, message: '分类树为空' };
    }

    // Get tree in Chinese
    let treeZh: OzonCategoryTreeNode[] = [];
    try {
      treeZh = await this.ozonCategoryApi.getCategoryTree(credentials, 'ZH_HANS');
    } catch {
      this.logger.warn('Failed to get Chinese category names, using default only');
    }

    // Build Chinese name lookup map
    const zhNameMap = new Map<number, string>();
    this.flattenTreeNames(treeZh, zhNameMap);

    // Two-pass approach: first upsert all nodes without parentId,
    // then update parentId in a second pass. This avoids FK constraint violations.
    interface FlatNode {
      id: number;
      parentId: number | null;
      name: string;
      nameZh: string | null;
      level: number;
      hasChildren: boolean;
    }

    const flatNodes: FlatNode[] = [];
    const seenIds = new Set<number>();

    const collectNodes = (
      nodes: OzonCategoryTreeNode[],
      parentId: number | null,
      level: number,
    ) => {
      for (const node of nodes) {
        if (!seenIds.has(node.description_category_id)) {
          seenIds.add(node.description_category_id);
          flatNodes.push({
            id: node.description_category_id,
            parentId,
            name: node.category_name,
            nameZh: zhNameMap.get(node.description_category_id) || null,
            level,
            hasChildren: !!(node.children && node.children.length > 0),
          });
        }
        if (node.children && node.children.length > 0) {
          collectNodes(node.children, node.description_category_id, level + 1);
        }
      }
    };

    collectNodes(treeDefault, null, 0);

    this.logger.log(`Collected ${flatNodes.length} unique categories`);

    let count = 0;
    let failed = 0;
    const now = new Date();

    // Pass 1: Upsert all categories WITHOUT parentId (avoids FK errors)
    for (const node of flatNodes) {
      try {
        await this.prisma.category.upsert({
          where: { id: node.id },
          create: {
            id: node.id,
            parentId: null,
            name: node.name,
            nameZh: node.nameZh,
            level: node.level,
            hasChildren: node.hasChildren,
            lastSyncAt: now,
          },
          update: {
            name: node.name,
            nameZh: node.nameZh,
            level: node.level,
            hasChildren: node.hasChildren,
            lastSyncAt: now,
          },
        });
        count++;
      } catch (error: any) {
        this.logger.error(`Pass 1 failed for category ${node.id}: ${error.message}`);
        failed++;
      }
    }

    this.logger.log(`Pass 1 complete: ${count} created/updated`);

    // Pass 2: Set parentId for all categories (parents now exist)
    let parentUpdated = 0;
    for (const node of flatNodes) {
      if (node.parentId !== null && seenIds.has(node.parentId)) {
        try {
          await this.prisma.category.update({
            where: { id: node.id },
            data: { parentId: node.parentId },
          });
          parentUpdated++;
        } catch (error: any) {
          // Parent might not exist if it was skipped; log but don't count as failure
          this.logger.warn(`Pass 2: failed to set parent for ${node.id}: ${error.message}`);
        }
      }
    }

    this.logger.log(`Category sync complete: ${count} synced, ${failed} failed, ${parentUpdated} parents linked`);
    return { synced: count, failed, parentUpdated };
  }

  /**
   * Helper: flatten tree into a name map for Chinese name lookup.
   */
  private flattenTreeNames(
    nodes: OzonCategoryTreeNode[],
    map: Map<number, string>,
  ) {
    for (const node of nodes) {
      map.set(node.description_category_id, node.category_name);
      if (node.children) {
        this.flattenTreeNames(node.children, map);
      }
    }
  }
}
