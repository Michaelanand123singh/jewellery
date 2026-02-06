/**
 * Blog service - Business logic for blogs
 */

import { BlogRepository } from '../repositories/blog.repository';
import {
  Blog,
  CreateBlogData,
  UpdateBlogData,
  BlogFilters,
  BlogSort,
  PaginationParams,
} from '../types/blog.types';
import { NotFoundError } from '@/src/shared/utils/errors';
import { slugify } from '@/src/shared/utils/formatters';

export class BlogService {
  private blogRepository: BlogRepository;

  constructor() {
    this.blogRepository = new BlogRepository();
  }

  async getBlogById(id: string): Promise<Blog> {
    const blog = await this.blogRepository.findById(id);
    if (!blog) {
      throw new NotFoundError('Blog');
    }
    return {
      ...blog,
      image: this.transformImageUrl(blog.image),
    };
  }

  async getBlogBySlug(slug: string): Promise<Blog> {
    const blog = await this.blogRepository.findBySlug(slug);
    if (!blog) {
      throw new NotFoundError('Blog');
    }
    return {
      ...blog,
      image: this.transformImageUrl(blog.image),
    };
  }

  async getBlogs(
    filters?: BlogFilters,
    sort?: BlogSort,
    pagination?: PaginationParams
  ): Promise<{ blogs: Blog[]; total: number; totalPages: number }> {
    const { blogs, total } = await this.blogRepository.findMany(
      filters,
      sort,
      pagination
    );

    // Transform image URLs to use proxy for frontend access
    const blogsWithProxyUrls = blogs.map(blog => ({
      ...blog,
      image: this.transformImageUrl(blog.image),
    }));

    const limit = pagination?.limit ?? 20;
    const totalPages = Math.ceil(total / limit);

    return { blogs: blogsWithProxyUrls, total, totalPages };
  }

  /**
   * Transform image URL to use proxy for frontend access
   */
  private transformImageUrl(url: string): string {
    // Only transform MinIO URLs, leave other URLs (like external URLs) as-is
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

  async createBlog(data: CreateBlogData): Promise<Blog> {
    // Generate slug if not provided
    const slug = data.slug || slugify(data.title);

    // Check if slug already exists
    const existing = await this.blogRepository.findBySlug(slug);
    if (existing) {
      throw new Error('Blog with this slug already exists');
    }

    const blog = await this.blogRepository.create({
      ...data,
      slug,
    });

    return {
      ...blog,
      image: this.transformImageUrl(blog.image),
    };
  }

  async updateBlog(id: string, data: UpdateBlogData): Promise<Blog> {
    // Check if blog exists
    await this.getBlogById(id);

    // If slug is being updated, check uniqueness
    if (data.slug) {
      const existing = await this.blogRepository.findBySlug(data.slug);
      if (existing && existing.id !== id) {
        throw new Error('Blog with this slug already exists');
      }
    }

    const blog = await this.blogRepository.update(id, data as Partial<CreateBlogData>);
    
    return {
      ...blog,
      image: this.transformImageUrl(blog.image),
    };
  }

  async deleteBlog(id: string): Promise<void> {
    await this.getBlogById(id);
    await this.blogRepository.delete(id);
  }
}

