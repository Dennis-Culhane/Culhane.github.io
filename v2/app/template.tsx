// app/template.tsx
// Page transition animation — renders plain content during SSR,
// wraps with framer-motion only after client hydration completes.

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function Template({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return <div>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, filter: 'blur(8px)', y: 12 }}
      animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
}
