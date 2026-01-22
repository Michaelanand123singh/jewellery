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
    return blog;
  }

  async getBlogBySlug(slug: string): Promise<Blog> {
    const blog = await this.blogRepository.findBySlug(slug);
    if (!blog) {
      throw new NotFoundError('Blog');
    }
    return blog;
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

    const limit = pagination?.limit ?? 20;
    const totalPages = Math.ceil(total / limit);

    return { blogs, total, totalPages };
  }

  async createBlog(data: CreateBlogData): Promise<Blog> {
    // Generate slug if not provided
    const slug = data.slug || slugify(data.title);

    // Check if slug already exists
    const existing = await this.blogRepository.findBySlug(slug);
    if (existing) {
      throw new Error('Blog with this slug already exists');
    }

    return this.blogRepository.create({
      ...data,
      slug,
    });
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

    return this.blogRepository.update(id, data as Partial<CreateBlogData>);
  }

  async deleteBlog(id: string): Promise<void> {
    await this.getBlogById(id);
    await this.blogRepository.delete(id);
  }
}

