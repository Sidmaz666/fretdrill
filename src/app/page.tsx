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
  sortNotesAscending,
  ExerciseType,
  EXERCISE_TYPES,
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
  RotateCcw,
  Star,
  ArrowRight,
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

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(freq, ctx.currentTime);

    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(freq * 0.5, ctx.currentTime);

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

    osc.connect(gain);
    osc2.connect(gain2);
    osc3.connect(gain3);
    gain.connect(ctx.destination);
    gain2.connect(ctx.destination);
    gain3.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc2.start(ctx.currentTime);
    osc3.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration + 0.05);
    osc2.stop(ctx.currentTime + duration + 0.05);
    osc3.stop(ctx.currentTime + duration + 0.05);
  } catch (e) {}
}

function playMetronomeClick(accent: boolean) {
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(accent ? 1200 : 900, ctx.currentTime);
    gain.gain.setValueAtTime(accent ? 0.25 : 0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.06);
  } catch (e) {}
}

// ─── INTERVAL COLOR MAPPING ───
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

// ─── EXERCISE CATEGORIES ───
const EXERCISE_CATEGORIES = [
  { label: 'Scale Runs', icon: Route, types: ['scale-asc', 'scale-desc', 'scale-asc-desc', 'reverse-pentatonic'] as ExerciseType[] },
  { label: 'Sequences', icon: Layers, types: ['thirds', 'sequence-3', 'sequence-4', 'sequence-5', 'pedal-tone'] as ExerciseType[] },
  { label: 'Shapes', icon: Target, types: ['triads', 'arpeggios', 'octave-shapes', 'double-stops'] as ExerciseType[] },
  { label: 'Technique', icon: Zap, types: ['string-skip', 'lateral-run', 'diagonal', 'position-shift', 'pentatonic-run', 'economy-picking', 'spider-walk', 'interval-jump'] as ExerciseType[] },
  { label: 'Connections', icon: GitBranch, types: ['connecting'] as ExerciseType[] },
];

// ─── VIEW MODES ───
type ViewMode = 'fretboard' | 'tab' | 'hybrid' | 'analysis';

