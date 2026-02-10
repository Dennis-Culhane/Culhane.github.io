// app/(public)/articles/ArticlesPagination.tsx

'use client';

import Box from '@mui/material/Box';
import Pagination from '@mui/material/Pagination';
import { useRouter } from 'next/navigation';

interface ArticlesPaginationProps {
  currentPage: number;
  totalPages: number;
  search: string;
  category: string;
}

export function ArticlesPagination({
  currentPage,
  totalPages,
  search,
  category,
}: ArticlesPaginationProps) {
  const router = useRouter();

  const handleChange = (_: React.ChangeEvent<unknown>, page: number) => {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (category) params.set('category', category);
    if (page > 1) params.set('page', String(page));
    const qs = params.toString();
    router.push(`/articles${qs ? `?${qs}` : ''}`);
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
      <Pagination
        count={totalPages}
        page={currentPage}
        onChange={handleChange}
        size="large"
        sx={{
          '& .MuiPaginationItem-root': {
            color: 'text.secondary',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            '&.Mui-selected': {
              backgroundColor: 'rgba(74, 234, 220, 0.15)',
              color: 'primary.main',
              borderColor: 'rgba(74, 234, 220, 0.3)',
            },
          },
        }}
      />
    </Box>
  );
}
