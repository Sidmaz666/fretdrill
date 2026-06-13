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
} from '@/lib/exercise-generator';
import FretboardDiagram from '@/components/guitar/FretboardDiagram';
import TabNotation from '@/components/guitar/TabNotation';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Guitar,
  Music,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  Zap,
  BookOpen,
  Pencil,
} from 'lucide-react';

// Sketch-style interval color mapping (muted, pencil-like)
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
  // State: Key and Scale (defaults: A minor pentatonic)
  const [keyIndex, setKeyIndex] = useState(9); // A
  const [scaleId, setScaleId] = useState('minor-pentatonic');
  const [positionIndex, setPositionIndex] = useState(0);
  const [exerciseType, setExerciseType] = useState<ExerciseType>('scale-asc-desc');
  const [showAllPositions, setShowAllPositions] = useState(false);
  const [viewMode, setViewMode] = useState<'fretboard' | 'exercise'>('fretboard');

  const keyNote = KEY_NAMES[keyIndex];
  const scale = SCALES[scaleId];

  // Calculate CAGED positions
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

  return (
    <div className="min-h-screen bg-[#f5f0e8] text-[#2c2c2c]">
      {/* Header - sketch style with pencil lines */}
      <header className="border-b-2 border-[#8b7355] bg-[#faf6ef]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm border-2 border-[#8b7355] flex items-center justify-center bg-[#f5f0e8]">
              <Pencil className="w-5 h-5 text-[#6b5b47]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#2c2c2c]" style={{ fontFamily: "'Georgia', 'Times New Roman', serif", fontStyle: 'italic' }}>
                FretBoard Forge
              </h1>
              <p className="text-xs text-[#8b7355] italic" style={{ fontFamily: "'Georgia', serif" }}>
                procedural guitar exercise generator
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 border border-[#8b7355] rounded-sm text-sm text-[#6b5b47] font-serif italic">
              <Music className="w-3.5 h-3.5" />
              {keyNote} {scale.name}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Sidebar - Controls */}
          <div className="lg:col-span-3 space-y-4">
            {/* Key Selector */}
            <div className="sketch-card bg-[#faf6ef] p-4">
              <h3 className="text-xs uppercase tracking-widest text-[#8b7355] mb-3 font-serif italic">
                Key
              </h3>
              <div className="grid grid-cols-4 gap-1.5">
                {KEY_DISPLAY_NAMES.map((key, idx) => (
                  <button
                    key={idx}
                    className={`px-1 py-1.5 text-xs font-semibold border transition-all rounded-sm ${
                      keyIndex === idx
                        ? 'sketch-btn-active border-[#6b5b47] bg-[rgba(139,115,85,0.15)] text-[#2c2c2c]'
                        : 'sketch-btn border-[#c4b89c] hover:border-[#8b7355]'
                    }`}
                    onClick={() => {
                      setKeyIndex(idx);
                      setPositionIndex(0);
                    }}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>

            {/* Scale Selector */}
            <div className="sketch-card bg-[#faf6ef] p-4">
              <h3 className="text-xs uppercase tracking-widest text-[#8b7355] mb-3 font-serif italic">
                Scale
              </h3>
              <Select value={scaleId} onValueChange={(v) => { setScaleId(v); setPositionIndex(0); }}>
                <SelectTrigger className="bg-[#f5f0e8] border-[#c4b89c] text-[#2c2c2c] text-sm rounded-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#faf6ef] border-[#c4b89c]">
                  {Object.entries(SCALES).map(([id, s]) => (
                    <SelectItem key={id} value={id} className="text-[#2c2c2c] focus:bg-[rgba(139,115,85,0.1)] focus:text-[#2c2c2c]">
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Scale notes */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {scaleNotes.map((note, idx) => (
                  <span
                    key={idx}
                    className={`inline-flex items-center justify-center px-2 py-0.5 text-xs font-serif italic border rounded-sm ${
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

            {/* Position Selector */}
            <div className="sketch-card bg-[#faf6ef] p-4">
              <h3 className="text-xs uppercase tracking-widest text-[#8b7355] mb-3 font-serif italic">
                Position
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <button
                    className="sketch-btn w-8 h-8 flex items-center justify-center border-[#c4b89c] disabled:opacity-30"
                    onClick={handlePrevPosition}
                    disabled={positionIndex <= 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="flex-1 text-center">
                    <span className="text-[#4a4a4a] font-semibold font-serif italic text-sm">
                      {currentPosition.name}
                    </span>
                    <span className="text-[#8b7355] text-xs block font-serif italic">
                      Frets {currentPosition.fretStart}–{currentPosition.fretEnd}
                    </span>
                  </div>
                  <button
                    className="sketch-btn w-8 h-8 flex items-center justify-center border-[#c4b89c] disabled:opacity-30"
                    onClick={handleNextPosition}
                    disabled={positionIndex >= positions.length - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <button
                  className={`w-full text-sm py-1.5 rounded-sm transition-all ${
                    showAllPositions
                      ? 'sketch-btn-active border-[#6b5b47]'
                      : 'sketch-btn border-[#c4b89c]'
                  }`}
                  onClick={() => setShowAllPositions(!showAllPositions)}
                >
                  {showAllPositions ? '✓ All Positions' : 'Show All'}
                </button>
                {!showAllPositions && (
                  <div className="flex gap-1">
                    {positions.map((pos, idx) => (
                      <button
                        key={idx}
                        className={`flex-1 py-1 text-xs font-semibold rounded-sm transition-all ${
                          positionIndex === idx
                            ? 'sketch-btn-active border-[#6b5b47]'
                            : 'sketch-btn border-[#c4b89c]'
                        }`}
                        onClick={() => setPositionIndex(idx)}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Exercise Type */}
            <div className="sketch-card bg-[#faf6ef] p-4">
              <h3 className="text-xs uppercase tracking-widest text-[#8b7355] mb-3 font-serif italic flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                Exercise
              </h3>
              <div className="space-y-2">
                <Select value={exerciseType} onValueChange={(v) => setExerciseType(v as ExerciseType)}>
                  <SelectTrigger className="bg-[#f5f0e8] border-[#c4b89c] text-[#2c2c2c] text-sm rounded-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#faf6ef] border-[#c4b89c]">
                    {Object.entries(EXERCISE_TYPES).map(([id, info]) => (
                      <SelectItem key={id} value={id} className="text-[#2c2c2c] focus:bg-[rgba(139,115,85,0.1)]">
                        {info.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button
                  className="sketch-btn w-full text-sm py-1.5 border-[#8b7355] text-[#6b5b47]"
                  onClick={handleRandomize}
                >
                  <Shuffle className="w-3 h-3 inline mr-1.5" />
                  Random Exercise
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-9 space-y-4">
            {/* View Mode Tabs - sketch style */}
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'fretboard' | 'exercise')}>
              <TabsList className="bg-[#faf6ef] border border-[#c4b89c] rounded-sm h-auto p-0.5">
                <TabsTrigger
                  value="fretboard"
                  className="data-[state=active]:bg-[rgba(139,115,85,0.15)] data-[state=active]:text-[#2c2c2c] data-[state=active]:border-[#8b7355] data-[state=active]:shadow-none rounded-sm text-[#8b7355] text-xs border border-transparent px-3 py-1.5 font-serif italic"
                >
                  <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                  Fretboard View
                </TabsTrigger>
                <TabsTrigger
                  value="exercise"
                  className="data-[state=active]:bg-[rgba(139,115,85,0.15)] data-[state=active]:text-[#2c2c2c] data-[state=active]:border-[#8b7355] data-[state=active]:shadow-none rounded-sm text-[#8b7355] text-xs border border-transparent px-3 py-1.5 font-serif italic"
                >
                  <Zap className="w-3.5 h-3.5 mr-1.5" />
                  Exercise View
                </TabsTrigger>
              </TabsList>

              <TabsContent value="fretboard" className="mt-4 space-y-4">
                {/* Fretboard Diagram */}
                <div className="sketch-card bg-[#faf6ef] overflow-hidden">
                  <div className="p-4 pb-2">
                    <div className="flex items-center justify-between mb-1">
                      <h2 className="text-base font-semibold font-serif italic text-[#2c2c2c]">
                        {keyNote} {scale.name}
                        {!showAllPositions && (
                          <span className="text-[#8b7355] font-normal"> — {currentPosition.name}</span>
                        )}
                      </h2>
                      <div className="flex items-center gap-1.5 text-xs text-[#8b7355]">
                        <span className="font-serif italic">intervals:</span>
                        {scale.intervalLabels.map((label, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center justify-center w-6 h-6 text-[9px] font-bold font-serif italic border rounded-sm"
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
                  </div>
                  <div className="px-2 pb-4 overflow-x-auto">
                    <FretboardDiagram
                      keyNote={keyNote}
                      scaleId={scaleId}
                      startFret={startFret}
                      endFret={endFret}
                      showAllPositions={showAllPositions}
                      positionIndex={positionIndex}
                    />
                  </div>
                </div>

                {/* Position previews */}
                {!showAllPositions && (
                  <div className="grid grid-cols-5 gap-2">
                    {positions.map((pos, idx) => (
                      <button
                        key={idx}
                        onClick={() => setPositionIndex(idx)}
                        className={`p-2 rounded-sm border transition-all text-left ${
                          positionIndex === idx
                            ? 'border-[#8b7355] bg-[rgba(139,115,85,0.1)]'
                            : 'border-[#c4b89c] bg-[#faf6ef] hover:border-[#8b7355]'
                        }`}
                      >
                        <div className="text-xs font-semibold text-[#4a4a4a] font-serif italic mb-0.5">{pos.name}</div>
                        <div className="text-[10px] text-[#8b7355] font-serif italic">Frets {pos.fretStart}–{pos.fretEnd}</div>
                        <div className="mt-1 overflow-hidden rounded-sm">
                          <FretboardDiagram
                            keyNote={keyNote}
                            scaleId={scaleId}
                            startFret={pos.fretStart}
                            endFret={pos.fretEnd}
                            positionIndex={idx}
                            width={150}
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Full fretboard */}
                {showAllPositions && (
                  <div className="sketch-card bg-[#faf6ef] p-4">
                    <div className="overflow-x-auto">
                      <FretboardDiagram
                        keyNote={keyNote}
                        scaleId={scaleId}
                        startFret={0}
                        endFret={FRET_COUNT}
                        showAllPositions={true}
                        positionIndex={-1}
                      />
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="exercise" className="mt-4 space-y-4">
                {/* Exercise card */}
                <div className="sketch-card bg-[#faf6ef]">
                  <div className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-base font-semibold font-serif italic text-[#2c2c2c]">
                          {currentExercise?.name || 'No Exercise'}
                        </h2>
                        <p className="text-xs text-[#8b7355] mt-0.5 font-serif italic">
                          {currentExercise?.description}
                        </p>
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 border border-[#c4b89c] rounded-sm text-xs text-[#6b5b47] font-serif italic">
                        {keyNote} {scale.name} — {currentPosition.name}
                      </span>
                    </div>
                  </div>
                  <div className="px-2 pb-4 space-y-3">
                    {/* Fretboard with exercise notes */}
                    <div className="overflow-x-auto">
                      <FretboardDiagram
                        keyNote={keyNote}
                        scaleId={scaleId}
                        startFret={startFret}
                        endFret={endFret}
                        positionIndex={positionIndex}
                      />
                    </div>

                    <div className="border-t border-[#c4b89c] mx-4" />

                    {/* Tab Notation */}
                    <div className="mx-2">
                      <TabNotation exercise={currentExercise} />
                    </div>
                  </div>
                </div>

                {/* Quick exercise buttons */}
                <div className="sketch-card bg-[#faf6ef] p-4">
                  <h3 className="text-xs uppercase tracking-widest text-[#8b7355] mb-3 font-serif italic">
                    Quick Exercises
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {Object.entries(EXERCISE_TYPES).map(([id, info]) => (
                      <button
                        key={id}
                        className={`text-xs py-1.5 px-2 rounded-sm transition-all ${
                          exerciseType === id
                            ? 'sketch-btn-active border-[#6b5b47]'
                            : 'sketch-btn border-[#c4b89c]'
                        }`}
                        onClick={() => setExerciseType(id as ExerciseType)}
                      >
                        {info.name}
                      </button>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Scale Reference */}
            <div className="sketch-card bg-[#faf6ef] p-4">
              <h3 className="text-xs uppercase tracking-widest text-[#8b7355] mb-3 font-serif italic flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5" />
                Scale Reference — {keyNote} {scale.name}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-[10px] uppercase tracking-widest text-[#8b7355] mb-2 font-serif italic">
                    Notes & Intervals
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {scale.intervals.map((interval, idx) => {
                      const noteIndex = (KEY_NAMES.indexOf(keyNote) + interval) % 12;
                      const noteName = KEY_NAMES[noteIndex];
                      const label = scale.intervalLabels[idx];
                      const color = getSketchIntervalColor(label);
                      return (
                        <div
                          key={idx}
                          className="flex flex-col items-center px-3 py-2 rounded-sm"
                          style={{
                            backgroundColor: color + '08',
                            border: `1px solid ${color}30`,
                          }}
                        >
                          <span className="text-sm font-bold font-serif italic" style={{ color }}>
                            {noteName}
                          </span>
                          <span className="text-[10px] text-[#8b7355] font-serif italic">{label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] uppercase tracking-widest text-[#8b7355] mb-2 font-serif italic">
                    Interval Formula
                  </h4>
                  <div className="font-mono text-sm text-[#4a4a4a] bg-[#f5f0e8] border border-[#c4b89c] rounded-sm p-3">
                    {scale.intervals.map((interval, idx) => (
                      <span key={idx}>
                        {idx > 0 && <span className="text-[#c4b89c]"> — </span>}
                        <span className="text-[#6b5b47]">{interval}</span>
                        <span className="text-[#b8a88a] text-xs ml-0.5">st</span>
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-[#8b7355] mt-2 font-serif italic">
                    Steps from root: {scale.intervals.slice(1).map((interval, idx) => {
                      const prevInterval = idx === 0 ? 0 : scale.intervals[idx];
                      const step = interval - prevInterval;
                      return step === 1 ? 'H' : step === 2 ? 'W' : `${step}H`;
                    }).join(' — ')}
                    {' '}(W = Whole step, H = Half step)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-[#c4b89c] mt-8">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <p className="text-xs text-[#8b7355] font-serif italic">
            FretBoard Forge — Procedural Guitar Exercise Generator
          </p>
          <p className="text-xs text-[#b8a88a] font-serif italic">
            Inspired by Ricky&apos;s Guitar teaching method
          </p>
        </div>
      </footer>
    </div>
  );
}
