// app/(public)/articles/page.tsx
// Articles listing page with search, category filter, and pagination.

import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { getArticles, getCategories } from '@/lib/api/articles';
import { ArticleGrid } from '@/components/articles/ArticleGrid';
import { ArticlesToolbar } from './ArticlesToolbar';
import { ArticlesPagination } from './ArticlesPagination';

export const metadata = { title: 'Publications' };

interface ArticlesPageProps {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}

export default async function ArticlesPage({ searchParams }: ArticlesPageProps) {
  const params = await searchParams;
  const search = params.q ?? '';
  const category = params.category ?? '';
  const page = Math.max(1, Number(params.page) || 1);

  const [result, categories] = await Promise.all([
    getArticles({ page, search, category }),
    getCategories(),
  ]);

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      {/* Page header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: '0.12em' }}>
          Research Archive
        </Typography>
        <Typography variant="h3" component="h1" sx={{ mt: 1, fontWeight: 400 }}>
          Publications
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {result.total} article{result.total !== 1 ? 's' : ''} found
        </Typography>
      </Box>

      {/* Search + Category filter (client component) */}
      <ArticlesToolbar
        categories={categories}
        initialSearch={search}
        initialCategory={category}
      />

      {/* Article grid */}
      {result.articles.length > 0 ? (
        <Box sx={{ mt: 4 }}>
          <ArticleGrid articles={result.articles} />
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center', py: 12 }}>
          <Typography variant="h6" color="text.secondary">
            No articles found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Try adjusting your search or filter criteria.
          </Typography>
        </Box>
      )}

      {/* Pagination */}
      {result.totalPages > 1 && (
        <ArticlesPagination
          currentPage={page}
          totalPages={result.totalPages}
          search={search}
          category={category}
        />
      )}
    </Container>
  );
}
