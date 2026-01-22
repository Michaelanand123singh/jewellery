/**
 * Product service - Business logic for products
 */

import { ProductRepository } from '../repositories/product.repository';
import {
  Product,
  CreateProductData,
  UpdateProductData,
  ProductFilters,
  ProductSort,
  PaginationParams,
} from '../types/product.types';
import { NotFoundError } from '@/src/shared/utils/errors';
import { slugify } from '@/src/shared/utils/formatters';

export class ProductService {
  private productRepository: ProductRepository;

  constructor() {
    this.productRepository = new ProductRepository();
  }

  async getProductById(id: string): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundError('Product');
    }
    return product;
  }

  async getProductBySlug(slug: string): Promise<Product> {
    const product = await this.productRepository.findBySlug(slug);
    if (!product) {
      throw new NotFoundError('Product');
    }
    return product;
  }

  async getProducts(
    filters?: ProductFilters,
    sort?: ProductSort,
    pagination?: PaginationParams
  ): Promise<{ products: Product[]; total: number; totalPages: number }> {
    const { products, total } = await this.productRepository.findMany(
      filters,
      sort,
      pagination
    );

    const limit = pagination?.limit ?? 20;
    const totalPages = Math.ceil(total / limit);

    return { products, total, totalPages };
  }

  async createProduct(data: CreateProductData): Promise<Product> {
    // Generate slug if not provided
    const slug = data.slug || slugify(data.name);

    // Check if slug already exists
    const existing = await this.productRepository.findBySlug(slug);
    if (existing) {
      throw new Error('Product with this slug already exists');
    }

    return this.productRepository.create({
      ...data,
      slug,
    });
  }

  async updateProduct(id: string, data: UpdateProductData): Promise<Product> {
    // Check if product exists
    await this.getProductById(id);

    // If slug is being updated, check uniqueness
    if (data.slug) {
      const existing = await this.productRepository.findBySlug(data.slug);
      if (existing && existing.id !== id) {
        throw new Error('Product with this slug already exists');
      }
    }

    return this.productRepository.update(id, data as Partial<Product>);
  }

  async deleteProduct(id: string): Promise<void> {
    await this.getProductById(id);
    await this.productRepository.delete(id);
  }

  async updateStock(id: string, quantity: number): Promise<Product> {
    await this.getProductById(id);
    return this.productRepository.updateStock(id, quantity);
  }
}

