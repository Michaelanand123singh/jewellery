/**
 * Category service - Business logic for category management
 */

import { CategoryRepository } from '../repositories/category.repository';
import { Category, CreateCategoryData, UpdateCategoryData } from '../types/category.types';
import { NotFoundError } from '@/src/shared/utils/errors';

export class CategoryService {
  private categoryRepository: CategoryRepository;

  constructor() {
    this.categoryRepository = new CategoryRepository();
  }

  async getCategoryById(id: string): Promise<Category> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError('Category');
    }
    return {
      ...category,
      image: category.image ? this.transformImageUrl(category.image) : category.image,
    };
  }

  async getCategoryBySlug(slug: string): Promise<Category> {
    const category = await this.categoryRepository.findBySlug(slug);
    if (!category) {
      throw new NotFoundError('Category');
    }
    return {
      ...category,
      image: category.image ? this.transformImageUrl(category.image) : category.image,
    };
  }

  async getAllCategories(includeInactive: boolean = false, onlyNavCategories: boolean = false): Promise<Category[]> {
    const categories = await this.categoryRepository.findMany(includeInactive, onlyNavCategories);
    return categories.map(cat => ({
      ...cat,
      image: cat.image ? this.transformImageUrl(cat.image) : cat.image,
    }));
  }

  async getRootCategories(includeInactive: boolean = false, onlyNavCategories: boolean = false): Promise<Category[]> {
    const categories = await this.categoryRepository.findRootCategories(includeInactive, onlyNavCategories);
    return this.transformCategoryTree(categories);
  }

  async getCategoryTree(includeInactive: boolean = false, onlyNavCategories: boolean = false): Promise<Category[]> {
    const categories = await this.categoryRepository.getCategoryTree(includeInactive, onlyNavCategories);
    return this.transformCategoryTree(categories);
  }

  /**
   * Transform image URLs in category tree recursively
   */
  private transformCategoryTree(categories: Category[]): Category[] {
    return categories.map(category => ({
      ...category,
      image: category.image ? this.transformImageUrl(category.image) : category.image,
      children: category.children ? this.transformCategoryTree(category.children) : category.children,
    }));
  }

  /**
   * Transform image URL to use proxy for frontend access
   */
  transformImageUrl(url: string): string {
    if (!url) return url;
    
    // Check if it's a MinIO URL
    const config = {
      publicUrl: process.env.MINIO_PUBLIC_URL || 'http://localhost:9000',
      bucketName: process.env.MINIO_BUCKET_NAME || 'products',
    };
    
    if (url.includes(config.publicUrl) || url.includes('/' + config.bucketName + '/')) {
      // Import dynamically to avoid circular dependencies
      const { getProxyUrl } = require('@/lib/storage');
      return getProxyUrl(url);
    }
    
    // For relative paths starting with /, assume they're already proxy URLs or public paths
    if (url.startsWith('/')) {
      return url;
    }
    
    // For external URLs (http/https), return as-is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // For storage keys without URL, convert to proxy URL
    const { getProxyUrl } = require('@/lib/storage');
    return getProxyUrl(url);
  }

  async createCategory(data: CreateCategoryData): Promise<Category> {
    const category = await this.categoryRepository.create(data);
    return {
      ...category,
      image: category.image ? this.transformImageUrl(category.image) : category.image,
    };
  }

  async updateCategory(id: string, data: UpdateCategoryData): Promise<Category> {
    await this.getCategoryById(id);
    const category = await this.categoryRepository.update(id, data);
    return {
      ...category,
      image: category.image ? this.transformImageUrl(category.image) : category.image,
    };
  }

  async deleteCategory(id: string): Promise<void> {
    await this.getCategoryById(id);
    await this.categoryRepository.delete(id);
  }
}

