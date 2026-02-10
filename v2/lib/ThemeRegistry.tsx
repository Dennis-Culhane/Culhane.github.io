// lib/ThemeRegistry.tsx

'use client';

import { useMemo, useEffect, type ReactNode } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { darkTheme, lightTheme } from '@/lib/theme';
import { useThemeStore } from '@/hooks/useThemeStore';

interface ThemeRegistryProps {
  children: ReactNode;
}

export function ThemeRegistry({ children }: ThemeRegistryProps) {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => (mode === 'dark' ? darkTheme : lightTheme), [mode]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
