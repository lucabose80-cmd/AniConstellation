'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, CardMedia, CircularProgress, Button, Chip } from '@mui/material';
import { getMediaDetails, AniListMedia } from '@/lib/anilist';
import TrackingForm from './TrackingForm';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function MediaDetail({ id, onBack }: { id: number, onBack: () => void }) {
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

  // Check relations for SOURCE or ADAPTATION
  const counterpartEdge = media.relations?.edges.find(e => 
    e.relationType === 'SOURCE' || e.relationType === 'ADAPTATION'
  );
  
  const hasCounterpart = !!counterpartEdge;
  const counterpartNode = counterpartEdge?.node;

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ mb: 3 }}>
        Back to Search
      </Button>
      
      <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', md: 'row' } }}>
        <CardMedia
          component="img"
          image={media.coverImage.large}
          alt={media.title.romaji}
          sx={{ width: { xs: '100%', md: 300 }, borderRadius: 3, objectFit: 'cover' }}
        />
        
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }} gutterBottom>
            {media.title.romaji}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
            <Chip label={media.type} color="primary" />
            <Chip label={media.status} variant="outlined" />
            <Chip label={media.format} variant="outlined" />
          </Box>

          {hasCounterpart && counterpartNode && (
            <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, mb: 3 }}>
              <Typography variant="subtitle2" color="secondary" gutterBottom>
                Counterpart exists ({counterpartNode.type})
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {counterpartNode.title.romaji}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Status: {counterpartNode.status}
              </Typography>
            </Box>
          )}

          <TrackingForm 
            mediaId={media.id} 
            title={media.title.romaji}
            coverImage={media.coverImage.large}
            type={media.type} 
            hasCounterpart={hasCounterpart} 
          />
        </Box>
      </Box>
    </Box>
  );
}
