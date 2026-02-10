// app/(public)/article/[slug]/CopyLinkButton.tsx

'use client';

import { useState, useCallback } from 'react';
import Button from '@mui/material/Button';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';

interface CopyLinkButtonProps {
  slug: string;
}

export function CopyLinkButton({ slug }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const url = `${window.location.origin}/article/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [slug]);

  return (
    <Button
      variant="outlined"
      size="medium"
      startIcon={copied ? <CheckIcon /> : <ContentCopyIcon />}
      onClick={handleCopy}
    >
      {copied ? 'Copied!' : 'Copy Link'}
    </Button>
  );
}
