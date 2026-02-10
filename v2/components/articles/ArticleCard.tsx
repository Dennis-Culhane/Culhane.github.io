// components/articles/ArticleCard.tsx

'use client';

import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { SpotlightCard } from '@/components/ui/SpotlightCard';

interface ArticleCardProps {
  title: string;
  authors: string;
  date: string | null;
  categories: string[];
  abstract: string;
  pdfUrl: string | null;
  slug: string;
}

export function ArticleCard({
  title,
  authors,
  date,
  categories,
  abstract,
  pdfUrl,
  slug,
}: ArticleCardProps) {
  const formattedDate = date
    ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
    : '';

  const truncatedAbstract =
    abstract.length > 200 ? `${abstract.slice(0, 200)}...` : abstract;

  return (
    <SpotlightCard
      onClick={() => {
        window.location.href = `/article/${slug}`;
      }}
      sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5, p: 3 }}>
        {/* Category chips */}
        {categories.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            {categories.slice(0, 3).map((cat) => (
              <Chip
                key={cat}
                label={cat}
                size="small"
                sx={{ fontSize: '0.7rem', height: 22 }}
              />
            ))}
          </Box>
        )}

        {/* Title */}
        <Typography
          variant="h6"
          component="h3"
          sx={{
            fontFamily: '"Merriweather", Georgia, serif',
            fontWeight: 400,
            fontSize: '1.05rem',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {title}
        </Typography>

        {/* Authors + Date */}
        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6 }}>
          {authors}
          {formattedDate && ` · ${formattedDate}`}
        </Typography>

        {/* Abstract preview */}
        {truncatedAbstract && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              flex: 1,
              lineHeight: 1.7,
              fontSize: '0.84rem',
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {truncatedAbstract}
          </Typography>
        )}

        {/* Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, mt: 'auto', pt: 1 }}>
          {pdfUrl && (
            <Tooltip title="Download PDF">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(pdfUrl, '_blank', 'noopener');
                }}
                sx={{
                  color: 'primary.main',
                  '&:hover': { backgroundColor: 'rgba(74, 234, 220, 0.1)' },
                }}
              >
                <PictureAsPdfIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="View details">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `/article/${slug}`;
              }}
              sx={{ color: 'text.secondary' }}
            >
              <OpenInNewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </CardContent>
    </SpotlightCard>
  );
}
