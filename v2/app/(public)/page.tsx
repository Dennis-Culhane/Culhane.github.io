// app/(public)/page.tsx
// Homepage — Hero section + recent publications

import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import { HeroSection } from '@/components/layout/HeroSection';
import { ArticleGrid } from '@/components/articles/ArticleGrid';
import { getProfile } from '@/lib/api/profile';
import { getFeaturedArticles } from '@/lib/api/articles';

export default async function HomePage() {
  const [profile, recentArticles] = await Promise.all([
    getProfile(),
    getFeaturedArticles(6),
  ]);

  return (
    <>
      <HeroSection profile={profile} />

      <Divider sx={{ mx: 'auto', maxWidth: 120, my: 2, borderColor: 'divider' }} />

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ letterSpacing: '0.12em', fontSize: '0.75rem' }}
          >
            Recent Publications
          </Typography>
          <Typography
            variant="h4"
            component="h2"
            sx={{ mt: 1, fontWeight: 400 }}
          >
            Latest Research
          </Typography>
        </Box>

        <ArticleGrid articles={recentArticles} />
      </Container>
    </>
  );
}
