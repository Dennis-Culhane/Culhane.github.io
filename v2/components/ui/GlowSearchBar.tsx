// components/ui/GlowSearchBar.tsx

'use client';

import { useState, type ChangeEvent } from 'react';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import { motion } from 'framer-motion';

interface GlowSearchBarProps {
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}

export function GlowSearchBar({
  value,
  onChange,
  placeholder = 'Search by title, author, or keyword...',
}: GlowSearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <motion.div
      animate={{
        boxShadow: isFocused
          ? '0 0 40px rgba(74, 234, 220, 0.15), 0 0 80px rgba(177, 140, 255, 0.08)'
          : '0 0 0px transparent',
      }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{ borderRadius: 28 }}
    >
      <TextField
        fullWidth
        variant="outlined"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon
                  sx={{
                    color: isFocused ? '#4AEADC' : 'text.secondary',
                    transition: 'color 0.3s ease',
                  }}
                />
              </InputAdornment>
            ),
          },
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '28px',
            height: 52,
          },
        }}
      />
    </motion.div>
  );
}
