// app/(public)/layout.tsx

import { GlassHeader } from '@/components/layout/GlassHeader';
import { GlassFooter } from '@/components/layout/GlassFooter';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GlassHeader />
      <main style={{ minHeight: '80vh', position: 'relative', zIndex: 1 }}>
        {children}
      </main>
      <GlassFooter />
    </>
  );
}
