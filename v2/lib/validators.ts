// lib/validators.ts
import { z } from 'zod';

export const articleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  authors: z.string().min(1, 'Authors are required'),
  published_date: z.string().nullable().optional(),
  abstract: z.string().default(''),
  pdf_url: z.string().url().nullable().optional(),
  pdf_filename: z.string().nullable().optional(),
  source_type: z.enum(['uploaded', 'external']).default('uploaded'),
  external_url: z.string().url().nullable().optional(),
  category_ids: z.array(z.number().int().positive()).default([]),
  is_featured: z.boolean().default(false),
});

export const categorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  sort_order: z.number().int().default(0),
});

export const subscriberSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const searchParamsSchema = z.object({
  q: z.string().optional(),
  category: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['date', 'relevance', 'citations']).default('date'),
});

export type ArticleInput = z.infer<typeof articleSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type SubscriberInput = z.infer<typeof subscriberSchema>;
export type SearchParams = z.infer<typeof searchParamsSchema>;
