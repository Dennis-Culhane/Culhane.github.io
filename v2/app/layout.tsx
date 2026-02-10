// app/layout.tsx

import type { Metadata } from 'next';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeRegistry } from '@/lib/ThemeRegistry';
import { AuroraBackground } from '@/components/ui/AuroraBackground';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Culhane Digital Library',
    template: '%s | Culhane Library',
  },
  description:
    'Research publications by Dennis P. Culhane — homelessness, housing policy, and integrated data systems.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Merriweather:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <AppRouterCacheProvider options={{ key: 'mui' }}>
          <ThemeRegistry>
            <AuroraBackground />
            {children}
          </ThemeRegistry>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
