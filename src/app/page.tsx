'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AuthUI from '@/components/Auth/AuthUI';
import AniListSearch from '@/components/Search/AniListSearch';
import MediaDetail from '@/components/Media/MediaDetail';
import DiscoveryDialog from '@/components/Discovery/DiscoveryDialog';
import CompareModal from '@/components/Media/CompareModal';
import dynamic from 'next/dynamic';

const ConstellationMap = dynamic(() => import('@/components/Map/ConstellationMap'), { 
  ssr: false, 
  loading: () => <CircularProgress /> 
});
import { Box, Typography, AppBar, Toolbar, Button, IconButton, CircularProgress, Paper, Select, MenuItem, Fab } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MapIcon from '@mui/icons-material/Map';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { auth } from '@/lib/firebase';
import { getAllTrackingData, TrackingData } from '@/lib/tracking';
import { getJikanData } from '@/lib/jikan';
import { AniListMedia } from '@/lib/anilist';

export default function Home() {
  const { user, loading } = useAuth();
  const [selectedMediaId, setSelectedMediaId] = useState<number | null>(null);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [trackingData, setTrackingData] = useState<TrackingData[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  
  const [isDiscoveryOpen, setIsDiscoveryOpen] = useState(false);
  const [recommendations, setRecommendations] = useState<AniListMedia[]>([]);
  const [mapFilter, setMapFilter] = useState<'GENRES' | 'ROMANCE' | 'RATING' | 'ALL' | 'SOURCE'>('ALL');

  const [isCompareMode, setIsCompareMode] = useState(false);
  const [compareNodes, setCompareNodes] = useState<number[]>([]);

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
    <Box sx={{ height: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
              AniConstellation
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium' }}>
              {trackingData.filter(d => d.type === 'ANIME').length} Anime • {trackingData.filter(d => d.type === 'MANGA').length} Manga
            </Typography>
          </Box>
          <Box>
            <Button 
              variant={isCompareMode ? "contained" : "outlined"}
              color="primary"
              onClick={() => {
                setIsCompareMode(!isCompareMode);
                setCompareNodes([]);
              }}
              sx={{ mr: 2, borderRadius: '100px' }}
            >
              {isCompareMode ? 'Vergleich Beenden' : 'Vergleichen'}
            </Button>
            <Button 
              variant="contained" 
              color="secondary" 
              startIcon={<AutoAwesomeIcon />}
              onClick={() => setIsDiscoveryOpen(true)}
              sx={{ mr: 2, borderRadius: '100px' }}
            >
              Discovery
            </Button>
            <Button variant="outlined" color="inherit" onClick={() => auth.signOut()}>
              Log Out
            </Button>
          </Box>
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
              onNavigate={(id) => setSelectedMediaId(id)}
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
          <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
            {/* Map Controls Panel */}
            <Paper elevation={4} sx={{ position: 'absolute', top: 16, left: 16, zIndex: 10, p: 2, borderRadius: 2, bgcolor: 'background.paper', width: 250 }}>
              <Typography variant="subtitle2" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>
                Konstellations-Filter
              </Typography>
              <Select
                fullWidth
                size="small"
                value={mapFilter}
                onChange={(e) => setMapFilter(e.target.value as any)}
                sx={{ mb: 2 }}
              >
                <MenuItem value="ALL">Alle Verbindungen</MenuItem>
                <MenuItem value="GENRES">Ähnliche Genres</MenuItem>
                <MenuItem value="ROMANCE">Gleiches Romance-Level</MenuItem>
                <MenuItem value="RATING">Ähnliche Top-Bewertung</MenuItem>
                <MenuItem value="SOURCE">Nach Quelle (Anime/Manga)</MenuItem>
              </Select>

              {recommendations.length > 0 && (
                <Button 
                  fullWidth 
                  variant="outlined" 
                  color="warning" 
                  size="small"
                  onClick={() => setRecommendations([])}
                >
                  Empfehlungen ausblenden
                </Button>
              )}
            </Paper>

            {dataLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
              </Box>
            ) : (
              <ConstellationMap 
                trackingData={trackingData} 
                recommendations={recommendations}
                onNodeClick={(id) => {
                  if (isCompareMode) {
                    const newNodes = [...compareNodes, id];
                    setCompareNodes(newNodes);
                  } else {
                    setSelectedMediaId(id);
                  }
                }} 
                filterBy={mapFilter}
              />
            )}

            {isCompareMode && (
              <Paper elevation={4} sx={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 10, p: 2, borderRadius: 2, bgcolor: 'primary.main', color: '#fff' }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {compareNodes.length === 0 ? "Klicke auf das erste Werk für den Vergleich" : "Klicke auf das zweite Werk"}
                </Typography>
              </Paper>
            )}

            <CompareModal 
              open={compareNodes.length === 2} 
              mediaIds={compareNodes} 
              onClose={() => {
                setIsCompareMode(false);
                setCompareNodes([]);
                fetchTrackingData();
              }} 
            />
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

      {user && (
        <DiscoveryDialog 
          open={isDiscoveryOpen} 
          onClose={() => setIsDiscoveryOpen(false)} 
          trackedMedia={trackingData}
          onRecommendationsGenerated={async (recs: AniListMedia[]) => {
            try {
              const enrichedRecs = await Promise.all(recs.map(async (rec) => {
                if (rec.idMal) {
                  const jData = await getJikanData(rec.idMal, rec.type as 'ANIME' | 'MANGA');
                  if (jData.germanTitle) {
                    rec.title.english = jData.germanTitle;
                  }
                }
                return rec;
              }));
              setRecommendations(enrichedRecs);
              setSelectedMediaId(null);
              setIsSearchMode(false);
            } catch (e) {
              console.error(e);
            } finally {
              setIsDiscoveryOpen(false);
              setDataLoading(false);
            }
          }}
        />
      )}
    </Box>
  );
}
