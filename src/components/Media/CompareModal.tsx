'use client';

import React from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MediaDetail from './MediaDetail';

interface CompareModalProps {
  open: boolean;
  mediaIds: number[];
  onClose: () => void;
  onNavigate?: (id: number) => void;
}

export default function CompareModal({ open, mediaIds, onClose, onNavigate }: CompareModalProps) {
  if (mediaIds.length !== 2) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="xl" 
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          height: '90vh',
          bgcolor: 'background.default',
        }
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
        Direktvergleich
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ color: (theme) => theme.palette.grey[500] }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', height: '100%' }}>
          <Box sx={{ flex: 1, height: '100%', overflowY: 'auto', borderRight: 1, borderColor: 'divider', p: 3 }}>
            <MediaDetail id={mediaIds[0]} onBack={() => {}} onNavigate={onNavigate} />
          </Box>
          <Box sx={{ flex: 1, height: '100%', overflowY: 'auto', p: 3 }}>
            <MediaDetail id={mediaIds[1]} onBack={() => {}} onNavigate={onNavigate} />
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
