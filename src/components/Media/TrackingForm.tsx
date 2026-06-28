'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Select, MenuItem, FormControl, InputLabel, Button, Slider, CircularProgress, Tabs, Tab, Chip, OutlinedInput, Paper, Checkbox, TextField } from '@mui/material';
import { saveTrackingData, getTrackingData, deleteTrackingData, TrackingData } from '@/lib/tracking';
import { useAuth } from '@/hooks/useAuth';

interface TrackingFormProps {
  mediaId: number;
  title: string;
  coverImage: string;
  type: 'ANIME' | 'MANGA';
  hasCounterpart: boolean;
  counterpart?: {
    id: number;
    title: { english?: string | null; romaji: string };
    type: string;
  };
  onSaved?: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const GENRES_LIST = ["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Isekai", "Mecha", "Mystery", "Psychological", "Romance", "Sci-Fi", "Slice of Life", "Sports", "Supernatural", "Thriller"];
const ROMANCE_LEVELS = ["Keine", "Angedeutet", "Subplot", "Hauptfokus"];
const CONFESSION_TIMINGS = ["Early", "Middle", "End", "Never", "N/A"];
const INTIMACY_LEVELS = ["None", "Händchen halten", "Umarmen", "Küssen", "Sex"];
const EMOTIONAL_IMPACTS = ["Keine", "Leicht", "Mitgenommen", "Tränen ausgelöst"];

export default function TrackingForm({ mediaId, title, coverImage, type, hasCounterpart, counterpart, onSaved }: TrackingFormProps) {
  const { user } = useAuth();
  
  // UI State
  const [tabIndex, setTabIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Status State
  const [status, setStatus] = useState<'PLANNING' | 'CURRENT' | 'COMPLETED' | 'DROPPED' | 'NONE'>('PLANNING');
  const [counterpartStatus, setCounterpartStatus] = useState<'NONE' | 'PLANNING' | 'CURRENT' | 'COMPLETED' | 'DROPPED'>('NONE');
  const [syncCounterpart, setSyncCounterpart] = useState<boolean>(false);
  const [readAdaptation, setReadAdaptation] = useState<boolean>(true);
  const [adaptationScores, setAdaptationScores] = useState({ story: 5, pacing: 5 });

  // Classification State
  const [genres, setGenres] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [secondaryTags, setSecondaryTags] = useState<string[]>([]);
  const [characterTropes, setCharacterTropes] = useState<string[]>([]);
  const [demography, setDemography] = useState<string>('');
  const [lengthStr, setLengthStr] = useState<string>('');
  const [romanceLevel, setRomanceLevel] = useState<string>('Keine');
  const [confessionTiming, setConfessionTiming] = useState<string>('N/A');
  const [intimacyLevel, setIntimacyLevel] = useState<string>('None');
  const [relationshipDynamics, setRelationshipDynamics] = useState<string[]>([]);
  const [wholesomeLewdScale, setWholesomeLewdScale] = useState<number>(5);
  const [comedySeriousScale, setComedySeriousScale] = useState<number>(5);
  const [actionDialogScale, setActionDialogScale] = useState<number>(5);
  const [pacingScale, setPacingScale] = useState<number>(5);

  const [malSynced, setMalSynced] = useState<boolean>(false);

  // Qualitative State (1-10)
  const [evalPlotAndStory, setEvalPlotAndStory] = useState<number>(5);
  const [evalCastAndCharacters, setEvalCastAndCharacters] = useState<number>(5);
  const [evalArtstyleAndAnimation, setEvalArtstyleAndAnimation] = useState<number>(5);
  const [evalAudioAndMusic, setEvalAudioAndMusic] = useState<number>(5);
  const [evalEnding, setEvalEnding] = useState<number>(5);
  const [evalRomanceAndChemistry, setEvalRomanceAndChemistry] = useState<number>(5);
  const [evalBingeFactor, setEvalBingeFactor] = useState<number>(5);
  const [emotionalImpact, setEmotionalImpact] = useState<string>('Keine');
  const [comments, setComments] = useState<string>('');

  const EMOTIONAL_IMPACTS = ['Keine', 'Leicht', 'Mitgenommen', 'Tränen nah', 'Tränen ausgelöst'];
  const RELATIONSHIP_DYNAMICS = ['Enemies to Lovers', 'Childhood Friends', 'Slow Burn', 'Harem', 'Love Triangle', 'Arranged Marriage', 'Student/Teacher', 'Rivals', 'Andere'];
  const CHAR_TROPES = ['Protag ist unbeliebt', 'Protag ist beliebt', 'Mangelndes Selbstwertgefühl', 'Overpowered MC', 'Tsundere', 'Yandere', 'Kuudere', 'Dandere', 'Chuunibyou'];
  const DEMOGRAPHICS = ['Shounen', 'Seinen', 'Shoujo', 'Josei', 'Kids', 'N/A'];
  const TAGS_LIST = ['Time Travel', 'Isekai', 'School Life', 'Mecha', 'Magic', 'Supernatural', 'Psychological', 'Cyberpunk', 'Post-Apocalyptic', 'Slice of Life', 'Mystery', 'Thriller', 'Historical', 'Military', 'Sports', 'Music', 'CGDCT', 'Found Family', 'Revenge', 'Coming of Age', 'Death Game', 'Gore', 'Dark Fantasy'];


  const calculateOverallScore = () => {
    // Base Weights (max score sum = 10)
    // Plot(2.5), Characters(2.5), Art(1.5), Audio(1.0 - nur Anime), Binge(1.5), Ending(1.0)
    let maxBase = 0;
    let currentScore = 0;
    
    currentScore += evalPlotAndStory * 2.5; maxBase += 25;
    currentScore += evalCastAndCharacters * 2.5; maxBase += 25;
    currentScore += evalArtstyleAndAnimation * 1.5; maxBase += 15;
    
    if (type === 'ANIME') {
      currentScore += evalAudioAndMusic * 1.0; maxBase += 10;
    }
    
    currentScore += evalBingeFactor * 1.5; maxBase += 15;
    
    if (status !== 'CURRENT') {
      currentScore += evalEnding * 1.0; maxBase += 10;
    }

    if (romanceLevel !== 'Keine' && romanceLevel !== 'Angedeutet') {
      currentScore += evalRomanceAndChemistry * 1.0; maxBase += 10;
    }
    
    let finalScore = (currentScore / maxBase) * 10.0;

    // Emotional Leverage
    let emotionalBonus = 0;
    if (emotionalImpact === 'Leicht') emotionalBonus = 0.1;
    if (emotionalImpact === 'Mitgenommen') emotionalBonus = 0.3;
    if (emotionalImpact === 'Tränen nah') emotionalBonus = 0.7;
    if (emotionalImpact === 'Tränen ausgelöst') emotionalBonus = 1.2;

    finalScore += emotionalBonus;
    if (finalScore > 10) finalScore = 10;
    
    return Number(finalScore.toFixed(1));
  };
  const overallScore = calculateOverallScore().toFixed(1);

  useEffect(() => {
    if (!user) return;
    getTrackingData(user.uid, mediaId).then((data) => {
      if (data) {
        setStatus(data.status);
        if (data.adaptationScores) {
          setAdaptationScores(data.adaptationScores);
        }
        if (data.classification) {
          setGenres(data.classification.genres || []);
          setTags(data.classification.tags || []);
          setSecondaryTags(data.classification.secondaryTags || []);
          setCharacterTropes(data.classification.characterTropes || []);
          setDemography(data.classification.demography || '');
          setLengthStr(data.classification.length || '');
          setRomanceLevel(data.classification.romanceLevel || 'Keine');
          setConfessionTiming(data.classification.confessionTiming || 'N/A');
          setIntimacyLevel(data.classification.intimacyLevel || 'None');
          
          let dynamics = data.classification.relationshipDynamics;
          let parsedDynamics: string[] = [];
          if (typeof dynamics === 'string') parsedDynamics = [dynamics];
          else if (Array.isArray(dynamics)) parsedDynamics = dynamics;
          setRelationshipDynamics(parsedDynamics);
          
          setWholesomeLewdScale(data.classification.wholesomeLewdScale || 5);
          setComedySeriousScale(data.classification.comedySeriousScale || 5);
          setActionDialogScale(data.classification.actionDialogScale || 5);
          setPacingScale(data.classification.pacingScale || 5);
        }
        
        setMalSynced(data.malSynced || false);

        if (data.evaluation) {
          setEvalPlotAndStory(data.evaluation.plotAndStory || 5);
          setEvalCastAndCharacters(data.evaluation.castAndCharacters || 5);
          setEvalArtstyleAndAnimation(data.evaluation.artstyleAndAnimation || 5);
          setEvalAudioAndMusic(data.evaluation.audioAndMusic || 5);
          setEvalEnding(data.evaluation.ending || 5);
          setEvalRomanceAndChemistry(data.evaluation.romanceAndChemistry || 5);
          setEvalBingeFactor(data.evaluation.bingeFactor || 5);
          setEmotionalImpact(data.evaluation.emotionalImpact || 'Keine');
          setComments(data.evaluation.comments || '');
        }
      }
      setLoading(false);
    });
  }, [user, mediaId]);

  const handleDelete = async () => {
    if (!user || !window.confirm('Möchtest du dieses Werk wirklich aus deiner Liste löschen?')) return;
    setSaving(true);
    await deleteTrackingData(user.uid, mediaId);
    setSaving(false);
    if (onSaved) onSaved(); // Close the form
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    
    const data: TrackingData = {
      mediaId,
      title,
      coverImage,
      type,
      status,
      adaptationScores: readAdaptation ? adaptationScores : undefined,
      malSynced,
      classification: {
        genres,
        tags,
        secondaryTags,
        characterTropes,
        demography,
        length: lengthStr,
        romanceLevel,
        confessionTiming,
        intimacyLevel,
        relationshipDynamics,
        wholesomeLewdScale,
        comedySeriousScale,
        actionDialogScale,
        pacingScale
      },
      evaluation: {
        plotAndStory: evalPlotAndStory,
        castAndCharacters: evalCastAndCharacters,
        artstyleAndAnimation: evalArtstyleAndAnimation,
        audioAndMusic: evalAudioAndMusic,
        ending: evalEnding,
        romanceAndChemistry: evalRomanceAndChemistry,
        bingeFactor: evalBingeFactor,
        emotionalImpact,
        overallScore: Number(overallScore),
        comments
      },
      updatedAt: Date.now()
    };
    
    if (hasCounterpart && status === 'COMPLETED' && counterpartStatus === 'COMPLETED' && readAdaptation) {
      data.adaptationScores = adaptationScores;
    }
    
    await saveTrackingData(user.uid, data);

    // Save counterpart data if sync is enabled
    if (hasCounterpart && syncCounterpart && counterpart) {
      const counterpartData: TrackingData = {
        ...data,
        mediaId: counterpart.id,
        title: counterpart.title.english || counterpart.title.romaji || "",
        type: counterpart.type as 'ANIME' | 'MANGA',
        status: counterpartStatus,
      };
      await saveTrackingData(user.uid, counterpartData);
    }
    
    setSaving(false);
    if (onSaved) {
      onSaved();
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  if (loading) return <CircularProgress />;

  return (
    <Box sx={{ mt: 3, p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>Track & Rate</Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabIndex} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label="Status & Cross" />
          <Tab label="Klassifizierung" />
          <Tab label="Qualität" />
        </Tabs>
      </Box>

      {/* TAB 1: Status & Cross-Tracking */}
      <CustomTabPanel value={tabIndex} index={0}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={status}
              label="Status"
              onChange={(e) => setStatus(e.target.value as any)}
            >
              <MenuItem value="PLANNING">Geplant</MenuItem>
              <MenuItem value="CURRENT">Aktuell</MenuItem>
              <MenuItem value="COMPLETED">Abgeschlossen</MenuItem>
              <MenuItem value="DROPPED">Abgebrochen</MenuItem>
            </Select>
          </FormControl>

          {hasCounterpart && counterpart && (
            <Box>
              <FormControl fullWidth>
                <InputLabel>Status des Pendants</InputLabel>
                <Select
                  value={counterpartStatus}
                  label="Status des Pendants"
                  onChange={(e) => setCounterpartStatus(e.target.value as any)}
                >
                  <MenuItem value="NONE">Nicht geplant</MenuItem>
                  <MenuItem value="PLANNING">Geplant</MenuItem>
                  <MenuItem value="CURRENT">Aktuell</MenuItem>
                  <MenuItem value="COMPLETED">Abgeschlossen</MenuItem>
                  <MenuItem value="DROPPED">Abgebrochen</MenuItem>
                </Select>
              </FormControl>

              <TextField 
                label="Länge (z.B. 24 Folgen, 2 Staffeln, Film)" 
                value={lengthStr} 
                onChange={(e) => setLengthStr(e.target.value)} 
                fullWidth 
                sx={{ mt: 2 }}
              />

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Checkbox 
                  checked={syncCounterpart} 
                  onChange={(e) => setSyncCounterpart(e.target.checked)} 
                  color="primary"
                />
                <Typography variant="body2">
                  Klassifizierung & Bewertung für das Pendant übernehmen (Erstellt einen zweiten Stern)
                </Typography>
              </Box>
              
              {(status === 'COMPLETED' || status === 'DROPPED') && 
               (counterpartStatus === 'COMPLETED' || counterpartStatus === 'DROPPED') && (
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Adaptions-Vergleich
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }} gutterBottom>
                    Wie gut wurde das Originalmaterial adaptiert?
                  </Typography>
                  
                  <Typography variant="body2" sx={{ mt: 2 }}>Story Adaption (1-10)</Typography>
                  <Slider 
                    value={adaptationScores.story} 
                    min={1} max={10} step={1} marks valueLabelDisplay="auto"
                    onChange={(_, val) => setAdaptationScores({...adaptationScores, story: val as number})}
                  />
                  <Typography variant="body2" sx={{ mt: 1 }}>Pacing (1-10)</Typography>
                  <Slider 
                    value={adaptationScores.pacing} 
                    min={1} max={10} step={1} marks valueLabelDisplay="auto"
                    onChange={(_, val) => setAdaptationScores({...adaptationScores, pacing: val as number})}
                  />
                </Box>
              )}
            </Box>
          )}

          <Box sx={{ mt: 3, p: 2, bgcolor: 'primary.main', color: '#FFFFFF', borderRadius: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Generierte Klassifizierung:</Typography>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              {(() => {
                let summaryStr = '';
                if (romanceLevel !== 'None' && romanceLevel !== '') {
                  summaryStr += 'Romantischer ';
                }
                const filteredGenres = genres.filter(g => g !== 'Romance');
                if (filteredGenres.length > 0) {
                  summaryStr += `${filteredGenres.slice(0, 2).join('-')}-Titel`;
                } else {
                  summaryStr += 'Titel';
                }
                return summaryStr;
              })()}
            </Typography>
          </Box>
        </Box>
      </CustomTabPanel>

      {/* TAB 2: Klassifizierung */}
      <CustomTabPanel value={tabIndex} index={1}>
        <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: 'background.default', borderRadius: 2 }}>
          <Typography variant="subtitle1" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>Basis-Daten & Demografie</Typography>
          <FormControl fullWidth sx={{ mt: 1, mb: 3 }}>
            <InputLabel>Genres</InputLabel>
            <Select
              multiple
              value={genres}
              onChange={(e) => setGenres(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
              input={<OutlinedInput label="Genres" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => <Chip key={value} label={value} size="small" />)}
                </Box>
              )}
            >
              {GENRES_LIST.map((name) => <MenuItem key={name} value={name}>{name}</MenuItem>)}
            </Select>
          </FormControl>
          
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Demografie</InputLabel>
            <Select value={demography} label="Demografie" onChange={(e) => setDemography(e.target.value)}>
              {DEMOGRAPHICS.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
            </Select>
          </FormControl>
        </Paper>

        <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: 'background.default', borderRadius: 2 }}>
          <Typography variant="subtitle1" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>Tags & Tropes</Typography>
          <FormControl fullWidth sx={{ mb: 3, mt: 1 }}>
            <InputLabel>Main Tags & Tropes</InputLabel>
            <Select
              multiple
              value={tags}
              onChange={(e) => setTags(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
              input={<OutlinedInput label="Main Tags & Tropes" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => <Chip key={value} label={value} size="small" color="primary" />)}
                </Box>
              )}
            >
              {TAGS_LIST.map((name) => <MenuItem key={name} value={name}>{name}</MenuItem>)}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Secondary Tags & Tropes</InputLabel>
            <Select
              multiple
              value={secondaryTags}
              onChange={(e) => setSecondaryTags(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
              input={<OutlinedInput label="Secondary Tags & Tropes" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => <Chip key={value} label={value} size="small" color="secondary" />)}
                </Box>
              )}
            >
              {TAGS_LIST.map((name) => <MenuItem key={name} value={name}>{name}</MenuItem>)}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 1 }}>
            <InputLabel>Charakter-Tropes</InputLabel>
            <Select
              multiple
              value={characterTropes}
              onChange={(e) => setCharacterTropes(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
              input={<OutlinedInput label="Charakter-Tropes" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => <Chip key={value} label={value} size="small" color="success" />)}
                </Box>
              )}
            >
              {CHAR_TROPES.map((name) => <MenuItem key={name} value={name}>{name}</MenuItem>)}
            </Select>
          </FormControl>
        </Paper>

        <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: 'background.default', borderRadius: 2 }}>
          <Typography variant="subtitle1" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>Romance-Dynamik</Typography>
          <FormControl fullWidth sx={{ mb: romanceLevel !== 'Keine' ? 3 : 1, mt: 1 }}>
            <InputLabel>Romance Level</InputLabel>
            <Select value={romanceLevel} label="Romance Level" onChange={(e) => setRomanceLevel(e.target.value)}>
              {ROMANCE_LEVELS.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
            </Select>
          </FormControl>
          
          {romanceLevel !== 'Keine' && (
            <>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Confession Timing</InputLabel>
                <Select value={confessionTiming} label="Confession Timing" onChange={(e) => setConfessionTiming(e.target.value)}>
                  {CONFESSION_TIMINGS.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Intimacy Level (Höchstes)</InputLabel>
                <Select value={intimacyLevel} label="Intimacy Level (Höchstes)" onChange={(e) => setIntimacyLevel(e.target.value)}>
                  {INTIMACY_LEVELS.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ mb: 1 }}>
                <InputLabel>Beziehungs-Dynamik</InputLabel>
                <Select 
                  multiple
                  value={relationshipDynamics} 
                  onChange={(e) => setRelationshipDynamics(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                  input={<OutlinedInput label="Beziehungs-Dynamik" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => <Chip key={value} label={value} size="small" color="warning" />)}
                    </Box>
                  )}
                >
                  {RELATIONSHIP_DYNAMICS.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
                </Select>
              </FormControl>
            </>
          )}
        </Paper>

        <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: 'background.default', borderRadius: 2 }}>
          <Typography variant="subtitle1" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>Tonalität (Vibe-Radar)</Typography>
          <Typography gutterBottom sx={{ mt: 1 }}>Wholesome vs. Lewd (1=Wholesome, 10=Lewd)</Typography>
          <Slider value={wholesomeLewdScale} min={1} max={10} step={1} marks valueLabelDisplay="auto" onChange={(_, val) => setWholesomeLewdScale(val as number)} />

          <Typography gutterBottom sx={{ mt: 3 }}>Comedy vs. Serious (1=Comedy, 10=Serious)</Typography>
          <Slider value={comedySeriousScale} min={1} max={10} step={1} marks valueLabelDisplay="auto" onChange={(_, val) => setComedySeriousScale(val as number)} />

          <Typography gutterBottom sx={{ mt: 3 }}>Action vs. Dialog-Fokus (1=Action, 10=Dialog)</Typography>
          <Slider value={actionDialogScale} min={1} max={10} step={1} marks valueLabelDisplay="auto" onChange={(_, val) => setActionDialogScale(val as number)} />

          <Typography gutterBottom sx={{ mt: 3 }}>Pacing (1=Slow, 10=Fast-Paced)</Typography>
          <Slider value={pacingScale} min={1} max={10} step={1} marks valueLabelDisplay="auto" onChange={(_, val) => setPacingScale(val as number)} />
        </Paper>
      </CustomTabPanel>

      {/* TAB 3: Qualität */}
      <CustomTabPanel value={tabIndex} index={2}>
        <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: 'background.default', borderRadius: 2 }}>
          <Typography variant="subtitle1" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>Kernelemente (1-10)</Typography>
          
          <Typography gutterBottom sx={{ mt: 1 }}>Narrative Tiefe & Plot-Struktur</Typography>
          <Slider value={evalPlotAndStory} min={1} max={10} step={1} marks valueLabelDisplay="auto" onChange={(_, val) => setEvalPlotAndStory(val as number)} />

          <Typography gutterBottom sx={{ mt: 2 }}>Cast & Charakterentwicklung</Typography>
          <Slider value={evalCastAndCharacters} min={1} max={10} step={1} marks valueLabelDisplay="auto" onChange={(_, val) => setEvalCastAndCharacters(val as number)} />

          {status !== 'CURRENT' && (
            <>
              <Typography gutterBottom sx={{ mt: 2 }}>Finale & Auflösung (Ending)</Typography>
              <Slider value={evalEnding} min={1} max={10} step={1} marks valueLabelDisplay="auto" onChange={(_, val) => setEvalEnding(val as number)} />
            </>
          )}

          {romanceLevel !== 'Keine' && romanceLevel !== 'Angedeutet' && (
            <>
              <Typography gutterBottom sx={{ mt: 2 }}>Romance & Chemie</Typography>
              <Slider value={evalRomanceAndChemistry} min={1} max={10} step={1} marks valueLabelDisplay="auto" onChange={(_, val) => setEvalRomanceAndChemistry(val as number)} />
            </>
          )}
        </Paper>

        <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: 'background.default', borderRadius: 2 }}>
          <Typography variant="subtitle1" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>Produktion & Suchtfaktor (1-10)</Typography>
          
          <Typography gutterBottom sx={{ mt: 1 }}>Zeichenstil / Animation</Typography>
          <Slider value={evalArtstyleAndAnimation} min={1} max={10} step={1} marks valueLabelDisplay="auto" onChange={(_, val) => setEvalArtstyleAndAnimation(val as number)} />

          {type === 'ANIME' && (
            <>
              <Typography gutterBottom sx={{ mt: 2 }}>Soundtrack / Voice Acting</Typography>
              <Slider value={evalAudioAndMusic} min={1} max={10} step={1} marks valueLabelDisplay="auto" onChange={(_, val) => setEvalAudioAndMusic(val as number)} />
            </>
          )}

          <Typography gutterBottom sx={{ mt: 2 }}>Motivation zu gucken / Binge-Faktor</Typography>
          <Slider value={evalBingeFactor} min={1} max={10} step={1} marks valueLabelDisplay="auto" onChange={(_, val) => setEvalBingeFactor(val as number)} />
        </Paper>

        <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: 'background.default', borderRadius: 2 }}>
          <Typography variant="subtitle1" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>Emotionale Resonanz & Review</Typography>
          
          <FormControl fullWidth sx={{ mt: 1, mb: 3 }}>
            <InputLabel>Ausgelöste Gefühle</InputLabel>
            <Select value={emotionalImpact} label="Ausgelöste Gefühle" onChange={(e) => setEmotionalImpact(e.target.value)}>
              {EMOTIONAL_IMPACTS.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Persönliches Review / Notizen"
            multiline
            rows={4}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Was hat dir besonders gut gefallen? Was war enttäuschend?"
            variant="outlined"
          />
        </Paper>

        <Box sx={{ p: 2, bgcolor: 'primary.main', color: '#FFFFFF', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Errechneter Gesamtscore:</Typography>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{overallScore}</Typography>
        </Box>
      </CustomTabPanel>

      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
        <Checkbox 
          checked={malSynced} 
          onChange={(e) => setMalSynced(e.target.checked)} 
          color="primary"
        />
        <Typography variant="body2">Auf MyAnimeList/AniList neu bewertet?</Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <Button
          variant="outlined"
          color="error"
          size="large"
          sx={{ py: 1.5, fontWeight: 'bold', borderRadius: '100px', minWidth: 120 }}
          onClick={handleDelete}
          disabled={saving}
        >
          Löschen
        </Button>
        <Button
          variant="contained"
          color="secondary"
          fullWidth
          size="large"
          sx={{ py: 1.5, fontWeight: 'bold', borderRadius: '100px' }}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <CircularProgress size={24} color="inherit" /> : 'Alles Speichern'}
        </Button>
      </Box>
    </Box>
  );
}
