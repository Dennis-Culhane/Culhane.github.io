// app/(public)/article/[slug]/page.tsx
// Article detail page — two-column layout: metadata + abstract + related | PDF preview

import { notFound } from 'next/navigation';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { ReadingZone } from '@/components/ui/ReadingZone';
import { PdfPreview } from '@/components/articles/PdfPreview';
import { RelatedArticles } from '@/components/articles/RelatedArticles';
import { CopyLinkButton } from './CopyLinkButton';
import { getArticleBySlug, getRelatedArticles } from '@/lib/api/articles';
import type { Metadata } from 'next';

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: 'Article Not Found' };
  return {
    title: article.title,
    description: article.abstract?.slice(0, 160),
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) notFound();

  const relatedArticles = await getRelatedArticles(article, 3);

  const formattedDate = article.published_date
    ? new Date(article.published_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      {/* Back navigation */}
      <Button
        href="/articles"
        startIcon={<ArrowBackIcon />}
        variant="text"
        size="small"
        sx={{ mb: 3, color: 'text.secondary' }}
      >
        Back to Publications
      </Button>

      {/* Article title — full width above the two columns */}
      <Typography
        variant="h3"
        component="h1"
        sx={{
          fontFamily: '"Merriweather", Georgia, serif',
          fontWeight: 400,
          fontSize: { xs: '1.4rem', sm: '1.6rem', md: '2rem' },
          lineHeight: 1.4,
          mb: 1,
        }}
      >
        {article.title}
      </Typography>

      {/* Two-column layout: left = details, right = PDF preview */}
      <Grid container spacing={{ xs: 3, md: 4 }} sx={{ mt: 1, alignItems: 'flex-start' }}>
        {/* LEFT COLUMN — metadata, abstract, actions, related articles */}
        <Grid size={{ xs: 12, lg: 5 }}>
          {/* Authors */}
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.95rem' }}>
            {article.authors}
          </Typography>

          {/* Date */}
          {formattedDate && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 0.5, mb: 2 }}
            >
              {formattedDate}
            </Typography>
          )}

          {/* Categories */}
          {article.categories.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 3 }}>
              {article.categories.map((cat) => (
                <Chip key={cat} label={cat} size="small" />
              ))}
            </Box>
          )}

          {/* Abstract — light teal/blue tint instead of deep dark */}
          {article.abstract && (
            <ReadingZone
              sx={{
                mb: 3,
                backgroundColor: 'rgba(74, 234, 220, 0.06)',
                border: '1px solid rgba(74, 234, 220, 0.15)',
                backdropFilter: 'blur(20px) saturate(1.2)',
                WebkitBackdropFilter: 'blur(20px) saturate(1.2)',
                '& p, & li': {
                  color: 'text.primary',
                },
              }}
            >
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ letterSpacing: '0.1em', fontSize: '0.7rem', mb: 2, display: 'block' }}
              >
                Abstract
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                {article.abstract}
              </Typography>
            </ReadingZone>
          )}

          {/* Action buttons — Download + Copy Link */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
            {article.pdf_url && (
              <Button
                href={article.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                variant="contained"
                startIcon={<PictureAsPdfIcon />}
                size="medium"
              >
                Download
              </Button>
            )}
            <CopyLinkButton slug={article.slug} />
          </Box>

          <Divider sx={{ borderColor: 'divider', my: 3 }} />

          {/* Related Articles */}
          <RelatedArticles articles={relatedArticles} />
        </Grid>

        {/* RIGHT COLUMN — PDF preview (sticky: stays fixed while scrolling left column) */}
        <Grid
          size={{ xs: 12, lg: 7 }}
          sx={{ alignSelf: 'flex-start', position: { lg: 'sticky' }, top: { lg: 80 } }}
        >
          {article.pdf_url ? (
            <PdfPreview url={article.pdf_url} title={article.title} />
          ) : (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: { xs: 200, md: 400 },
                borderRadius: 3,
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                No PDF available for this article.
              </Typography>
            </Box>
          )}
        </Grid>
      </Grid>
    </Container>
  );
}
