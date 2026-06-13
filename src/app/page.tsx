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
  STRING_OPEN_NOTES,
} from '@/lib/music-theory';
import {
  generateExercise,
  generatePatternExercises,
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
  Play,
  Square,
  ArrowRight,
  Info,
} from 'lucide-react';

// ─── Audio Engine ───
// Guitar string frequencies (standard tuning, open strings)
const STRING_FREQUENCIES = [82.41, 110.0, 146.83, 196.0, 246.94, 329.63]; // E2, A2, D3, G3, B3, E4

let audioCtx: AudioContext | null = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

function playNote(stringIdx: number, fret: number, duration: number = 0.5) {
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const baseFreq = STRING_FREQUENCIES[stringIdx];
    const freq = baseFreq * Math.pow(2, fret / 12);
    
    // Create oscillator with guitar-like timbre
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const osc2 = ctx.createOscillator();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(freq, ctx.currentTime);
    
    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0.15, ctx.currentTime);
    
    // Envelope: quick attack, medium decay
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    gain2.gain.setValueAtTime(0, ctx.currentTime);
    gain2.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.01);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    osc.connect(gain);
    osc2.connect(gain2);
    gain.connect(ctx.destination);
    gain2.connect(ctx.destination);
    
    osc.start(ctx.currentTime);
    osc2.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
    osc2.stop(ctx.currentTime + duration);
  } catch (e) {
    // Silently fail if audio not available
  }
}

// Interval color mapping
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

// Exercise categories
const EXERCISE_CATEGORIES = [
  { label: 'Scale Runs', icon: Route, types: ['scale-asc', 'scale-desc', 'scale-asc-desc'] as ExerciseType[] },
  { label: 'Sequences', icon: Layers, types: ['thirds', 'sequence-3', 'sequence-4'] as ExerciseType[] },
  { label: 'Shapes', icon: Target, types: ['triads', 'string-skip', 'lateral-run'] as ExerciseType[] },
  { label: 'Technique', icon: Zap, types: ['diagonal', 'position-shift', 'pentatonic-run', 'economy-picking'] as ExerciseType[] },
  { label: 'Connections', icon: GitBranch, types: ['connecting'] as ExerciseType[] },
];

