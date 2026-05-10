import request from '../request';

export interface Category {
  id: number;
  parentId: number | null;
  name: string;
  nameZh: string | null;
  level: number;
  hasChildren: boolean;
  lastSyncAt: string | null;
  children?: Category[];
}

export interface CategoryWithAncestors {
  category: Category;
  ancestors: Category[];
}

/** Get category children (lazy load) */
export function getCategoryTreeApi(parentId?: number) {
  return request.get<any, Category[]>('/categories/tree', {
    params: parentId !== undefined ? { parentId } : {},
  });
}

/** Get full nested tree (for cascading selector) */
export function getFullCategoryTreeApi() {
  return request.get<any, Category[]>('/categories/full-tree');
}

/** Search categories */
export function searchCategoriesApi(keyword: string) {
  return request.get<any, Category[]>('/categories/search', {
    params: { keyword },
  });
}

/** Get category with ancestor breadcrumb */
export function getCategoryWithAncestorsApi(id: number) {
  return request.get<any, CategoryWithAncestors>(`/categories/${id}`);
}

/** Sync categories from Ozon */
export function syncCategoriesApi(storeAccountId: string) {
  return request.post<any, { synced: number }>('/categories/sync', {
    storeAccountId,
  });
}
