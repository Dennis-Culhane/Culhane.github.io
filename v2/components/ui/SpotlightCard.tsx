// components/ui/SpotlightCard.tsx

'use client';

import { useRef, type MouseEvent, type ReactNode } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import Card from '@mui/material/Card';
import type { SxProps, Theme } from '@mui/material/styles';

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  sx?: SxProps<Theme>;
}

export function SpotlightCard({ children, className, onClick, sx }: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springX = useSpring(mouseX, { stiffness: 200, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 200, damping: 30 });

  function handleMouseMove(event: MouseEvent) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(event.clientX - rect.left);
    mouseY.set(event.clientY - rect.top);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <Card
      ref={ref}
      component={motion.div}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={className}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          opacity: 0,
          transition: 'opacity 0.4s ease',
          background:
            'radial-gradient(400px circle at var(--spotlight-x, 0px) var(--spotlight-y, 0px), rgba(74, 234, 220, 0.08), transparent 60%)',
          pointerEvents: 'none',
          zIndex: 1,
        },
        '&:hover::before': {
          opacity: 1,
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          padding: '1px',
          opacity: 0,
          transition: 'opacity 0.4s ease',
          background:
            'radial-gradient(300px circle at var(--spotlight-x, 0px) var(--spotlight-y, 0px), rgba(74, 234, 220, 0.3), transparent 60%)',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor',
          pointerEvents: 'none',
          zIndex: 1,
        },
        '&:hover::after': {
          opacity: 1,
        },
        ...sx,
      }}
      style={
        {
          '--spotlight-x': `${springX.get()}px`,
          '--spotlight-y': `${springY.get()}px`,
        } as React.CSSProperties
      }
    >
      <div style={{ position: 'relative', zIndex: 2 }}>{children}</div>
    </Card>
  );
}