// ─── MAIN COMPONENT ───
export default function Home() {
  // Core state
  const [keyIndex, setKeyIndex] = useState(9); // A
  const [scaleId, setScaleId] = useState('minor-pentatonic');
  const [positionIndex, setPositionIndex] = useState(0);
  const [exerciseType, setExerciseType] = useState<ExerciseType>('scale-asc-desc');
  const [showAllPositions, setShowAllPositions] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('hybrid');

  // Playback state — unified highlight mechanism
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [playingIdx, setPlayingIdx] = useState(-1);
  const [playbackMode, setPlaybackMode] = useState<'idle' | 'exercise' | 'scale'>('idle');
  // playbackActiveNote is the SOLE source of truth for fretboard highlight during playback
  const [playbackActiveNote, setPlaybackActiveNote] = useState<{ string: number; fret: number } | null>(null);
  // clickActiveNote is for user clicks only (not during playback)
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

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile drawer
  const [expandedCategory, setExpandedCategory] = useState<string>('Scale Runs');
  const [rightPanelExpanded, setRightPanelExpanded] = useState(true); // mobile: explorer expand
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

  // Scale notes for playback
  const scaleNotesForPlayback = useMemo(() => {
    const notes = getScaleOnFretboard(keyNote, scaleId, startFret, endFret);
    const sorted = sortNotesAscending(notes);
    const ascDesc = [...sorted, ...sorted.slice(0, -1).reverse()];
    return ascDesc.map((n, i) => ({
      string: n.string,
      fret: n.fret,
      note: n.note,
      intervalLabel: n.intervalLabel,
      isRoot: n.isRoot,
      sequenceNumber: i + 1,
    }));
  }, [keyNote, scaleId, startFret, endFret]);

  // Exercise highlighting for fretboard
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
      if (!seen.has(key)) {
        seen.add(key);
        path.push({ string: note.string, fret: note.fret, sequenceNumber: note.sequenceNumber });
      }
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

  // The effective active note for the fretboard: playback takes priority over click
  const effectiveActiveNote = playbackActiveNote || (isPlaying ? null : clickActiveNote);

  // ─── HANDLERS ───

  const handleRandomize = useCallback(() => {
    const types = Object.keys(EXERCISE_TYPES) as ExerciseType[];
    setExerciseType(types[Math.floor(Math.random() * types.length)]);
  }, []);

  const handlePrevPosition = useCallback(() => {
    setPositionIndex(prev => Math.max(0, prev - 1));
  }, []);

  const handleNextPosition = useCallback(() => {
    setPositionIndex(prev => Math.min(positions.length - 1, prev + 1));
  }, [positions.length]);

  const handleFretboardNoteClick = useCallback((note: { string: number; fret: number }) => {
    if (soundEnabled) playGuitarNote(note.string, note.fret, 0.6);
    setClickActiveNote(prev => prev && prev.string === note.string && prev.fret === note.fret ? null : note);
  }, [soundEnabled]);

  const handleTabNoteClick = useCallback((note: ExerciseNote) => {
    if (soundEnabled) playGuitarNote(note.string, note.fret, 0.6);
    if (!isPlaying) {
      setClickActiveNote({ string: note.string, fret: note.fret });
      setTimeout(() => setClickActiveNote(null), 1500);
    }
  }, [soundEnabled, isPlaying]);

  const handlePatternClick = useCallback((posIdx: number) => {
    setPositionIndex(posIdx);
    setShowAllPositions(false);
  }, []);

  // ─── PLAYBACK ENGINE ───

  const stopPlayback = useCallback(() => {
    playbackRef.current.playing = false;
    if (playbackRef.current.timeoutId) {
      clearTimeout(playbackRef.current.timeoutId);
      playbackRef.current.timeoutId = null;
    }
    setIsPlaying(false);
    setIsPaused(false);
    setPlayingIdx(-1);
    setPlaybackMode('idle');
    setPlaybackActiveNote(null); // Clear playback highlight only
  }, []);

  const startPlayback = useCallback((mode: 'exercise' | 'scale', startFromIdx: number = 0) => {
    stopPlayback();
    setClickActiveNote(null); // Clear any click highlight
    const notes = mode === 'exercise' ? currentExercise.notes : scaleNotesForPlayback;
    if (!notes.length) return;

    setIsPlaying(true);
    setIsPaused(false);
    setPlaybackMode(mode);
    playbackRef.current = { playing: true, notes, idx: startFromIdx, timeoutId: null };

    const intervalMs = (60 / bpm) * 1000;

    const playNext = () => {
      if (!playbackRef.current.playing) return;
      const idx = playbackRef.current.idx;
      if (idx >= notes.length) {
        stopPlayback();
        return;
      }
      const note = notes[idx];
      // Single highlight source: only set playbackActiveNote, not clickActiveNote
      setPlayingIdx(idx);
      setPlaybackActiveNote({ string: note.string, fret: note.fret });
      if (soundEnabled) playGuitarNote(note.string, note.fret, Math.min(intervalMs / 1000 * 0.8, 0.6));
      playbackRef.current.idx = idx + 1;
      playbackRef.current.timeoutId = window.setTimeout(playNext, intervalMs);
    };
    playNext();
  }, [currentExercise, scaleNotesForPlayback, bpm, soundEnabled, stopPlayback]);

  const togglePausePlayback = useCallback(() => {
    if (isPaused) {
      setIsPaused(false);
      playbackRef.current.playing = true;
      const notes = playbackRef.current.notes;
      const intervalMs = (60 / bpm) * 1000;

      const playNext = () => {
        if (!playbackRef.current.playing) return;
        const idx = playbackRef.current.idx;
        if (idx >= notes.length) {
          stopPlayback();
          return;
        }
        const note = notes[idx];
        setPlayingIdx(idx);
        setPlaybackActiveNote({ string: note.string, fret: note.fret });
        if (soundEnabled) playGuitarNote(note.string, note.fret, Math.min(intervalMs / 1000 * 0.8, 0.6));
        playbackRef.current.idx = idx + 1;
        playbackRef.current.timeoutId = window.setTimeout(playNext, intervalMs);
      };
      playNext();
    } else {
      playbackRef.current.playing = false;
      if (playbackRef.current.timeoutId) {
        clearTimeout(playbackRef.current.timeoutId);
        playbackRef.current.timeoutId = null;
      }
      setIsPaused(true);
    }
  }, [isPaused, bpm, soundEnabled, stopPlayback]);

  const handlePlayExercise = useCallback(() => {
    if (isPlaying && playbackMode === 'exercise') {
      togglePausePlayback();
    } else if (isPlaying) {
      stopPlayback();
      startPlayback('exercise');
    } else {
      startPlayback('exercise');
    }
  }, [isPlaying, playbackMode, togglePausePlayback, stopPlayback, startPlayback]);

  const handlePlayScale = useCallback(() => {
    if (isPlaying && playbackMode === 'scale') {
      togglePausePlayback();
    } else if (isPlaying) {
      stopPlayback();
      startPlayback('scale');
    } else {
      startPlayback('scale');
    }
  }, [isPlaying, playbackMode, togglePausePlayback, stopPlayback, startPlayback]);

  // ─── METRONOME ───

  const startMetronome = useCallback(() => {
    metronomeRef.current = true;
    beatCountRef.current = 0;
    setMetronomeOn(true);

    const tick = () => {
      if (!metronomeRef.current) return;
      const accent = beatCountRef.current % timeSignature === 0;
      setCurrentBeat(beatCountRef.current % timeSignature);
      if (soundEnabled) playMetronomeClick(accent);
      beatCountRef.current++;
      const intervalMs = (60 / bpm) * 1000;
      metronomeTimeoutRef.current = window.setTimeout(tick, intervalMs);
    };
    tick();
  }, [bpm, soundEnabled, timeSignature]);

  const stopMetronome = useCallback(() => {
    metronomeRef.current = false;
    if (metronomeTimeoutRef.current) clearTimeout(metronomeTimeoutRef.current);
    setMetronomeOn(false);
    setCurrentBeat(-1);
  }, []);

  const toggleMetronome = useCallback(() => {
    if (metronomeOn) stopMetronome();
    else startMetronome();
  }, [metronomeOn, startMetronome, stopMetronome]);

  useEffect(() => {
    if (metronomeOn) {
      stopMetronome();
      startMetronome();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bpm, timeSignature]);

  useEffect(() => {
    return () => {
      playbackRef.current.playing = false;
      metronomeRef.current = false;
    };
  }, []);

  const handleTapTempo = useCallback(() => {
    const now = Date.now();
    if (tapTimes.current.length > 0 && now - tapTimes.current[tapTimes.current.length - 1] > 2000) {
      tapTimes.current = [];
    }
    tapTimes.current.push(now);
    if (tapTimes.current.length > 5) tapTimes.current.shift();
    if (tapTimes.current.length >= 2) {
      const intervals = [];
      for (let i = 1; i < tapTimes.current.length; i++) {
        intervals.push(tapTimes.current[i] - tapTimes.current[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const newBpm = Math.round(60000 / avgInterval);
      setBpm(Math.max(40, Math.min(220, newBpm)));
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

  // ─── ANALYSIS DATA ───
  const analysisData = useMemo(() => {
    if (!currentExercise) return null;
    const notes = currentExercise.notes;
    const stringChanges = notes.filter((n, i) => i > 0 && n.string !== notes[i - 1].string).length;
    const positionShifts = notes.filter((n, i) => i > 0 && Math.abs(n.fret - notes[i - 1].fret) > 5).length;
    const uniqueStrings = new Set(notes.map(n => n.string)).size;
    const fretRange = notes.length ? `${Math.min(...notes.map(n => n.fret))}–${Math.max(...notes.map(n => n.fret))}` : '–';
    const avgFretJump = notes.length > 1
      ? (notes.reduce((sum, n, i) => i > 0 ? sum + Math.abs(n.fret - notes[i - 1].fret) : sum, 0) / (notes.length - 1)).toFixed(1)
      : '0';

    // Picking direction estimate
    const pickingDir = notes.map((n, i) => {
      if (i === 0) return 'D'; // downstroke
      const prev = notes[i - 1];
      // Same string, higher fret = same direction; different string = alternate
      if (n.string !== prev.string) return n.string > prev.string ? 'D' : 'U';
      return i % 2 === 0 ? 'D' : 'U';
    });

    // String movement pattern
    const stringPattern = notes.map((n, i) => {
      if (i === 0) return 'start';
      const diff = n.string - notes[i - 1].string;
      if (diff < 0) return `down ${Math.abs(diff)}`;
      if (diff > 0) return `up ${diff}`;
      return 'same';
    });

    return {
      stringChanges,
      positionShifts,
      uniqueStrings,
      fretRange,
      avgFretJump,
      pickingDir,
      stringPattern,
      totalNotes: notes.length,
    };
  }, [currentExercise]);

  // ─── RENDER ───
  return (
    <div className="h-screen flex flex-col bg-[#f5f0e8] text-[#2c2c2c] overflow-hidden">

      {/* ══════════════════════════════════════════════════
          TOP STICKY GLOBAL CONTEXT BAR
          ══════════════════════════════════════════════════ */}
      <header className="border-b-2 border-[#8b7355] bg-[#faf6ef] shrink-0 z-40">
        <div className="px-4 py-2 flex items-center gap-3">
          {/* Mobile menu button */}
          <button
            className="lg:hidden sketch-btn p-1.5 border-[#c4b89c]"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-sm border-2 border-[#8b7355] flex items-center justify-center bg-[#f5f0e8]">
              <Guitar className="w-4 h-4 text-[#6b5b47]" />
            </div>
            <h1 className="text-[14px] font-bold text-[#2c2c2c] hidden sm:block" style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic' }}>
              FretBoard Forge
            </h1>
          </div>

          {/* Separator */}
          <div className="w-px h-6 bg-[#c4b89c] hidden md:block" />

          {/* Key Selector — compact */}
          <div className="hidden md:flex items-center gap-1.5 shrink-0">
            <span className="text-[9px] uppercase tracking-[0.12em] text-[#8b7355] font-serif italic font-bold">Key</span>
            <div className="flex gap-0.5">
              {KEY_DISPLAY_NAMES.map((key, idx) => (
                <button
                  key={idx}
                  className={`h-6 min-w-[28px] px-1 text-[9px] font-semibold border transition-all rounded-sm ${
                    keyIndex === idx ? 'sketch-btn-active border-[#6b5b47]' : 'sketch-btn border-[#c4b89c] hover:border-[#8b7355]'
                  }`}
                  onClick={() => { setKeyIndex(idx); setPositionIndex(0); stopPlayback(); }}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>

          <div className="w-px h-6 bg-[#c4b89c] hidden md:block" />

          {/* Scale Selector — compact */}
          <div className="hidden md:flex items-center gap-1.5 shrink-0">
            <span className="text-[9px] uppercase tracking-[0.12em] text-[#8b7355] font-serif italic font-bold">Scale</span>
            <Select value={scaleId} onValueChange={(v) => { setScaleId(v); setPositionIndex(0); stopPlayback(); }}>
              <SelectTrigger className="bg-[#f5f0e8] border-[#c4b89c] text-[#2c2c2c] text-[10px] rounded-sm h-6 w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#faf6ef] border-[#c4b89c]">
                {Object.entries(SCALES).map(([id, s]) => (
                  <SelectItem key={id} value={id} className="text-[#2c2c2c] focus:bg-[rgba(139,115,85,0.1)] text-[10px]">
                    {s.name} ({s.intervals.length})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-px h-6 bg-[#c4b89c] hidden md:block" />

          {/* Position Selector — compact */}
          <div className="hidden md:flex items-center gap-1 shrink-0">
            <span className="text-[9px] uppercase tracking-[0.12em] text-[#8b7355] font-serif italic font-bold">Pos</span>
            <button className="sketch-btn w-5 h-6 flex items-center justify-center border-[#c4b89c] disabled:opacity-30 p-0" onClick={handlePrevPosition} disabled={positionIndex <= 0}>
              <ChevronLeft className="h-3 w-3" />
            </button>
            {positions.map((_, idx) => (
              <button
                key={idx}
                className={`h-6 w-6 text-[9px] font-semibold rounded-sm transition-all border p-0 ${
                  !showAllPositions && positionIndex === idx ? 'sketch-btn-active border-[#6b5b47]' : 'sketch-btn border-[#c4b89c] hover:border-[#8b7355]'
                }`}
                onClick={() => { setPositionIndex(idx); setShowAllPositions(false); stopPlayback(); }}
              >
                {idx + 1}
              </button>
            ))}
            <button
              className={`h-6 px-1.5 text-[9px] font-semibold rounded-sm transition-all border p-0 ${
                showAllPositions ? 'sketch-btn-active border-[#6b5b47]' : 'sketch-btn border-[#c4b89c] hover:border-[#8b7355]'
              }`}
              onClick={() => { setShowAllPositions(true); stopPlayback(); }}
            >
              All
            </button>
            <button className="sketch-btn w-5 h-6 flex items-center justify-center border-[#c4b89c] disabled:opacity-30 p-0" onClick={handleNextPosition} disabled={positionIndex >= positions.length - 1}>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          {/* Mobile context pill */}
          <div className="md:hidden flex-1 flex items-center justify-center">
            <span className="text-[10px] font-serif italic text-[#4a4a4a] font-bold">
              {keyNote} {scale.name} · P{positionIndex + 1}
            </span>
          </div>

          {/* Spacer */}
          <div className="flex-1 hidden md:block" />

          {/* Current context summary — desktop */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <span className="text-[9px] text-[#8b7355] font-serif italic">
              {currentPosition.name} · Frets {currentPosition.fretStart}–{currentPosition.fretEnd}
            </span>
          </div>

          {/* Sound toggle */}
          <button
            className={`sketch-btn px-2 py-1 text-[9px] flex items-center gap-1 shrink-0 ${soundEnabled ? 'border-[#6b5b47]' : 'border-[#c4b89c] opacity-50'}`}
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
          </button>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════
          MAIN WORK AREA — 3-column desktop / single mobile
          ══════════════════════════════════════════════════ */}
      <div className="flex-1 flex overflow-hidden">

        {/* ─── LEFT SIDEBAR: Exercise Library ─── */}
        {/* Desktop: always visible. Mobile: drawer overlay */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-30 bg-black/30" onClick={() => setSidebarOpen(false)} />
        )}
        <aside className={`
          fixed lg:relative inset-y-0 left-0 z-30 lg:z-0
          w-[260px] lg:w-[260px] shrink-0
          bg-[#faf6ef] border-r-2 border-[#8b7355]
          overflow-y-auto
          transform transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          pt-[52px] lg:pt-0
        `}>
          <div className="p-3 space-y-2">
            {/* Sidebar header */}
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] uppercase tracking-[0.15em] text-[#8b7355] font-serif italic font-bold">Exercise Library</h3>
              <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
                <X className="w-4 h-4 text-[#8b7355]" />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#8b7355]" />
              <input
                type="text"
                placeholder="Search exercises..."
                value={exerciseSearch}
                onChange={e => setExerciseSearch(e.target.value)}
                className="w-full pl-6 pr-2 py-1.5 text-[10px] bg-[#f5f0e8] border border-[#c4b89c] rounded-sm focus:outline-none focus:border-[#8b7355] font-serif italic"
              />
            </div>

            {/* Random button */}
            <button
              className="sketch-btn w-full text-[9px] py-1.5 border-[#8b7355] text-[#6b5b47] font-semibold flex items-center justify-center gap-1"
              onClick={handleRandomize}
            >
              <Shuffle className="w-3 h-3" />
              Random Exercise
            </button>

            {/* Category groups */}
            <div className="space-y-1">
              {filteredCategories.map(cat => {
                const Icon = cat.icon;
                const isActiveCat = cat.types.includes(exerciseType);
                const isExpanded = expandedCategory === cat.label;

                return (
                  <div key={cat.label}>
                    <button
                      className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded-sm text-[10px] font-serif italic font-bold transition-all ${
                        isActiveCat
                          ? 'bg-[rgba(155,57,57,0.08)] text-[#9b3939]'
                          : 'text-[#6b5b47] hover:bg-[rgba(139,115,85,0.06)]'
                      }`}
                      onClick={() => setExpandedCategory(isExpanded ? '' : cat.label)}
                    >
                      <Icon className="w-3 h-3 shrink-0" />
                      <span className="flex-1 text-left">{cat.label}</span>
                      <span className="text-[8px] opacity-50">{cat.types.length}</span>
                      {isExpanded ? <ChevronUp className="w-3 h-3 opacity-40" /> : <ChevronDown className="w-3 h-3 opacity-40" />}
                    </button>

                    {(isExpanded || isActiveCat) && (
                      <div className="ml-4 mt-0.5 space-y-0.5">
                        {cat.types.map(typeId => {
                          const info = EXERCISE_TYPES[typeId];
                          const isSelected = exerciseType === typeId;
                          return (
                            <button
                              key={typeId}
                              className={`w-full text-left text-[9px] py-1 px-2 rounded-sm transition-all ${
                                isSelected
                                  ? 'bg-[rgba(155,57,57,0.12)] text-[#9b3939] font-bold'
                                  : 'text-[#4a4a4a] hover:bg-[rgba(139,115,85,0.08)]'
                              }`}
                              onClick={() => { setExerciseType(typeId); stopPlayback(); setSidebarOpen(false); }}
                              title={info.description}
                            >
                              {info.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Intervals legend at bottom of sidebar */}
            <div className="border-t border-[#e8e2d6] pt-2 mt-3">
              <h4 className="text-[9px] uppercase tracking-[0.12em] text-[#8b7355] font-serif italic font-bold mb-1.5">Intervals</h4>
              <div className="flex flex-wrap gap-1">
                {scale.intervalLabels.map((label, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center justify-center px-1.5 py-0.5 text-[8px] font-bold font-serif italic border rounded-sm"
                    style={{
                      borderColor: getIntervalColor(label) + '55',
                      color: getIntervalColor(label),
                      backgroundColor: getIntervalColor(label) + '12',
                    }}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Scale notes at bottom of sidebar */}
            <div className="border-t border-[#e8e2d6] pt-2 mt-2">
              <h4 className="text-[9px] uppercase tracking-[0.12em] text-[#8b7355] font-serif italic font-bold mb-1.5">Scale Notes</h4>
              <div className="flex flex-wrap gap-1">
                {scaleNotes.map((note, idx) => {
                  const label = scale.intervalLabels[idx];
                  const color = getIntervalColor(label);
                  return (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[8px] font-serif italic border rounded-sm"
                      style={{ borderColor: color + '40', color, backgroundColor: color + '08' }}
                    >
                      <span className="font-bold">{note}</span>
                      <span className="opacity-40 text-[7px]">{label}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>

        {/* ─── CENTER PANEL: Active Practice Workspace ─── */}
        <main className="flex-1 overflow-y-auto min-w-0 pb-[72px] lg:pb-[68px]">
          <div className="p-3 lg:p-4 space-y-3">

            {/* Exercise header */}
            <div className="sketch-card bg-[#faf6ef] px-3 py-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[12px] font-bold text-[#9b3939] font-serif italic truncate">
                    {currentExercise?.name || 'Select exercise'}
                  </span>
                  <span className="text-[9px] text-[#8b7355] font-serif italic hidden sm:inline">— {currentExercise?.description}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[9px] text-[#b8a88a] font-serif italic">{currentExercise?.notes.length || 0} notes</span>
                  <span className="text-[9px] text-[#6b5b47] font-serif italic font-semibold">
                    {keyNote} {scale.name} · {showAllPositions ? 'All Pos' : `P${positionIndex + 1}`}
                  </span>
                  {/* Currently playing note info */}
                  {isPlaying && playbackActiveNote && (
                    <span className="text-[9px] text-[#9b3939] font-serif italic font-bold">
                      ▸ {playingIdx + 1}/{playbackMode === 'exercise' ? currentExercise.notes.length : scaleNotesForPlayback.length}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* View Switcher */}
            <div className="flex items-center gap-1">
              {([
                { mode: 'fretboard' as ViewMode, icon: Guitar, label: 'Fretboard' },
                { mode: 'tab' as ViewMode, icon: FileText, label: 'Tab' },
                { mode: 'hybrid' as ViewMode, icon: Eye, label: 'Hybrid' },
                { mode: 'analysis' as ViewMode, icon: BarChart3, label: 'Analysis' },
              ]).map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  className={`flex items-center gap-1 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider border-2 rounded-sm transition-all ${
                    viewMode === mode
                      ? 'sketch-btn-active border-[#6b5b47] text-[#2c2c2c]'
                      : 'sketch-btn border-[#c4b89c] text-[#8b7355] hover:border-[#8b7355]'
                  }`}
                  onClick={() => setViewMode(mode)}
                >
                  <Icon className="w-3 h-3" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}

              {/* Inline play controls in view switcher area */}
              <div className="flex-1" />
              <div className="flex items-center gap-1">
                <button
                  className={`px-2 py-1 text-[9px] font-bold flex items-center gap-1 border-2 rounded-sm transition-all ${
                    isPlaying && playbackMode === 'exercise' && !isPaused
                      ? 'bg-[#9b3939] text-white border-[#9b3939]'
                      : 'sketch-btn border-[#6b5b47]'
                  }`}
                  onClick={handlePlayExercise}
                  title="Play exercise"
                >
                  {isPlaying && playbackMode === 'exercise' && !isPaused ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  <span className="hidden sm:inline">Exercise</span>
                </button>
                <button
                  className={`px-2 py-1 text-[9px] font-bold flex items-center gap-1 border-2 rounded-sm transition-all ${
                    isPlaying && playbackMode === 'scale' && !isPaused
                      ? 'bg-[#4a5a8a] text-white border-[#4a5a8a]'
                      : 'sketch-btn border-[#4a5a8a]'
                  }`}
                  onClick={handlePlayScale}
                  title="Play scale"
                >
                  {isPlaying && playbackMode === 'scale' && !isPaused ? <Pause className="w-3 h-3" /> : <Music className="w-3 h-3" />}
                  <span className="hidden sm:inline">Scale</span>
                </button>
                {isPlaying && (
                  <button
                    className="px-2 py-1 text-[9px] font-bold flex items-center gap-1 border-2 rounded-sm bg-[#4a4a4a] text-white border-[#4a4a4a]"
                    onClick={stopPlayback}
                  >
                    <Square className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* ─── View Content ─── */}

            {/* Fretboard View */}
            {viewMode === 'fretboard' && (
              <div className="sketch-card bg-[#faf6ef] overflow-hidden">
                <div className="px-2 py-2 overflow-x-auto">
                  <FretboardDiagram
                    keyNote={keyNote}
                    scaleId={scaleId}
                    startFret={startFret}
                    endFret={endFret}
                    showAllPositions={showAllPositions}
                    positionIndex={positionIndex}
                    highlightNotes={isPlaying ? undefined : exerciseHighlightNotes}
                    exercisePath={isPlaying ? undefined : exercisePath}
                    activeNote={effectiveActiveNote}
                    onNoteClick={handleFretboardNoteClick}
                    showPatternLines={true}
                    fullFretboard={true}
                  />
                </div>
              </div>
            )}

            {/* Tab View */}
            {viewMode === 'tab' && (
              <TabNotation
                exercise={currentExercise}
                onNoteClick={handleTabNoteClick}
                playingIdx={playingIdx}
                isPlaying={isPlaying}
                isPaused={isPaused}
                playbackMode={playbackMode}
                onPlayExercise={handlePlayExercise}
                onPlayScale={handlePlayScale}
                onPause={togglePausePlayback}
                onStop={stopPlayback}
              />
            )}

            {/* Hybrid View — Fretboard + Tab stacked */}
            {viewMode === 'hybrid' && (
              <>
                <div className="sketch-card bg-[#faf6ef] overflow-hidden">
                  <div className="px-2 py-2 overflow-x-auto">
                    <FretboardDiagram
                      keyNote={keyNote}
                      scaleId={scaleId}
                      startFret={startFret}
                      endFret={endFret}
                      showAllPositions={showAllPositions}
                      positionIndex={positionIndex}
                      highlightNotes={isPlaying ? undefined : exerciseHighlightNotes}
                      exercisePath={isPlaying ? undefined : exercisePath}
                      activeNote={effectiveActiveNote}
                      onNoteClick={handleFretboardNoteClick}
                      showPatternLines={true}
                      fullFretboard={true}
                    />
                  </div>
                </div>
                <TabNotation
                  exercise={currentExercise}
                  onNoteClick={handleTabNoteClick}
                  playingIdx={playingIdx}
                  isPlaying={isPlaying}
                  isPaused={isPaused}
                  playbackMode={playbackMode}
                  onPlayExercise={handlePlayExercise}
                  onPlayScale={handlePlayScale}
                  onPause={togglePausePlayback}
                  onStop={stopPlayback}
                />
              </>
            )}

            {/* Analysis View */}
            {viewMode === 'analysis' && analysisData && (
              <div className="sketch-card bg-[#faf6ef] p-4 space-y-4">
                {/* Exercise Overview */}
                <div>
                  <h3 className="text-[10px] uppercase tracking-[0.15em] text-[#8b7355] font-serif italic font-bold mb-2">Exercise Overview</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="bg-[#f5f0e8] border border-[#e8e2d6] rounded-sm p-2">
                      <div className="text-[8px] text-[#8b7355] font-serif italic uppercase">Total Notes</div>
                      <div className="text-[16px] font-bold text-[#2c2c2c] font-serif italic">{analysisData.totalNotes}</div>
                    </div>
                    <div className="bg-[#f5f0e8] border border-[#e8e2d6] rounded-sm p-2">
                      <div className="text-[8px] text-[#8b7355] font-serif italic uppercase">Fret Range</div>
                      <div className="text-[16px] font-bold text-[#2c2c2c] font-serif italic">{analysisData.fretRange}</div>
                    </div>
                    <div className="bg-[#f5f0e8] border border-[#e8e2d6] rounded-sm p-2">
                      <div className="text-[8px] text-[#8b7355] font-serif italic uppercase">String Changes</div>
                      <div className="text-[16px] font-bold text-[#2c2c2c] font-serif italic">{analysisData.stringChanges}</div>
                    </div>
                    <div className="bg-[#f5f0e8] border border-[#e8e2d6] rounded-sm p-2">
                      <div className="text-[8px] text-[#8b7355] font-serif italic uppercase">Position Shifts</div>
                      <div className="text-[16px] font-bold text-[#2c2c2c] font-serif italic">{analysisData.positionShifts}</div>
                    </div>
                  </div>
                </div>

                {/* Scale Formula */}
                <div>
                  <h3 className="text-[10px] uppercase tracking-[0.15em] text-[#8b7355] font-serif italic font-bold mb-2">Scale Formula</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {scaleNotes.map((note, idx) => {
                      const label = scale.intervalLabels[idx];
                      const color = getIntervalColor(label);
                      return (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-serif italic border rounded-sm"
                          style={{ borderColor: color + '50', color, backgroundColor: color + '0a' }}
                        >
                          <span className="font-bold">{note}</span>
                          <span className="opacity-50 text-[8px]">{label}</span>
                        </span>
                      );
                    })}
                  </div>
                  <p className="text-[9px] text-[#8b7355] font-serif italic mt-1.5">
                    Steps: {scale.intervals.slice(1).map((interval, idx) => {
                      const prevInterval = idx === 0 ? 0 : scale.intervals[idx];
                      const step = interval - prevInterval;
                      return step === 1 ? 'H' : step === 2 ? 'W' : `${step}H`;
                    }).join(' − ')}
                  </p>
                </div>

                {/* String Coverage */}
                <div>
                  <h3 className="text-[10px] uppercase tracking-[0.15em] text-[#8b7355] font-serif italic font-bold mb-2">String Coverage</h3>
                  <div className="flex gap-2">
                    {['E', 'A', 'D', 'G', 'B', 'e'].map((s, idx) => {
                      const used = currentExercise.notes.some(n => n.string === idx);
                      return (
                        <div key={s} className={`w-8 h-8 rounded-sm border-2 flex items-center justify-center text-[10px] font-bold font-serif italic ${
                          used ? 'border-[#8b7355] bg-[rgba(139,115,85,0.1)] text-[#4a4a4a]' : 'border-[#e8e2d6] text-[#c4b89c]'
                        }`}>
                          {s}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[9px] text-[#8b7355] font-serif italic mt-1">
                    {analysisData.uniqueStrings} of 6 strings used · Avg fret jump: {analysisData.avgFretJump} frets
                  </p>
                </div>

                {/* Picking Pattern */}
                <div>
                  <h3 className="text-[10px] uppercase tracking-[0.15em] text-[#8b7355] font-serif italic font-bold mb-2">Suggested Picking</h3>
                  <div className="flex flex-wrap gap-0.5">
                    {analysisData.pickingDir.slice(0, 30).map((dir, idx) => (
                      <span
                        key={idx}
                        className={`w-4 h-4 rounded-sm flex items-center justify-center text-[7px] font-bold border ${
                          dir === 'D'
                            ? 'border-[#4a7a4a] text-[#4a7a4a] bg-[rgba(74,122,74,0.08)]'
                            : 'border-[#4a5a8a] text-[#4a5a8a] bg-[rgba(74,90,138,0.08)]'
                        }`}
                      >
                        {dir}
                      </span>
                    ))}
                    {analysisData.pickingDir.length > 30 && (
                      <span className="text-[8px] text-[#8b7355] font-serif italic ml-1">+{analysisData.pickingDir.length - 30} more</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[8px] text-[#4a7a4a] font-serif italic">D = Downstroke</span>
                    <span className="text-[8px] text-[#4a5a8a] font-serif italic">U = Upstroke</span>
                  </div>
                </div>

                {/* Position Info */}
                <div>
                  <h3 className="text-[10px] uppercase tracking-[0.15em] text-[#8b7355] font-serif italic font-bold mb-2">Position Context</h3>
                  <div className="bg-[#f5f0e8] border border-[#e8e2d6] rounded-sm p-3 space-y-1.5">
                    <p className="text-[10px] text-[#4a4a4a] font-serif italic">
                      <span className="font-bold text-[#8b7355]">Shape:</span> {currentPosition.name} — CAGED position {positionIndex + 1} of {positions.length}
                    </p>
                    <p className="text-[10px] text-[#4a4a4a] font-serif italic">
                      <span className="font-bold text-[#8b7355]">Fret span:</span> Frets {currentPosition.fretStart} to {currentPosition.fretEnd} ({currentPosition.fretEnd - currentPosition.fretStart + 1} frets)
                    </p>
                    <p className="text-[10px] text-[#4a4a4a] font-serif italic">
                      <span className="font-bold text-[#8b7355]">Pattern:</span> {currentExercise.type} exercise in {keyNote} {scale.name}
                    </p>
                    <p className="text-[10px] text-[#4a4a4a] font-serif italic">
                      <span className="font-bold text-[#8b7355]">Practice tip:</span> {analysisData.positionShifts > 0
                        ? 'This exercise involves position shifts — practice slowly and focus on smooth transitions.'
                        : analysisData.stringChanges > currentExercise.notes.length * 0.6
                          ? 'High string-crossing density — keep your picking hand relaxed and use efficient alternate picking.'
                          : 'Focus on clean note articulation and consistent timing with the metronome.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ─── Mobile: Explorer section (below main view) ─── */}
            <div className="xl:hidden">
              <button
                className="w-full sketch-card bg-[#faf6ef] px-3 py-2 flex items-center justify-between"
                onClick={() => setRightPanelExpanded(!rightPanelExpanded)}
              >
                <span className="text-[9px] uppercase tracking-[0.12em] text-[#8b7355] font-serif italic font-bold">Scale Explorer</span>
                {rightPanelExpanded ? <ChevronUp className="w-3 h-3 text-[#8b7355]" /> : <ChevronDown className="w-3 h-3 text-[#8b7355]" />}
              </button>
              {rightPanelExpanded && (
                <div className="mt-2 space-y-3">
                  {/* CAGED Patterns — compact */}
                  <div className="sketch-card bg-[#faf6ef] p-3">
                    <h4 className="text-[9px] uppercase tracking-[0.12em] text-[#8b7355] font-serif italic font-bold mb-2">CAGED Positions</h4>
                    <div className="grid grid-cols-5 gap-2">
                      {patternExercises.map((pat) => (
                        <button
                          key={pat.position}
                          onClick={() => handlePatternClick(pat.position - 1)}
                          className="text-left"
                        >
                          <PatternDiagram
                            keyNote={keyNote}
                            scaleId={scaleId}
                            fretStart={pat.fretStart}
                            fretEnd={pat.fretEnd}
                            positionNumber={pat.position}
                            exerciseNotes={pat.notes}
                            selected={positionIndex === pat.position - 1 && !showAllPositions}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* ─── RIGHT SIDEBAR: Explorer / Related Content ─── */}
        <aside className="hidden xl:block w-[300px] shrink-0 border-l-2 border-[#8b7355] bg-[#faf6ef] overflow-y-auto">
          <div className="p-3 space-y-3">

            {/* Scale Context Card */}
            <div className="sketch-card bg-[#f5f0e8] p-3">
              <h4 className="text-[10px] uppercase tracking-[0.12em] text-[#8b7355] font-serif italic font-bold mb-2">
                {keyNote} {scale.name}
              </h4>
              <div className="flex flex-wrap gap-1 mb-2">
                {scaleNotes.map((note, idx) => {
                  const label = scale.intervalLabels[idx];
                  const color = getIntervalColor(label);
                  return (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-serif italic border rounded-sm"
                      style={{ borderColor: color + '40', color, backgroundColor: color + '08' }}
                    >
                      <span className="font-bold">{note}</span>
                      <span className="opacity-40 text-[7px]">{label}</span>
                    </span>
                  );
                })}
              </div>
              <p className="text-[8px] text-[#8b7355] font-serif italic">
                {scale.intervals.length} notes · {scale.intervalLabels.join(' − ')}
              </p>
              <p className="text-[8px] text-[#8b7355] font-serif italic mt-0.5">
                Steps: {scale.intervals.slice(1).map((interval, idx) => {
                  const prevInterval = idx === 0 ? 0 : scale.intervals[idx];
                  const step = interval - prevInterval;
                  return step === 1 ? 'H' : step === 2 ? 'W' : `${step}H`;
                }).join(' − ')}
              </p>
            </div>

            {/* Position Thumbnails */}
            <div>
              <h4 className="text-[9px] uppercase tracking-[0.12em] text-[#8b7355] font-serif italic font-bold mb-2">CAGED Positions</h4>
              <div className="space-y-2">
                {patternExercises.map((pat) => (
                  <button
                    key={pat.position}
                    onClick={() => handlePatternClick(pat.position - 1)}
                    className="w-full text-left"
                  >
                    <PatternDiagram
                      keyNote={keyNote}
                      scaleId={scaleId}
                      fretStart={pat.fretStart}
                      fretEnd={pat.fretEnd}
                      positionNumber={pat.position}
                      exerciseNotes={pat.notes}
                      selected={positionIndex === pat.position - 1 && !showAllPositions}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Related Exercises */}
            <div>
              <h4 className="text-[9px] uppercase tracking-[0.12em] text-[#8b7355] font-serif italic font-bold mb-2">Related Exercises</h4>
              <div className="space-y-1">
                {EXERCISE_CATEGORIES.find(c => c.types.includes(exerciseType))?.types
                  .filter(t => t !== exerciseType)
                  .slice(0, 4)
                  .map(typeId => {
                    const info = EXERCISE_TYPES[typeId];
                    return (
                      <button
                        key={typeId}
                        className="w-full text-left flex items-center gap-1.5 px-2 py-1.5 rounded-sm text-[9px] text-[#4a4a4a] hover:bg-[rgba(139,115,85,0.08)] transition-all"
                        onClick={() => { setExerciseType(typeId); stopPlayback(); }}
                      >
                        <ArrowRight className="w-2.5 h-2.5 text-[#8b7355] shrink-0" />
                        <span className="font-serif italic">{info.name}</span>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Session Info */}
            <div className="border-t border-[#e8e2d6] pt-3">
              <h4 className="text-[9px] uppercase tracking-[0.12em] text-[#8b7355] font-serif italic font-bold mb-2">Session</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-[9px]">
                  <span className="text-[#8b7355] font-serif italic">Position</span>
                  <span className="text-[#4a4a4a] font-bold">{showAllPositions ? 'All' : `P${positionIndex + 1}`} ({currentPosition.fretStart}–{currentPosition.fretEnd})</span>
                </div>
                <div className="flex justify-between text-[9px]">
                  <span className="text-[#8b7355] font-serif italic">Exercise</span>
                  <span className="text-[#4a4a4a] font-bold">{currentExercise?.name}</span>
                </div>
                <div className="flex justify-between text-[9px]">
                  <span className="text-[#8b7355] font-serif italic">Notes</span>
                  <span className="text-[#4a4a4a] font-bold">{currentExercise?.notes.length || 0}</span>
                </div>
                <div className="flex justify-between text-[9px]">
                  <span className="text-[#8b7355] font-serif italic">Tempo</span>
                  <span className="text-[#4a4a4a] font-bold">{bpm} BPM</span>
                </div>
              </div>
            </div>

            {/* Available exercises count */}
            <div className="text-center pt-2 border-t border-[#e8e2d6]">
              <p className="text-[8px] text-[#b8a88a] font-serif italic">
                {Object.keys(EXERCISE_TYPES).length} exercises · 12 keys · 12 scales · 5 positions
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* ══════════════════════════════════════════════════
          BOTTOM STICKY PRACTICE BAR
          ══════════════════════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t-2 border-[#8b7355] bg-[#faf6ef]">
        <div className="px-3 py-2 flex items-center gap-3">

          {/* Transport */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              className={`w-8 h-8 flex items-center justify-center border-2 rounded-sm transition-all ${
                isPlaying && playbackMode === 'exercise' && !isPaused
                  ? 'bg-[#9b3939] text-white border-[#9b3939]'
                  : 'sketch-btn border-[#6b5b47]'
              }`}
              onClick={handlePlayExercise}
              title="Play exercise"
            >
              {isPlaying && playbackMode === 'exercise' && !isPaused ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              className={`w-8 h-8 flex items-center justify-center border-2 rounded-sm transition-all ${
                isPlaying && playbackMode === 'scale' && !isPaused
                  ? 'bg-[#4a5a8a] text-white border-[#4a5a8a]'
                  : 'sketch-btn border-[#4a5a8a]'
              }`}
              onClick={handlePlayScale}
              title="Play scale"
            >
              {isPlaying && playbackMode === 'scale' && !isPaused ? <Pause className="w-3.5 h-3.5" /> : <Music className="w-3.5 h-3.5" />}
            </button>
            {isPlaying && (
              <button
                className="w-8 h-8 flex items-center justify-center border-2 rounded-sm bg-[#4a4a4a] text-white border-[#4a4a4a]"
                onClick={stopPlayback}
                title="Stop"
              >
                <Square className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Separator */}
          <div className="w-px h-6 bg-[#e8e2d6]" />

          {/* Tempo */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center gap-1 shrink-0">
              <Timer className="w-3 h-3 text-[#8b7355]" />
              <span className="text-[14px] font-mono font-bold text-[#4a4a4a]">{bpm}</span>
              <span className="text-[8px] text-[#8b7355] font-serif italic hidden sm:inline">BPM</span>
            </div>
            <input
              type="range"
              min={40}
              max={220}
              step={1}
              value={bpm}
              onChange={e => setBpm(Number(e.target.value))}
              className="w-16 sm:w-24 h-1.5 cursor-pointer"
              style={{ accentColor: '#8b7355' }}
            />
            <div className="hidden md:flex gap-0.5">
              {bpmPresets.map(preset => (
                <button
                  key={preset}
                  className={`text-[8px] px-1 py-0.5 border rounded-sm transition-all ${
                    bpm === preset ? 'sketch-btn-active border-[#6b5b47]' : 'sketch-btn border-[#c4b89c] hover:border-[#8b7355]'
                  }`}
                  onClick={() => setBpm(preset)}
                >
                  {preset}
                </button>
              ))}
            </div>
            <button
              className="sketch-btn text-[8px] px-1.5 py-0.5 border-[#8b7355] text-[#6b5b47] font-semibold hidden sm:block"
              onClick={handleTapTempo}
            >
              TAP
            </button>
          </div>

          {/* Separator */}
          <div className="w-px h-6 bg-[#e8e2d6]" />

          {/* Metronome */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              className={`px-2 py-1.5 text-[9px] font-bold flex items-center gap-1 border-2 rounded-sm transition-all ${
                metronomeOn
                  ? 'bg-[#9b3939] text-white border-[#9b3939]'
                  : 'sketch-btn border-[#6b5b47]'
              }`}
              onClick={toggleMetronome}
            >
              <Drum className="w-3 h-3" />
              <span className="hidden sm:inline">{metronomeOn ? 'STOP' : 'MET'}</span>
            </button>
            {/* Beat indicators */}
            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: timeSignature }, (_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full border-2 transition-all duration-75 ${
                    metronomeOn && currentBeat === i
                      ? 'bg-[#9b3939] border-[#9b3939] scale-110'
                      : 'bg-transparent border-[#c4b89c]'
                  }`}
                />
              ))}
            </div>
            {/* Time sig */}
            <div className="hidden md:flex gap-0.5">
              {[3, 4, 5, 6].map(ts => (
                <button
                  key={ts}
                  className={`text-[8px] px-1 py-0.5 border rounded-sm transition-all ${
                    timeSignature === ts ? 'sketch-btn-active border-[#6b5b47]' : 'sketch-btn border-[#c4b89c] hover:border-[#8b7355]'
                  }`}
                  onClick={() => setTimeSignature(ts)}
                >
                  {ts}/4
                </button>
              ))}
            </div>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Playback status */}
          {isPlaying && (
            <div className="hidden md:flex items-center gap-1 shrink-0">
              <span className="text-[9px] text-[#9b3939] font-serif italic font-bold">
                {playbackMode === 'exercise' ? 'EXERCISE' : 'SCALE'}
              </span>
              <span className="text-[9px] text-[#4a4a4a] font-mono">
                {playingIdx + 1}/{playbackMode === 'exercise' ? currentExercise.notes.length : scaleNotesForPlayback.length}
              </span>
            </div>
          )}

          {/* Mobile key/scale quick change */}
          <div className="md:hidden flex items-center gap-1 shrink-0">
            <Select value={scaleId} onValueChange={(v) => { setScaleId(v); setPositionIndex(0); stopPlayback(); }}>
              <SelectTrigger className="bg-[#f5f0e8] border-[#c4b89c] text-[9px] rounded-sm h-7 w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#faf6ef] border-[#c4b89c]">
                {Object.entries(SCALES).map(([id, s]) => (
                  <SelectItem key={id} value={id} className="text-[9px] text-[#2c2c2c]">
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
