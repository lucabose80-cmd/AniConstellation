'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AuthUI from '@/components/Auth/AuthUI';
import AniListSearch from '@/components/Search/AniListSearch';
import MediaDetail from '@/components/Media/MediaDetail';
import ConstellationMap from '@/components/Map/ConstellationMap';
import { Box, Typography, Button, CircularProgress, AppBar, Toolbar, Fab } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MapIcon from '@mui/icons-material/Map';
import { auth } from '@/lib/firebase';
import { getAllTrackingData, TrackingData } from '@/lib/tracking';

export default function Home() {
  const { user, loading } = useAuth();
  const [selectedMediaId, setSelectedMediaId] = useState<number | null>(null);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [trackingData, setTrackingData] = useState<TrackingData[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  const fetchTrackingData = async () => {
    if (user) {
      setDataLoading(true);
      const data = await getAllTrackingData(user.uid);
      setTrackingData(data);
      setDataLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackingData();
  }, [user]);

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
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
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

      <Box sx={{ position: 'relative', flexGrow: 1, overflow: 'hidden' }}>
        {selectedMediaId ? (
          <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto', height: '100%', overflow: 'auto' }}>
            <MediaDetail 
              id={selectedMediaId} 
              onBack={() => {
                setSelectedMediaId(null);
                fetchTrackingData();
              }} 
            />
          </Box>
        ) : isSearchMode ? (
          <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto', height: '100%', overflow: 'auto' }}>
            <AniListSearch onSelect={(id) => {
              setSelectedMediaId(id);
              setIsSearchMode(false);
            }} />
          </Box>
        ) : (
          <Box sx={{ width: '100%', height: '100%' }}>
            {dataLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
              </Box>
            ) : (
              <ConstellationMap 
                trackingData={trackingData} 
                onNodeClick={(id) => setSelectedMediaId(id)} 
              />
            )}
          </Box>
        )}

        {!selectedMediaId && (
          <Fab 
            color="primary" 
            sx={{ position: 'absolute', bottom: 32, right: 32 }}
            onClick={() => setIsSearchMode(!isSearchMode)}
          >
            {isSearchMode ? <MapIcon /> : <SearchIcon />}
          </Fab>
        )}
      </Box>
    </Box>
  );
}
