// components/ui/AuroraBackground.tsx
// Renders only after client hydration to avoid SSR/CSR mismatch
// with Emotion's injected <style> tags.

'use client';

import { useState, useEffect } from 'react';
import styles from './AuroraBackground.module.css';

export function AuroraBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <div className={styles.aurora} aria-hidden="true" />
      <div className={styles.grain} aria-hidden="true" />
    </>
  );
}
