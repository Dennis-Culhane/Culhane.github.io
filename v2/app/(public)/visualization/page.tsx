// app/(public)/visualization/page.tsx

import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { getAllArticles } from '@/lib/api/articles';
import { ResearchVisualization } from './ResearchVisualization';

export const metadata = {
  title: 'Research Visualization',
  description: 'Publication timeline, research field distribution, and collaboration statistics.',
};

export default async function VisualizationPage() {
  const articles = await getAllArticles();

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Box sx={{ mb: 6 }}>
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: '0.12em' }}>
          Research Insights
        </Typography>
        <Typography variant="h3" component="h1" sx={{ mt: 1, fontWeight: 400 }}>
          Research Visualization
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Publication timeline, research field distribution, and collaboration statistics.
        </Typography>
      </Box>

      <ResearchVisualization articles={articles} />
    </Container>
  );
}
