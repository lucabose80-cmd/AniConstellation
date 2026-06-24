'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AuthUI from '@/components/Auth/AuthUI';
import AniListSearch from '@/components/Search/AniListSearch';
import MediaDetail from '@/components/Media/MediaDetail';
import { Box, Typography, Button, CircularProgress, AppBar, Toolbar } from '@mui/material';
import { auth } from '@/lib/firebase';

export default function Home() {
  const { user, loading } = useAuth();
  const [selectedMediaId, setSelectedMediaId] = useState<number | null>(null);

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
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6" color="primary" fontWeight="bold">
            AniConstellation
          </Typography>
          <Button variant="outlined" color="inherit" onClick={() => auth.signOut()}>
            Log Out
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
        {selectedMediaId ? (
          <MediaDetail 
            id={selectedMediaId} 
            onBack={() => setSelectedMediaId(null)} 
          />
        ) : (
          <AniListSearch onSelect={setSelectedMediaId} />
        )}
      </Box>
    </Box>
  );
}
