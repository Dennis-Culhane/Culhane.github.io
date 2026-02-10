// app/admin/page.tsx

import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

export const metadata = {
  title: 'Admin Dashboard',
};

export default function AdminDashboardPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Stats cards and management overview. Coming in Phase 3.
      </Typography>
    </Container>
  );
}
