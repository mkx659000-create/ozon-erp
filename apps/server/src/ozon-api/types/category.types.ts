// ===== /v1/description-category/tree =====
export interface OzonCategoryTreeRequest {
  language?: string; // "DEFAULT", "RU", "EN", "ZH_HANS"
}

export interface OzonCategoryTreeNode {
  description_category_id: number;
  category_name: string;
  disabled: boolean;
  children: OzonCategoryTreeNode[];
}

export interface OzonCategoryTreeResponse {
  result: OzonCategoryTreeNode[];
}

// ===== /v1/description-category/attribute =====
export interface OzonCategoryAttributeRequest {
  description_category_id: number;
  language?: string;
  type_id: number;
}

export interface OzonCategoryAttribute {
  id: number;
  name: string;
  description: string;
  type: string;
  is_collection: boolean;
  is_required: boolean;
  group_id: number;
  group_name: string;
  dictionary_id: number;
  category_dependent: boolean;
}

export interface OzonCategoryAttributeResponse {
  result: OzonCategoryAttribute[];
}
