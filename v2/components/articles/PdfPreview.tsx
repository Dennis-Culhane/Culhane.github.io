// components/articles/PdfPreview.tsx

'use client';

import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

interface PdfPreviewProps {
  url: string;
  title?: string;
}

/**
 * Embedded PDF preview using Google Docs Viewer (same approach as v1).
 * Falls back to an error message if the viewer fails to load.
 */
export function PdfPreview({ url, title = 'PDF Preview' }: PdfPreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: { xs: 450, sm: 600, md: 'calc(100vh - 120px)' },
        borderRadius: 3,
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      {/* Loading overlay */}
      {isLoading && !hasError && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            zIndex: 1,
          }}
        >
          <CircularProgress size={32} sx={{ color: 'primary.main' }} />
          <Typography variant="body2" color="text.secondary">
            Loading PDF...
          </Typography>
        </Box>
      )}

      {/* Error state */}
      {hasError && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            zIndex: 1,
          }}
        >
          <Typography variant="body2" color="error.main">
            Failed to load PDF preview.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Please use the download button instead.
          </Typography>
        </Box>
      )}

      {/* Google Docs Viewer iframe */}
      {!hasError && (
        <iframe
          src={googleViewerUrl}
          title={title}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: 'inherit',
            display: isLoading ? 'none' : 'block',
          }}
          allowFullScreen
        />
      )}
    </Box>
  );
}
