// components/layout/GlassFooter.tsx

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export function GlassFooter() {
  const year = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        py: 4,
        px: 3,
        mt: 8,
        textAlign: 'center',
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography variant="body2" color="text.secondary">
        &copy; {year} Dennis P. Culhane &middot; University of Pennsylvania
      </Typography>
    </Box>
  );
}
