// components/ui/ReadingZone.tsx

import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';
import type { ReactNode } from 'react';

const READING_SURFACE = {
  backgroundColor: 'rgba(10, 14, 26, 0.88)',
  backdropFilter: 'blur(32px) saturate(1.1)',
  WebkitBackdropFilter: 'blur(32px) saturate(1.1)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  backgroundImage: 'none',
};

interface ReadingZoneProps {
  children: ReactNode;
  sx?: SxProps<Theme>;
}

export function ReadingZone({ children, sx }: ReadingZoneProps) {
  return (
    <Box
      sx={{
        ...READING_SURFACE,
        borderRadius: 3,
        p: 3,
        '& p, & li': {
          fontFamily: '"Merriweather", Georgia, serif',
          lineHeight: 1.9,
          color: 'rgba(255, 255, 255, 0.88)',
          fontSize: '1rem',
        },
        '& h1, & h2, & h3, & h4': {
          fontFamily: '"Merriweather", Georgia, serif',
        },
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
