/**
 * Category repository - Data access layer for categories
 */

import { prisma } from '@/src/infrastructure/database/prisma';
import { Category, CreateCategoryData, UpdateCategoryData } from '../types/category.types';
import { slugify } from '@/src/shared/utils/formatters';

export class CategoryRepository {
  async findById(id: string): Promise<Category | null> {
    return prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: {
          orderBy: { order: 'asc' },
        },
      },
    }) as unknown as Category | null;
  }

  async findBySlug(slug: string): Promise<Category | null> {
    return prisma.category.findUnique({
      where: { slug },
      include: {
        parent: true,
        children: {
          orderBy: { order: 'asc' },
        },
      },
    }) as unknown as Category | null;
  }

  async findMany(includeInactive: boolean = false, onlyNavCategories: boolean = false): Promise<Category[]> {
    const where: any = {};
    
    if (!includeInactive) {
      where.isActive = true;
    }
    
    if (onlyNavCategories) {
      where.showInNav = true;
    }
    
    // Build children where clause
    const childrenWhere: any = {};
    if (onlyNavCategories) {
      childrenWhere.showInNav = true;
      if (!includeInactive) {
        childrenWhere.isActive = true;
      }
    } else if (!includeInactive) {
      childrenWhere.isActive = true;
    }
    
    const categories = await prisma.category.findMany({
      where: Object.keys(where).length > 0 ? where : {},
      include: {
        parent: true,
        children: {
          where: Object.keys(childrenWhere).length > 0 ? childrenWhere : {},
          orderBy: { order: 'asc' },
        },
      },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    }) as unknown as Category[];
    
    // Recursively filter children if onlyNavCategories is true
    if (onlyNavCategories) {
      return this.filterNavCategories(categories);
    }
    
    return categories;
  }
  
  /**
   * Recursively filter categories to only include those with showInNav = true
   */
  private filterNavCategories(categories: Category[]): Category[] {
    return categories
      .filter(cat => cat.showInNav)
      .map(cat => ({
        ...cat,
        children: cat.children ? this.filterNavCategories(cat.children) : undefined,
      }));
  }

  async findRootCategories(includeInactive: boolean = false, onlyNavCategories: boolean = false): Promise<Category[]> {
    const where: any = {
      parentId: null,
    };
    
    if (!includeInactive) {
      where.isActive = true;
    }
    
    if (onlyNavCategories) {
      where.showInNav = true;
    }
    
    // Build children where clause
    const childrenWhere: any = {};
    if (onlyNavCategories) {
      childrenWhere.showInNav = true;
      if (!includeInactive) {
        childrenWhere.isActive = true;
      }
    } else if (!includeInactive) {
      childrenWhere.isActive = true;
    }
    
    // Order by navOrder if filtering by nav, otherwise by order
    const orderBy: any = onlyNavCategories 
      ? [{ navOrder: 'asc' as const }, { order: 'asc' as const }, { name: 'asc' as const }]
      : [{ order: 'asc' as const }, { name: 'asc' as const }];
    
    const rootCategories = await prisma.category.findMany({
      where,
      include: {
        children: {
          where: Object.keys(childrenWhere).length > 0 ? childrenWhere : {},
          orderBy: { order: 'asc' },
        },
      },
      orderBy,
    }) as unknown as Category[];
    
    // Only filter recursively if explicitly requesting nav-only categories
    if (onlyNavCategories) {
      return this.filterNavCategories(rootCategories);
    }
    
    return rootCategories;
  }

  async create(data: CreateCategoryData): Promise<Category> {
    const slug = data.slug || slugify(data.name);
    
    // Check if slug already exists
    const existing = await prisma.category.findUnique({
      where: { slug },
    });
    
    if (existing) {
      throw new Error('Category with this slug already exists');
    }

    return prisma.category.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        image: data.image,
        parentId: data.parentId || null,
        order: data.order || 0,
        isActive: data.isActive !== undefined ? data.isActive : true,
        showInNav: data.showInNav !== undefined ? data.showInNav : false,
        navOrder: data.navOrder ?? 0,
      },
      include: {
        parent: true,
        children: true,
      },
    }) as unknown as Category;
  }

  async update(id: string, data: UpdateCategoryData): Promise<Category> {
    const category = await this.findById(id);
    if (!category) {
      throw new Error('Category not found');
    }

    // If slug is being updated, check uniqueness
    if (data.slug && data.slug !== category.slug) {
      const existing = await prisma.category.findUnique({
        where: { slug: data.slug },
      });
      if (existing && existing.id !== id) {
        throw new Error('Category with this slug already exists');
      }
    }

    // Prevent circular references
    if (data.parentId && data.parentId === id) {
      throw new Error('Category cannot be its own parent');
    }

    // Check if parent would create a circular reference
    if (data.parentId) {
      const parent = await this.findById(data.parentId);
      if (parent?.parentId === id) {
        throw new Error('Cannot create circular reference');
      }
    }

    return prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        image: data.image,
        parentId: data.parentId !== undefined ? data.parentId : undefined,
        order: data.order,
        isActive: data.isActive,
        showInNav: data.showInNav,
        navOrder: data.navOrder,
      },
      include: {
        parent: true,
        children: true,
      },
    }) as unknown as Category;
  }

  async delete(id: string): Promise<void> {
    const category = await this.findById(id);
    if (!category) {
      throw new Error('Category not found');
    }

    // Check if category has children
    if (category.children && category.children.length > 0) {
      throw new Error('Cannot delete category with subcategories');
    }

    // Check if category has products
    const productCount = await prisma.product.count({
      where: { category: { contains: category.slug } },
    });

    if (productCount > 0) {
      throw new Error('Cannot delete category with associated products');
    }

    await prisma.category.delete({
      where: { id },
    });
  }

  async getCategoryTree(includeInactive: boolean = false, onlyNavCategories: boolean = false): Promise<Category[]> {
    const rootCategories = await this.findRootCategories(includeInactive, onlyNavCategories);
    return rootCategories;
  }
}

