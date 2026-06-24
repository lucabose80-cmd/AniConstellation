'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, CardMedia, CircularProgress, Button, Chip, Paper, Divider } from '@mui/material';
import { getMediaDetails, AniListMedia } from '@/lib/anilist';
import { getJikanData, JikanData } from '@/lib/jikan';
import TrackingForm from './TrackingForm';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface MediaDetailProps {
  id: number;
  onBack: () => void;
  onNavigate?: (id: number) => void;
}

export default function MediaDetail({ id, onBack, onNavigate }: MediaDetailProps) {
  const [media, setMedia] = useState<AniListMedia | null>(null);
  const [jikanMetadata, setJikanMetadata] = useState<JikanData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchMedia = async () => {
      setLoading(true);
      try {
        const data = await getMediaDetails(id);
        if (active && data) {
          if (data.idMal) {
            const jData = await getJikanData(data.idMal, data.type as 'ANIME' | 'MANGA');
            if (jData.germanTitle) {
              data.title.english = jData.germanTitle;
            }
            setJikanMetadata(jData);
          }
          setMedia(data);
        }
      } catch (error) {
        console.error('Failed to fetch media', error);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchMedia();
    return () => { active = false; };
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
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <Chip label={media.type} color="primary" size="small" />
            <Chip label={media.status} variant="outlined" size="small" />
            <Chip label={media.format} variant="outlined" size="small" />
            {jikanMetadata?.score && (
              <Chip label={`MAL Score: ${jikanMetadata.score} ⭐`} color="secondary" size="small" />
            )}
          </Box>
          
          {(jikanMetadata?.synopsis || media.description) && (
            <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>Kurzbeschreibung</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ 
                display: '-webkit-box', 
                WebkitLineClamp: 4, 
                WebkitBoxOrient: 'vertical', 
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {jikanMetadata?.synopsis || media.description?.replace(/<[^>]*>?/gm, '')}
              </Typography>
            </Paper>
          )}

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
            type={media.type as 'ANIME' | 'MANGA'} 
            hasCounterpart={hasCounterpart} 
            counterpart={counterpart}
          />
        </Box>
      </Box>
    </Box>
  );
}
