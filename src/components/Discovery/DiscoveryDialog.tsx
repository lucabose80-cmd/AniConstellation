'use client';

import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, List, ListItem, ListItemButton, ListItemAvatar, Avatar, ListItemText, Checkbox, Typography, Box, CircularProgress } from '@mui/material';
import { TrackingData } from '@/lib/tracking';
import { AniListMedia } from '@/lib/anilist';
import { generateRecommendations } from '@/lib/recommendation';

interface DiscoveryDialogProps {
  open: boolean;
  onClose: () => void;
  trackedMedia: TrackingData[];
  onRecommendationsGenerated: (recs: AniListMedia[]) => void;
}

export default function DiscoveryDialog({ open, onClose, trackedMedia, onRecommendationsGenerated }: DiscoveryDialogProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);

  const handleToggle = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      if (newSelected.size < 10) {
        newSelected.add(id);
      }
    }
    setSelectedIds(newSelected);
  };

  const handleGenerate = async () => {
    setLoading(true);
    const selectedMedia = trackedMedia.filter(m => selectedIds.has(m.mediaId));
    
    try {
      const recs = await generateRecommendations(selectedMedia, trackedMedia);
      onRecommendationsGenerated(recs);
    } catch (error) {
      console.error('Failed to generate recommendations', error);
    } finally {
      setLoading(false);
      onClose();
    }
  };

  // Sort tracked media by score so user can easily pick their favorites
  const sortedMedia = [...trackedMedia].sort((a, b) => 
    (b.evaluation?.overallScore || 0) - (a.evaluation?.overallScore || 0)
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold' }} color="primary">Generate Constellations</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Select up to 10 of your favorite tracked works. We will analyze their genres and your scores to discover new recommendations for your constellation.
        </Typography>
        <Typography variant="subtitle2" color="primary" sx={{ mt: 2, mb: 1 }}>
          Selected: {selectedIds.size} / 10
        </Typography>
        
        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
          {sortedMedia.map((media) => (
            <ListItem
              key={media.mediaId}
              disablePadding
            >
              <ListItemButton role={undefined} onClick={() => handleToggle(media.mediaId)} dense>
                <Checkbox
                  edge="start"
                  checked={selectedIds.has(media.mediaId)}
                  tabIndex={-1}
                  disableRipple
                />
                <ListItemAvatar>
                  <Avatar alt={media.title} src={media.coverImage} variant="rounded" />
                </ListItemAvatar>
                <ListItemText 
                  primary={media.title} 
                  secondary={`Score: ${media.evaluation?.overallScore || 'N/A'}`} 
                />
              </ListItemButton>
            </ListItem>
          ))}
          {sortedMedia.length === 0 && (
            <Typography variant="body2" sx={{ p: 2, textAlign: 'center' }}>
              You haven't tracked any works yet. Track some before using Discovery!
            </Typography>
          )}
        </List>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>Cancel</Button>
        <Button 
          onClick={handleGenerate} 
          variant="contained" 
          disabled={selectedIds.size === 0 || loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {loading ? 'Discovering...' : 'Generate Recommendations'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
