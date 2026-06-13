'use client';

import React, { useState, useMemo, useCallback } from 'react';
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
  ChevronDown,
  Target,
  Layers,
  Route,
} from 'lucide-react';

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

// Exercise categories with icons
const EXERCISE_CATEGORIES = [
  {
    label: 'Scale Runs',
    icon: Route,
    types: ['scale-asc', 'scale-desc', 'scale-asc-desc'] as ExerciseType[],
  },
  {
    label: 'Sequences',
    icon: Layers,
    types: ['thirds', 'sequence-3', 'sequence-4'] as ExerciseType[],
  },
  {
    label: 'Shapes',
    icon: Target,
    types: ['triads', 'string-skip', 'lateral-run'] as ExerciseType[],
  },
  {
    label: 'Technique',
    icon: Zap,
    types: ['diagonal', 'position-shift', 'pentatonic-run', 'economy-picking'] as ExerciseType[],
  },
  {
    label: 'Connections',
    icon: GitBranch,
    types: ['connecting'] as ExerciseType[],
  },
];

export default function Home() {
  const [keyIndex, setKeyIndex] = useState(9); // A
  const [scaleId, setScaleId] = useState('minor-pentatonic');
  const [positionIndex, setPositionIndex] = useState(0);
  const [exerciseType, setExerciseType] = useState<ExerciseType>('scale-asc-desc');
  const [showAllPositions, setShowAllPositions] = useState(false);
  const [activeNote, setActiveNote] = useState<{ string: number; fret: number } | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>('Scale Runs');

  const keyNote = KEY_NAMES[keyIndex];
  const scale = SCALES[scaleId];

  const positions = useMemo(() => getCAGEDPositions(keyNote, scaleId), [keyNote, scaleId]);
  const currentPosition = positions[positionIndex] || { fretStart: 0, fretEnd: FRET_COUNT, name: 'Full Fretboard' };
  const startFret = showAllPositions ? 0 : currentPosition.fretStart;
  const endFret = showAllPositions ? FRET_COUNT : currentPosition.fretEnd;

  // Generate current exercise
  const currentExercise = useMemo(
    () => generateExercise(exerciseType, keyNote, scaleId, positionIndex),
    [exerciseType, keyNote, scaleId, positionIndex]
  );

  // Exercise notes for fretboard highlighting (from the full fretboard)
  const exerciseHighlightNotes = useMemo(() => {
    if (!currentExercise || !currentExercise.notes.length) return undefined;
    const allScaleNotes = getScaleOnFretboard(keyNote, scaleId, 0, FRET_COUNT);
    const exerciseNoteKeys = new Set(currentExercise.notes.map(n => `${n.string}-${n.fret}`));
    return allScaleNotes.filter(n => exerciseNoteKeys.has(`${n.string}-${n.fret}`));
  }, [currentExercise, keyNote, scaleId]);

  // Exercise path with sequence numbers for the full fretboard
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

  // Pattern exercises for CAGED diagram section
  const patternExercises = useMemo(() => {
    return generatePatternExercises(keyNote, scaleId);
  }, [keyNote, scaleId]);

  const handleRandomize = useCallback(() => {
    const types = Object.keys(EXERCISE_TYPES) as ExerciseType[];
    setExerciseType(types[Math.floor(Math.random() * types.length)]);
  }, []);

  const handlePrevPosition = useCallback(() => setPositionIndex(prev => Math.max(0, prev - 1)), []);
  const handleNextPosition = useCallback(() => setPositionIndex(prev => Math.min(positions.length - 1, prev + 1)), [positions.length]);

  const scaleNotes = useMemo(() => {
    return scale.intervals.map(interval => {
      const noteIndex = (KEY_NAMES.indexOf(keyNote) + interval) % 12;
      return KEY_NAMES[noteIndex];
    });
  }, [keyNote, scale]);

  const handleFretboardNoteClick = useCallback((note: { string: number; fret: number }) => {
    setActiveNote(prev => prev && prev.string === note.string && prev.fret === note.fret ? null : note);
  }, []);

  const handleTabNoteClick = useCallback((note: ExerciseNote) => {
    setActiveNote({ string: note.string, fret: note.fret });
    setTimeout(() => setActiveNote(null), 2000);
  }, []);

  const handlePatternClick = useCallback((posIdx: number) => {
    setPositionIndex(posIdx);
    setShowAllPositions(false);
  }, []);

  const toggleCategory = useCallback((label: string) => {
    setExpandedCategory(prev => prev === label ? null : label);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f0e8] text-[#2c2c2c]">
      {/* ── HEADER ── */}
      <header className="border-b-2 border-[#8b7355] bg-[#faf6ef] shrink-0">
        <div className="max-w-[1400px] mx-auto px-5 py-3 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-sm border-2 border-[#8b7355] flex items-center justify-center bg-[#f5f0e8]">
              <Music className="w-4.5 h-4.5 text-[#6b5b47]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#2c2c2c] leading-tight" style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic' }}>
                FretBoard Forge
              </h1>
              <p className="text-[9px] text-[#8b7355] font-serif italic -mt-0.5">Procedural Guitar Exercises</p>
            </div>
          </div>

          {/* Scale Info Badge */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <span className="px-3 py-1.5 border-2 border-[#8b7355] rounded-sm bg-[#f5f0e8] text-sm font-serif italic font-bold text-[#4a4a4a]">
                {keyNote} {scale.name}
              </span>
              <div className="flex items-center gap-1">
                {scaleNotes.map((note, idx) => {
                  const label = scale.intervalLabels[idx];
                  const color = getIntervalColor(label);
                  return (
                    <span
                      key={idx}
                      className="inline-flex flex-col items-center px-1.5 py-0.5 text-[9px] font-serif italic border rounded-sm leading-tight"
                      style={{
                        borderColor: color + '50',
                        color: color,
                        backgroundColor: color + '0a',
                      }}
                    >
                      <span className="font-bold text-[10px]">{note}</span>
                      <span className="opacity-60 text-[8px]">{label}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 py-4 space-y-4">
        {/* ── CONTROL BAR ── */}
        <div className="sketch-card bg-[#faf6ef] p-4">
          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto_auto] gap-4 items-start">
            {/* Key Selector */}
            <div>
              <h3 className="text-[10px] uppercase tracking-[0.15em] text-[#8b7355] mb-2 font-serif italic font-bold">Key</h3>
              <div className="grid grid-cols-6 gap-1">
                {KEY_DISPLAY_NAMES.map((key, idx) => (
                  <button
                    key={idx}
                    className={`h-7 min-w-[38px] text-[11px] font-semibold border transition-all rounded-sm ${
                      keyIndex === idx
                        ? 'sketch-btn-active border-[#6b5b47]'
                        : 'sketch-btn border-[#c4b89c] hover:border-[#8b7355]'
                    }`}
                    onClick={() => { setKeyIndex(idx); setPositionIndex(0); }}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>

            {/* Scale Selector */}
            <div className="min-w-[180px]">
              <h3 className="text-[10px] uppercase tracking-[0.15em] text-[#8b7355] mb-2 font-serif italic font-bold">Scale</h3>
              <Select value={scaleId} onValueChange={(v) => { setScaleId(v); setPositionIndex(0); }}>
                <SelectTrigger className="bg-[#f5f0e8] border-[#c4b89c] text-[#2c2c2c] text-xs rounded-sm h-8 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#faf6ef] border-[#c4b89c]">
                  {Object.entries(SCALES).map(([id, s]) => (
                    <SelectItem key={id} value={id} className="text-[#2c2c2c] focus:bg-[rgba(139,115,85,0.1)] text-xs">
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Position Selector */}
            <div>
              <h3 className="text-[10px] uppercase tracking-[0.15em] text-[#8b7355] mb-2 font-serif italic font-bold">Position</h3>
              <div className="flex items-center gap-1">
                <button
                  className="sketch-btn w-7 h-7 flex items-center justify-center border-[#c4b89c] disabled:opacity-30"
                  onClick={handlePrevPosition}
                  disabled={positionIndex <= 0}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                {positions.map((_, idx) => (
                  <button
                    key={idx}
                    className={`h-7 w-8 text-[11px] font-semibold rounded-sm transition-all border ${
                      !showAllPositions && positionIndex === idx
                        ? 'sketch-btn-active border-[#6b5b47]'
                        : 'sketch-btn border-[#c4b89c] hover:border-[#8b7355]'
                    }`}
                    onClick={() => { setPositionIndex(idx); setShowAllPositions(false); }}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button
                  className={`h-7 px-2 text-[11px] font-semibold rounded-sm transition-all border ${
                    showAllPositions
                      ? 'sketch-btn-active border-[#6b5b47]'
                      : 'sketch-btn border-[#c4b89c] hover:border-[#8b7355]'
                  }`}
                  onClick={() => setShowAllPositions(!showAllPositions)}
                >
                  All
                </button>
                <button
                  className="sketch-btn w-7 h-7 flex items-center justify-center border-[#c4b89c] disabled:opacity-30"
                  onClick={handleNextPosition}
                  disabled={positionIndex >= positions.length - 1}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-1.5 text-[10px] text-[#6b5b47] font-serif italic font-semibold text-center">
                {showAllPositions ? 'Full Fretboard' : `${currentPosition.name} · Frets ${currentPosition.fretStart}–${currentPosition.fretEnd}`}
              </div>
            </div>

            {/* Interval Legend */}
            <div>
              <h3 className="text-[10px] uppercase tracking-[0.15em] text-[#8b7355] mb-2 font-serif italic font-bold">Intervals</h3>
              <div className="flex flex-wrap gap-1 max-w-[200px]">
                {scale.intervalLabels.map((label, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-bold font-serif italic border rounded-sm"
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
              <div className="mt-1.5 text-[9px] text-[#8b7355] font-serif italic">
                Steps: {scale.intervals.slice(1).map((interval, idx) => {
                  const prevInterval = idx === 0 ? 0 : scale.intervals[idx];
                  const step = interval - prevInterval;
                  return step === 1 ? 'H' : step === 2 ? 'W' : `${step}H`;
                }).join(' — ')}
              </div>
            </div>
          </div>
        </div>

        {/* ── FRETBOARD + EXERCISE SECTION ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
          {/* Fretboard Diagram */}
          <div className="sketch-card bg-[#faf6ef] overflow-hidden">
            <div className="px-4 pt-3 pb-1.5 flex items-center justify-between border-b border-[#e8e2d6]">
              <div>
                <h2 className="text-sm font-bold font-serif italic text-[#2c2c2c]">
                  {keyNote} {scale.name}
                  {!showAllPositions && <span className="text-[#8b7355] font-normal"> — {currentPosition.name}</span>}
                </h2>
                <p className="text-[10px] text-[#8b7355] font-serif italic mt-0.5">
                  {currentExercise?.name || 'Select exercise'} · Frets {currentPosition.fretStart}–{currentPosition.fretEnd}
                </p>
              </div>
              <span className="text-[10px] px-2 py-1 border border-[#9b393940] rounded-sm text-[#9b3939] font-serif italic font-semibold bg-[#9b393908]">
                {currentExercise?.notes.length || 0} notes
              </span>
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

          {/* Exercise Panel */}
          <div className="sketch-card bg-[#faf6ef] flex flex-col max-h-[520px]">
            <div className="px-3 pt-3 pb-2 flex items-center justify-between border-b border-[#e8e2d6] shrink-0">
              <h3 className="text-[11px] uppercase tracking-[0.15em] text-[#8b7355] font-serif italic font-bold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                Exercises
              </h3>
              <button
                className="sketch-btn text-[10px] px-2 py-1 border-[#8b7355] text-[#6b5b47] font-semibold flex items-center gap-1"
                onClick={handleRandomize}
              >
                <Shuffle className="w-3 h-3" />
                Random
              </button>
            </div>

            {/* Current exercise display */}
            <div className="px-3 py-2 border-b border-[#e8e2d6] bg-[#f5f0e8] shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-[#9b3939] font-serif italic">
                  {EXERCISE_TYPES[exerciseType].name}
                </span>
                <span className="text-[9px] text-[#8b7355] font-serif italic">
                  — {EXERCISE_TYPES[exerciseType].description}
                </span>
              </div>
            </div>

            {/* Accordion exercise categories */}
            <div className="flex-1 overflow-y-auto px-1 py-1">
              {EXERCISE_CATEGORIES.map(cat => {
                const Icon = cat.icon;
                const isExpanded = expandedCategory === cat.label;
                const isActiveCat = cat.types.includes(exerciseType);

                return (
                  <div key={cat.label} className="mb-0.5">
                    <button
                      className={`w-full flex items-center gap-2 px-2.5 py-2 text-left rounded-sm transition-colors ${
                        isActiveCat
                          ? 'bg-[rgba(155,57,57,0.06)]'
                          : 'hover:bg-[rgba(139,115,85,0.05)]'
                      }`}
                      onClick={() => toggleCategory(cat.label)}
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isActiveCat ? 'text-[#9b3939]' : 'text-[#8b7355]'}`} />
                      <span className={`text-[10px] uppercase tracking-[0.1em] font-serif italic font-bold flex-1 ${
                        isActiveCat ? 'text-[#9b3939]' : 'text-[#6b5b47]'
                      }`}>
                        {cat.label}
                      </span>
                      <ChevronDown className={`w-3 h-3 text-[#8b7355] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    {isExpanded && (
                      <div className="px-2 pb-2 space-y-1">
                        {cat.types.map(typeId => {
                          const info = EXERCISE_TYPES[typeId];
                          const isSelected = exerciseType === typeId;
                          return (
                            <button
                              key={typeId}
                              className={`w-full text-left px-3 py-1.5 rounded-sm transition-all text-[11px] border ${
                                isSelected
                                  ? 'bg-[rgba(155,57,57,0.1)] border-[#9b393960] text-[#9b3939] font-bold'
                                  : 'bg-transparent border-transparent text-[#4a4a4a] hover:bg-[rgba(139,115,85,0.06)] hover:border-[#c4b89c]'
                              }`}
                              onClick={() => setExerciseType(typeId)}
                            >
                              <span className="font-semibold">{info.name}</span>
                              <span className="text-[9px] text-[#8b7355] font-serif italic ml-1.5">{info.description}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Tab Notation ── */}
        <TabNotation
          exercise={currentExercise}
          onNoteClick={handleTabNoteClick}
        />

        {/* ── CAGED Pattern Diagrams ── */}
        <div className="sketch-card bg-[#faf6ef] p-4">
          <h3 className="text-[11px] uppercase tracking-[0.15em] text-[#8b7355] mb-3 font-serif italic font-bold flex items-center gap-1.5">
            <GitBranch className="w-3.5 h-3.5" />
            CAGED Patterns — {keyNote} {scale.name}
          </h3>
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

        {/* ── Position Connection Diagrams ── */}
        <div className="sketch-card bg-[#faf6ef] p-4">
          <h3 className="text-[11px] uppercase tracking-[0.15em] text-[#8b7355] mb-3 font-serif italic font-bold flex items-center gap-1.5">
            <Route className="w-3.5 h-3.5" />
            Position Connections
          </h3>
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
              
              return (
                <PatternDiagram
                  key={`conn-${idx}`}
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
                  selected={false}
                />
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
