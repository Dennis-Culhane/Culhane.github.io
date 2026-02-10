// components/ui/ThemeToggle.tsx

'use client';

import { useCallback } from 'react';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useThemeStore } from '@/hooks/useThemeStore';

export function ThemeToggle() {
  const { mode, toggle } = useThemeStore();

  const handleToggle = useCallback(() => {
    toggle();
  }, [toggle]);

  return (
    <Tooltip title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
      <IconButton
        onClick={handleToggle}
        sx={{
          color: 'text.secondary',
          '&:hover': { color: 'text.primary' },
        }}
        aria-label="Toggle color theme"
      >
        {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
      </IconButton>
    </Tooltip>
  );
}
