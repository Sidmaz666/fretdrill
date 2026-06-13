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

export default function Home() {
  const [keyIndex, setKeyIndex] = useState(9); // A
  const [scaleId, setScaleId] = useState('minor-pentatonic');
  const [positionIndex, setPositionIndex] = useState(0);
  const [exerciseType, setExerciseType] = useState<ExerciseType>('scale-asc-desc');
  const [showAllPositions, setShowAllPositions] = useState(false);
  const [activeNote, setActiveNote] = useState<{ string: number; fret: number } | null>(null);

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
    // Get all scale notes on the full fretboard
    const allScaleNotes = getScaleOnFretboard(keyNote, scaleId, 0, FRET_COUNT);
    const exerciseNoteKeys = new Set(currentExercise.notes.map(n => `${n.string}-${n.fret}`));
    return allScaleNotes.filter(n => exerciseNoteKeys.has(`${n.string}-${n.fret}`));
  }, [currentExercise, keyNote, scaleId]);

  // Exercise path with sequence numbers for the full fretboard
  const exercisePath = useMemo(() => {
    if (!currentExercise || !currentExercise.notes.length) return undefined;
    // Deduplicate while preserving order
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

  // Group exercise types into categories
  const exerciseCategories = useMemo(() => [
    {
      label: 'Scale Runs',
      types: ['scale-asc', 'scale-desc', 'scale-asc-desc'] as ExerciseType[],
    },
    {
      label: 'Sequences',
      types: ['thirds', 'sequence-3', 'sequence-4'] as ExerciseType[],
    },
    {
      label: 'Shapes',
      types: ['triads', 'string-skip', 'lateral-run'] as ExerciseType[],
    },
    {
      label: 'Technique',
      types: ['diagonal', 'position-shift', 'pentatonic-run', 'economy-picking'] as ExerciseType[],
    },
    {
      label: 'Connections',
      types: ['connecting'] as ExerciseType[],
    },
  ], []);

  return (
    <div className="min-h-screen bg-[#f5f0e8] text-[#2c2c2c]">
      {/* Header */}
      <header className="border-b-2 border-[#8b7355] bg-[#faf6ef]">
        <div className="max-w-[1400px] mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm border-2 border-[#8b7355] flex items-center justify-center bg-[#f5f0e8]">
              <Music className="w-4 h-4 text-[#6b5b47]" />
            </div>
            <h1 className="text-base font-bold text-[#2c2c2c]" style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic' }}>
              FretBoard Forge
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 border border-[#8b7355] rounded-sm text-sm text-[#6b5b47] font-serif italic font-semibold">
              {keyNote} {scale.name}
            </span>
            {/* Scale notes in header */}
            <div className="hidden md:flex items-center gap-1">
              {scaleNotes.map((note, idx) => {
                const label = scale.intervalLabels[idx];
                const color = getIntervalColor(label);
                return (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-serif italic border rounded-sm"
                    style={{
                      borderColor: color + '40',
                      color: color,
                      backgroundColor: color + '10',
                    }}
                  >
                    <span className="font-bold">{note}</span>
                    <span className="opacity-60">{label}</span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 py-4 space-y-4">
        {/* ── Control Bar ── */}
        <div className="sketch-card bg-[#faf6ef] p-3">
          <div className="flex flex-wrap items-start gap-4">
            {/* Key Selector */}
            <div className="flex-shrink-0">
              <h3 className="text-[10px] uppercase tracking-widest text-[#8b7355] mb-1.5 font-serif italic font-bold">Key</h3>
              <div className="grid grid-cols-6 gap-1">
                {KEY_DISPLAY_NAMES.map((key, idx) => (
                  <button
                    key={idx}
                    className={`h-7 min-w-[36px] text-[11px] font-semibold border transition-all rounded-sm ${
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
            <div className="flex-shrink-0 min-w-[160px]">
              <h3 className="text-[10px] uppercase tracking-widest text-[#8b7355] mb-1.5 font-serif italic font-bold">Scale</h3>
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
            <div className="flex-shrink-0">
              <h3 className="text-[10px] uppercase tracking-widest text-[#8b7355] mb-1.5 font-serif italic font-bold">Position</h3>
              <div className="flex items-center gap-1">
                <button
                  className="sketch-btn w-6 h-7 flex items-center justify-center border-[#c4b89c] disabled:opacity-30"
                  onClick={handlePrevPosition}
                  disabled={positionIndex <= 0}
                >
                  <ChevronLeft className="h-3 w-3" />
                </button>
                {positions.map((_, idx) => (
                  <button
                    key={idx}
                    className={`h-7 min-w-[28px] text-[11px] font-semibold rounded-sm transition-all border ${
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
                  className={`h-7 min-w-[36px] text-[11px] font-semibold rounded-sm transition-all border ${
                    showAllPositions
                      ? 'sketch-btn-active border-[#6b5b47]'
                      : 'sketch-btn border-[#c4b89c] hover:border-[#8b7355]'
                  }`}
                  onClick={() => setShowAllPositions(!showAllPositions)}
                >
                  All
                </button>
                <button
                  className="sketch-btn w-6 h-7 flex items-center justify-center border-[#c4b89c] disabled:opacity-30"
                  onClick={handleNextPosition}
                  disabled={positionIndex >= positions.length - 1}
                >
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
              <div className="mt-1 text-[10px] text-[#6b5b47] font-serif italic font-semibold">
                {showAllPositions ? 'Full Fretboard' : `${currentPosition.name} · Frets ${currentPosition.fretStart}–${currentPosition.fretEnd}`}
              </div>
            </div>

            {/* Interval Legend */}
            <div className="flex-shrink-0 ml-auto">
              <h3 className="text-[10px] uppercase tracking-widest text-[#8b7355] mb-1.5 font-serif italic font-bold">Intervals</h3>
              <div className="flex flex-wrap gap-1">
                {scale.intervalLabels.map((label, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold font-serif italic border rounded-sm"
                    style={{
                      borderColor: getIntervalColor(label) + '55',
                      color: getIntervalColor(label),
                      backgroundColor: getIntervalColor(label) + '15',
                    }}
                  >
                    {label}
                  </span>
                ))}
              </div>
              <div className="mt-1 text-[9px] text-[#8b7355] font-serif italic">
                Steps: {scale.intervals.slice(1).map((interval, idx) => {
                  const prevInterval = idx === 0 ? 0 : scale.intervals[idx];
                  const step = interval - prevInterval;
                  return step === 1 ? 'H' : step === 2 ? 'W' : `${step}H`;
                }).join(' — ')}
              </div>
            </div>
          </div>
        </div>

        {/* ── Full Fretboard Diagram ── */}
        <div className="sketch-card bg-[#faf6ef] overflow-hidden">
          <div className="px-3 pt-3 pb-1 flex items-center justify-between">
            <h2 className="text-sm font-semibold font-serif italic text-[#2c2c2c]">
              {keyNote} {scale.name}
              {!showAllPositions && <span className="text-[#8b7355] font-normal"> — {currentPosition.name}</span>}
            </h2>
            <span className="text-[10px] text-[#8b7355] font-serif italic">
              {currentExercise?.name || 'Select exercise'}
            </span>
          </div>
          <div className="px-1 pb-3 overflow-x-auto">
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

        {/* ── Exercise Selector ── */}
        <div className="sketch-card bg-[#faf6ef] p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] uppercase tracking-widest text-[#8b7355] font-serif italic font-bold flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Exercise
            </h3>
            <button
              className="sketch-btn text-[10px] px-2 py-1 border-[#8b7355] text-[#6b5b47] font-semibold"
              onClick={handleRandomize}
            >
              <Shuffle className="w-3 h-3 inline mr-1" />
              Random
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            {exerciseCategories.map(cat => (
              <div key={cat.label} className="space-y-1">
                <div className="text-[9px] text-[#8b7355] font-serif italic font-semibold uppercase tracking-wider">{cat.label}</div>
                <div className="flex flex-wrap gap-1">
                  {cat.types.map(typeId => {
                    const info = EXERCISE_TYPES[typeId];
                    return (
                      <button
                        key={typeId}
                        className={`text-[10px] py-1 px-2 rounded-sm transition-all border ${
                          exerciseType === typeId
                            ? 'sketch-btn-active border-[#6b5b47]'
                            : 'sketch-btn border-[#c4b89c] hover:border-[#8b7355]'
                        }`}
                        onClick={() => setExerciseType(typeId)}
                      >
                        {info.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tab Notation ── */}
        <TabNotation
          exercise={currentExercise}
          onNoteClick={handleTabNoteClick}
        />

        {/* ── CAGED Pattern Diagrams ── */}
        <div className="sketch-card bg-[#faf6ef] p-3">
          <h3 className="text-[10px] uppercase tracking-widest text-[#8b7355] mb-3 font-serif italic font-bold flex items-center gap-1">
            <GitBranch className="w-3 h-3" />
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
        <div className="sketch-card bg-[#faf6ef] p-3">
          <h3 className="text-[10px] uppercase tracking-widest text-[#8b7355] mb-3 font-serif italic font-bold">
            Position Connections
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {positions.slice(0, -1).map((pos, idx) => {
              const nextPos = positions[idx + 1];
              if (!nextPos) return null;
              // Bridge from end of current position to start of next
              const bridgeStart = Math.max(0, pos.fretEnd - 3);
              const bridgeEnd = Math.min(FRET_COUNT, nextPos.fretStart + 4);
              // Get all scale notes in the bridge zone
              const bridgeNotes = getScaleOnFretboard(keyNote, scaleId, bridgeStart, bridgeEnd);
              // Deduplicate notes
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
      <footer className="border-t-2 border-[#c4b89c] mt-4">
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
