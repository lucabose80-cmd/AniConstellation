'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Select, MenuItem, FormControl, InputLabel, Button, Slider, CircularProgress, Tabs, Tab, Chip, OutlinedInput, Paper, Checkbox, TextField } from '@mui/material';
import { saveTrackingData, getTrackingData, TrackingData } from '@/lib/tracking';
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
const ROMANCE_LEVELS = ["None", "Subplot", "Prominent", "Main Focus"];
const CONFESSION_TIMINGS = ["Early", "Middle", "End", "Never", "N/A"];
const INTIMACY_LEVELS = ["None", "Händchen halten", "Umarmen", "Küssen", "Sex"];
const EMOTIONAL_IMPACTS = ["Keine", "Leicht", "Mitgenommen", "Tränen ausgelöst"];

export default function TrackingForm({ mediaId, title, coverImage, type, hasCounterpart, counterpart }: TrackingFormProps) {
  const { user } = useAuth();
  
  // UI State
  const [tabIndex, setTabIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Status State
  const [status, setStatus] = useState<'PLANNING' | 'CURRENT' | 'COMPLETED' | 'DROPPED'>('PLANNING');
  const [counterpartStatus, setCounterpartStatus] = useState<'PLANNING' | 'CURRENT' | 'COMPLETED' | 'DROPPED'>('PLANNING');
  const [syncCounterpart, setSyncCounterpart] = useState<boolean>(true);
  const [readAdaptation, setReadAdaptation] = useState<boolean>(true);
  const [adaptationScores, setAdaptationScores] = useState({ story: 5, pacing: 5 });

  // Classification State
  const [genres, setGenres] = useState<string[]>([]);
  const [lengthStr, setLengthStr] = useState<string>('');
  const [romanceLevel, setRomanceLevel] = useState<string>('None');
  const [confessionTiming, setConfessionTiming] = useState<string>('N/A');
  const [intimacyLevel, setIntimacyLevel] = useState<string>('None');
  const [relationshipDynamics, setRelationshipDynamics] = useState<string>('None');
  const [wholesomeLewdScale, setWholesomeLewdScale] = useState<number>(5);
  const [comedySeriousScale, setComedySeriousScale] = useState<number>(5);
  const [actionDialogScale, setActionDialogScale] = useState<number>(5);
  const [pacingScale, setPacingScale] = useState<number>(5);

  // Qualitative State (1-10)
  const [evalStory, setEvalStory] = useState<number>(5);
  const [evalCharacters, setEvalCharacters] = useState<number>(5);
  const [evalSetting, setEvalSetting] = useState<number>(5);
  const [evalSupportingCast, setEvalSupportingCast] = useState<number>(5);
  const [evalRomance, setEvalRomance] = useState<number>(5);
  const [evalEnding, setEvalEnding] = useState<number>(5);
  const [evalAnimation, setEvalAnimation] = useState<number>(5);
  const [evalArtstyle, setEvalArtstyle] = useState<number>(5);
  const [evalRewatch, setEvalRewatch] = useState<number>(5);
  const [evalImmersion, setEvalImmersion] = useState<number>(5);
  const [emotionalImpact, setEmotionalImpact] = useState<string>('Keine');

  const EMOTIONAL_IMPACTS = ['Keine', 'Leicht', 'Mitgenommen', 'Tränen nah', 'Tränen ausgelöst'];
  const RELATIONSHIP_DYNAMICS = ['None', 'Enemies to Lovers', 'Childhood Friends', 'Slow Burn', 'Harem', 'Love Triangle', 'Arranged Marriage', 'Student/Teacher', 'Andere'];

  const calculateOverallScore = () => {
    // Base Weights: Story(2.0), Characters(2.0), Setting(1.0), SuppCast(1.0), Romance(1.0), Ending(1.0), Anim(0.5), Art(0.5), Rewatch(0.5), Immersion(0.5) = 10.0
    const baseScore = (evalStory * 2.0) + (evalCharacters * 2.0) + (evalSetting * 1.0) + (evalSupportingCast * 1.0) + 
                      (evalRomance * 1.0) + (evalEnding * 1.0) + (evalAnimation * 0.5) + (evalArtstyle * 0.5) + 
                      (evalRewatch * 0.5) + (evalImmersion * 0.5);
    
    let finalScore = baseScore / 10.0;

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
          setLengthStr(data.classification.length || '');
          setRomanceLevel(data.classification.romanceLevel || 'None');
          setConfessionTiming(data.classification.confessionTiming || 'N/A');
          setIntimacyLevel(data.classification.intimacyLevel || 'None');
          setRelationshipDynamics(data.classification.relationshipDynamics || 'None');
          setWholesomeLewdScale(data.classification.wholesomeLewdScale || 5);
          setComedySeriousScale(data.classification.comedySeriousScale || 5);
          setActionDialogScale(data.classification.actionDialogScale || 5);
          setPacingScale(data.classification.pacingScale || 5);
        }
        if (data.evaluation) {
          setEvalStory(data.evaluation.story || 5);
          setEvalCharacters(data.evaluation.characters || 5);
          setEvalSetting(data.evaluation.setting || 5);
          setEvalSupportingCast(data.evaluation.supportingCast || 5);
          setEvalRomance(data.evaluation.romance || 5);
          setEvalEnding(data.evaluation.ending || 5);
          setEvalAnimation(data.evaluation.animation || 5);
          setEvalArtstyle(data.evaluation.artstyle || 5);
          setEvalRewatch(data.evaluation.rewatchValue || 5);
          setEvalImmersion(data.evaluation.immersion || 5);
          setEmotionalImpact(data.evaluation.emotionalImpact || 'Keine');
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
      title,
      coverImage,
      type,
      status,
      classification: {
        genres,
        length: lengthStr,
        romanceLevel,
        confessionTiming,
        intimacyLevel,
        relationshipDynamics,
        wholesomeLewdScale,
        comedySeriousScale,
        actionDialogScale,
        pacingScale,
        summary: ''
      },
      evaluation: {
        story: evalStory,
        characters: evalCharacters,
        setting: evalSetting,
        supportingCast: evalSupportingCast,
        romance: evalRomance,
        ending: evalEnding,
        animation: evalAnimation,
        artstyle: evalArtstyle,
        rewatchValue: evalRewatch,
        immersion: evalImmersion,
        emotionalImpact,
        overallScore: Number(overallScore)
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
          <Typography variant="subtitle1" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>Meta-Daten</Typography>
          <FormControl fullWidth sx={{ mt: 1, mb: 1 }}>
            <InputLabel>Genres</InputLabel>
            <Select
              multiple
              value={genres}
              onChange={(e) => setGenres(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
              input={<OutlinedInput label="Genres" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
            >
              {GENRES_LIST.map((name) => (
                <MenuItem key={name} value={name}>{name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Paper>

        <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: 'background.default', borderRadius: 2 }}>
          <Typography variant="subtitle1" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>Romance-Dynamik</Typography>
          <FormControl fullWidth sx={{ mb: 3, mt: 1 }}>
            <InputLabel>Romance Level</InputLabel>
            <Select value={romanceLevel} label="Romance Level" onChange={(e) => setRomanceLevel(e.target.value)}>
              {ROMANCE_LEVELS.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
            </Select>
          </FormControl>
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
            <Select value={relationshipDynamics} label="Beziehungs-Dynamik" onChange={(e) => setRelationshipDynamics(e.target.value)}>
              {RELATIONSHIP_DYNAMICS.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
            </Select>
          </FormControl>
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
          <Typography variant="subtitle1" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>Säule 1: Narrative (Story & World)</Typography>
          <Typography gutterBottom sx={{ mt: 1 }}>Story & Plot-Struktur (1-10)</Typography>
          <Slider value={evalStory} min={1} max={10} step={1} marks valueLabelDisplay="auto" onChange={(_, val) => setEvalStory(val as number)} />

          <Typography gutterBottom sx={{ mt: 2 }}>Setting / World-Building (1-10)</Typography>
          <Slider value={evalSetting} min={1} max={10} step={1} marks valueLabelDisplay="auto" onChange={(_, val) => setEvalSetting(val as number)} />

          <Typography gutterBottom sx={{ mt: 2 }}>Finale & Auflösung (Ending) (1-10)</Typography>
          <Slider value={evalEnding} min={1} max={10} step={1} marks valueLabelDisplay="auto" onChange={(_, val) => setEvalEnding(val as number)} />
        </Paper>

        <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: 'background.default', borderRadius: 2 }}>
          <Typography variant="subtitle1" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>Säule 2: Cast & Chemie</Typography>
          <Typography gutterBottom sx={{ mt: 1 }}>Hauptcharaktere & Entwicklung (1-10)</Typography>
          <Slider value={evalCharacters} min={1} max={10} step={1} marks valueLabelDisplay="auto" onChange={(_, val) => setEvalCharacters(val as number)} />

          <Typography gutterBottom sx={{ mt: 2 }}>Nebencharaktere (Supporting Cast) (1-10)</Typography>
          <Slider value={evalSupportingCast} min={1} max={10} step={1} marks valueLabelDisplay="auto" onChange={(_, val) => setEvalSupportingCast(val as number)} />

          <Typography gutterBottom sx={{ mt: 2 }}>Romance & Chemie (1-10)</Typography>
          <Slider value={evalRomance} min={1} max={10} step={1} marks valueLabelDisplay="auto" onChange={(_, val) => setEvalRomance(val as number)} />
        </Paper>

        <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: 'background.default', borderRadius: 2 }}>
          <Typography variant="subtitle1" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>Säule 3: Produktion & Kunst</Typography>
          <Typography gutterBottom sx={{ mt: 1 }}>Animationsqualität (1-10)</Typography>
          <Slider value={evalAnimation} min={1} max={10} step={1} marks valueLabelDisplay="auto" onChange={(_, val) => setEvalAnimation(val as number)} />

          <Typography gutterBottom sx={{ mt: 2 }}>Artstyle / Zeichenstil (1-10)</Typography>
          <Slider value={evalArtstyle} min={1} max={10} step={1} marks valueLabelDisplay="auto" onChange={(_, val) => setEvalArtstyle(val as number)} />
        </Paper>

        <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: 'background.default', borderRadius: 2 }}>
          <Typography variant="subtitle1" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>Säule 4: Gesamterlebnis</Typography>
          <Typography gutterBottom sx={{ mt: 1 }}>Immersion (Tiefe des Eintauchens) (1-10)</Typography>
          <Slider value={evalImmersion} min={1} max={10} step={1} marks valueLabelDisplay="auto" onChange={(_, val) => setEvalImmersion(val as number)} />

          <Typography gutterBottom sx={{ mt: 2 }}>Re-Watch / Re-Read Value (1-10)</Typography>
          <Slider value={evalRewatch} min={1} max={10} step={1} marks valueLabelDisplay="auto" onChange={(_, val) => setEvalRewatch(val as number)} />

          <FormControl fullWidth sx={{ mt: 3, mb: 1 }}>
            <InputLabel>Ausgelöste Gefühle</InputLabel>
            <Select value={emotionalImpact} label="Ausgelöste Gefühle" onChange={(e) => setEmotionalImpact(e.target.value)}>
              {EMOTIONAL_IMPACTS.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
            </Select>
          </FormControl>
        </Paper>

        <Box sx={{ p: 2, bgcolor: 'primary.main', color: '#FFFFFF', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Errechneter Gesamtscore:</Typography>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{overallScore}</Typography>
        </Box>
      </CustomTabPanel>

      <Button
        variant="contained"
        color="secondary"
        fullWidth
        size="large"
        sx={{ mt: 4, py: 1.5, fontWeight: 'bold', borderRadius: '100px' }}
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? <CircularProgress size={24} color="inherit" /> : 'Alles Speichern'}
      </Button>
    </Box>
  );
}
