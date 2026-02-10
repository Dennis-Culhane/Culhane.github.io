// components/articles/RelatedArticles.tsx

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import type { ArticleWithCategories } from '@/lib/api/articles';

interface RelatedArticlesProps {
  articles: ArticleWithCategories[];
}

/**
 * Displays a list of related articles with a left accent border,
 * matching the v1 visual pattern. Each item links to its detail page.
 */
export function RelatedArticles({ articles }: RelatedArticlesProps) {
  if (articles.length === 0) {
    return (
      <Box sx={{ mt: 5 }}>
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ letterSpacing: '0.1em', fontSize: '0.7rem', mb: 2, display: 'block' }}
        >
          Related Articles
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No related articles found.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 5 }}>
      <Typography
        variant="overline"
        color="text.secondary"
        sx={{ letterSpacing: '0.1em', fontSize: '0.7rem', mb: 2, display: 'block' }}
      >
        Related Articles
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {articles.map((article) => {
          const formattedDate = article.published_date
            ? new Date(article.published_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
              })
            : null;

          return (
            <Box
              key={article.id}
              sx={{
                borderLeft: '2px solid',
                borderColor: 'primary.main',
                pl: 2,
                py: 0.5,
                transition: 'border-color 0.3s ease',
                '&:hover': {
                  borderColor: 'secondary.main',
                },
              }}
            >
              <Link
                href={`/article/${article.slug}`}
                style={{ textDecoration: 'none' }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: '"Merriweather", Georgia, serif',
                    fontWeight: 400,
                    fontSize: '0.9rem',
                    lineHeight: 1.5,
                    color: 'primary.main',
                    cursor: 'pointer',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  {article.title}
                </Typography>
              </Link>
              {formattedDate && (
                <Typography variant="caption" color="text.secondary">
                  {formattedDate}
                </Typography>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
