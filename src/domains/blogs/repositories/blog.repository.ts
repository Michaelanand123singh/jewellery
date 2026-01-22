/**
 * Blog repository - Data access layer for blogs
 */

import { prisma } from '@/src/infrastructure/database/prisma';
import { Blog, BlogFilters, BlogSort, PaginationParams } from '../types/blog.types';

export class BlogRepository {
  async findById(id: string): Promise<Blog | null> {
    return prisma.blog.findUnique({
      where: { id },
      include: {
        faqs: true,
      },
    });
  }

  async findBySlug(slug: string): Promise<Blog | null> {
    return prisma.blog.findUnique({
      where: { slug },
      include: {
        faqs: true,
      },
    });
  }

  async findMany(
    filters?: BlogFilters,
    sort?: BlogSort,
    pagination?: PaginationParams
  ): Promise<{ blogs: Blog[]; total: number }> {
    const where: any = {};

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { excerpt: { contains: filters.search, mode: 'insensitive' } },
        { content: { contains: filters.search, mode: 'insensitive' } },
        { tags: { has: filters.search } },
      ];
    }

    if (filters?.published !== undefined) {
      where.published = filters.published;
    }

    if (filters?.author) {
      where.author = { contains: filters.author, mode: 'insensitive' };
    }

    const orderBy: any = {};
    if (sort?.sortBy) {
      orderBy[sort.sortBy] = sort.sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const skip = pagination?.skip ?? 0;
    const take = pagination?.limit ?? 20;

    const [blogs, total] = await Promise.all([
      prisma.blog.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          faqs: true,
        },
      }),
      prisma.blog.count({ where }),
    ]);

    return { blogs, total };
  }

  async create(data: {
    title: string;
    slug: string;
    excerpt: string;
    content?: string;
    image: string;
    category: string;
    author?: string;
    readTime?: string;
    tags?: string[];
    published?: boolean;
    publishedAt?: Date;
    faqs?: Array<{ question: string; answer: string }>;
  }): Promise<Blog> {
    const { faqs, ...blogData } = data;
    
    return prisma.blog.create({
      data: {
        ...blogData,
        publishedAt: data.published ? (data.publishedAt || new Date()) : null,
        faqs: faqs && faqs.length > 0 ? {
          create: faqs.map(faq => ({
            question: faq.question,
            answer: faq.answer,
          })),
        } : undefined,
      },
      include: {
        faqs: true,
      },
    });
  }

  async update(
    id: string,
    data: {
      title?: string;
      slug?: string;
      excerpt?: string;
      content?: string;
      image?: string;
      category?: string;
      author?: string;
      readTime?: string;
      tags?: string[];
      published?: boolean;
      publishedAt?: Date;
      faqs?: Array<{ question: string; answer: string }>;
    }
  ): Promise<Blog> {
    const { faqs, ...blogData } = data;

    // Prepare update data with proper typing
    const updateData: any = {
      ...blogData,
    };

    // Handle publishedAt
    if (data.published !== undefined) {
      updateData.publishedAt = data.published ? (data.publishedAt || new Date()) : null;
    }

    // Handle FAQs update
    if (faqs !== undefined) {
      // Delete existing FAQs
      await prisma.blogFAQ.deleteMany({
        where: { blogId: id },
      });

      // Create new FAQs if provided
      if (faqs.length > 0) {
        updateData.faqs = {
          create: faqs.map(faq => ({
            question: faq.question,
            answer: faq.answer,
          })),
        };
      }
    }

    return prisma.blog.update({
      where: { id },
      data: updateData,
      include: {
        faqs: true,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.blog.delete({
      where: { id },
    });
  }
}

