'use client';

import React, { useState, useEffect } from 'react';
import { Box, TextField, Card, CardContent, CardMedia, Typography, CircularProgress, CardActionArea, InputAdornment, ToggleButton, ToggleButtonGroup } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { searchMedia, AniListMedia } from '@/lib/anilist';

interface AniListSearchProps {
  onSelect: (id: number) => void;
}

export default function AniListSearch({ onSelect }: AniListSearchProps) {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'ANIME' | 'MANGA'>('ANIME');
  const [results, setResults] = useState<AniListMedia[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim()) {
        setLoading(true);
        const data = await searchMedia(query, type);
        setResults(data);
        setLoading(false);
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query, type]);

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold' }} color="primary" gutterBottom>
        Entdecke Werke
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
        <TextField
          fullWidth
          label="Titel suchen..."
          variant="outlined"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ flexGrow: 1, minWidth: 200 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }
          }}
        />
        <ToggleButtonGroup
          color="primary"
          value={type}
          exclusive
          onChange={(e, newType) => {
            if (newType !== null) setType(newType);
          }}
          aria-label="Media Type"
        >
          <ToggleButton value="ANIME">Anime</ToggleButton>
          <ToggleButton value="MANGA">Manga</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {loading && <CircularProgress sx={{ display: 'block', mx: 'auto', mb: 2 }} />}
      
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3 }}>
        {results.map((media) => (
          <Box key={media.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardActionArea onClick={() => onSelect(media.id)} sx={{ flexGrow: 1 }}>
                <CardMedia
                  component="img"
                  height="300"
                  image={media.coverImage.large}
                  alt={media.title.english || media.title.romaji}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} noWrap>
                    {media.title.english || media.title.romaji}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {media.type} • {media.status}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
