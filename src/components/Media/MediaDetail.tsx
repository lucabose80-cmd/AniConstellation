'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, CardMedia, CircularProgress, Button, Chip, Paper } from '@mui/material';
import { getMediaDetails, AniListMedia } from '@/lib/anilist';
import TrackingForm from './TrackingForm';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface MediaDetailProps {
  id: number;
  onBack: () => void;
  onNavigate?: (id: number) => void;
}

export default function MediaDetail({ id, onBack, onNavigate }: MediaDetailProps) {
  const [media, setMedia] = useState<AniListMedia | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMediaDetails(id).then((data) => {
      setMedia(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />;
  if (!media) return <Typography>Media not found</Typography>;

  // Get the most relevant counterpart (manga for anime, anime for manga)
  const counterpartEdge = media.relations?.edges?.find(e => 
    e.relationType === 'ADAPTATION' || e.relationType === 'SOURCE' || e.relationType === 'ALTERNATIVE'
  );
  
  const counterpart = counterpartEdge?.node;
  const hasCounterpart = !!counterpart;

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ mb: 2 }}>
        Zurück zur Map
      </Button>
      
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '300px 1fr' }, gap: 4 }}>
        <Box 
          component="img" 
          src={media.coverImage.large} 
          alt={media.title.english || media.title.romaji} 
          sx={{ width: '100%', borderRadius: 2, boxShadow: 3, objectFit: 'cover', alignSelf: 'start', maxHeight: { xs: 400, md: 'none' } }} 
        />
        
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }} gutterBottom>
            {media.title.english || media.title.romaji}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
            <Chip label={media.type} color="primary" size="small" />
            <Chip label={media.status} variant="outlined" size="small" />
            <Chip label={media.format} variant="outlined" size="small" />
          </Box>

          {counterpart && (
            <Paper 
              elevation={1} 
              sx={{ p: 2, mb: 4, bgcolor: 'background.paper', cursor: onNavigate && counterpart.id ? 'pointer' : 'default', '&:hover': onNavigate && counterpart.id ? { bgcolor: 'action.hover' } : {} }}
              onClick={() => {
                if (onNavigate && counterpart.id) {
                  onNavigate(counterpart.id);
                }
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Pendant vorhanden ({counterpart.type})
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {counterpart.title.english || counterpart.title.romaji}
              </Typography>
            </Paper>
          )}

          <TrackingForm 
            mediaId={media.id} 
            title={media.title.english || media.title.romaji}
            coverImage={media.coverImage.large}
            type={media.type} 
            hasCounterpart={hasCounterpart} 
          />
        </Box>
      </Box>
    </Box>
  );
}