export default function Home() {
  const [keyIndex, setKeyIndex] = useState(9); // A
  const [scaleId, setScaleId] = useState('minor-pentatonic');
  const [positionIndex, setPositionIndex] = useState(0);
  const [exerciseType, setExerciseType] = useState<ExerciseType>('scale-asc-desc');
  const [showAllPositions, setShowAllPositions] = useState(false);
  const [activeNote, setActiveNote] = useState<{ string: number; fret: number } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingIdx, setPlayingIdx] = useState(-1);
  const [connectionView, setConnectionView] = useState<{ start: number; end: number } | null>(null);
  const playingRef = useRef(false);

  const keyNote = KEY_NAMES[keyIndex];
  const scale = SCALES[scaleId];

  const positions = useMemo(() => getCAGEDPositions(keyNote, scaleId), [keyNote, scaleId]);
  const currentPosition = positions[positionIndex] || { fretStart: 0, fretEnd: FRET_COUNT, name: 'Full Fretboard' };
  const startFret = connectionView ? connectionView.start : (showAllPositions ? 0 : currentPosition.fretStart);
  const endFret = connectionView ? connectionView.end : (showAllPositions ? FRET_COUNT : currentPosition.fretEnd);

  // Generate current exercise
  const currentExercise = useMemo(
    () => generateExercise(exerciseType, keyNote, scaleId, positionIndex),
    [exerciseType, keyNote, scaleId, positionIndex]
  );

  // Exercise notes for fretboard highlighting
  const exerciseHighlightNotes = useMemo(() => {
    if (!currentExercise || !currentExercise.notes.length) return undefined;
    const allScaleNotes = getScaleOnFretboard(keyNote, scaleId, 0, FRET_COUNT);
    const exerciseNoteKeys = new Set(currentExercise.notes.map(n => `${n.string}-${n.fret}`));
    return allScaleNotes.filter(n => exerciseNoteKeys.has(`${n.string}-${n.fret}`));
  }, [currentExercise, keyNote, scaleId]);

  // Exercise path with sequence numbers
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

  const handleRandomize = useCallback(() => {
    const types = Object.keys(EXERCISE_TYPES) as ExerciseType[];
    setExerciseType(types[Math.floor(Math.random() * types.length)]);
  }, []);

  const handlePrevPosition = useCallback(() => {
    setPositionIndex(prev => Math.max(0, prev - 1));
    setConnectionView(null);
  }, []);
  const handleNextPosition = useCallback(() => {
    setPositionIndex(prev => Math.min(positions.length - 1, prev + 1));
    setConnectionView(null);
  }, [positions.length]);

  const scaleNotes = useMemo(() => {
    return scale.intervals.map(interval => {
      const noteIndex = (KEY_NAMES.indexOf(keyNote) + interval) % 12;
      return KEY_NAMES[noteIndex];
    });
  }, [keyNote, scale]);

  // Play a single note on the fretboard
  const handleFretboardNoteClick = useCallback((note: { string: number; fret: number }) => {
    if (soundEnabled) playNote(note.string, note.fret, 0.6);
    setActiveNote(prev => prev && prev.string === note.string && prev.fret === note.fret ? null : note);
  }, [soundEnabled]);

  // Play through the entire exercise sequentially
  const playExercise = useCallback(() => {
    if (!currentExercise || !currentExercise.notes.length) return;
    if (isPlaying) {
      playingRef.current = false;
      setIsPlaying(false);
      setPlayingIdx(-1);
      return;
    }
    setIsPlaying(true);
    playingRef.current = true;
    const notes = currentExercise.notes;
    const bpm = 140;
    const intervalMs = (60 / bpm) * 1000;
    
    let idx = 0;
    const playNext = () => {
      if (!playingRef.current || idx >= notes.length) {
        setIsPlaying(false);
        setPlayingIdx(-1);
        playingRef.current = false;
        return;
      }
      const note = notes[idx];
      setPlayingIdx(idx);
      setActiveNote({ string: note.string, fret: note.fret });
      if (soundEnabled) playNote(note.string, note.fret, 0.4);
      idx++;
      setTimeout(playNext, intervalMs);
    };
    playNext();
  }, [currentExercise, isPlaying, soundEnabled]);

  const handleTabNoteClick = useCallback((note: ExerciseNote) => {
    if (soundEnabled) playNote(note.string, note.fret, 0.6);
    setActiveNote({ string: note.string, fret: note.fret });
    setTimeout(() => setActiveNote(null), 1500);
  }, [soundEnabled]);

  const handlePatternClick = useCallback((posIdx: number) => {
    setPositionIndex(posIdx);
    setShowAllPositions(false);
    setConnectionView(null);
  }, []);

  // Connection diagram click — show bridge zone on fretboard
  const handleConnectionClick = useCallback((bridgeStart: number, bridgeEnd: number) => {
    setConnectionView({ start: bridgeStart, end: bridgeEnd });
    setShowAllPositions(true);
  }, []);

  // Clear connection view when changing position
  useEffect(() => {
    if (!connectionView) return;
  }, [connectionView]);

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f0e8] text-[#2c2c2c]">
      {/* ── HEADER ── */}
      <header className="border-b-2 border-[#8b7355] bg-[#faf6ef] shrink-0">
        <div className="max-w-[1400px] mx-auto px-5 py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-sm border-2 border-[#8b7355] flex items-center justify-center bg-[#f5f0e8]">
              <Music className="w-4 h-4 text-[#6b5b47]" />
            </div>
            <div>
              <h1 className="text-base font-bold text-[#2c2c2c] leading-tight" style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic' }}>
                FretBoard Forge
              </h1>
              <p className="text-[8px] text-[#8b7355] font-serif italic -mt-0.5">Procedural Guitar Exercise Generator</p>
            </div>
          </div>
          {/* Sound toggle + exercise play */}
          <div className="flex items-center gap-2">
            <button
              className={`sketch-btn px-2 py-1 text-[10px] flex items-center gap-1 ${soundEnabled ? 'border-[#6b5b47]' : 'border-[#c4b89c] opacity-50'}`}
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Sound on' : 'Sound off'}
            >
              <Volume2 className="w-3.5 h-3.5" />
              {soundEnabled ? 'ON' : 'OFF'}
            </button>
            <button
              className={`px-3 py-1 text-[10px] font-bold flex items-center gap-1.5 border-2 rounded-sm transition-all ${
                isPlaying
                  ? 'bg-[#9b3939] text-white border-[#9b3939]'
                  : 'sketch-btn border-[#6b5b47]'
              }`}
              onClick={playExercise}
            >
              {isPlaying ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              {isPlaying ? 'STOP' : 'PLAY'}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 py-4 space-y-4">
        {/* ── CONTROLS — Full width, well organized ── */}
        <div className="sketch-card bg-[#faf6ef] p-4 space-y-3">
          {/* Row 1: Key selector (full width) */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-[10px] uppercase tracking-[0.15em] text-[#8b7355] font-serif italic font-bold">Key</h3>
              <span className="text-[9px] text-[#b8a88a] font-serif italic">— Root note of the scale</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {KEY_DISPLAY_NAMES.map((key, idx) => (
                <button
                  key={idx}
                  className={`h-8 min-w-[42px] px-2 text-[11px] font-semibold border transition-all rounded-sm ${
                    keyIndex === idx
                      ? 'sketch-btn-active border-[#6b5b47]'
                      : 'sketch-btn border-[#c4b89c] hover:border-[#8b7355]'
                  }`}
                  onClick={() => { setKeyIndex(idx); setPositionIndex(0); setConnectionView(null); }}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: Scale (full width) + Position + Intervals */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-4 items-start">
            {/* Scale — takes full width on the left */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-[10px] uppercase tracking-[0.15em] text-[#8b7355] font-serif italic font-bold">Scale</h3>
                <span className="text-[9px] text-[#b8a88a] font-serif italic">— {scale.intervals.length} notes · {scale.intervalLabels.join(' − ')}</span>
              </div>
              <Select value={scaleId} onValueChange={(v) => { setScaleId(v); setPositionIndex(0); setConnectionView(null); }}>
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
              {/* Scale notes row */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {scaleNotes.map((note, idx) => {
                  const label = scale.intervalLabels[idx];
                  const color = getIntervalColor(label);
                  return (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-serif italic border rounded-sm"
                      style={{
                        borderColor: color + '50',
                        color: color,
                        backgroundColor: color + '0a',
                      }}
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
                      !showAllPositions && !connectionView && positionIndex === idx
                        ? 'sketch-btn-active border-[#6b5b47]'
                        : 'sketch-btn border-[#c4b89c] hover:border-[#8b7355]'
                    }`}
                    onClick={() => { setPositionIndex(idx); setShowAllPositions(false); setConnectionView(null); }}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button
                  className={`h-8 px-2 text-[11px] font-semibold rounded-sm transition-all border ${
                    showAllPositions && !connectionView
                      ? 'sketch-btn-active border-[#6b5b47]'
                      : 'sketch-btn border-[#c4b89c] hover:border-[#8b7355]'
                  }`}
                  onClick={() => { setShowAllPositions(true); setConnectionView(null); }}
                >
                  All
                </button>
                <button className="sketch-btn w-7 h-8 flex items-center justify-center border-[#c4b89c] disabled:opacity-30" onClick={handleNextPosition} disabled={positionIndex >= positions.length - 1}>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-1.5 text-[10px] text-[#6b5b47] font-serif italic font-semibold text-center">
                {connectionView
                  ? `Bridge Zone · Frets ${connectionView.start}–${connectionView.end}`
                  : showAllPositions
                    ? 'Full Fretboard · All Positions'
                    : `${currentPosition.name} · Frets ${currentPosition.fretStart}–${currentPosition.fretEnd}`
                }
              </div>
            </div>

            {/* Intervals legend */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-[10px] uppercase tracking-[0.15em] text-[#8b7355] font-serif italic font-bold">Intervals</h3>
              </div>
              <div className="flex flex-wrap gap-1 max-w-[200px]">
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

        {/* ── FRETBOARD — Full width ── */}
        <div className="sketch-card bg-[#faf6ef] overflow-hidden">
          <div className="px-4 pt-3 pb-1.5 flex items-center justify-between border-b border-[#e8e2d6]">
            <div>
              <h2 className="text-sm font-bold font-serif italic text-[#2c2c2c]">
                {keyNote} {scale.name}
                {connectionView
                  ? <span className="text-[#6b4a7a] font-normal"> — Bridge Frets {connectionView.start}–{connectionView.end}</span>
                  : !showAllPositions
                    ? <span className="text-[#8b7355] font-normal"> — {currentPosition.name}</span>
                    : <span className="text-[#8b7355] font-normal"> — All Positions</span>
                }
              </h2>
              <p className="text-[10px] text-[#8b7355] font-serif italic mt-0.5">
                {currentExercise?.name || 'Select exercise'} · {currentExercise?.notes.length || 0} notes · Click any note to hear it
              </p>
            </div>
            {connectionView && (
              <button
                className="sketch-btn text-[10px] px-2 py-1 border-[#6b4a7a] text-[#6b4a7a] flex items-center gap-1"
                onClick={() => setConnectionView(null)}
              >
                <ChevronLeft className="w-3 h-3" /> Back
              </button>
            )}
          </div>
          <div className="px-2 py-2 overflow-x-auto">
            <FretboardDiagram
              keyNote={keyNote}
              scaleId={scaleId}
              startFret={startFret}
              endFret={endFret}
              showAllPositions={showAllPositions || !!connectionView}
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

        {/* ── EXERCISE SELECTOR — Horizontal grouped pills, full width ── */}
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

          {/* Exercise type pills — grouped by category, all visible */}
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
                        onClick={() => setExerciseType(typeId)}
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

        {/* ── TAB NOTATION — Full width ── */}
        <TabNotation
          exercise={currentExercise}
          onNoteClick={handleTabNoteClick}
          playingIdx={playingIdx}
        />

        {/* ── CAGED PATTERNS ── */}
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
                  selected={positionIndex === pat.position - 1 && !showAllPositions && !connectionView}
                />
              </button>
            ))}
          </div>
        </div>

        {/* ── POSITION CONNECTIONS — Now functional ── */}
        <div className="sketch-card bg-[#faf6ef] p-4">
          <div className="flex items-center gap-2 mb-3">
            <ArrowRight className="w-3.5 h-3.5 text-[#6b4a7a]" />
            <h3 className="text-[11px] uppercase tracking-[0.15em] text-[#6b4a7a] font-serif italic font-bold">
              Position Connections
            </h3>
            <span className="text-[9px] text-[#b8a88a] font-serif italic">— Click to see bridge zone on fretboard</span>
            <Info className="w-3 h-3 text-[#b8a88a]" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {positions.slice(0, -1).map((pos, idx) => {
              const nextPos = positions[idx + 1];
              if (!nextPos) return null;
              const bridgeStart = Math.max(0, pos.fretEnd - 3);
              const bridgeEnd = Math.min(FRET_COUNT, nextPos.fretStart + 4);
              const bridgeNotes = getScaleOnFretboard(keyNote, scaleId, bridgeStart, bridgeEnd);
              const seen = new Set<string>();
              const connectNotes = bridgeNotes.filter(n => {
                const key = `${n.string}-${n.fret}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
              });
              const isActive = connectionView?.start === bridgeStart && connectionView?.end === bridgeEnd;
              
              return (
                <div
                  key={`conn-${idx}`}
                  onClick={() => handleConnectionClick(bridgeStart, bridgeEnd)}
                  className={`text-left transition-all rounded-sm border-2 cursor-pointer ${
                    isActive
                      ? 'border-[#6b4a7a] bg-[rgba(107,74,122,0.08)]'
                      : 'border-[#c4b89c] bg-[#faf6ef] hover:border-[#6b4a7a]'
                  }`}
                >
                  <PatternDiagram
                    keyNote={keyNote}
                    scaleId={scaleId}
                    fretStart={bridgeStart}
                    fretEnd={bridgeEnd}
                    positionNumber={idx + 1}
                    customLabel={`P${idx + 1} → P${idx + 2}`}
                    exerciseNotes={connectNotes.map((n, i) => ({
                      string: n.string,
                      fret: n.fret,
                      sequenceNumber: i + 1,
                    }))}
                    selected={isActive}
                    onNoteClick={() => handleConnectionClick(bridgeStart, bridgeEnd)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-[#c4b89c] mt-auto">
        <div className="max-w-[1400px] mx-auto px-4 py-2.5 flex items-center justify-between">
          <p className="text-[10px] text-[#8b7355] font-serif italic">
            FretBoard Forge — Procedural Guitar Exercise Generator
          </p>
          <p className="text-[10px] text-[#b8a88a] font-serif italic">
            Inspired by Ricky&apos;s Guitar
          </p>
        </div>
      </footer>
    </div>
  );
}
