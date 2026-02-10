// app/(public)/about/page.tsx
// About page — Professor biography

import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import DescriptionIcon from '@mui/icons-material/Description';
import { ReadingZone } from '@/components/ui/ReadingZone';
import { getProfile } from '@/lib/api/profile';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'About' };

export default async function AboutPage() {
  const profile = await getProfile();

  const name = profile?.name ?? 'Dennis P. Culhane, Ph.D.';
  const positions = profile?.positions ?? [];
  const biography = profile?.biography ?? [];

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
      {/* Profile header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'center', sm: 'flex-start' },
          gap: 4,
          mb: 6,
        }}
      >
        {profile?.image_url && (
          <Avatar
            src={profile.image_url}
            alt={name}
            sx={{
              width: 140,
              height: 140,
              flexShrink: 0,
              border: '2px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 0 40px rgba(74, 234, 220, 0.1)',
            }}
          />
        )}

        <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontFamily: '"Merriweather", Georgia, serif',
              fontWeight: 400,
              fontSize: { xs: '1.6rem', md: '2.2rem' },
            }}
          >
            {name}
          </Typography>

          {positions.map((pos, i) => (
            <Typography
              key={i}
              variant="body2"
              color="text.secondary"
              sx={{ mt: i === 0 ? 1.5 : 0.5, fontSize: '0.95rem' }}
            >
              {pos}
            </Typography>
          ))}

          {profile?.cv_url && (
            <Button
              href={profile.cv_url}
              target="_blank"
              rel="noopener noreferrer"
              variant="outlined"
              startIcon={<DescriptionIcon />}
              size="small"
              sx={{ mt: 2 }}
            >
              Download CV
            </Button>
          )}
        </Box>
      </Box>

      {/* Biography */}
      {biography.length > 0 && (
        <ReadingZone>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ letterSpacing: '0.1em', fontSize: '0.7rem', mb: 2, display: 'block' }}
          >
            Biography
          </Typography>
          {biography.map((paragraph, i) => (
            <Typography key={i} variant="body1" sx={{ mb: 2 }}>
              {paragraph}
            </Typography>
          ))}
        </ReadingZone>
      )}
    </Container>
  );
}
