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
} from 'lucide-react';

// ─── AUDIO ENGINE ───
const STRING_FREQUENCIES = [82.41, 110.0, 146.83, 196.0, 246.94, 329.63]; // E2, A2, D3, G3, B3, E4

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

    // Main oscillator - warm triangle
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    // Harmonic - subtle sawtooth for body
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(freq, ctx.currentTime);

    // Sub harmonic - an octave below for warmth
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(freq * 0.5, ctx.currentTime);

    // Attack envelope - quick attack, medium decay
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
  } catch (e) {
    // Silently fail
  }
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
  if (label.includes('♭3') || label.includes('♭2')) return '#6b4a7a';
  if (label === '3' || label === '2') return '#4a7a4a';
  if (label === '4') return '#4a5a8a';
  if (label === '5') return '#4a7a7a';
  if (label.includes('5')) return '#4a7a7a';
  if (label.includes('6')) return '#8a6a3a';
  if (label.includes('7')) return '#7a4a6a';
  if (label.includes('♯') || label.includes('♭')) return '#6b4a7a';
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

// ─── MAIN COMPONENT ───
export default function Home() {
  // Core state
  const [keyIndex, setKeyIndex] = useState(9); // A
  const [scaleId, setScaleId] = useState('minor-pentatonic');
  const [positionIndex, setPositionIndex] = useState(0);
  const [exerciseType, setExerciseType] = useState<ExerciseType>('scale-asc-desc');
  const [showAllPositions, setShowAllPositions] = useState(false);
  const [activeNote, setActiveNote] = useState<{ string: number; fret: number } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [playingIdx, setPlayingIdx] = useState(-1);
  const [playbackMode, setPlaybackMode] = useState<'idle' | 'exercise' | 'scale'>('idle');
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

  // Scale notes for "play scale" feature
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

  // Exercise highlighting
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
    setActiveNote(prev => prev && prev.string === note.string && prev.fret === note.fret ? null : note);
  }, [soundEnabled]);

  const handleTabNoteClick = useCallback((note: ExerciseNote) => {
    if (soundEnabled) playGuitarNote(note.string, note.fret, 0.6);
    setActiveNote({ string: note.string, fret: note.fret });
    setTimeout(() => setActiveNote(null), 1500);
  }, [soundEnabled]);

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
    setActiveNote(null);
  }, []);

  const startPlayback = useCallback((mode: 'exercise' | 'scale', startFromIdx: number = 0) => {
    stopPlayback();
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
      setPlayingIdx(idx);
      setActiveNote({ string: note.string, fret: note.fret });
      if (soundEnabled) playGuitarNote(note.string, note.fret, Math.min(intervalMs / 1000 * 0.8, 0.6));
      playbackRef.current.idx = idx + 1;
      playbackRef.current.timeoutId = window.setTimeout(playNext, intervalMs);
    };
    playNext();
  }, [currentExercise, scaleNotesForPlayback, bpm, soundEnabled, stopPlayback]);

  const togglePausePlayback = useCallback(() => {
    if (isPaused) {
      // Resume
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
        setActiveNote({ string: note.string, fret: note.fret });
        if (soundEnabled) playGuitarNote(note.string, note.fret, Math.min(intervalMs / 1000 * 0.8, 0.6));
        playbackRef.current.idx = idx + 1;
        playbackRef.current.timeoutId = window.setTimeout(playNext, intervalMs);
      };
      playNext();
    } else {
      // Pause
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

  // Restart metronome when BPM changes while running
  useEffect(() => {
    if (metronomeOn) {
      stopMetronome();
      startMetronome();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bpm, timeSignature]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      playbackRef.current.playing = false;
      metronomeRef.current = false;
    };
  }, []);

  // Tap tempo
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

  // BPM presets
  const bpmPresets = [60, 80, 100, 120, 140, 160, 180];

  // Active playback notes for TabNotation
  const activePlayingNote = useMemo(() => {
    if (!isPlaying || playingIdx < 0) return null;
    const notes = playbackMode === 'exercise' ? currentExercise.notes : scaleNotesForPlayback;
    return notes[playingIdx] || null;
  }, [isPlaying, playingIdx, playbackMode, currentExercise, scaleNotesForPlayback]);

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f0e8] text-[#2c2c2c]">
      {/* ── HEADER ── */}
      <header className="border-b-2 border-[#8b7355] bg-[#faf6ef] shrink-0">
        <div className="max-w-[1440px] mx-auto px-5 py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-sm border-2 border-[#8b7355] flex items-center justify-center bg-[#f5f0e8]">
              <Music className="w-5 h-5 text-[#6b5b47]" />
            </div>
            <div>
              <h1 className="text-[17px] font-bold text-[#2c2c2c] leading-tight" style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic' }}>
                FretBoard Forge
              </h1>
              <p className="text-[9px] text-[#8b7355] font-serif italic -mt-0.5 tracking-wide">Procedural Guitar Exercise Generator</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className={`sketch-btn px-2.5 py-1.5 text-[10px] flex items-center gap-1.5 ${soundEnabled ? 'border-[#6b5b47]' : 'border-[#c4b89c] opacity-50'}`}
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Sound on' : 'Sound off'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              {soundEnabled ? 'SOUND' : 'MUTE'}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 py-4 space-y-4">

        {/* ══════════════════════════════════════════════
            CONTROLS — Key → Scale → Position/Intervals
            ══════════════════════════════════════════════ */}
        <div className="sketch-card bg-[#faf6ef] p-4 space-y-4">
          {/* Row 1: Key Selector */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-[10px] uppercase tracking-[0.15em] text-[#8b7355] font-serif italic font-bold">Key</h3>
              <span className="text-[9px] text-[#b8a88a] font-serif italic">— Root note of the scale</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {KEY_DISPLAY_NAMES.map((key, idx) => (
                <button
                  key={idx}
                  className={`h-8 min-w-[46px] px-2 text-[11px] font-semibold border transition-all rounded-sm ${
                    keyIndex === idx ? 'sketch-btn-active border-[#6b5b47]' : 'sketch-btn border-[#c4b89c] hover:border-[#8b7355]'
                  }`}
                  onClick={() => { setKeyIndex(idx); setPositionIndex(0); stopPlayback(); }}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: Scale Selector (full width) */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-[10px] uppercase tracking-[0.15em] text-[#8b7355] font-serif italic font-bold">Scale</h3>
              <span className="text-[9px] text-[#b8a88a] font-serif italic">— {scale.intervals.length} notes · {scale.intervalLabels.join(' − ')}</span>
            </div>
            <Select value={scaleId} onValueChange={(v) => { setScaleId(v); setPositionIndex(0); stopPlayback(); }}>
              <SelectTrigger className="bg-[#f5f0e8] border-[#c4b89c] text-[#2c2c2c] text-xs rounded-sm h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#faf6ef] border-[#c4b89c]">
                {Object.entries(SCALES).map(([id, s]) => (
                  <SelectItem key={id} value={id} className="text-[#2c2c2c] focus:bg-[rgba(139,115,85,0.1)] text-xs">
                    {s.name} ({s.intervals.length} notes)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Scale notes + intervals */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
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
                    <span className="opacity-50 text-[9px]">{label}</span>
                  </span>
                );
              })}
              <span className="text-[9px] text-[#8b7355] font-serif italic ml-1">
                Steps: {scale.intervals.slice(1).map((interval, idx) => {
                  const prevInterval = idx === 0 ? 0 : scale.intervals[idx];
                  const step = interval - prevInterval;
                  return step === 1 ? 'H' : step === 2 ? 'W' : `${step}H`;
                }).join(' − ')}
              </span>
            </div>
          </div>

          {/* Row 3: Position + Intervals side by side */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-start">
            {/* Position */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-[10px] uppercase tracking-[0.15em] text-[#8b7355] font-serif italic font-bold">Position</h3>
                <span className="text-[9px] text-[#b8a88a] font-serif italic">— CAGED shape on neck</span>
              </div>
              <div className="flex items-center gap-1">
                <button className="sketch-btn w-7 h-8 flex items-center justify-center border-[#c4b89c] disabled:opacity-30" onClick={handlePrevPosition} disabled={positionIndex <= 0}>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                {positions.map((_, idx) => (
                  <button
                    key={idx}
                    className={`h-8 w-9 text-[11px] font-semibold rounded-sm transition-all border ${
                      !showAllPositions && positionIndex === idx ? 'sketch-btn-active border-[#6b5b47]' : 'sketch-btn border-[#c4b89c] hover:border-[#8b7355]'
                    }`}
                    onClick={() => { setPositionIndex(idx); setShowAllPositions(false); stopPlayback(); }}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button
                  className={`h-8 px-2 text-[11px] font-semibold rounded-sm transition-all border ${
                    showAllPositions ? 'sketch-btn-active border-[#6b5b47]' : 'sketch-btn border-[#c4b89c] hover:border-[#8b7355]'
                  }`}
                  onClick={() => { setShowAllPositions(true); stopPlayback(); }}
                >
                  All
                </button>
                <button className="sketch-btn w-7 h-8 flex items-center justify-center border-[#c4b89c] disabled:opacity-30" onClick={handleNextPosition} disabled={positionIndex >= positions.length - 1}>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-1.5 text-[10px] text-[#6b5b47] font-serif italic font-semibold">
                {showAllPositions ? 'Full Fretboard · All Positions' : `${currentPosition.name} · Frets ${currentPosition.fretStart}–${currentPosition.fretEnd}`}
              </div>
            </div>

            {/* Intervals legend */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-[10px] uppercase tracking-[0.15em] text-[#8b7355] font-serif italic font-bold">Intervals</h3>
              </div>
              <div className="flex flex-wrap gap-1 max-w-[260px]">
                {scale.intervalLabels.map((label, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center justify-center px-2 py-1 text-[10px] font-bold font-serif italic border rounded-sm"
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
          </div>
        </div>

        {/* ══════════════════════════════════════════════
            FRETBOARD — Full interactive
            ══════════════════════════════════════════════ */}
        <div className="sketch-card bg-[#faf6ef] overflow-hidden">
          <div className="px-4 pt-3 pb-1.5 flex items-center justify-between border-b border-[#e8e2d6]">
            <div>
              <h2 className="text-sm font-bold font-serif italic text-[#2c2c2c]">
                {keyNote} {scale.name}
                {!showAllPositions
                  ? <span className="text-[#8b7355] font-normal"> — {currentPosition.name}</span>
                  : <span className="text-[#8b7355] font-normal"> — All Positions</span>
                }
              </h2>
              <p className="text-[10px] text-[#8b7355] font-serif italic mt-0.5">
                {currentExercise?.name || 'Select exercise'} · {currentExercise?.notes.length || 0} notes · Click any note to hear it
              </p>
            </div>
          </div>
          <div className="px-2 py-2 overflow-x-auto">
            <FretboardDiagram
              keyNote={keyNote}
              scaleId={scaleId}
              startFret={startFret}
              endFret={endFret}
              showAllPositions={showAllPositions}
              positionIndex={positionIndex}
              highlightNotes={exerciseHighlightNotes}
              exercisePath={exercisePath}
              activeNote={activeNote}
              onNoteClick={handleFretboardNoteClick}
              showPatternLines={true}
              fullFretboard={true}
            />
          </div>
        </div>

        {/* ══════════════════════════════════════════════
            PLAYBACK CONTROLS — BPM + Metronome + Transport
            ══════════════════════════════════════════════ */}
        <div className="sketch-card bg-[#faf6ef] p-4">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-4 items-center">
            {/* BPM Control */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Timer className="w-3.5 h-3.5 text-[#8b7355]" />
                <h3 className="text-[10px] uppercase tracking-[0.15em] text-[#8b7355] font-serif italic font-bold">Tempo</h3>
                <span className="text-[20px] font-mono font-bold text-[#4a4a4a] ml-1">{bpm}</span>
                <span className="text-[10px] text-[#8b7355] font-serif italic">BPM</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={40}
                  max={220}
                  step={1}
                  value={bpm}
                  onChange={e => setBpm(Number(e.target.value))}
                  className="flex-1 h-2 accent-[#8b7355] cursor-pointer"
                  style={{ accentColor: '#8b7355' }}
                />
                <div className="flex gap-1">
                  {bpmPresets.map(preset => (
                    <button
                      key={preset}
                      className={`text-[9px] px-1.5 py-0.5 border rounded-sm transition-all ${
                        bpm === preset ? 'sketch-btn-active border-[#6b5b47]' : 'sketch-btn border-[#c4b89c] hover:border-[#8b7355]'
                      }`}
                      onClick={() => setBpm(preset)}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <button
                  className="sketch-btn text-[9px] px-2 py-0.5 border-[#8b7355] text-[#6b5b47] font-semibold"
                  onClick={handleTapTempo}
                  title="Tap to set tempo"
                >
                  TAP
                </button>
              </div>
            </div>

            {/* Metronome */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Drum className="w-3.5 h-3.5 text-[#8b7355]" />
                <h3 className="text-[10px] uppercase tracking-[0.15em] text-[#8b7355] font-serif italic font-bold">Metronome</h3>
              </div>
              <div className="flex items-center gap-3">
                {/* Time signature selector */}
                <div className="flex gap-1">
                  {[3, 4, 5, 6].map(ts => (
                    <button
                      key={ts}
                      className={`text-[9px] px-1.5 py-0.5 border rounded-sm transition-all ${
                        timeSignature === ts ? 'sketch-btn-active border-[#6b5b47]' : 'sketch-btn border-[#c4b89c] hover:border-[#8b7355]'
                      }`}
                      onClick={() => setTimeSignature(ts)}
                    >
                      {ts}/4
                    </button>
                  ))}
                </div>
                {/* Beat indicators */}
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: timeSignature }, (_, i) => (
                    <div
                      key={i}
                      className={`w-4 h-4 rounded-full border-2 transition-all duration-75 ${
                        metronomeOn && currentBeat === i
                          ? 'bg-[#9b3939] border-[#9b3939] scale-110'
                          : 'bg-transparent border-[#c4b89c]'
                      }`}
                    />
                  ))}
                </div>
                {/* Metronome toggle */}
                <button
                  className={`px-3 py-1.5 text-[10px] font-bold flex items-center gap-1.5 border-2 rounded-sm transition-all ${
                    metronomeOn
                      ? 'bg-[#9b3939] text-white border-[#9b3939]'
                      : 'sketch-btn border-[#6b5b47]'
                  }`}
                  onClick={toggleMetronome}
                >
                  {metronomeOn ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  {metronomeOn ? 'STOP' : 'START'}
                </button>
              </div>
            </div>

            {/* Transport controls */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-[#8b7355]" />
                <h3 className="text-[10px] uppercase tracking-[0.15em] text-[#8b7355] font-serif italic font-bold">Playback</h3>
                {isPlaying && (
                  <span className="text-[9px] text-[#9b3939] font-serif italic font-bold">
                    {playbackMode === 'exercise' ? 'EXERCISE' : 'SCALE'} · Note {playingIdx + 1}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  className={`px-3 py-1.5 text-[10px] font-bold flex items-center gap-1.5 border-2 rounded-sm transition-all ${
                    isPlaying && playbackMode === 'exercise' && !isPaused
                      ? 'bg-[#9b3939] text-white border-[#9b3939]'
                      : 'sketch-btn border-[#6b5b47]'
                  }`}
                  onClick={handlePlayExercise}
                  title="Play exercise"
                >
                  {isPlaying && playbackMode === 'exercise' && !isPaused ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  {isPlaying && playbackMode === 'exercise' && !isPaused ? 'PAUSE' : 'EXERCISE'}
                </button>
                <button
                  className={`px-3 py-1.5 text-[10px] font-bold flex items-center gap-1.5 border-2 rounded-sm transition-all ${
                    isPlaying && playbackMode === 'scale' && !isPaused
                      ? 'bg-[#4a5a8a] text-white border-[#4a5a8a]'
                      : 'sketch-btn border-[#4a5a8a]'
                  }`}
                  onClick={handlePlayScale}
                  title="Play scale"
                >
                  {isPlaying && playbackMode === 'scale' && !isPaused ? <Pause className="w-3 h-3" /> : <Music className="w-3 h-3" />}
                  {isPlaying && playbackMode === 'scale' && !isPaused ? 'PAUSE' : 'SCALE'}
                </button>
                {isPlaying && (
                  <button
                    className="px-3 py-1.5 text-[10px] font-bold flex items-center gap-1.5 border-2 rounded-sm bg-[#4a4a4a] text-white border-[#4a4a4a] transition-all"
                    onClick={stopPlayback}
                    title="Stop playback"
                  >
                    <Square className="w-3 h-3" />
                    STOP
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════
            EXERCISE SELECTOR — Horizontal grouped pills
            ══════════════════════════════════════════════ */}
        <div className="sketch-card bg-[#faf6ef] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-[#8b7355]" />
              <h3 className="text-[11px] uppercase tracking-[0.15em] text-[#8b7355] font-serif italic font-bold">Exercise</h3>
              <span className="text-[9px] text-[#b8a88a] font-serif italic">— {EXERCISE_TYPES[exerciseType].description}</span>
            </div>
            <button
              className="sketch-btn text-[10px] px-2 py-1 border-[#8b7355] text-[#6b5b47] font-semibold flex items-center gap-1"
              onClick={handleRandomize}
            >
              <Shuffle className="w-3 h-3" />
              Random
            </button>
          </div>

          {EXERCISE_CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isActiveCat = cat.types.includes(exerciseType);
            return (
              <div key={cat.label} className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.1em] font-serif italic font-bold shrink-0 ${
                  isActiveCat ? 'text-[#9b3939]' : 'text-[#8b7355]'
                }`}>
                  <Icon className="w-3 h-3" />
                  {cat.label}
                </span>
                <div className="flex flex-wrap gap-1">
                  {cat.types.map(typeId => {
                    const info = EXERCISE_TYPES[typeId];
                    const isSelected = exerciseType === typeId;
                    return (
                      <button
                        key={typeId}
                        className={`text-[10px] py-1.5 px-2.5 rounded-sm transition-all border font-semibold ${
                          isSelected
                            ? 'bg-[rgba(155,57,57,0.12)] border-[#9b393970] text-[#9b3939]'
                            : 'sketch-btn border-[#c4b89c] hover:border-[#8b7355]'
                        }`}
                        onClick={() => { setExerciseType(typeId); stopPlayback(); }}
                        title={info.description}
                      >
                        {info.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* ══════════════════════════════════════════════
            TAB NOTATION — Interactive
            ══════════════════════════════════════════════ */}
        <TabNotation
          exercise={currentExercise}
          onNoteClick={handleTabNoteClick}
          playingIdx={playingIdx}
          activePlayingNote={activePlayingNote}
        />

        {/* ══════════════════════════════════════════════
            CAGED PATTERNS
            ══════════════════════════════════════════════ */}
        <div className="sketch-card bg-[#faf6ef] p-4">
          <div className="flex items-center gap-2 mb-3">
            <GitBranch className="w-3.5 h-3.5 text-[#8b7355]" />
            <h3 className="text-[11px] uppercase tracking-[0.15em] text-[#8b7355] font-serif italic font-bold">
              CAGED Patterns — {keyNote} {scale.name}
            </h3>
            <span className="text-[9px] text-[#b8a88a] font-serif italic">— Click to navigate to position</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
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

      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t-2 border-[#c4b89c] mt-auto">
        <div className="max-w-[1440px] mx-auto px-4 py-2.5 flex items-center justify-between">
          <p className="text-[10px] text-[#8b7355] font-serif italic">
            FretBoard Forge — Procedural Guitar Exercise Generator
          </p>
          <p className="text-[10px] text-[#b8a88a] font-serif italic">
            {Object.keys(EXERCISE_TYPES).length} exercises · 12 keys · 12 scales · 5 positions
          </p>
        </div>
      </footer>
    </div>
  );
}
