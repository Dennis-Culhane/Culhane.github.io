// app/admin/layout.tsx

import Box from '@mui/material/Box';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* GlassRail navigation — Phase 3 */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        {children}
      </Box>
    </Box>
  );
}
