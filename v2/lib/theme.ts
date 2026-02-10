// lib/theme.ts

'use client';

import { createTheme } from '@mui/material/styles';

// ═══════════════════════════════════════════════════════
//  SURFACE CONSTANTS
// ═══════════════════════════════════════════════════════

const GLASS_SURFACE = {
  backgroundColor: 'rgba(255, 255, 255, 0.04)',
  backdropFilter: 'blur(24px) saturate(1.2)',
  WebkitBackdropFilter: 'blur(24px) saturate(1.2)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  backgroundImage: 'none',
} as const;

const GLASS_SURFACE_ELEVATED = {
  ...GLASS_SURFACE,
  backgroundColor: 'rgba(255, 255, 255, 0.07)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.24)',
} as const;

export const READING_SURFACE = {
  backgroundColor: 'rgba(10, 14, 26, 0.88)',
  backdropFilter: 'blur(32px) saturate(1.1)',
  WebkitBackdropFilter: 'blur(32px) saturate(1.1)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  backgroundImage: 'none',
} as const;

// ═══════════════════════════════════════════════════════
//  FONT STACKS
// ═══════════════════════════════════════════════════════

const FONT_UI = '"Inter Variable", system-ui, sans-serif';
const FONT_READING = '"Merriweather", "Noto Serif SC", Georgia, serif';

// ═══════════════════════════════════════════════════════
//  DARK THEME (Default)
// ═══════════════════════════════════════════════════════

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#4AEADC' },
    secondary: { main: '#B18CFF' },
    background: {
      default: '#0A0E1A',
      paper: 'rgba(255, 255, 255, 0.04)',
    },
    text: {
      primary: 'rgba(255, 255, 255, 0.92)',
      secondary: 'rgba(255, 255, 255, 0.56)',
    },
    divider: 'rgba(255, 255, 255, 0.08)',
    error: { main: '#FF6B6B' },
    success: { main: '#4AEA8B' },
    warning: { main: '#FFD166' },
  },
  typography: {
    fontFamily: FONT_UI,
    h1: { fontFamily: FONT_READING, fontWeight: 400, letterSpacing: '-0.02em' },
    h2: { fontFamily: FONT_READING, fontWeight: 400, letterSpacing: '-0.01em' },
    h3: { fontFamily: FONT_READING, fontWeight: 400 },
    h4: { fontWeight: 400 },
    body1: { fontFamily: FONT_READING, fontWeight: 400, lineHeight: 1.8, letterSpacing: '0.01em' },
    body2: { fontFamily: FONT_UI, fontWeight: 300, letterSpacing: '0.02em' },
    button: { fontFamily: FONT_UI, fontWeight: 400, letterSpacing: '0.04em', textTransform: 'none' as const },
    caption: { fontFamily: FONT_UI, fontWeight: 300, letterSpacing: '0.03em' },
    overline: { fontFamily: FONT_UI, fontWeight: 400, letterSpacing: '0.08em' },
  },
  shape: { borderRadius: 20 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: 'transparent',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          ...GLASS_SURFACE,
          borderRadius: 20,
          transition: 'background-color 0.3s ease, border-color 0.3s ease',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            borderColor: 'rgba(255, 255, 255, 0.15)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          ...GLASS_SURFACE,
          boxShadow: 'none',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: 0,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          ...GLASS_SURFACE_ELEVATED,
          borderRadius: 24,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none' as const,
        },
        contained: {
          background: 'linear-gradient(135deg, #4AEADC, #B18CFF)',
          color: '#0A0E1A',
          fontWeight: 500,
          boxShadow: '0 0 20px rgba(74, 234, 220, 0.25)',
          '&:hover': {
            boxShadow: '0 0 30px rgba(74, 234, 220, 0.4)',
          },
        },
        outlined: {
          borderColor: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(8px)',
          '&:hover': {
            borderColor: 'rgba(255, 255, 255, 0.3)',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
          },
        },
        text: {
          color: 'rgba(255, 255, 255, 0.72)',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          color: 'rgba(255, 255, 255, 0.72)',
          fontFamily: FONT_UI,
          fontSize: '0.8125rem',
          '&.MuiChip-filled': {
            backgroundColor: 'rgba(255, 255, 255, 0.14)',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            color: 'rgba(255, 255, 255, 0.92)',
          },
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.10)',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(12px)',
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.2)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#4AEADC',
            boxShadow: '0 0 16px rgba(74, 234, 220, 0.15)',
          },
        },
        notchedOutline: {
          borderColor: 'rgba(255, 255, 255, 0.1)',
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #4AEADC, #B18CFF)',
          color: '#0A0E1A',
          boxShadow: '0 0 24px rgba(74, 234, 220, 0.3)',
          borderRadius: 16,
          '&:hover': {
            boxShadow: '0 0 36px rgba(74, 234, 220, 0.5)',
          },
        },
      },
    },
    MuiSnackbarContent: {
      styleOverrides: {
        root: {
          ...GLASS_SURFACE_ELEVATED,
        },
      },
    },
  },
});

