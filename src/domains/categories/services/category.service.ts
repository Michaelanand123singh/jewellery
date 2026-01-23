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
    return category;
  }

  async getCategoryBySlug(slug: string): Promise<Category> {
    const category = await this.categoryRepository.findBySlug(slug);
    if (!category) {
      throw new NotFoundError('Category');
    }
    return category;
  }

  async getAllCategories(includeInactive: boolean = false): Promise<Category[]> {
    return this.categoryRepository.findMany(includeInactive);
  }

  async getRootCategories(includeInactive: boolean = false): Promise<Category[]> {
    return this.categoryRepository.findRootCategories(includeInactive);
  }

  async getCategoryTree(includeInactive: boolean = false): Promise<Category[]> {
    return this.categoryRepository.getCategoryTree(includeInactive);
  }

  async createCategory(data: CreateCategoryData): Promise<Category> {
    return this.categoryRepository.create(data);
  }

  async updateCategory(id: string, data: UpdateCategoryData): Promise<Category> {
    await this.getCategoryById(id);
    return this.categoryRepository.update(id, data);
  }

  async deleteCategory(id: string): Promise<void> {
    await this.getCategoryById(id);
    await this.categoryRepository.delete(id);
  }
}

