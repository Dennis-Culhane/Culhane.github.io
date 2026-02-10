// app/admin/login/page.tsx

import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

export const metadata = {
  title: 'Admin Login',
};

export default function AdminLoginPage() {
  return (
    <Container maxWidth="xs" sx={{ py: 12, textAlign: 'center' }}>
      <Typography variant="h4" gutterBottom>
        Admin Login
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Supabase Auth login form. Coming in Phase 3.
      </Typography>
    </Container>
  );
}
