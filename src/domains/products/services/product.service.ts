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

    // Check if SKU already exists (if provided)
    if (data.sku) {
      const { ProductVariantRepository } = await import('../repositories/variant.repository');
      const variantRepo = new ProductVariantRepository();
      const existingSku = await variantRepo.findBySku(data.sku);
      if (existingSku) {
        throw new Error('Product with this SKU already exists');
      }
    }

    return this.productRepository.create({
      ...data,
      slug,
      status: data.status || 'DRAFT',
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

  async getAllProductsForExport(): Promise<Product[]> {
    const { products } = await this.productRepository.findMany(
      undefined,
      undefined,
      { limit: 10000, skip: 0 } // Large limit for export
    );
    return products;
  }

  async bulkCreateProducts(products: CreateProductData[]): Promise<{ success: Product[]; failed: Array<{ data: CreateProductData; error: string }> }> {
    const success: Product[] = [];
    const failed: Array<{ data: CreateProductData; error: string }> = [];

    for (const productData of products) {
      try {
        const product = await this.createProduct(productData);
        success.push(product);
      } catch (error) {
        failed.push({
          data: productData,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return { success, failed };
  }
}

