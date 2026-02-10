// app/(public)/collaboration-network/page.tsx

import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { getAllArticles } from '@/lib/api/articles';
import { CollaborationNetwork } from './CollaborationNetwork';

export const metadata = {
  title: 'Collaboration Network',
  description: 'Force-directed graph of co-author collaboration with Dennis P. Culhane.',
};

export default async function CollaborationNetworkPage() {
  const articles = await getAllArticles();

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 4, md: 6 } }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: '0.12em' }}>
          Research Network
        </Typography>
        <Typography variant="h3" component="h1" sx={{ mt: 1, fontWeight: 400 }}>
          Collaboration Network
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Node size reflects number of collaborative articles. Hover for names; click a node to view
          collaborative articles.
        </Typography>
      </Box>

      <CollaborationNetwork articles={articles} />
    </Container>
  );
}
