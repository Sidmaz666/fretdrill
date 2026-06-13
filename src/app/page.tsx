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
  Exercise,
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
} from 'lucide-react';

// Sketch-style interval color mapping
function getSketchIntervalColor(label: string): string {
  if (label === 'R') return '#8b4a4a';
  if (label.includes('♭3') || label.includes('♭2')) return '#6b4a7a';
  if (label === '3' || label === '2') return '#4a7a4a';
  if (label === '4') return '#4a5a8a';
  if (label.includes('5') || label === '5') return '#4a7a7a';
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

  // CAGED positions
  const positions = useMemo(
    () => getCAGEDPositions(keyNote, scaleId),
    [keyNote, scaleId]
  );

  const currentPosition = positions[positionIndex] || {
    fretStart: 0,
    fretEnd: FRET_COUNT,
    name: 'Full Fretboard',
  };

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
    // Convert ExerciseNote[] to FretboardNote-like format for highlighting
    const allScaleNotes = getScaleOnFretboard(keyNote, scaleId, startFret, endFret);
    const exerciseNoteKeys = new Set(
      currentExercise.notes.map(n => `${n.string}-${n.fret}`)
    );
    return allScaleNotes.filter(n => exerciseNoteKeys.has(`${n.string}-${n.fret}`));
  }, [currentExercise, keyNote, scaleId, startFret, endFret]);

  // Randomize exercise
  const handleRandomize = useCallback(() => {
    const types = Object.keys(EXERCISE_TYPES) as ExerciseType[];
    setExerciseType(types[Math.floor(Math.random() * types.length)]);
  }, []);

  // Navigate positions
  const handlePrevPosition = useCallback(() => {
    setPositionIndex(prev => Math.max(0, prev - 1));
  }, []);

  const handleNextPosition = useCallback(() => {
    setPositionIndex(prev => Math.min(positions.length - 1, prev + 1));
  }, [positions.length]);

  // Scale notes
  const scaleNotes = useMemo(() => {
    return scale.intervals.map(interval => {
      const noteIndex = (KEY_NAMES.indexOf(keyNote) + interval) % 12;
      return KEY_NAMES[noteIndex];
    });
  }, [keyNote, scale]);

  // Handle note click on fretboard
  const handleFretboardNoteClick = useCallback((note: { string: number; fret: number }) => {
    setActiveNote(prev =>
      prev && prev.string === note.string && prev.fret === note.fret ? null : note
    );
  }, []);

  // Handle note click on tab
  const handleTabNoteClick = useCallback((note: ExerciseNote) => {
    setActiveNote({ string: note.string, fret: note.fret });
    // Auto-clear after 2s
    setTimeout(() => setActiveNote(null), 2000);
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f0e8] text-[#2c2c2c]">
      {/* Header */}
      <header className="border-b-2 border-[#8b7355] bg-[#faf6ef]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-sm border-2 border-[#8b7355] flex items-center justify-center bg-[#f5f0e8]">
              <Music className="w-4 h-4 text-[#6b5b47]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#2c2c2c]" style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic' }}>
                FretBoard Forge
              </h1>
              <p className="text-[10px] text-[#8b7355] italic" style={{ fontFamily: "'Georgia', serif" }}>
                guitar exercise generator
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 border border-[#8b7355] rounded-sm text-sm text-[#6b5b47] font-serif italic">
            {keyNote} {scale.name}
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-4 space-y-4">
        {/* ── Row 1: Key + Scale + Position ── */}
        <div className="flex flex-wrap items-end gap-4">
          {/* Key */}
          <div className="flex-shrink-0">
            <label className="text-[10px] uppercase tracking-widest text-[#8b7355] mb-1.5 block font-serif italic">Key</label>
            <div className="flex flex-wrap gap-1">
              {KEY_DISPLAY_NAMES.map((key, idx) => (
                <button
                  key={idx}
                  className={`w-9 h-8 text-xs font-semibold border transition-all rounded-sm ${
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

          {/* Scale */}
          <div className="flex-shrink-0 min-w-[180px]">
            <label className="text-[10px] uppercase tracking-widest text-[#8b7355] mb-1.5 block font-serif italic">Scale</label>
            <Select value={scaleId} onValueChange={(v) => { setScaleId(v); setPositionIndex(0); }}>
              <SelectTrigger className="bg-[#f5f0e8] border-[#c4b89c] text-[#2c2c2c] text-sm rounded-sm h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#faf6ef] border-[#c4b89c]">
                {Object.entries(SCALES).map(([id, s]) => (
                  <SelectItem key={id} value={id} className="text-[#2c2c2c] focus:bg-[rgba(139,115,85,0.1)]">
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Scale notes inline */}
            <div className="mt-1.5 flex flex-wrap gap-1">
              {scaleNotes.map((note, idx) => (
                <span
                  key={idx}
                  className={`inline-flex items-center justify-center px-1.5 py-0 text-[10px] font-serif italic border rounded-sm ${
                    idx === 0
                      ? 'border-[#8b4a4a]/50 text-[#8b4a4a] bg-[#8b4a4a]/10'
                      : 'border-[#c4b89c] text-[#6b5b47]'
                  }`}
                >
                  {note}
                </span>
              ))}
            </div>
          </div>

          {/* Position */}
          <div className="flex-shrink-0">
            <label className="text-[10px] uppercase tracking-widest text-[#8b7355] mb-1.5 block font-serif italic">Position</label>
            <div className="flex items-center gap-1.5">
              <button
                className="sketch-btn w-7 h-7 flex items-center justify-center border-[#c4b89c] disabled:opacity-30"
                onClick={handlePrevPosition}
                disabled={positionIndex <= 0}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              {positions.map((pos, idx) => (
                <button
                  key={idx}
                  className={`w-7 h-7 text-xs font-semibold rounded-sm transition-all ${
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
                className="sketch-btn w-7 h-7 flex items-center justify-center border-[#c4b89c] disabled:opacity-30"
                onClick={handleNextPosition}
                disabled={positionIndex >= positions.length - 1}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              <button
                className={`sketch-btn text-[10px] px-2 h-7 rounded-sm transition-all ${
                  showAllPositions
                    ? 'sketch-btn-active border-[#6b5b47]'
                    : 'border-[#c4b89c] hover:border-[#8b7355]'
                }`}
                onClick={() => setShowAllPositions(!showAllPositions)}
              >
                All
              </button>
            </div>
            <div className="mt-1 text-[10px] text-[#8b7355] font-serif italic">
              {currentPosition.name} — Frets {currentPosition.fretStart}–{currentPosition.fretEnd}
            </div>
          </div>
        </div>

        {/* ── Row 2: Fretboard ── */}
        <div className="sketch-card bg-[#faf6ef] overflow-hidden">
          <div className="px-3 pt-3 pb-1 flex items-center justify-between">
            <h2 className="text-sm font-semibold font-serif italic text-[#2c2c2c]">
              {keyNote} {scale.name}
              {!showAllPositions && <span className="text-[#8b7355] font-normal"> — {currentPosition.name}</span>}
            </h2>
            <div className="flex items-center gap-1 text-[10px] text-[#8b7355]">
              <span className="font-serif italic">intervals:</span>
              {scale.intervalLabels.map((label, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center justify-center w-5 h-5 text-[8px] font-bold font-serif italic border rounded-sm"
                  style={{
                    borderColor: getSketchIntervalColor(label) + '55',
                    color: getSketchIntervalColor(label),
                    backgroundColor: getSketchIntervalColor(label) + '10',
                  }}
                >
                  {label}
                </span>
              ))}
            </div>
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
              activeNote={activeNote}
              onNoteClick={handleFretboardNoteClick}
            />
          </div>
        </div>

        {/* ── Row 3: Exercise Type Buttons ── */}
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-[10px] uppercase tracking-widest text-[#8b7355] font-serif italic">Exercise</label>
          {Object.entries(EXERCISE_TYPES).map(([id, info]) => (
            <button
              key={id}
              className={`text-xs py-1.5 px-3 rounded-sm transition-all ${
                exerciseType === id
                  ? 'sketch-btn-active border-[#6b5b47]'
                  : 'sketch-btn border-[#c4b89c] hover:border-[#8b7355]'
              }`}
              onClick={() => setExerciseType(id as ExerciseType)}
              title={info.description}
            >
              {info.name}
            </button>
          ))}
          <button
            className="sketch-btn text-xs py-1.5 px-3 border-[#8b7355] text-[#6b5b47]"
            onClick={handleRandomize}
            title="Random exercise"
          >
            <Shuffle className="w-3 h-3 inline mr-1" />
            Random
          </button>
        </div>

        {/* ── Row 4: Tab Notation ── */}
        <TabNotation
          exercise={currentExercise}
          onNoteClick={handleTabNoteClick}
        />

        {/* ── Row 5: Position Thumbnails ── */}
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
                  />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── Row 6: Scale Reference (compact) ── */}
        <div className="sketch-card bg-[#faf6ef] p-3">
          <div className="flex flex-wrap items-center gap-4">
            <h3 className="text-[10px] uppercase tracking-widest text-[#8b7355] font-serif italic flex items-center gap-1">
              <Music className="w-3 h-3" />
              {keyNote} {scale.name}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {scale.intervals.map((interval, idx) => {
                const noteIndex = (KEY_NAMES.indexOf(keyNote) + interval) % 12;
                const noteName = KEY_NAMES[noteIndex];
                const label = scale.intervalLabels[idx];
                const color = getSketchIntervalColor(label);
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-1 px-2 py-1 rounded-sm"
                    style={{ backgroundColor: color + '08', border: `1px solid ${color}30` }}
                  >
                    <span className="text-xs font-bold font-serif italic" style={{ color }}>{noteName}</span>
                    <span className="text-[9px] text-[#8b7355] font-serif italic">{label}</span>
                  </div>
                );
              })}
            </div>
            <div className="text-[10px] text-[#8b7355] font-serif italic">
              Steps: {scale.intervals.slice(1).map((interval, idx) => {
                const prevInterval = idx === 0 ? 0 : scale.intervals[idx];
                const step = interval - prevInterval;
                return step === 1 ? 'H' : step === 2 ? 'W' : `${step}H`;
              }).join(' — ')}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-[#c4b89c] mt-4">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
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
