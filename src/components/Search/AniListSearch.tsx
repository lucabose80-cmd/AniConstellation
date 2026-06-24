'use client';

import React, { useState, useEffect } from 'react';
import { Box, TextField, Grid, Card, CardMedia, CardContent, Typography, CircularProgress, CardActionArea } from '@mui/material';
import { searchMedia, AniListMedia } from '@/lib/anilist';
import { useDebounce } from '@/hooks/useDebounce';

export default function AniListSearch({ onSelect }: { onSelect: (id: number) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AniListMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    if (debouncedQuery.length < 3) {
      setResults([]);
      return;
    }
    let active = true;
    setLoading(true);
    searchMedia(debouncedQuery).then((data) => {
      if (active) {
        setResults(data);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [debouncedQuery]);

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
        Discover
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Search for Manga or Anime to track and compare.
      </Typography>
      
      <TextField
        fullWidth
        label="Search Anime or Manga..."
        variant="outlined"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        sx={{ mb: 4 }}
      />
      {loading && <CircularProgress sx={{ display: 'block', mx: 'auto', mb: 2 }} />}
      
      <Grid container spacing={3}>
        {results.map((media) => (
          <Grid item xs={6} sm={4} md={3} key={media.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardActionArea onClick={() => onSelect(media.id)} sx={{ flexGrow: 1 }}>
                <CardMedia
                  component="img"
                  height="300"
                  image={media.coverImage.large}
                  alt={media.title.romaji}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="bold" noWrap>
                    {media.title.romaji}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {media.type} • {media.status}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
