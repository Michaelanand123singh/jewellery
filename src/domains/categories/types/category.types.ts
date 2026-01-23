/**
 * Category domain types
 */

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  parentId?: string | null;
  parent?: Category | null;
  children?: Category[];
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCategoryData {
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  parentId?: string | null;
  order?: number;
  isActive?: boolean;
}

export interface UpdateCategoryData {
  name?: string;
  slug?: string;
  description?: string;
  image?: string;
  parentId?: string | null;
  order?: number;
  isActive?: boolean;
}

export interface CategoryTree extends Category {
  children?: CategoryTree[];
  productCount?: number;
}

