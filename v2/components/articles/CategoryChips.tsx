// components/articles/CategoryChips.tsx

'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import type { Category } from '@/types';

interface CategoryChipsProps {
  categories: (Category & { count: number })[];
  activeSlug: string;
  onSelect: (slug: string) => void;
}

export function CategoryChips({ categories, activeSlug, onSelect }: CategoryChipsProps) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
      <Chip
        label="All"
        variant={activeSlug === '' ? 'filled' : 'outlined'}
        onClick={() => onSelect('')}
        sx={{ fontWeight: activeSlug === '' ? 500 : 300 }}
      />
      {categories.map((cat) => (
        <Chip
          key={cat.id}
          label={`${cat.name} (${cat.count})`}
          variant={activeSlug === cat.slug ? 'filled' : 'outlined'}
          onClick={() => onSelect(cat.slug)}
          sx={{ fontWeight: activeSlug === cat.slug ? 500 : 300 }}
        />
      ))}
    </Box>
  );
}
