'use client';

import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Paper, CircularProgress } from '@mui/material';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function AuthUI() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', p: 2 }}>
      <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 3, borderRadius: 3 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }} color="primary">
            AniConstellation
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Logge dich ein oder registriere dich, um deine Anime und Manga zu tracken und deine eigene Sternenkarte zu erstellen.
          </Typography>
        </Box>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <TextField
            label="E-Mail"
            type="email"
            variant="outlined"
            fullWidth
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Passwort"
            type="password"
            variant="outlined"
            fullWidth
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          
          {error && <Typography color="error" variant="body2">{error}</Typography>}

          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            disabled={loading}
            sx={{ mt: 1, py: 1.5, fontWeight: 'bold' }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : (isLogin ? 'Login' : 'Registrieren')}
          </Button>
        </form>

        <Box sx={{ textAlign: 'center', mt: 1 }}>
          <Button color="secondary" onClick={() => setIsLogin(!isLogin)} sx={{ textTransform: 'none', fontWeight: 'bold' }}>
            {isLogin ? "Noch kein Account? Registrieren" : "Bereits einen Account? Login"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
