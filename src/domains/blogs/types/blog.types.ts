/**
 * Blog domain types
 */

export interface BlogFAQ {
  id?: string;
  question: string;
  answer: string;
}

export interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content?: string | null;
  image: string;
  category: string;
  author?: string | null;
  readTime?: string | null;
  tags: string[];
  published: boolean;
  publishedAt?: Date | null;
  faqs?: BlogFAQ[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBlogData {
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
  faqs?: BlogFAQ[];
}

export interface UpdateBlogData {
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
  faqs?: BlogFAQ[];
}

export interface BlogFilters {
  category?: string;
  search?: string;
  published?: boolean;
  author?: string;
}

export interface BlogSort {
  sortBy?: 'title' | 'createdAt' | 'publishedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  skip?: number;
}

