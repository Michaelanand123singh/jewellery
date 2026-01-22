/**
 * Blog validation schemas
 */

import { z } from 'zod';

export const blogFAQSchema = z.object({
  question: z.string().min(1, 'Question is required'),
  answer: z.string().min(1, 'Answer is required'),
});

export const createBlogSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens'),
  excerpt: z.string().min(1, 'Excerpt is required').max(500, 'Excerpt must be less than 500 characters'),
  content: z.string().optional(),
  image: z.string().url('Image must be a valid URL'),
  category: z.string().min(1, 'Category is required'),
  author: z.string().optional(),
  readTime: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  published: z.boolean().default(false),
  publishedAt: z.date().optional(),
  faqs: z.array(blogFAQSchema).optional().default([]),
});

export const updateBlogSchema = createBlogSchema.partial();

