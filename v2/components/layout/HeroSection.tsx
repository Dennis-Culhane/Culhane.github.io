// components/layout/HeroSection.tsx

'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import EmailIcon from '@mui/icons-material/Email';
import type { Profile } from '@/types';

interface HeroSectionProps {
  profile: Profile | null;
}

export function HeroSection({ profile }: HeroSectionProps) {
  const [bioExpanded, setBioExpanded] = useState(false);

  const name = profile?.name ?? 'Dennis P. Culhane, Ph.D.';
  const positions = profile?.positions ?? [
    'Professor of Social Policy at University of Pennsylvania.',
    'Leading authority on homelessness and assisted housing policy.',
  ];
  const biography = profile?.biography ?? [];
  const imageUrl = profile?.image_url ?? null;

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: { xs: 0, md: 5 },
        mx: { xs: 0, md: 4, lg: 'auto' },
        mt: { xs: 0, md: 3 },
        maxWidth: 1100,
      }}
    >
      {/* Soft pastel gradient background — subtle, not flashy */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(74,234,220,0.08) 0%, rgba(177,140,255,0.06) 50%, rgba(255,180,150,0.04) 100%)'
              : 'linear-gradient(135deg, rgba(200,220,255,0.4) 0%, rgba(230,210,255,0.3) 40%, rgba(255,220,200,0.25) 100%)',
          zIndex: 0,
        }}
      />

      <Container
        maxWidth="lg"
        sx={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'center', md: 'center' },
          gap: { xs: 4, md: 6 },
          py: { xs: 5, md: 6 },
          px: { xs: 3, md: 5 },
        }}
      >
        {/* LEFT — Text content */}
        <Box
          sx={{
            flex: 1,
            textAlign: { xs: 'center', md: 'left' },
            minWidth: 0,
          }}
        >
          {/* Name */}
          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontFamily: '"Merriweather", Georgia, serif',
              fontWeight: 700,
              fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.6rem' },
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
              color: 'text.primary',
              mb: 2,
            }}
          >
            {name}
          </Typography>

          {/* Positions / subtitle */}
          <Box sx={{ mb: 3 }}>
            {positions.map((pos, i) => (
              <Typography
                key={i}
                variant="body1"
                sx={{
                  color: 'text.secondary',
                  lineHeight: 1.7,
                  fontSize: { xs: '0.9rem', md: '1rem' },
                  fontFamily: '"Inter Variable", system-ui, sans-serif',
                }}
              >
                {pos}
              </Typography>
            ))}
          </Box>

          {/* Expandable biography */}
          {biography.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Button
                variant="outlined"
                onClick={() => setBioExpanded(!bioExpanded)}
                endIcon={bioExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                fullWidth
                sx={{
                  justifyContent: 'space-between',
                  textTransform: 'none',
                  fontWeight: 400,
                  fontSize: '0.95rem',
                  borderRadius: 3,
                  py: 1.2,
                  px: 2.5,
                  backgroundColor: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.04)'
                      : 'rgba(255,255,255,0.7)',
                  backdropFilter: 'blur(12px)',
                  maxWidth: { md: 380 },
                }}
              >
                Read full biography
              </Button>
              <Collapse in={bioExpanded} timeout={400}>
                <Box
                  sx={{
                    mt: 2,
                    p: 2.5,
                    borderRadius: 3,
                    backgroundColor: (theme) =>
                      theme.palette.mode === 'dark'
                        ? 'rgba(255,255,255,0.04)'
                        : 'rgba(255,255,255,0.75)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid',
                    borderColor: 'divider',
                    maxWidth: { md: 480 },
                  }}
                >
                  {biography.map((paragraph, i) => (
                    <Typography
                      key={i}
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                        lineHeight: 1.8,
                        fontSize: '0.88rem',
                        mb: i < biography.length - 1 ? 1.5 : 0,
                      }}
                    >
                      {paragraph}
                    </Typography>
                  ))}
                </Box>
              </Collapse>
            </Box>
          )}

          {/* CTA Buttons */}
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              justifyContent: { xs: 'center', md: 'flex-start' },
              flexWrap: 'wrap',
            }}
          >
            <Button
              href="/articles"
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              size="large"
              sx={{
                borderRadius: 6,
                px: 3.5,
                py: 1.2,
                fontWeight: 500,
              }}
            >
              Browse Publications
            </Button>
            <Button
              href="/about"
              variant="outlined"
              startIcon={<EmailIcon />}
              size="large"
              sx={{
                borderRadius: 6,
                px: 3,
                py: 1.2,
              }}
            >
              Contact
            </Button>
          </Box>
        </Box>

        {/* RIGHT — Profile photo with elegant gradient ring */}
        {imageUrl && (
          <Box
            sx={{
              flexShrink: 0,
              width: { xs: 200, sm: 260, md: 320 },
              height: { xs: 200, sm: 260, md: 320 },
              borderRadius: '50%',
              p: '4px',
              background: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'conic-gradient(from 135deg, rgba(74,234,220,0.4), rgba(177,140,255,0.3), rgba(74,234,220,0.25), rgba(177,140,255,0.2))'
                  : 'conic-gradient(from 135deg, rgba(13,115,119,0.5), rgba(107,79,160,0.35), rgba(13,115,119,0.3), rgba(107,79,160,0.25))',
              boxShadow: (theme) =>
                theme.palette.mode === 'dark'
                  ? '0 20px 40px rgba(0,0,0,0.35), 0 8px 16px rgba(0,0,0,0.2)'
                  : '0 20px 40px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.06)',
            }}
          >
            <Box
              component="img"
              src={imageUrl}
              alt={name}
              sx={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                objectFit: 'cover',
                objectPosition: 'center top',
                display: 'block',
                boxShadow: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'inset 0 1px 0 rgba(255,255,255,0.06)'
                    : 'inset 0 1px 0 rgba(255,255,255,0.9)',
              }}
            />
          </Box>
        )}
      </Container>
    </Box>
  );
}
