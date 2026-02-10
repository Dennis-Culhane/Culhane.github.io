// lib/api/articles.ts
// Server-side data fetching for articles from Supabase.

import { createClient } from '@/lib/supabase/server';
import type { Category } from '@/types';

const PAGE_SIZE = 20;

export interface ArticleWithCategories {
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
  categories: string[];
}

export interface ArticlesResult {
  articles: ArticleWithCategories[];
  total: number;
  page: number;
  totalPages: number;
}

// Helper: get untyped client to avoid Supabase TS narrowing issues with complex queries
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getDb(): Promise<any> {
  return createClient();
}

/**
 * Fetch paginated articles with optional search and category filter.
 */
export async function getArticles({
  page = 1,
  search = '',
  category = '',
  limit = PAGE_SIZE,
}: {
  page?: number;
  search?: string;
  category?: string;
  limit?: number;
} = {}): Promise<ArticlesResult> {
  const db = await getDb();
  const offset = (page - 1) * limit;

  // When filtering by category, first get matching article IDs
  let filteredIds: string[] | null = null;
  if (category) {
    const { data: catRows } = await db
      .from('categories')
      .select('id')
      .eq('slug', category)
      .limit(1);

    const catId = catRows?.[0]?.id;
    if (catId != null) {
      const { data: links } = await db
        .from('article_categories')
        .select('article_id')
        .eq('category_id', catId);

      filteredIds = (links ?? []).map((l: { article_id: string }) => l.article_id);
      if (filteredIds!.length === 0) {
        return { articles: [], total: 0, page, totalPages: 0 };
      }
    }
  }

  // Build the main query
  let query = db
    .from('articles')
    .select('*', { count: 'exact' });

  if (search.trim()) {
    const term = `%${search.trim()}%`;
    query = query.or(`title.ilike.${term},authors.ilike.${term},abstract.ilike.${term}`);
  }

  if (filteredIds) {
    query = query.in('id', filteredIds);
  }

  const { data, count, error } = await query
    .order('published_date', { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(`Fetch articles failed: ${error.message}`);

  const rows = (data ?? []) as ArticleRow[];
  const articleIds = rows.map((a) => a.id);
  const articles = await attachCategories(db, rows, articleIds);

  return {
    articles,
    total: (count as number) ?? 0,
    page,
    totalPages: Math.ceil(((count as number) ?? 0) / limit),
  };
}

/**
 * Fetch a single article by slug.
 */
export async function getArticleBySlug(slug: string): Promise<ArticleWithCategories | null> {
  const db = await getDb();

  const { data, error } = await db
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) return null;

  const row = data as ArticleRow;
  const withCats = await attachCategories(db, [row], [row.id]);
  return withCats[0] ?? null;
}

/**
 * Fetch all categories with article counts.
 */
export async function getCategories(): Promise<(Category & { count: number })[]> {
  const db = await getDb();

  const { data: categories, error } = await db
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw new Error(`Fetch categories failed: ${error.message}`);

  const { data: counts } = await db
    .from('article_categories')
    .select('category_id');

  const countMap = new Map<number, number>();
  for (const row of (counts ?? []) as { category_id: number }[]) {
    countMap.set(row.category_id, (countMap.get(row.category_id) ?? 0) + 1);
  }

  return ((categories ?? []) as Category[]).map((cat) => ({
    ...cat,
    count: countMap.get(cat.id) ?? 0,
  }));
}

/**
 * Fetch all articles (for visualization and collaboration network).
 * Uses a high limit; for very large datasets consider streaming or pagination.
 */
export async function getAllArticles(): Promise<ArticleWithCategories[]> {
  const db = await getDb();

  const { data, error } = await db
    .from('articles')
    .select('*')
    .order('published_date', { ascending: false, nullsFirst: false })
    .limit(1000);

  if (error) throw new Error(`Fetch all articles failed: ${error.message}`);

  const rows = (data ?? []) as ArticleRow[];
  const articleIds = rows.map((a) => a.id);
  return attachCategories(db, rows, articleIds);
}

/**
 * Fetch featured/recent articles for the homepage.
 */
export async function getFeaturedArticles(limit = 6): Promise<ArticleWithCategories[]> {
  const db = await getDb();

  const { data, error } = await db
    .from('articles')
    .select('*')
    .order('published_date', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) throw new Error(`Fetch featured failed: ${error.message}`);

  const rows = (data ?? []) as ArticleRow[];
  const articleIds = rows.map((a) => a.id);
  return attachCategories(db, rows, articleIds);
}

/**
 * Fetch related articles for a given article, scored by relevance.
 *
 * Scoring mirrors v1 logic:
 *   - Shared author substrings: +3 per match
 *   - Shared categories:        +2 per match
 *   - Common keywords (>4 chars) in title/abstract: +0.5 per word
 *   - Published within 1 year:  +1
 *
 * Returns the top `limit` articles with score > 0.
 */
export async function getRelatedArticles(
  article: ArticleWithCategories,
  limit = 3,
): Promise<ArticleWithCategories[]> {
  const db = await getDb();

  // Fetch a broader candidate pool — same categories first, fallback to recent
  const { data: allRows, error } = await db
    .from('articles')
    .select('*')
    .neq('id', article.id)
    .order('published_date', { ascending: false, nullsFirst: false })
    .limit(100);

  if (error || !allRows) return [];

  const rows = allRows as ArticleRow[];
  const articleIds = rows.map((r) => r.id);
  const candidates = await attachCategories(db, rows, articleIds);

  // Tokenize current article for keyword matching
  const currentWords = new Set(
    `${article.title} ${article.abstract}`
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 4),
  );

  const currentAuthors = article.authors
    .split(',')
    .map((a) => a.trim().toLowerCase())
    .filter(Boolean);

  const scored = candidates
    .map((candidate) => {
      let score = 0;

      // Shared authors
      const candidateAuthors = candidate.authors
        .split(',')
        .map((a) => a.trim().toLowerCase())
        .filter(Boolean);
      for (const ca of candidateAuthors) {
        for (const aa of currentAuthors) {
          if (ca.includes(aa) || aa.includes(ca)) {
            score += 3;
            break;
          }
        }
      }

      // Shared categories
      for (const cat of candidate.categories) {
        if (article.categories.includes(cat)) score += 2;
      }

      // Common keywords in title + abstract
      const candidateText = `${candidate.title} ${candidate.abstract}`.toLowerCase();
      const candidateWordSet = new Set(candidateText.split(/\s+/));
      for (const word of currentWords) {
        if (candidateWordSet.has(word)) score += 0.5;
      }

      // Close publication date (within 1 year)
      if (article.published_date && candidate.published_date) {
        const diff = Math.abs(
          new Date(article.published_date).getTime() - new Date(candidate.published_date).getTime(),
        );
        const yearMs = 365 * 24 * 60 * 60 * 1000;
        if (diff < yearMs) score += 1;
      }

      return { candidate, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map((item) => item.candidate);
}

// ---------------------------------------------------------------------------
// Internal types and helpers
// ---------------------------------------------------------------------------

interface ArticleRow {
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
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function attachCategories(db: any, articles: ArticleRow[], articleIds: string[]): Promise<ArticleWithCategories[]> {
  if (articleIds.length === 0) return [];

  const { data: joins } = await db
    .from('article_categories')
    .select('article_id, categories ( name )')
    .in('article_id', articleIds);

  const catMap = new Map<string, string[]>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const join of (joins ?? []) as any[]) {
    const articleId = join.article_id as string;
    const catName = join.categories?.name as string | undefined;
    if (catName) {
      if (!catMap.has(articleId)) catMap.set(articleId, []);
      catMap.get(articleId)!.push(catName);
    }
  }

  return articles.map((a) => ({
    ...a,
    categories: catMap.get(a.id) ?? [],
  }));
}