// ═══════════════════════════════════════════════════════
//  LIGHT THEME — "Dawn / Opal"
// ═══════════════════════════════════════════════════════

const LIGHT_GLASS_SURFACE = {
  backgroundColor: 'rgba(255, 255, 255, 0.65)',
  backdropFilter: 'blur(20px) saturate(1.3)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.3)',
  border: '1px solid rgba(255, 255, 255, 0.5)',
  backgroundImage: 'none',
  boxShadow: '0 2px 16px rgba(0, 0, 0, 0.06)',
} as const;

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0D7377' },
    secondary: { main: '#6B4FA0' },
    background: {
      default: '#F8F6F4',
      paper: 'rgba(255, 255, 255, 0.72)',
    },
    text: {
      primary: '#1A1A2E',
      secondary: 'rgba(26, 26, 46, 0.56)',
    },
    divider: 'rgba(0, 0, 0, 0.08)',
    error: { main: '#D32F2F' },
    success: { main: '#2E7D32' },
    warning: { main: '#ED6C02' },
  },
  typography: {
    fontFamily: FONT_UI,
    h1: { fontFamily: FONT_READING, fontWeight: 400, letterSpacing: '-0.02em' },
    h2: { fontFamily: FONT_READING, fontWeight: 400, letterSpacing: '-0.01em' },
    h3: { fontFamily: FONT_READING, fontWeight: 400 },
    h4: { fontWeight: 400 },
    body1: { fontFamily: FONT_READING, fontWeight: 400, lineHeight: 1.8, letterSpacing: '0.01em' },
    body2: { fontFamily: FONT_UI, fontWeight: 400, letterSpacing: '0.02em' },
    button: { fontFamily: FONT_UI, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'none' as const },
  },
  shape: { borderRadius: 20 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: 'transparent',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          ...LIGHT_GLASS_SURFACE,
          borderRadius: 20,
          transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
          '&:hover': {
            borderColor: 'rgba(107, 79, 160, 0.2)',
            boxShadow: '0 4px 24px rgba(107, 79, 160, 0.08), 0 1px 3px rgba(0, 0, 0, 0.06)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          ...LIGHT_GLASS_SURFACE,
          boxShadow: 'none',
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
          borderRadius: 0,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 12, textTransform: 'none' as const },
        contained: {
          backgroundColor: '#0D7377',
          color: '#FFFFFF',
          boxShadow: '0 2px 8px rgba(13, 115, 119, 0.2)',
          '&:hover': {
            backgroundColor: '#0A5E62',
            boxShadow: '0 4px 12px rgba(13, 115, 119, 0.3)',
          },
        },
        outlined: {
          borderColor: 'rgba(0, 0, 0, 0.15)',
          '&:hover': {
            borderColor: 'rgba(13, 115, 119, 0.4)',
            backgroundColor: 'rgba(13, 115, 119, 0.04)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(0, 0, 0, 0.04)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          '&.MuiChip-filled': {
            backgroundColor: 'rgba(13, 115, 119, 0.1)',
            borderColor: 'rgba(13, 115, 119, 0.2)',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(8px)',
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#0D7377',
            boxShadow: '0 0 0 3px rgba(13, 115, 119, 0.1)',
          },
        },
        notchedOutline: {
          borderColor: 'rgba(0, 0, 0, 0.12)',
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          backgroundColor: '#0D7377',
          color: '#FFFFFF',
          boxShadow: '0 4px 16px rgba(13, 115, 119, 0.25)',
          borderRadius: 16,
          '&:hover': {
            backgroundColor: '#0A5E62',
          },
        },
      },
    },
  },
});
