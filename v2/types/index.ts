// types/index.ts

export interface Article {
  id: string;
  title: string;
  slug: string;
  authors: string;
  published_date: string | null;
  abstract: string;
  pdf_url: string | null;
  pdf_filename: string | null;
  source_type: 'uploaded' | 'external';
  external_url: string | null;
  citation_count: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  categories?: Category[];
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
}

export interface Profile {
  id: string;
  name: string;
  positions: string[];
  biography: string[];
  image_url: string | null;
  cv_url: string | null;
}

export interface Subscriber {
  id: number;
  email: string;
  subscribed_at: string;
  is_active: boolean;
}

export interface ArticleWithCategories extends Article {
  categories: Category[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
