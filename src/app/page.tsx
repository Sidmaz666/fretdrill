'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  KEY_NAMES,
  KEY_DISPLAY_NAMES,
  SCALES,
  NoteName,
  getCAGEDPositions,
  getScaleOnFretboard,
  FRET_COUNT,
} from '@/lib/music-theory';
import {
  generateExercise,
  generatePatternExercises,
  computeExerciseStats,
  sortNotesAscending,
  ExerciseType,
  EXERCISE_TYPES,
  EXERCISE_CATEGORIES,
  ExerciseNote,
} from '@/lib/exercise-generator';
import FretboardDiagram from '@/components/guitar/FretboardDiagram';
import PatternDiagram from '@/components/guitar/PatternDiagram';
import TabNotation from '@/components/guitar/TabNotation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Music,
  Zap,
  GitBranch,
  Target,
  Layers,
  Route,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  Timer,
  Drum,
  Search,
  Menu,
  X,
  Guitar,
  FileText,
  BarChart3,
  Eye,
  ChevronDown,
  ChevronUp,
  Star,
  ArrowRight,
  Clock,
  Signal,
  Activity,
  Hash,
  Ruler,
} from 'lucide-react';

// ─── AUDIO ENGINE ───
const STRING_FREQUENCIES = [82.41, 110.0, 146.83, 196.0, 246.94, 329.63];

let audioCtx: AudioContext | null = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

function playGuitarNote(stringIdx: number, fret: number, duration: number = 0.5) {
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const baseFreq = STRING_FREQUENCIES[stringIdx];
    const freq = baseFreq * Math.pow(2, fret / 12);
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = 'triangle'; osc.frequency.setValueAtTime(freq, ctx.currentTime);
    const osc2 = ctx.createOscillator(); const gain2 = ctx.createGain();
    osc2.type = 'sawtooth'; osc2.frequency.setValueAtTime(freq, ctx.currentTime);
    const osc3 = ctx.createOscillator(); const gain3 = ctx.createGain();
    osc3.type = 'sine'; osc3.frequency.setValueAtTime(freq * 0.5, ctx.currentTime);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    gain2.gain.setValueAtTime(0, ctx.currentTime);
    gain2.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.008);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration * 0.7);
    gain3.gain.setValueAtTime(0, ctx.currentTime);
    gain3.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.01);
    gain3.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration * 0.5);
    osc.connect(gain); osc2.connect(gain2); osc3.connect(gain3);
    gain.connect(ctx.destination); gain2.connect(ctx.destination); gain3.connect(ctx.destination);
    osc.start(ctx.currentTime); osc2.start(ctx.currentTime); osc3.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration + 0.05); osc2.stop(ctx.currentTime + duration + 0.05); osc3.stop(ctx.currentTime + duration + 0.05);
  } catch (e) {}
}

function playMetronomeClick(accent: boolean) {
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = 'sine'; osc.frequency.setValueAtTime(accent ? 1200 : 900, ctx.currentTime);
    gain.gain.setValueAtTime(accent ? 0.25 : 0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.06);
  } catch (e) {}
}

// ─── INTERVAL COLOR ───
function getIntervalColor(label: string): string {
  if (label === 'R') return '#9b3939';
  if (label.includes('\u266D3') || label.includes('\u266D2')) return '#6b4a7a';
  if (label === '3' || label === '2') return '#4a7a4a';
  if (label === '4') return '#4a5a8a';
  if (label === '5') return '#4a7a7a';
  if (label.includes('5')) return '#4a7a7a';
  if (label.includes('6')) return '#8a6a3a';
  if (label.includes('7')) return '#7a4a6a';
  if (label.includes('\u266F') || label.includes('\u266D')) return '#6b4a7a';
  return '#5a5a6a';
}

// Difficulty stars
function DifficultyBadge({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className={`w-1.5 h-1.5 rounded-sm ${i <= level ? 'bg-[#9b3939]' : 'bg-[#e8e2d6]'}`} />
      ))}
    </div>
  );
}

// ─── VIEW MODES ───
type ViewMode = 'fretboard' | 'tab' | 'hybrid' | 'analysis';

