'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Select, MenuItem, FormControl, InputLabel, Button, Slider, CircularProgress } from '@mui/material';
import { saveTrackingData, getTrackingData, TrackingData } from '@/lib/tracking';
import { useAuth } from '@/hooks/useAuth';

interface TrackingFormProps {
  mediaId: number;
  type: 'ANIME' | 'MANGA';
  hasCounterpart: boolean;
}

export default function TrackingForm({ mediaId, type, hasCounterpart }: TrackingFormProps) {
  const { user } = useAuth();
  const [status, setStatus] = useState<'PLANNING' | 'CURRENT' | 'COMPLETED' | 'DROPPED'>('PLANNING');
  const [storyAdaptation, setStoryAdaptation] = useState<number>(5);
  const [pacing, setPacing] = useState<number>(5);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    getTrackingData(user.uid, mediaId).then((data) => {
      if (data) {
        setStatus(data.status);
        if (data.adaptationScores) {
          setStoryAdaptation(data.adaptationScores.storyAdaptation);
          setPacing(data.adaptationScores.pacing);
        }
      }
      setLoading(false);
    });
  }, [user, mediaId]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const data: TrackingData = {
      mediaId,
      type,
      status,
      updatedAt: Date.now()
    };
    if (hasCounterpart) {
      data.adaptationScores = { storyAdaptation, pacing };
    }
    await saveTrackingData(user.uid, data);
    setSaving(false);
  };

  if (loading) return <CircularProgress />;

  return (
    <Box sx={{ mt: 3, p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>Track this {type}</Typography>
      
      <FormControl fullWidth sx={{ mt: 2 }}>
        <InputLabel>Status</InputLabel>
        <Select
          value={status}
          label="Status"
          onChange={(e) => setStatus(e.target.value as any)}
        >
          <MenuItem value="PLANNING">Planning</MenuItem>
          <MenuItem value="CURRENT">Current</MenuItem>
          <MenuItem value="COMPLETED">Completed</MenuItem>
          <MenuItem value="DROPPED">Dropped</MenuItem>
        </Select>
      </FormControl>

      {hasCounterpart && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary">
            Adaptation Comparison (Cross-Tracking)
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Since the counterpart exists, how would you rate the adaptation?
          </Typography>
          
          <Typography gutterBottom sx={{ mt: 2 }}>Story Adaptation (1-10)</Typography>
          <Slider
            value={storyAdaptation}
            min={1}
            max={10}
            step={1}
            marks
            valueLabelDisplay="auto"
            onChange={(_, val) => setStoryAdaptation(val as number)}
          />

          <Typography gutterBottom sx={{ mt: 2 }}>Pacing (1-10)</Typography>
          <Slider
            value={pacing}
            min={1}
            max={10}
            step={1}
            marks
            valueLabelDisplay="auto"
            onChange={(_, val) => setPacing(val as number)}
          />
        </Box>
      )}

      <Button
        variant="contained"
        color="primary"
        fullWidth
        sx={{ mt: 4, py: 1.5, fontWeight: 'bold' }}
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? <CircularProgress size={24} color="inherit" /> : 'Save Tracking Data'}
      </Button>
    </Box>
  );
}
