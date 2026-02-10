// components/articles/ArticleGrid.tsx

import Grid from '@mui/material/Grid2';
import { ArticleCard } from './ArticleCard';
import type { ArticleWithCategories } from '@/lib/api/articles';

interface ArticleGridProps {
  articles: ArticleWithCategories[];
}

export function ArticleGrid({ articles }: ArticleGridProps) {
  return (
    <Grid container spacing={3}>
      {articles.map((article) => (
        <Grid key={article.id} size={{ xs: 12, sm: 6, lg: 4 }}>
          <ArticleCard
            title={article.title}
            authors={article.authors}
            date={article.published_date}
            categories={article.categories}
            abstract={article.abstract}
            pdfUrl={article.pdf_url}
            slug={article.slug}
          />
        </Grid>
      ))}
    </Grid>
  );
}
