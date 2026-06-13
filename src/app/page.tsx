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
  ExerciseType,
  EXERCISE_TYPES,
  ExerciseNote,
} from '@/lib/exercise-generator';
import FretboardDiagram from '@/components/guitar/FretboardDiagram';
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

  // Exercise notes for fretboard highlighting
  const exerciseHighlightNotes = useMemo(() => {
    if (!currentExercise || !currentExercise.notes.length) return undefined;
    const allScaleNotes = getScaleOnFretboard(keyNote, scaleId, startFret, endFret);
    const exerciseNoteKeys = new Set(currentExercise.notes.map(n => `${n.string}-${n.fret}`));
    return allScaleNotes.filter(n => exerciseNoteKeys.has(`${n.string}-${n.fret}`));
  }, [currentExercise, keyNote, scaleId, startFret, endFret]);

  // Exercise path (ordered note sequence for path visualization)
  const exercisePath = useMemo(() => {
    if (!currentExercise || !currentExercise.notes.length) return undefined;
    // Deduplicate while preserving order
    const seen = new Set<string>();
    const path: { string: number; fret: number }[] = [];
    for (const note of currentExercise.notes) {
      const key = `${note.string}-${note.fret}`;
      if (!seen.has(key)) {
        seen.add(key);
        path.push({ string: note.string, fret: note.fret });
      }
    }
    return path;
  }, [currentExercise]);

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

  return (
    <div className="min-h-screen bg-[#f5f0e8] text-[#2c2c2c]">
      {/* Header */}
      <header className="border-b-2 border-[#8b7355] bg-[#faf6ef]">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm border-2 border-[#8b7355] flex items-center justify-center bg-[#f5f0e8]">
              <Music className="w-4 h-4 text-[#6b5b47]" />
            </div>
            <div>
              <h1 className="text-base font-bold text-[#2c2c2c]" style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic' }}>
                FretBoard Forge
              </h1>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 border border-[#8b7355] rounded-sm text-sm text-[#6b5b47] font-serif italic font-semibold">
            {keyNote} {scale.name}
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4">
          {/* ── Sidebar: Controls ── */}
          <div className="space-y-3">
            {/* Key Selector */}
            <div className="sketch-card bg-[#faf6ef] p-3">
              <h3 className="text-[10px] uppercase tracking-widest text-[#8b7355] mb-2 font-serif italic font-bold">Key</h3>
              <div className="grid grid-cols-4 gap-1">
                {KEY_DISPLAY_NAMES.map((key, idx) => (
                  <button
                    key={idx}
                    className={`h-7 text-[11px] font-semibold border transition-all rounded-sm ${
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
            <div className="sketch-card bg-[#faf6ef] p-3">
              <h3 className="text-[10px] uppercase tracking-widest text-[#8b7355] mb-2 font-serif italic font-bold">Scale</h3>
              <Select value={scaleId} onValueChange={(v) => { setScaleId(v); setPositionIndex(0); }}>
                <SelectTrigger className="bg-[#f5f0e8] border-[#c4b89c] text-[#2c2c2c] text-xs rounded-sm h-8">
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
              {/* Scale notes */}
              <div className="mt-2 flex flex-wrap gap-1">
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

            {/* Position Selector */}
            <div className="sketch-card bg-[#faf6ef] p-3">
              <h3 className="text-[10px] uppercase tracking-widest text-[#8b7355] mb-2 font-serif italic font-bold">Position</h3>
              <div className="flex items-center gap-1 mb-1.5">
                <button
                  className="sketch-btn w-6 h-6 flex items-center justify-center border-[#c4b89c] disabled:opacity-30"
                  onClick={handlePrevPosition}
                  disabled={positionIndex <= 0}
                >
                  <ChevronLeft className="h-3 w-3" />
                </button>
                {positions.map((_, idx) => (
                  <button
                    key={idx}
                    className={`flex-1 h-6 text-[11px] font-semibold rounded-sm transition-all ${
                      positionIndex === idx
                        ? 'sketch-btn-active border-[#6b5b47]'
                        : 'sketch-btn border-[#c4b89c] hover:border-[#8b7355]'
                    }`}
                    onClick={() => setPositionIndex(idx)}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button
                  className="sketch-btn w-6 h-6 flex items-center justify-center border-[#c4b89c] disabled:opacity-30"
                  onClick={handleNextPosition}
                  disabled={positionIndex >= positions.length - 1}
                >
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#6b5b47] font-serif italic font-semibold">
                  {currentPosition.name} · Frets {currentPosition.fretStart}–{currentPosition.fretEnd}
                </span>
                <button
                  className={`text-[10px] px-1.5 py-0.5 rounded-sm transition-all border ${
                    showAllPositions
                      ? 'sketch-btn-active border-[#6b5b47]'
                      : 'border-[#c4b89c] hover:border-[#8b7355] text-[#6b5b47]'
                  }`}
                  onClick={() => setShowAllPositions(!showAllPositions)}
                >
                  All
                </button>
              </div>
            </div>

            {/* Exercise Selector */}
            <div className="sketch-card bg-[#faf6ef] p-3">
              <h3 className="text-[10px] uppercase tracking-widest text-[#8b7355] mb-2 font-serif italic font-bold flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Exercise
              </h3>
              <div className="space-y-1">
                {Object.entries(EXERCISE_TYPES).map(([id, info]) => (
                  <button
                    key={id}
                    className={`w-full text-left text-[11px] py-1.5 px-2 rounded-sm transition-all border ${
                      exerciseType === id
                        ? 'sketch-btn-active border-[#6b5b47]'
                        : 'sketch-btn border-[#c4b89c] hover:border-[#8b7355]'
                    }`}
                    onClick={() => setExerciseType(id as ExerciseType)}
                  >
                    <span className="font-semibold">{info.name}</span>
                  </button>
                ))}
              </div>
              <button
                className="sketch-btn w-full text-[11px] py-1.5 mt-1.5 border-[#8b7355] text-[#6b5b47] font-semibold"
                onClick={handleRandomize}
              >
                <Shuffle className="w-3 h-3 inline mr-1" />
                Random Exercise
              </button>
            </div>

            {/* Interval Legend */}
            <div className="sketch-card bg-[#faf6ef] p-3">
              <h3 className="text-[10px] uppercase tracking-widest text-[#8b7355] mb-2 font-serif italic font-bold">Intervals</h3>
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
              <div className="mt-2 text-[9px] text-[#8b7355] font-serif italic">
                Steps: {scale.intervals.slice(1).map((interval, idx) => {
                  const prevInterval = idx === 0 ? 0 : scale.intervals[idx];
                  const step = interval - prevInterval;
                  return step === 1 ? 'H' : step === 2 ? 'W' : `${step}H`;
                }).join(' — ')}
              </div>
            </div>
          </div>

          {/* ── Main Content: Fretboard + Exercise ── */}
          <div className="space-y-4">
            {/* Fretboard Diagram */}
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
                />
              </div>
            </div>

            {/* Tab Notation */}
            <TabNotation
              exercise={currentExercise}
              onNoteClick={handleTabNoteClick}
            />

            {/* Position Thumbnails */}
            {!showAllPositions && (
              <div className="grid grid-cols-5 gap-2">
                {positions.map((pos, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPositionIndex(idx)}
                    className={`p-1.5 rounded-sm border transition-all text-left ${
                      positionIndex === idx
                        ? 'border-[#8b7355] bg-[rgba(139,115,85,0.1)]'
                        : 'border-[#c4b89c] bg-[#faf6ef] hover:border-[#8b7355]'
                    }`}
                  >
                    <div className="text-[10px] font-semibold text-[#4a4a4a] font-serif italic">
                      P{idx + 1} <span className="text-[#8b7355] font-normal">({pos.fretStart}–{pos.fretEnd})</span>
                    </div>
                    <div className="mt-0.5 overflow-hidden rounded-sm">
                      <FretboardDiagram
                        keyNote={keyNote}
                        scaleId={scaleId}
                        startFret={pos.fretStart}
                        endFret={pos.fretEnd}
                        positionIndex={idx}
                        width={140}
                        compact
                        showPatternLines={true}
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-[#c4b89c] mt-4">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
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
