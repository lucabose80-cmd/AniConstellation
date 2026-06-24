'use client';

import { useAuth } from '@/hooks/useAuth';
import AuthUI from '@/components/Auth/AuthUI';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { auth } from '@/lib/firebase';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <AuthUI />;
  }

  return (
    <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <Typography variant="h3" color="primary" fontWeight="bold">Dashboard</Typography>
      <Typography variant="body1">Logged in as {user.email}</Typography>
      <Button variant="outlined" color="secondary" onClick={() => auth.signOut()}>
        Log Out
      </Button>
    </Box>
  );
}