// ─── MAIN COMPONENT ───
export default function Home() {
  // Core state
  const [keyIndex, setKeyIndex] = useState(9);
  const [scaleId, setScaleId] = useState('minor-pentatonic');
  const [positionIndex, setPositionIndex] = useState(0);
  const [exerciseType, setExerciseType] = useState<ExerciseType>('scale-asc-desc');
  const [showAllPositions, setShowAllPositions] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('hybrid');

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [playingIdx, setPlayingIdx] = useState(-1);
  const [playbackMode, setPlaybackMode] = useState<'idle' | 'exercise' | 'scale'>('idle');
  const [playbackActiveNote, setPlaybackActiveNote] = useState<{ string: number; fret: number } | null>(null);
  const [clickActiveNote, setClickActiveNote] = useState<{ string: number; fret: number } | null>(null);
  const playbackRef = useRef<{ playing: boolean; notes: ExerciseNote[]; idx: number; timeoutId: number | null }>({
    playing: false, notes: [], idx: 0, timeoutId: null,
  });

  // BPM & Metronome
  const [bpm, setBpm] = useState(100);
  const [metronomeOn, setMetronomeOn] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(-1);
  const [timeSignature, setTimeSignature] = useState(4);
  const metronomeRef = useRef(false);
  const metronomeTimeoutRef = useRef<number | null>(null);
  const beatCountRef = useRef(0);
  const tapTimes = useRef<number[]>([]);

  // Session timer
  const [sessionStart] = useState(Date.now());
  const [sessionElapsed, setSessionElapsed] = useState(0);
  const [exercisesPlayed, setExercisesPlayed] = useState(0);

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string>('scale-runs');
  const [rightPanelExpanded, setRightPanelExpanded] = useState(true);
  const [exerciseSearch, setExerciseSearch] = useState('');

  // Derived state
  const keyNote = KEY_NAMES[keyIndex];
  const scale = SCALES[scaleId];
  const positions = useMemo(() => getCAGEDPositions(keyNote, scaleId), [keyNote, scaleId]);
  const currentPosition = positions[positionIndex] || { fretStart: 0, fretEnd: FRET_COUNT, name: 'Full Fretboard' };
  const startFret = showAllPositions ? 0 : currentPosition.fretStart;
  const endFret = showAllPositions ? FRET_COUNT : currentPosition.fretEnd;

  // Current exercise
  const currentExercise = useMemo(
    () => generateExercise(exerciseType, keyNote, scaleId, positionIndex),
    [exerciseType, keyNote, scaleId, positionIndex]
  );

  // Exercise stats (verbose, nerdy)
  const exerciseStats = useMemo(() => computeExerciseStats(currentExercise), [currentExercise]);

  // Exercise type metadata
  const exerciseMeta = EXERCISE_TYPES[exerciseType];

  // Breadcrumb
  const exerciseCategory = useMemo(() => {
    for (const cat of EXERCISE_CATEGORIES) {
      if (cat.types.includes(exerciseType)) return cat;
    }
    return EXERCISE_CATEGORIES[0];
  }, [exerciseType]);

  // Scale notes for playback
  const scaleNotesForPlayback = useMemo(() => {
    const notes = getScaleOnFretboard(keyNote, scaleId, startFret, endFret);
    const sorted = sortNotesAscending(notes);
    const ascDesc = [...sorted, ...sorted.slice(0, -1).reverse()];
    return ascDesc.map((n, i) => ({
      string: n.string, fret: n.fret, note: n.note, intervalLabel: n.intervalLabel, isRoot: n.isRoot, sequenceNumber: i + 1,
    }));
  }, [keyNote, scaleId, startFret, endFret]);

  const exerciseHighlightNotes = useMemo(() => {
    if (!currentExercise || !currentExercise.notes.length) return undefined;
    const allScaleNotes = getScaleOnFretboard(keyNote, scaleId, 0, FRET_COUNT);
    const exerciseNoteKeys = new Set(currentExercise.notes.map(n => `${n.string}-${n.fret}`));
    return allScaleNotes.filter(n => exerciseNoteKeys.has(`${n.string}-${n.fret}`));
  }, [currentExercise, keyNote, scaleId]);

  const exercisePath = useMemo(() => {
    if (!currentExercise || !currentExercise.notes.length) return undefined;
    const seen = new Set<string>();
    const path: Array<{ string: number; fret: number; sequenceNumber?: number }> = [];
    for (const note of currentExercise.notes) {
      const key = `${note.string}-${note.fret}`;
      if (!seen.has(key)) { seen.add(key); path.push({ string: note.string, fret: note.fret, sequenceNumber: note.sequenceNumber }); }
    }
    return path;
  }, [currentExercise]);

  const patternExercises = useMemo(() => generatePatternExercises(keyNote, scaleId), [keyNote, scaleId]);

  const scaleNotes = useMemo(() => {
    return scale.intervals.map(interval => {
      const noteIndex = (KEY_NAMES.indexOf(keyNote) + interval) % 12;
      return KEY_NAMES[noteIndex];
    });
  }, [keyNote, scale]);

  const effectiveActiveNote = playbackActiveNote || (isPlaying ? null : clickActiveNote);

  // Session timer
  useEffect(() => {
    const interval = setInterval(() => setSessionElapsed(Math.floor((Date.now() - sessionStart) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [sessionStart]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // ─── HANDLERS ───

  const handleRandomize = useCallback(() => {
    const types = Object.keys(EXERCISE_TYPES) as ExerciseType[];
    setExerciseType(types[Math.floor(Math.random() * types.length)]);
    setExercisesPlayed(p => p + 1);
  }, []);

  const handlePrevPosition = useCallback(() => setPositionIndex(prev => Math.max(0, prev - 1)), []);
  const handleNextPosition = useCallback(() => setPositionIndex(prev => Math.min(positions.length - 1, prev + 1)), [positions.length]);

  const handleFretboardNoteClick = useCallback((note: { string: number; fret: number }) => {
    if (soundEnabled) playGuitarNote(note.string, note.fret, 0.6);
    setClickActiveNote(prev => prev && prev.string === note.string && prev.fret === note.fret ? null : note);
  }, [soundEnabled]);

  const handleTabNoteClick = useCallback((note: ExerciseNote) => {
    if (soundEnabled) playGuitarNote(note.string, note.fret, 0.6);
    if (!isPlaying) { setClickActiveNote({ string: note.string, fret: note.fret }); setTimeout(() => setClickActiveNote(null), 1500); }
  }, [soundEnabled, isPlaying]);

  const handlePatternClick = useCallback((posIdx: number) => { setPositionIndex(posIdx); setShowAllPositions(false); }, []);

  // ─── PLAYBACK ENGINE ───
  const stopPlayback = useCallback(() => {
    playbackRef.current.playing = false;
    if (playbackRef.current.timeoutId) { clearTimeout(playbackRef.current.timeoutId); playbackRef.current.timeoutId = null; }
    setIsPlaying(false); setIsPaused(false); setPlayingIdx(-1); setPlaybackMode('idle'); setPlaybackActiveNote(null);
  }, []);

  const startPlayback = useCallback((mode: 'exercise' | 'scale', startFromIdx: number = 0) => {
    stopPlayback(); setClickActiveNote(null);
    const notes = mode === 'exercise' ? currentExercise.notes : scaleNotesForPlayback;
    if (!notes.length) return;
    setIsPlaying(true); setIsPaused(false); setPlaybackMode(mode);
    if (mode === 'exercise') setExercisesPlayed(p => p + 1);
    playbackRef.current = { playing: true, notes, idx: startFromIdx, timeoutId: null };
    const intervalMs = (60 / bpm) * 1000;
    const playNext = () => {
      if (!playbackRef.current.playing) return;
      const idx = playbackRef.current.idx;
      if (idx >= notes.length) { stopPlayback(); return; }
      const note = notes[idx];
      setPlayingIdx(idx); setPlaybackActiveNote({ string: note.string, fret: note.fret });
      if (soundEnabled) playGuitarNote(note.string, note.fret, Math.min(intervalMs / 1000 * 0.8, 0.6));
      playbackRef.current.idx = idx + 1;
      playbackRef.current.timeoutId = window.setTimeout(playNext, intervalMs);
    };
    playNext();
  }, [currentExercise, scaleNotesForPlayback, bpm, soundEnabled, stopPlayback]);

  const togglePausePlayback = useCallback(() => {
    if (isPaused) {
      setIsPaused(false); playbackRef.current.playing = true;
      const notes = playbackRef.current.notes; const intervalMs = (60 / bpm) * 1000;
      const playNext = () => {
        if (!playbackRef.current.playing) return;
        const idx = playbackRef.current.idx;
        if (idx >= notes.length) { stopPlayback(); return; }
        const note = notes[idx];
        setPlayingIdx(idx); setPlaybackActiveNote({ string: note.string, fret: note.fret });
        if (soundEnabled) playGuitarNote(note.string, note.fret, Math.min(intervalMs / 1000 * 0.8, 0.6));
        playbackRef.current.idx = idx + 1;
        playbackRef.current.timeoutId = window.setTimeout(playNext, intervalMs);
      };
      playNext();
    } else {
      playbackRef.current.playing = false;
      if (playbackRef.current.timeoutId) { clearTimeout(playbackRef.current.timeoutId); playbackRef.current.timeoutId = null; }
      setIsPaused(true);
    }
  }, [isPaused, bpm, soundEnabled, stopPlayback]);

  const handlePlayExercise = useCallback(() => {
    if (isPlaying && playbackMode === 'exercise') { togglePausePlayback(); }
    else if (isPlaying) { stopPlayback(); startPlayback('exercise'); }
    else { startPlayback('exercise'); }
  }, [isPlaying, playbackMode, togglePausePlayback, stopPlayback, startPlayback]);

  const handlePlayScale = useCallback(() => {
    if (isPlaying && playbackMode === 'scale') { togglePausePlayback(); }
    else if (isPlaying) { stopPlayback(); startPlayback('scale'); }
    else { startPlayback('scale'); }
  }, [isPlaying, playbackMode, togglePausePlayback, stopPlayback, startPlayback]);

  // ─── METRONOME ───
  const startMetronome = useCallback(() => {
    metronomeRef.current = true; beatCountRef.current = 0; setMetronomeOn(true);
    const tick = () => {
      if (!metronomeRef.current) return;
      const accent = beatCountRef.current % timeSignature === 0;
      setCurrentBeat(beatCountRef.current % timeSignature);
      if (soundEnabled) playMetronomeClick(accent);
      beatCountRef.current++;
      metronomeTimeoutRef.current = window.setTimeout(tick, (60 / bpm) * 1000);
    };
    tick();
  }, [bpm, soundEnabled, timeSignature]);

  const stopMetronome = useCallback(() => {
    metronomeRef.current = false;
    if (metronomeTimeoutRef.current) clearTimeout(metronomeTimeoutRef.current);
    setMetronomeOn(false); setCurrentBeat(-1);
  }, []);

  const toggleMetronome = useCallback(() => { metronomeOn ? stopMetronome() : startMetronome(); }, [metronomeOn, startMetronome, stopMetronome]);

  useEffect(() => { if (metronomeOn) { stopMetronome(); startMetronome(); } }, [bpm, timeSignature]); // eslint-disable-line
  useEffect(() => { return () => { playbackRef.current.playing = false; metronomeRef.current = false; }; }, []);

  const handleTapTempo = useCallback(() => {
    const now = Date.now();
    if (tapTimes.current.length > 0 && now - tapTimes.current[tapTimes.current.length - 1] > 2000) tapTimes.current = [];
    tapTimes.current.push(now);
    if (tapTimes.current.length > 5) tapTimes.current.shift();
    if (tapTimes.current.length >= 2) {
      const intervals = [];
      for (let i = 1; i < tapTimes.current.length; i++) intervals.push(tapTimes.current[i] - tapTimes.current[i - 1]);
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      setBpm(Math.max(40, Math.min(220, Math.round(60000 / avgInterval))));
    }
  }, []);

  const bpmPresets = [60, 80, 100, 120, 140, 160];

  // Filtered exercises for search
  const filteredCategories = useMemo(() => {
    if (!exerciseSearch.trim()) return EXERCISE_CATEGORIES;
    const q = exerciseSearch.toLowerCase();
    return EXERCISE_CATEGORIES.map(cat => ({
      ...cat,
      types: cat.types.filter(t => EXERCISE_TYPES[t].name.toLowerCase().includes(q) || EXERCISE_TYPES[t].description.toLowerCase().includes(q)),
    })).filter(cat => cat.types.length > 0);
  }, [exerciseSearch]);

  // Group categories by section
  const sectionGroups = useMemo(() => {
    const groups: Array<{ section: string; categories: typeof EXERCISE_CATEGORIES }> = [];
    for (const cat of filteredCategories) {
      const existing = groups.find(g => g.section === cat.section);
      if (existing) existing.categories.push(cat);
      else groups.push({ section: cat.section, categories: [cat] });
    }
    return groups;
  }, [filteredCategories]);

  // ─── RENDER ───
  return (
    <div className="h-screen flex flex-col bg-[#f5f0e8] text-[#2c2c2c] overflow-hidden">

      {/* ═══ TOP STICKY GLOBAL CONTEXT BAR ═══ */}
      <header className="border-b-2 border-[#8b7355] bg-[#faf6ef] shrink-0 z-40">
        <div className="px-3 py-1.5 flex items-center gap-2">
          <button className="lg:hidden sketch-btn p-1 border-[#c4b89c]" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-6 h-6 rounded-sm border-2 border-[#8b7355] flex items-center justify-center bg-[#f5f0e8]">
              <Guitar className="w-3.5 h-3.5 text-[#6b5b47]" />
            </div>
            <h1 className="text-[12px] font-bold text-[#2c2c2c] hidden sm:block" style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic' }}>FretBoard Forge</h1>
          </div>
          <div className="w-px h-5 bg-[#c4b89c] hidden md:block" />
          {/* Key */}
          <div className="hidden md:flex items-center gap-1 shrink-0">
            <span className="text-[8px] uppercase tracking-[0.1em] text-[#8b7355] font-serif italic font-bold">Key</span>
            <div className="flex gap-0.5">
              {KEY_DISPLAY_NAMES.map((key, idx) => (
                <button key={idx} className={`h-5 min-w-[22px] px-0.5 text-[8px] font-semibold border transition-all rounded-sm ${keyIndex === idx ? 'sketch-btn-active border-[#6b5b47]' : 'sketch-btn border-[#c4b89c] hover:border-[#8b7355]'}`}
                  onClick={() => { setKeyIndex(idx); setPositionIndex(0); stopPlayback(); }}>{key}</button>
              ))}
            </div>
          </div>
          <div className="w-px h-5 bg-[#c4b89c] hidden md:block" />
          {/* Scale */}
          <div className="hidden md:flex items-center gap-1 shrink-0">
            <span className="text-[8px] uppercase tracking-[0.1em] text-[#8b7355] font-serif italic font-bold">Scale</span>
            <Select value={scaleId} onValueChange={(v) => { setScaleId(v); setPositionIndex(0); stopPlayback(); }}>
              <SelectTrigger className="bg-[#f5f0e8] border-[#c4b89c] text-[#2c2c2c] text-[9px] rounded-sm h-5 w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#faf6ef] border-[#c4b89c]">
                {Object.entries(SCALES).map(([id, s]) => (
                  <SelectItem key={id} value={id} className="text-[9px] text-[#2c2c2c]">{s.name} ({s.intervals.length})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-px h-5 bg-[#c4b89c] hidden md:block" />
          {/* Position */}
          <div className="hidden md:flex items-center gap-0.5 shrink-0">
            <span className="text-[8px] uppercase tracking-[0.1em] text-[#8b7355] font-serif italic font-bold">Pos</span>
            <button className="sketch-btn w-4 h-5 flex items-center justify-center border-[#c4b89c] p-0" onClick={handlePrevPosition} disabled={positionIndex <= 0}><ChevronLeft className="h-2.5 w-2.5" /></button>
            {positions.map((_, idx) => (
              <button key={idx} className={`h-5 w-5 text-[8px] font-semibold rounded-sm transition-all border p-0 ${!showAllPositions && positionIndex === idx ? 'sketch-btn-active border-[#6b5b47]' : 'sketch-btn border-[#c4b89c] hover:border-[#8b7355]'}`}
                onClick={() => { setPositionIndex(idx); setShowAllPositions(false); stopPlayback(); }}>{idx + 1}</button>
            ))}
            <button className={`h-5 px-1 text-[8px] font-semibold rounded-sm transition-all border p-0 ${showAllPositions ? 'sketch-btn-active border-[#6b5b47]' : 'sketch-btn border-[#c4b89c] hover:border-[#8b7355]'}`}
              onClick={() => { setShowAllPositions(true); stopPlayback(); }}>All</button>
            <button className="sketch-btn w-4 h-5 flex items-center justify-center border-[#c4b89c] p-0" onClick={handleNextPosition} disabled={positionIndex >= positions.length - 1}><ChevronRight className="h-2.5 w-2.5" /></button>
          </div>
          {/* Mobile context pill */}
          <div className="md:hidden flex-1 flex items-center justify-center">
            <span className="text-[9px] font-serif italic text-[#4a4a4a] font-bold">{keyNote} {scale.name} · P{positionIndex + 1}</span>
          </div>
          <div className="flex-1 hidden md:block" />
          <div className="hidden lg:flex items-center gap-1.5 shrink-0">
            <span className="text-[8px] text-[#8b7355] font-serif italic">{currentPosition.name} · Frets {currentPosition.fretStart}–{currentPosition.fretEnd}</span>
            <span className="text-[8px] text-[#b8a88a] font-serif italic">· {Object.keys(EXERCISE_TYPES).length} exercises</span>
          </div>
          <button className={`sketch-btn px-1.5 py-0.5 text-[8px] flex items-center gap-0.5 shrink-0 ${soundEnabled ? 'border-[#6b5b47]' : 'border-[#c4b89c] opacity-50'}`}
            onClick={() => setSoundEnabled(!soundEnabled)}>
            {soundEnabled ? <Volume2 className="w-2.5 h-2.5" /> : <VolumeX className="w-2.5 h-2.5" />}
          </button>
        </div>
      </header>

      {/* ═══ MAIN WORK AREA ═══ */}
      <div className="flex-1 flex overflow-hidden">

        {/* ─── LEFT SIDEBAR ─── */}
        {sidebarOpen && <div className="lg:hidden fixed inset-0 z-30 bg-black/30" onClick={() => setSidebarOpen(false)} />}
        <aside className={`fixed lg:relative inset-y-0 left-0 z-30 lg:z-0 w-[250px] lg:w-[250px] shrink-0 bg-[#faf6ef] border-r-2 border-[#8b7355] overflow-y-auto transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} pt-[38px] lg:pt-0`}>
          <div className="p-2.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <h3 className="text-[9px] uppercase tracking-[0.15em] text-[#8b7355] font-serif italic font-bold">Exercise Library</h3>
              <button className="lg:hidden" onClick={() => setSidebarOpen(false)}><X className="w-3.5 h-3.5 text-[#8b7355]" /></button>
            </div>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-[#8b7355]" />
              <input type="text" placeholder="Search..." value={exerciseSearch} onChange={e => setExerciseSearch(e.target.value)}
                className="w-full pl-5 pr-2 py-1 text-[8px] bg-[#f5f0e8] border border-[#c4b89c] rounded-sm focus:outline-none focus:border-[#8b7355] font-serif italic" />
            </div>
            {/* Random */}
            <button className="sketch-btn w-full text-[8px] py-1 border-[#8b7355] text-[#6b5b47] font-semibold flex items-center justify-center gap-1" onClick={handleRandomize}>
              <Shuffle className="w-2.5 h-2.5" /> Random Exercise
            </button>

            {/* Category groups by section */}
            {sectionGroups.map(group => (
              <div key={group.section}>
                <div className="text-[7px] uppercase tracking-[0.2em] text-[#9b3939] font-serif italic font-bold pt-2 pb-0.5 border-b border-[#e8e2d6] mb-0.5">
                  {group.section}
                </div>
                {group.categories.map(cat => {
                  const isActiveCat = cat.types.includes(exerciseType);
                  const isExpanded = expandedCategory === cat.id;
                  return (
                    <div key={cat.id}>
                      <button className={`w-full flex items-center gap-1 px-1.5 py-1 rounded-sm text-[8px] font-serif italic font-bold transition-all ${isActiveCat ? 'bg-[rgba(155,57,57,0.08)] text-[#9b3939]' : 'text-[#6b5b47] hover:bg-[rgba(139,115,85,0.06)]'}`}
                        onClick={() => setExpandedCategory(isExpanded ? '' : cat.id)}>
                        <span className="flex-1 text-left">{cat.label}</span>
                        <span className="text-[6px] opacity-50">{cat.types.length}</span>
                        {isExpanded ? <ChevronUp className="w-2.5 h-2.5 opacity-40" /> : <ChevronDown className="w-2.5 h-2.5 opacity-40" />}
                      </button>
                      {(isExpanded || isActiveCat) && (
                        <div className="ml-3 mt-0.5 space-y-0.5">
                          {cat.types.map(typeId => {
                            const info = EXERCISE_TYPES[typeId];
                            const isSelected = exerciseType === typeId;
                            return (
                              <button key={typeId} className={`w-full text-left flex items-center gap-1 text-[7px] py-0.5 px-1.5 rounded-sm transition-all ${isSelected ? 'bg-[rgba(155,57,57,0.12)] text-[#9b3939] font-bold' : 'text-[#4a4a4a] hover:bg-[rgba(139,115,85,0.08)]'}`}
                                onClick={() => { setExerciseType(typeId); stopPlayback(); setSidebarOpen(false); }}>
                                <DifficultyBadge level={info.difficulty} />
                                <span className="flex-1 truncate">{info.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Intervals legend */}
            <div className="border-t border-[#e8e2d6] pt-2 mt-2">
              <h4 className="text-[8px] uppercase tracking-[0.12em] text-[#8b7355] font-serif italic font-bold mb-1">Intervals</h4>
              <div className="flex flex-wrap gap-0.5">
                {scale.intervalLabels.map((label, idx) => (
                  <span key={idx} className="inline-flex items-center justify-center px-1 py-0.5 text-[7px] font-bold font-serif italic border rounded-sm"
                    style={{ borderColor: getIntervalColor(label) + '55', color: getIntervalColor(label), backgroundColor: getIntervalColor(label) + '12' }}>{label}</span>
                ))}
              </div>
            </div>
            {/* Scale notes */}
            <div className="border-t border-[#e8e2d6] pt-2 mt-1">
              <h4 className="text-[8px] uppercase tracking-[0.12em] text-[#8b7355] font-serif italic font-bold mb-1">Scale Notes</h4>
              <div className="flex flex-wrap gap-0.5">
                {scaleNotes.map((note, idx) => {
                  const label = scale.intervalLabels[idx]; const color = getIntervalColor(label);
                  return (
                    <span key={idx} className="inline-flex items-center gap-0.5 px-1 py-0.5 text-[7px] font-serif italic border rounded-sm"
                      style={{ borderColor: color + '40', color, backgroundColor: color + '08' }}>
                      <span className="font-bold">{note}</span><span className="opacity-40 text-[6px]">{label}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>

        {/* ─── CENTER PANEL ─── */}
        <main className="flex-1 overflow-y-auto min-w-0 pb-[64px]">
          <div className="p-2.5 lg:p-3 space-y-2">

            {/* Exercise Header (Sticky within center) */}
            <div className="sticky top-0 z-10 bg-[#faf6ef] border-b-2 border-[#8b7355] -mx-2.5 lg:-mx-3 px-2.5 lg:px-3 pb-2 pt-1">
              {/* Breadcrumb */}
              <div className="flex items-center gap-1 text-[7px] text-[#8b7355] font-serif italic mb-0.5">
                <span>{exerciseCategory.section}</span>
                <ChevronRight className="w-2 h-2" />
                <span>{exerciseCategory.label}</span>
                <ChevronRight className="w-2 h-2" />
                <span className="text-[#9b3939] font-bold">{exerciseMeta.name}</span>
              </div>
              {/* Title + metadata */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-[#9b3939] font-serif italic truncate">{currentExercise?.name}</span>
                    <DifficultyBadge level={exerciseMeta.difficulty} />
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-[7px] text-[#6b5b47] font-serif italic font-semibold">{keyNote} {scale.name} · {showAllPositions ? 'All Pos' : `P${positionIndex + 1}`}</span>
                    <span className="text-[7px] text-[#b8a88a] font-serif italic">{exerciseMeta.focus}</span>
                    <span className="text-[7px] text-[#b8a88a] font-serif italic">~{exerciseMeta.estimatedTime}</span>
                    {isPlaying && playbackActiveNote && (
                      <span className="text-[7px] text-[#9b3939] font-serif italic font-bold">▸ {playingIdx + 1}/{playbackMode === 'exercise' ? currentExercise.notes.length : scaleNotesForPlayback.length}</span>
                    )}
                  </div>
                </div>
                {/* Quick actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button className="sketch-btn h-5 px-1 text-[7px] border-[#c4b89c] text-[#8b7355]" onClick={handleRandomize} title="Random"><Shuffle className="w-2.5 h-2.5" /></button>
                </div>
              </div>
            </div>

            {/* View Switcher + Inline play */}
            <div className="flex items-center gap-1">
              {([
                { mode: 'fretboard' as ViewMode, icon: Guitar, label: 'Fretboard' },
                { mode: 'tab' as ViewMode, icon: FileText, label: 'Tab' },
                { mode: 'hybrid' as ViewMode, icon: Eye, label: 'Hybrid' },
                { mode: 'analysis' as ViewMode, icon: BarChart3, label: 'Analysis' },
              ]).map(({ mode, icon: Icon, label }) => (
                <button key={mode} className={`flex items-center gap-0.5 px-2 py-1 text-[8px] font-bold uppercase tracking-wider border-2 rounded-sm transition-all ${viewMode === mode ? 'sketch-btn-active border-[#6b5b47] text-[#2c2c2c]' : 'sketch-btn border-[#c4b89c] text-[#8b7355] hover:border-[#8b7355]'}`}
                  onClick={() => setViewMode(mode)}>
                  <Icon className="w-2.5 h-2.5" /><span className="hidden sm:inline">{label}</span>
                </button>
              ))}
              <div className="flex-1" />
              <button className={`px-1.5 py-0.5 text-[8px] font-bold flex items-center gap-0.5 border-2 rounded-sm transition-all ${isPlaying && playbackMode === 'exercise' && !isPaused ? 'bg-[#9b3939] text-white border-[#9b3939]' : 'sketch-btn border-[#6b5b47]'}`} onClick={handlePlayExercise}>
                {isPlaying && playbackMode === 'exercise' && !isPaused ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
              </button>
              <button className={`px-1.5 py-0.5 text-[8px] font-bold flex items-center gap-0.5 border-2 rounded-sm transition-all ${isPlaying && playbackMode === 'scale' && !isPaused ? 'bg-[#4a5a8a] text-white border-[#4a5a8a]' : 'sketch-btn border-[#4a5a8a]'}`} onClick={handlePlayScale}>
                {isPlaying && playbackMode === 'scale' && !isPaused ? <Pause className="w-2.5 h-2.5" /> : <Music className="w-2.5 h-2.5" />}
              </button>
              {isPlaying && <button className="px-1.5 py-0.5 text-[8px] font-bold flex items-center gap-0.5 border-2 rounded-sm bg-[#4a4a4a] text-white border-[#4a4a4a]" onClick={stopPlayback}><Square className="w-2.5 h-2.5" /></button>}
            </div>

            {/* ─── View Content ─── */}

            {/* Fretboard Only */}
            {viewMode === 'fretboard' && (
              <div className="sketch-card bg-[#faf6ef] overflow-hidden">
                <div className="px-1 py-1 overflow-x-auto">
                  <FretboardDiagram keyNote={keyNote} scaleId={scaleId} startFret={startFret} endFret={endFret}
                    showAllPositions={showAllPositions} positionIndex={positionIndex}
                    highlightNotes={isPlaying ? undefined : exerciseHighlightNotes}
                    exercisePath={isPlaying ? undefined : exercisePath}
                    activeNote={effectiveActiveNote} onNoteClick={handleFretboardNoteClick}
                    showPatternLines={true} fullFretboard={true} />
                </div>
              </div>
            )}

            {/* Tab Only */}
            {viewMode === 'tab' && (
              <TabNotation exercise={currentExercise} onNoteClick={handleTabNoteClick} playingIdx={playingIdx}
                isPlaying={isPlaying} isPaused={isPaused} playbackMode={playbackMode}
                onPlayExercise={handlePlayExercise} onPlayScale={handlePlayScale} onPause={togglePausePlayback} onStop={stopPlayback} />
            )}

            {/* Hybrid — Fretboard + Tab */}
            {viewMode === 'hybrid' && (
              <>
                <div className="sketch-card bg-[#faf6ef] overflow-hidden">
                  <div className="px-1 py-1 overflow-x-auto">
                    <FretboardDiagram keyNote={keyNote} scaleId={scaleId} startFret={startFret} endFret={endFret}
                      showAllPositions={showAllPositions} positionIndex={positionIndex}
                      highlightNotes={isPlaying ? undefined : exerciseHighlightNotes}
                      exercisePath={isPlaying ? undefined : exercisePath}
                      activeNote={effectiveActiveNote} onNoteClick={handleFretboardNoteClick}
                      showPatternLines={true} fullFretboard={true} />
                  </div>
                </div>
                <TabNotation exercise={currentExercise} onNoteClick={handleTabNoteClick} playingIdx={playingIdx}
                  isPlaying={isPlaying} isPaused={isPaused} playbackMode={playbackMode}
                  onPlayExercise={handlePlayExercise} onPlayScale={handlePlayScale} onPause={togglePausePlayback} onStop={stopPlayback} />
              </>
            )}

            {/* Analysis — Verbose Nerdy Stats */}
            {viewMode === 'analysis' && (
              <div className="sketch-card bg-[#faf6ef] p-3 space-y-3">
                {/* Overview Stats Grid */}
                <div>
                  <h3 className="text-[9px] uppercase tracking-[0.15em] text-[#8b7355] font-serif italic font-bold mb-1.5 flex items-center gap-1"><Activity className="w-3 h-3" /> Exercise Overview</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {[
                      { label: 'Total Notes', value: exerciseStats.totalNotes, icon: Hash },
                      { label: 'Fret Range', value: `${exerciseStats.fretRange[0]}–${exerciseStats.fretRange[1]}`, icon: Ruler },
                      { label: 'String Changes', value: exerciseStats.stringChanges, icon: ArrowRight },
                      { label: 'Pos. Shifts', value: exerciseStats.positionShifts, icon: Zap },
                    ].map(({ label, value, icon: Icon }) => (
                      <div key={label} className="bg-[#f5f0e8] border border-[#e8e2d6] rounded-sm p-1.5">
                        <div className="flex items-center gap-0.5 text-[7px] text-[#8b7355] font-serif italic uppercase"><Icon className="w-2.5 h-2.5" />{label}</div>
                        <div className="text-[14px] font-bold text-[#2c2c2c] font-serif italic">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Deep Stats */}
                <div>
                  <h3 className="text-[9px] uppercase tracking-[0.15em] text-[#8b7355] font-serif italic font-bold mb-1.5 flex items-center gap-1"><Signal className="w-3 h-3" /> Detailed Metrics</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                    {[
                      { label: 'Avg Jump', value: exerciseStats.avgFretJump },
                      { label: 'Max Jump', value: exerciseStats.maxFretJump },
                      { label: 'Strings Used', value: `${exerciseStats.uniqueStrings}/6` },
                      { label: 'Unique Frets', value: exerciseStats.uniqueFrets },
                      { label: 'Difficulty', value: `${exerciseStats.difficulty}/5` },
                      { label: 'Pattern', value: exerciseStats.patternType },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-[#f5f0e8] border border-[#e8e2d6] rounded-sm p-1.5">
                        <div className="text-[6px] text-[#8b7355] font-serif italic uppercase">{label}</div>
                        <div className="text-[11px] font-bold text-[#2c2c2c] font-serif italic">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Interval Distribution */}
                <div>
                  <h3 className="text-[9px] uppercase tracking-[0.15em] text-[#8b7355] font-serif italic font-bold mb-1.5">Interval Distribution</h3>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(exerciseStats.intervalDistribution).sort((a, b) => b[1] - a[1]).map(([label, count]) => {
                      const color = getIntervalColor(label);
                      const maxCount = Math.max(...Object.values(exerciseStats.intervalDistribution));
                      const width = Math.max(20, (count / maxCount) * 100);
                      return (
                        <div key={label} className="flex items-center gap-1">
                          <div className="h-3 rounded-sm overflow-hidden" style={{ width: `${width}px`, backgroundColor: color + '20', border: `1px solid ${color}40` }}>
                            <div className="h-full rounded-sm" style={{ width: `${(count / maxCount) * 100}%`, backgroundColor: color + '60' }} />
                          </div>
                          <span className="text-[7px] font-serif italic" style={{ color }}>{label}: <b>{count}</b></span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* String Coverage */}
                <div>
                  <h3 className="text-[9px] uppercase tracking-[0.15em] text-[#8b7355] font-serif italic font-bold mb-1.5">String Coverage</h3>
                  <div className="flex gap-1.5">
                    {['E', 'A', 'D', 'G', 'B', 'e'].map((s, idx) => {
                      const used = currentExercise.notes.some(n => n.string === idx);
                      const noteCount = currentExercise.notes.filter(n => n.string === idx).length;
                      return (
                        <div key={s} className={`flex flex-col items-center w-8 rounded-sm border-2 p-1 ${used ? 'border-[#8b7355] bg-[rgba(139,115,85,0.1)]' : 'border-[#e8e2d6]'}`}>
                          <span className={`text-[9px] font-bold font-serif italic ${used ? 'text-[#4a4a4a]' : 'text-[#c4b89c]'}`}>{s}</span>
                          {used && <span className="text-[6px] text-[#8b7355] font-serif italic">{noteCount}n</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Scale Formula */}
                <div>
                  <h3 className="text-[9px] uppercase tracking-[0.15em] text-[#8b7355] font-serif italic font-bold mb-1.5">Scale Formula</h3>
                  <div className="flex flex-wrap gap-1 mb-1">
                    {scaleNotes.map((note, idx) => {
                      const label = scale.intervalLabels[idx]; const color = getIntervalColor(label);
                      return (
                        <span key={idx} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[8px] font-serif italic border rounded-sm"
                          style={{ borderColor: color + '50', color, backgroundColor: color + '0a' }}>
                          <span className="font-bold">{note}</span><span className="opacity-50 text-[6px]">{label}</span>
                        </span>
                      );
                    })}
                  </div>
                  <p className="text-[7px] text-[#8b7355] font-serif italic">
                    Steps: {scale.intervals.slice(1).map((interval, idx) => {
                      const prevInterval = idx === 0 ? 0 : scale.intervals[idx]; const step = interval - prevInterval;
                      return step === 1 ? 'H' : step === 2 ? 'W' : `${step}H`;
                    }).join(' − ')}
                  </p>
                </div>

                {/* Picking Direction */}
                <div>
                  <h3 className="text-[9px] uppercase tracking-[0.15em] text-[#8b7355] font-serif italic font-bold mb-1.5">Suggested Picking</h3>
                  <div className="flex flex-wrap gap-px">
                    {exerciseStats.pickingDirection.slice(0, 40).map((dir, idx) => (
                      <span key={idx} className={`w-3.5 h-3.5 rounded-sm flex items-center justify-center text-[6px] font-bold border ${
                        dir === 'D' ? 'border-[#4a7a4a] text-[#4a7a4a] bg-[rgba(74,122,74,0.06)]' : 'border-[#4a5a8a] text-[#4a5a8a] bg-[rgba(74,90,138,0.06)]'
                      }`}>{dir}</span>
                    ))}
                    {exerciseStats.pickingDirection.length > 40 && <span className="text-[6px] text-[#8b7355] font-serif italic ml-0.5">+{exerciseStats.pickingDirection.length - 40}</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[6px] text-[#4a7a4a] font-serif italic">D = Downstroke</span>
                    <span className="text-[6px] text-[#4a5a8a] font-serif italic">U = Upstroke</span>
                  </div>
                </div>

                {/* Exercise Metadata */}
                <div>
                  <h3 className="text-[9px] uppercase tracking-[0.15em] text-[#8b7355] font-serif italic font-bold mb-1.5 flex items-center gap-1"><Clock className="w-3 h-3" /> Exercise Info</h3>
                  <div className="bg-[#f5f0e8] border border-[#e8e2d6] rounded-sm p-2 space-y-1">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                      <div className="flex justify-between text-[7px]"><span className="text-[#8b7355] font-serif italic">Focus</span><span className="text-[#4a4a4a] font-bold">{exerciseMeta.focus}</span></div>
                      <div className="flex justify-between text-[7px]"><span className="text-[#8b7355] font-serif italic">Duration</span><span className="text-[#4a4a4a] font-bold">{exerciseMeta.estimatedTime}</span></div>
                      <div className="flex justify-between text-[7px]"><span className="text-[#8b7355] font-serif italic">Position</span><span className="text-[#4a4a4a] font-bold">{showAllPositions ? 'All' : `P${positionIndex + 1}`} ({currentPosition.fretStart}–{currentPosition.fretEnd})</span></div>
                      <div className="flex justify-between text-[7px]"><span className="text-[#8b7355] font-serif italic">Category</span><span className="text-[#4a4a4a] font-bold">{exerciseStats.patternType}</span></div>
                      <div className="flex justify-between text-[7px]"><span className="text-[#8b7355] font-serif italic">Notes</span><span className="text-[#4a4a4a] font-bold">{exerciseStats.totalNotes}</span></div>
                      <div className="flex justify-between text-[7px]"><span className="text-[#8b7355] font-serif italic">Fret Span</span><span className="text-[#4a4a4a] font-bold">{exerciseStats.fretRange[1] - exerciseStats.fretRange[0] + 1} frets</span></div>
                    </div>
                    <div className="flex flex-wrap gap-0.5 pt-1 border-t border-[#e8e2d6]">
                      {exerciseMeta.tags.map(tag => (
                        <span key={tag} className="px-1 py-0.5 text-[6px] font-serif italic bg-[rgba(139,115,85,0.08)] text-[#6b5b47] border border-[#e8e2d6] rounded-sm">{tag}</span>
                      ))}
                    </div>
                    <p className="text-[7px] text-[#4a4a4a] font-serif italic pt-1 border-t border-[#e8e2d6]">
                      {exerciseStats.positionShifts > 0 ? 'Contains position shifts — practice slowly, focus on smooth transitions.' :
                        exerciseStats.stringChanges > exerciseStats.totalNotes * 0.6 ? 'High string-crossing density — keep picking hand relaxed, use efficient alternate picking.' :
                        'Focus on clean articulation and consistent timing with the metronome.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile: Explorer section */}
            <div className="xl:hidden">
              <button className="w-full sketch-card bg-[#faf6ef] px-2 py-1 flex items-center justify-between"
                onClick={() => setRightPanelExpanded(!rightPanelExpanded)}>
                <span className="text-[8px] uppercase tracking-[0.12em] text-[#8b7355] font-serif italic font-bold">Scale Explorer</span>
                {rightPanelExpanded ? <ChevronUp className="w-2.5 h-2.5 text-[#8b7355]" /> : <ChevronDown className="w-2.5 h-2.5 text-[#8b7355]" />}
              </button>
              {rightPanelExpanded && (
                <div className="mt-1.5">
                  <div className="sketch-card bg-[#faf6ef] p-2">
                    <h4 className="text-[8px] uppercase tracking-[0.12em] text-[#8b7355] font-serif italic font-bold mb-1.5">CAGED Positions</h4>
                    <div className="grid grid-cols-5 gap-1.5">
                      {patternExercises.map((pat) => (
                        <button key={pat.position} onClick={() => handlePatternClick(pat.position - 1)} className="text-left">
                          <PatternDiagram keyNote={keyNote} scaleId={scaleId} fretStart={pat.fretStart} fretEnd={pat.fretEnd}
                            positionNumber={pat.position} exerciseNotes={pat.notes}
                            selected={positionIndex === pat.position - 1 && !showAllPositions} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* ─── RIGHT SIDEBAR ─── */}
        <aside className="hidden xl:block w-[280px] shrink-0 border-l-2 border-[#8b7355] bg-[#faf6ef] overflow-y-auto">
          <div className="p-2.5 space-y-2.5">

            {/* Card 1: Current Scale */}
            <div className="sketch-card bg-[#f5f0e8] p-2.5">
              <h4 className="text-[8px] uppercase tracking-[0.12em] text-[#8b7355] font-serif italic font-bold mb-1.5">Current Scale</h4>
              <div className="text-[11px] font-bold text-[#9b3939] font-serif italic mb-1">{keyNote} {scale.name}</div>
              <div className="flex flex-wrap gap-0.5 mb-1.5">
                {scaleNotes.map((note, idx) => {
                  const label = scale.intervalLabels[idx]; const color = getIntervalColor(label);
                  return <span key={idx} className="inline-flex items-center gap-0.5 px-1 py-0.5 text-[7px] font-serif italic border rounded-sm"
                    style={{ borderColor: color + '40', color, backgroundColor: color + '08' }}>
                    <span className="font-bold">{note}</span><span className="opacity-40 text-[5px]">{label}</span>
                  </span>;
                })}
              </div>
              <p className="text-[6px] text-[#8b7355] font-serif italic">{scale.intervals.length} notes · Steps: {scale.intervals.slice(1).map((interval, idx) => {
                const prevInterval = idx === 0 ? 0 : scale.intervals[idx]; const step = interval - prevInterval;
                return step === 1 ? 'H' : step === 2 ? 'W' : `${step}H`;
              }).join('−')}</p>
            </div>

            {/* Card 2: Current Position */}
            <div className="sketch-card bg-[#f5f0e8] p-2.5">
              <h4 className="text-[8px] uppercase tracking-[0.12em] text-[#8b7355] font-serif italic font-bold mb-1.5">Current Position</h4>
              <div className="space-y-1.5">
                {patternExercises.map((pat) => (
                  <button key={pat.position} onClick={() => handlePatternClick(pat.position - 1)} className="w-full text-left">
                    <PatternDiagram keyNote={keyNote} scaleId={scaleId} fretStart={pat.fretStart} fretEnd={pat.fretEnd}
                      positionNumber={pat.position} exerciseNotes={pat.notes}
                      selected={positionIndex === pat.position - 1 && !showAllPositions} />
                  </button>
                ))}
              </div>
            </div>

            {/* Card 3: Related Exercises */}
            <div className="sketch-card bg-[#f5f0e8] p-2.5">
              <h4 className="text-[8px] uppercase tracking-[0.12em] text-[#8b7355] font-serif italic font-bold mb-1.5">Related Exercises</h4>
              <div className="space-y-0.5">
                {exerciseCategory.types.filter(t => t !== exerciseType).slice(0, 5).map(typeId => {
                  const info = EXERCISE_TYPES[typeId];
                  return (
                    <button key={typeId} className="w-full text-left flex items-center gap-1 px-1.5 py-1 rounded-sm text-[7px] text-[#4a4a4a] hover:bg-[rgba(139,115,85,0.08)] transition-all"
                      onClick={() => { setExerciseType(typeId); stopPlayback(); }}>
                      <ArrowRight className="w-2 h-2 text-[#8b7355] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="font-serif italic">{info.name}</span>
                        <span className="text-[6px] text-[#8b7355] ml-1">{info.focus}</span>
                      </div>
                      <DifficultyBadge level={info.difficulty} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Card 4: Next Suggested */}
            <div className="sketch-card bg-[#f5f0e8] p-2.5">
              <h4 className="text-[8px] uppercase tracking-[0.12em] text-[#8b7355] font-serif italic font-bold mb-1.5">Suggested Next</h4>
              {(() => {
                const currentIdx = exerciseCategory.types.indexOf(exerciseType);
                const nextType = currentIdx >= 0 && currentIdx < exerciseCategory.types.length - 1 ? exerciseCategory.types[currentIdx + 1] : null;
                const nextMeta = nextType ? EXERCISE_TYPES[nextType] : null;
                if (!nextType || !nextMeta) return <p className="text-[7px] text-[#b8a88a] font-serif italic">Complete!</p>;
                return (
                  <button className="w-full text-left bg-[rgba(155,57,57,0.05)] border border-[#9b393930] rounded-sm p-1.5 hover:bg-[rgba(155,57,57,0.1)] transition-all"
                    onClick={() => { setExerciseType(nextType); stopPlayback(); }}>
                    <div className="flex items-center gap-1">
                      <Play className="w-2.5 h-2.5 text-[#9b3939]" />
                      <span className="text-[8px] font-bold text-[#9b3939] font-serif italic">{nextMeta.name}</span>
                    </div>
                    <p className="text-[6px] text-[#8b7355] font-serif italic mt-0.5">{nextMeta.description} · {nextMeta.focus}</p>
                  </button>
                );
              })()}
            </div>

            {/* Card 5: Session */}
            <div className="sketch-card bg-[#f5f0e8] p-2.5">
              <h4 className="text-[8px] uppercase tracking-[0.12em] text-[#8b7355] font-serif italic font-bold mb-1.5 flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> Session</h4>
              <div className="grid grid-cols-2 gap-1.5">
                <div><div className="text-[6px] text-[#8b7355] font-serif italic uppercase">Time</div><div className="text-[12px] font-bold text-[#2c2c2c] font-mono">{formatTime(sessionElapsed)}</div></div>
                <div><div className="text-[6px] text-[#8b7355] font-serif italic uppercase">Played</div><div className="text-[12px] font-bold text-[#2c2c2c] font-mono">{exercisesPlayed}</div></div>
                <div><div className="text-[6px] text-[#8b7355] font-serif italic uppercase">Tempo</div><div className="text-[12px] font-bold text-[#2c2c2c] font-mono">{bpm}</div></div>
                <div><div className="text-[6px] text-[#8b7355] font-serif italic uppercase">Library</div><div className="text-[12px] font-bold text-[#2c2c2c] font-mono">{Object.keys(EXERCISE_TYPES).length}</div></div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* ═══ BOTTOM STICKY PRACTICE BAR ═══ */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t-2 border-[#8b7355] bg-[#faf6ef]">
        <div className="px-2.5 py-1.5 flex items-center gap-2">

          {/* TRANSPORT */}
          <div className="flex items-center gap-1 shrink-0">
            <button className={`w-7 h-7 flex items-center justify-center border-2 rounded-sm transition-all ${isPlaying && playbackMode === 'exercise' && !isPaused ? 'bg-[#9b3939] text-white border-[#9b3939]' : 'sketch-btn border-[#6b5b47]'}`}
              onClick={handlePlayExercise} title="Play exercise">
              {isPlaying && playbackMode === 'exercise' && !isPaused ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </button>
            <button className={`w-7 h-7 flex items-center justify-center border-2 rounded-sm transition-all ${isPlaying && playbackMode === 'scale' && !isPaused ? 'bg-[#4a5a8a] text-white border-[#4a5a8a]' : 'sketch-btn border-[#4a5a8a]'}`}
              onClick={handlePlayScale} title="Play scale">
              {isPlaying && playbackMode === 'scale' && !isPaused ? <Pause className="w-3 h-3" /> : <Music className="w-3 h-3" />}
            </button>
            {isPlaying && <button className="w-7 h-7 flex items-center justify-center border-2 rounded-sm bg-[#4a4a4a] text-white border-[#4a4a4a]" onClick={stopPlayback}><Square className="w-3 h-3" /></button>}
          </div>

          <div className="w-px h-5 bg-[#e8e2d6]" />

          {/* TEMPO */}
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="flex items-center gap-0.5 shrink-0">
              <Timer className="w-2.5 h-2.5 text-[#8b7355]" />
              <span className="text-[13px] font-mono font-bold text-[#4a4a4a]">{bpm}</span>
              <span className="text-[7px] text-[#8b7355] font-serif italic hidden sm:inline">BPM</span>
            </div>
            <input type="range" min={40} max={220} step={1} value={bpm} onChange={e => setBpm(Number(e.target.value))}
              className="w-14 sm:w-20 h-1 cursor-pointer" style={{ accentColor: '#8b7355' }} />
            <div className="hidden md:flex gap-0.5">
              {bpmPresets.map(preset => (
                <button key={preset} className={`text-[7px] px-0.5 py-0.5 border rounded-sm transition-all ${bpm === preset ? 'sketch-btn-active border-[#6b5b47]' : 'sketch-btn border-[#c4b89c] hover:border-[#8b7355]'}`}
                  onClick={() => setBpm(preset)}>{preset}</button>
              ))}
            </div>
            <button className="sketch-btn text-[7px] px-1 py-0.5 border-[#8b7355] text-[#6b5b47] font-semibold hidden sm:block" onClick={handleTapTempo}>TAP</button>
          </div>

          <div className="w-px h-5 bg-[#e8e2d6]" />

          {/* METRONOME */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button className={`px-1.5 py-0.5 text-[8px] font-bold flex items-center gap-0.5 border-2 rounded-sm transition-all ${metronomeOn ? 'bg-[#9b3939] text-white border-[#9b3939]' : 'sketch-btn border-[#6b5b47]'}`}
              onClick={toggleMetronome}>
              <Drum className="w-2.5 h-2.5" />
              <span className="hidden sm:inline">{metronomeOn ? 'STOP' : 'MET'}</span>
            </button>
            <div className="hidden sm:flex items-center gap-0.5">
              {Array.from({ length: timeSignature }, (_, i) => (
                <div key={i} className={`w-2.5 h-2.5 rounded-full border-2 transition-all duration-75 ${metronomeOn && currentBeat === i ? 'bg-[#9b3939] border-[#9b3939] scale-110' : 'bg-transparent border-[#c4b89c]'}`} />
              ))}
            </div>
            <div className="hidden md:flex gap-0.5">
              {[3, 4, 5, 6].map(ts => (
                <button key={ts} className={`text-[7px] px-0.5 py-0.5 border rounded-sm transition-all ${timeSignature === ts ? 'sketch-btn-active border-[#6b5b47]' : 'sketch-btn border-[#c4b89c] hover:border-[#8b7355]'}`}
                  onClick={() => setTimeSignature(ts)}>{ts}/4</button>
              ))}
            </div>
          </div>

          <div className="flex-1" />

          {/* SESSION */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <div className="text-right">
              <div className="text-[8px] text-[#8b7355] font-serif italic leading-none">Session</div>
              <div className="text-[10px] font-mono font-bold text-[#4a4a4a]">{formatTime(sessionElapsed)}</div>
            </div>
            <div className="text-right">
              <div className="text-[8px] text-[#8b7355] font-serif italic leading-none">Played</div>
              <div className="text-[10px] font-mono font-bold text-[#4a4a4a]">{exercisesPlayed}</div>
            </div>
          </div>

          {/* Playback status */}
          {isPlaying && (
            <div className="hidden md:flex items-center gap-0.5 shrink-0">
              <span className="text-[7px] text-[#9b3939] font-serif italic font-bold">{playbackMode === 'exercise' ? 'EX' : 'SC'}</span>
              <span className="text-[7px] text-[#4a4a4a] font-mono">{playingIdx + 1}/{playbackMode === 'exercise' ? currentExercise.notes.length : scaleNotesForPlayback.length}</span>
            </div>
          )}

          {/* Mobile scale selector */}
          <div className="md:hidden shrink-0">
            <Select value={scaleId} onValueChange={(v) => { setScaleId(v); setPositionIndex(0); stopPlayback(); }}>
              <SelectTrigger className="bg-[#f5f0e8] border-[#c4b89c] text-[8px] rounded-sm h-6 w-[100px]"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#faf6ef] border-[#c4b89c]">
                {Object.entries(SCALES).map(([id, s]) => (<SelectItem key={id} value={id} className="text-[8px] text-[#2c2c2c]">{s.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
