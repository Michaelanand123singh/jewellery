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

  async getProductById(id: string, includeDraft: boolean = false): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundError('Product');
    }
    
    // Check if product is published (unless admin)
    if (!includeDraft && product.status !== 'PUBLISHED') {
      throw new NotFoundError('Product');
    }
    
    return {
      ...product,
      image: this.transformImageUrl(product.image),
      images: product.images?.map(img => this.transformImageUrl(img)) || product.images,
      ogImage: product.ogImage ? this.transformImageUrl(product.ogImage) : product.ogImage,
    };
  }

  async getProductBySlug(slug: string, includeDraft: boolean = false): Promise<Product> {
    const product = await this.productRepository.findBySlug(slug);
    if (!product) {
      throw new NotFoundError('Product');
    }
    
    // Check if product is published (unless admin)
    if (!includeDraft && product.status !== 'PUBLISHED') {
      throw new NotFoundError('Product');
    }
    
    return {
      ...product,
      image: this.transformImageUrl(product.image),
      images: product.images?.map(img => this.transformImageUrl(img)) || product.images,
      ogImage: product.ogImage ? this.transformImageUrl(product.ogImage) : product.ogImage,
    };
  }

  async getProducts(
    filters?: ProductFilters,
    sort?: ProductSort,
    pagination?: PaginationParams,
    includeDraft: boolean = false
  ): Promise<{ products: Product[]; total: number; totalPages: number }> {
    const { products, total } = await this.productRepository.findMany(
      filters,
      sort,
      pagination,
      includeDraft
    );

    // Transform image URLs to use proxy for frontend access
    const productsWithProxyUrls = products.map(product => ({
      ...product,
      image: this.transformImageUrl(product.image),
      images: product.images?.map(img => this.transformImageUrl(img)) || product.images,
      ogImage: product.ogImage ? this.transformImageUrl(product.ogImage) : product.ogImage,
    }));

    const limit = pagination?.limit ?? 20;
    const totalPages = Math.ceil(total / limit);

    return { products: productsWithProxyUrls, total, totalPages };
  }

  /**
   * Transform image URL to use proxy for frontend access
   */
  private transformImageUrl(url: string): string {
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

    const product = await this.productRepository.create({
      ...data,
      slug,
      status: data.status || 'DRAFT',
    });

    return {
      ...product,
      image: this.transformImageUrl(product.image),
      images: product.images?.map(img => this.transformImageUrl(img)) || product.images,
      ogImage: product.ogImage ? this.transformImageUrl(product.ogImage) : product.ogImage,
    };
  }

  async updateProduct(id: string, data: UpdateProductData): Promise<Product> {
    // Check if product exists (allow draft for admin)
    await this.getProductById(id, true);

    // If slug is being updated, check uniqueness
    if (data.slug) {
      const existing = await this.productRepository.findBySlug(data.slug);
      if (existing && existing.id !== id) {
        throw new Error('Product with this slug already exists');
      }
    }

    const product = await this.productRepository.update(id, data as Partial<Product>);
    
    return {
      ...product,
      image: this.transformImageUrl(product.image),
      images: product.images?.map(img => this.transformImageUrl(img)) || product.images,
      ogImage: product.ogImage ? this.transformImageUrl(product.ogImage) : product.ogImage,
    };
  }

  async deleteProduct(id: string): Promise<void> {
    // Check if product exists (including drafts) before deleting
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundError('Product');
    }
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

