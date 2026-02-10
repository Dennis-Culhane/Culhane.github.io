// components/layout/GlassHeader.tsx

'use client';

import { useScroll, useTransform, motion, useMotionValueEvent } from 'framer-motion';
import { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export function GlassHeader() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setScrolled(latest > 64);
  });

  return (
    <AppBar
      component={motion.header}
      position="sticky"
      elevation={0}
      sx={{
        background: scrolled ? undefined : 'transparent',
        backdropFilter: scrolled ? 'blur(24px) saturate(1.2)' : 'none',
        borderBottom: scrolled
          ? '1px solid rgba(255, 255, 255, 0.08)'
          : '1px solid transparent',
        transition: 'background 0.4s ease, border-color 0.4s ease, backdrop-filter 0.4s ease',
      }}
    >
      <Toolbar sx={{ maxWidth: 1320, width: '100%', mx: 'auto', px: { xs: 2, md: 3 } }}>
        <Typography
          variant="h6"
          component="a"
          href="/"
          sx={{
            fontFamily: '"Inter Variable", system-ui, sans-serif',
            fontWeight: 400,
            letterSpacing: '0.04em',
            textDecoration: 'none',
            color: 'text.primary',
            mr: 4,
          }}
        >
          Culhane Library
        </Typography>

        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, flexGrow: 1 }}>
          <Button href="/articles" variant="text" size="small">Articles</Button>
          <Button href="/visualization" variant="text" size="small">Research Visualization</Button>
          <Button href="/collaboration-network" variant="text" size="small">Collaboration Network</Button>
          <Button href="/about" variant="text" size="small">About</Button>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ThemeToggle />
        </Box>
      </Toolbar>
    </AppBar>
  );
}
