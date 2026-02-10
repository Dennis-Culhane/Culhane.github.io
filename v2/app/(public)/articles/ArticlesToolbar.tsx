// app/(public)/articles/ArticlesToolbar.tsx

'use client';

import { useState, useCallback, type ChangeEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Box from '@mui/material/Box';
import { GlowSearchBar } from '@/components/ui/GlowSearchBar';
import { CategoryChips } from '@/components/articles/CategoryChips';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import type { Category } from '@/types';

interface ArticlesToolbarProps {
  categories: (Category & { count: number })[];
  initialSearch: string;
  initialCategory: string;
}

export function ArticlesToolbar({ categories, initialSearch, initialCategory }: ArticlesToolbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(initialSearch);
  const debouncedSearch = useDebouncedValue(search, 400);
  const [activeCategory, setActiveCategory] = useState(initialCategory);

  // Build URL and navigate when filter changes
  const navigate = useCallback(
    (params: { q?: string; category?: string }) => {
      const next = new URLSearchParams(searchParams.toString());

      if (params.q !== undefined) {
        if (params.q) next.set('q', params.q);
        else next.delete('q');
      }
      if (params.category !== undefined) {
        if (params.category) next.set('category', params.category);
        else next.delete('category');
      }
      // Reset to page 1 on filter change
      next.delete('page');

      const qs = next.toString();
      router.push(`/articles${qs ? `?${qs}` : ''}`);
    },
    [router, searchParams],
  );

  const handleSearchChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value);
    },
    [],
  );

  // Trigger navigation when debounced search changes
  // Use effect would be ideal but keeping it simple with onBlur + Enter
  const handleSearchSubmit = useCallback(() => {
    navigate({ q: search });
  }, [navigate, search]);

  const handleCategorySelect = useCallback(
    (slug: string) => {
      // Toggle: clicking the active category again deselects it (back to All)
      const next = activeCategory === slug ? '' : slug;
      setActiveCategory(next);
      navigate({ category: next });
    },
    [navigate, activeCategory],
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box
        component="form"
        onSubmit={(e: React.FormEvent) => {
          e.preventDefault();
          handleSearchSubmit();
        }}
      >
        <GlowSearchBar
          value={search}
          onChange={handleSearchChange}
          placeholder="Search by title, author, or keyword..."
        />
      </Box>
      <CategoryChips
        categories={categories}
        activeSlug={activeCategory}
        onSelect={handleCategorySelect}
      />
    </Box>
  );
}
