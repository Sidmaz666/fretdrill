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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';

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

  // Current position fret range
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
    const randomType = types[Math.floor(Math.random() * types.length)];
    setExerciseType(randomType);
  }, []);

  // Navigate positions
  const handlePrevPosition = useCallback(() => {
    setPositionIndex(prev => Math.max(0, prev - 1));
  }, []);

  const handleNextPosition = useCallback(() => {
    setPositionIndex(prev => Math.min(positions.length - 1, prev + 1));
  }, [positions.length]);

  // Scale info
  const scaleNotes = useMemo(() => {
    return scale.intervals.map(interval => {
      const noteIndex = (KEY_NAMES.indexOf(keyNote) + interval) % 12;
      return KEY_NAMES[noteIndex];
    });
  }, [keyNote, scale]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Guitar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">FretBoard Forge</h1>
              <p className="text-xs text-slate-400">Procedural Guitar Exercise Generator</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-amber-500/30 text-amber-400">
              <Music className="w-3 h-3 mr-1" />
              {keyNote} {scale.name}
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Controls */}
          <div className="lg:col-span-3 space-y-4">
            {/* Key Selector */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-200">Key</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-1.5">
                  {KEY_DISPLAY_NAMES.map((key, idx) => (
                    <Button
                      key={idx}
                      variant={keyIndex === idx ? 'default' : 'outline'}
                      size="sm"
                      className={
                        keyIndex === idx
                          ? 'bg-amber-500 hover:bg-amber-600 text-black font-bold'
                          : 'border-slate-700 text-slate-300 hover:border-amber-500/50 hover:text-amber-400'
                      }
                      onClick={() => {
                        setKeyIndex(idx);
                        setPositionIndex(0);
                      }}
                    >
                      {key}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Scale Selector */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-200">Scale</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={scaleId} onValueChange={(v) => { setScaleId(v); setPositionIndex(0); }}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {Object.entries(SCALES).map(([id, s]) => (
                      <SelectItem key={id} value={id} className="text-slate-200 focus:bg-slate-700 focus:text-white">
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Scale notes display */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {scaleNotes.map((note, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className={
                        idx === 0
                          ? 'border-red-500/50 text-red-400 bg-red-500/10'
                          : 'border-slate-600 text-slate-300'
                      }
                    >
                      {note}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Position Selector */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-200">Position</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 border-slate-700"
                    onClick={handlePrevPosition}
                    disabled={positionIndex <= 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex-1 text-center">
                    <span className="text-amber-400 font-semibold">
                      {currentPosition.name}
                    </span>
                    <span className="text-slate-500 text-xs block">
                      Frets {currentPosition.fretStart}–{currentPosition.fretEnd}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 border-slate-700"
                    onClick={handleNextPosition}
                    disabled={positionIndex >= positions.length - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  variant={showAllPositions ? 'default' : 'outline'}
                  size="sm"
                  className={
                    showAllPositions
                      ? 'bg-amber-500 text-black w-full'
                      : 'border-slate-700 text-slate-300 w-full'
                  }
                  onClick={() => setShowAllPositions(!showAllPositions)}
                >
                  {showAllPositions ? 'Showing All Positions' : 'Show All Positions'}
                </Button>
                {!showAllPositions && (
                  <div className="flex gap-1">
                    {positions.map((pos, idx) => (
                      <Button
                        key={idx}
                        variant={positionIndex === idx ? 'default' : 'outline'}
                        size="sm"
                        className={
                          positionIndex === idx
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/50 flex-1'
                            : 'border-slate-700 text-slate-400 flex-1'
                        }
                        onClick={() => setPositionIndex(idx)}
                      >
                        {idx + 1}
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Exercise Type */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Exercise Type
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Select value={exerciseType} onValueChange={(v) => setExerciseType(v as ExerciseType)}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {Object.entries(EXERCISE_TYPES).map(([id, info]) => (
                      <SelectItem key={id} value={id} className="text-slate-200 focus:bg-slate-700 focus:text-white">
                        {info.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 w-full"
                  onClick={handleRandomize}
                >
                  <Shuffle className="w-3 h-3 mr-2" />
                  Random Exercise
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Fretboard & Tabs */}
          <div className="lg:col-span-9 space-y-4">
            {/* View Mode Tabs */}
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'fretboard' | 'exercise')}>
              <TabsList className="bg-slate-900 border border-slate-800">
                <TabsTrigger value="fretboard" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Fretboard View
                </TabsTrigger>
                <TabsTrigger value="exercise" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black">
                  <Zap className="w-4 h-4 mr-2" />
                  Exercise View
                </TabsTrigger>
              </TabsList>

              <TabsContent value="fretboard" className="mt-4 space-y-4">
                {/* Fretboard Diagram */}
                <Card className="bg-slate-900 border-slate-800 overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold text-white">
                        {keyNote} {scale.name}
                        {!showAllPositions && ` — ${currentPosition.name}`}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>Intervals:</span>
                        {scale.intervalLabels.map((label, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold"
                            style={{
                              backgroundColor: getIntervalColorForLabel(label) + '33',
                              color: getIntervalColorForLabel(label),
                              border: `1px solid ${getIntervalColorForLabel(label)}55`,
                            }}
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="overflow-x-auto">
                      <FretboardDiagram
                        keyNote={keyNote}
                        scaleId={scaleId}
                        startFret={startFret}
                        endFret={endFret}
                        showAllPositions={showAllPositions}
                        positionIndex={positionIndex}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* All 5 positions preview */}
                {!showAllPositions && (
                  <div className="grid grid-cols-5 gap-2">
                    {positions.map((pos, idx) => (
                      <button
                        key={idx}
                        onClick={() => setPositionIndex(idx)}
                        className={`p-2 rounded-lg border transition-all ${
                          positionIndex === idx
                            ? 'border-amber-500/50 bg-amber-500/10'
                            : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs font-semibold text-slate-300 mb-1">{pos.name}</div>
                        <div className="text-[10px] text-slate-500">Frets {pos.fretStart}–{pos.fretEnd}</div>
                        <div className="mt-1 overflow-hidden rounded">
                          <FretboardDiagram
                            keyNote={keyNote}
                            scaleId={scaleId}
                            startFret={pos.fretStart}
                            endFret={pos.fretEnd}
                            positionIndex={idx}
                            width={150}
                            className="[&_*]:!text-[6px]"
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Full fretboard when showing all */}
                {showAllPositions && (
                  <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="pt-4">
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
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="exercise" className="mt-4 space-y-4">
                {/* Current Exercise */}
                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base font-semibold text-white">
                          {currentExercise?.name || 'No Exercise'}
                        </CardTitle>
                        <p className="text-xs text-slate-400 mt-1">
                          {currentExercise?.description}
                        </p>
                      </div>
                      <Badge variant="outline" className="border-amber-500/30 text-amber-400">
                        {keyNote} {scale.name} — {currentPosition.name}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Fretboard with exercise notes highlighted */}
                    <div className="overflow-x-auto">
                      <FretboardDiagram
                        keyNote={keyNote}
                        scaleId={scaleId}
                        startFret={startFret}
                        endFret={endFret}
                        positionIndex={positionIndex}
                      />
                    </div>

                    <Separator className="bg-slate-800" />

                    {/* Tab Notation */}
                    <TabNotation exercise={currentExercise} />
                  </CardContent>
                </Card>

                {/* Quick exercise buttons */}
                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-slate-200">Quick Exercises</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {Object.entries(EXERCISE_TYPES).map(([id, info]) => (
                        <Button
                          key={id}
                          variant={exerciseType === id ? 'default' : 'outline'}
                          size="sm"
                          className={
                            exerciseType === id
                              ? 'bg-amber-500 text-black font-semibold'
                              : 'border-slate-700 text-slate-300 hover:border-amber-500/50 hover:text-amber-400'
                          }
                          onClick={() => setExerciseType(id as ExerciseType)}
                        >
                          {info.name}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Scale Reference */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Music className="w-4 h-4 text-amber-400" />
                  Scale Reference — {keyNote} {scale.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs text-slate-400 mb-2 uppercase tracking-wide">Notes & Intervals</h4>
                    <div className="flex flex-wrap gap-2">
                      {scale.intervals.map((interval, idx) => {
                        const noteIndex = (KEY_NAMES.indexOf(keyNote) + interval) % 12;
                        const noteName = KEY_NAMES[noteIndex];
                        const label = scale.intervalLabels[idx];
                        const color = getIntervalColorForLabel(label);
                        return (
                          <div
                            key={idx}
                            className="flex flex-col items-center px-3 py-2 rounded-lg"
                            style={{
                              backgroundColor: color + '15',
                              border: `1px solid ${color}33`,
                            }}
                          >
                            <span className="text-sm font-bold" style={{ color }}>{noteName}</span>
                            <span className="text-[10px] text-slate-400">{label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs text-slate-400 mb-2 uppercase tracking-wide">Interval Formula</h4>
                    <div className="font-mono text-sm text-slate-300 bg-slate-800 rounded-lg p-3">
                      {scale.intervals.map((interval, idx) => (
                        <span key={idx}>
                          {idx > 0 && <span className="text-slate-500"> - </span>}
                          <span className="text-amber-400">{interval}</span>
                          <span className="text-slate-500 text-xs ml-0.5">st</span>
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      Steps from root: {scale.intervals.slice(1).map((interval, idx) => {
                        const prevInterval = idx === 0 ? 0 : scale.intervals[idx];
                        const step = interval - prevInterval;
                        return step === 1 ? 'H' : step === 2 ? 'W' : `${step}H`;
                      }).join(' - ')}
                      (W = Whole step, H = Half step)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-8">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            FretBoard Forge — Procedural Guitar Exercise Generator
          </p>
          <p className="text-xs text-slate-600">
            Inspired by Ricky&apos;s Guitar teaching method
          </p>
        </div>
      </footer>
    </div>
  );
}

// Helper function to get interval color as hex string
function getIntervalColorForLabel(label: string): string {
  if (label === 'R') return '#ef4444';
  if (label.includes('♭3') || label.includes('♭2')) return '#a855f7';
  if (label === '3' || label === '2') return '#22c55e';
  if (label === '4') return '#3b82f6';
  if (label.includes('5') || label === '5') return '#06b6d4';
  if (label.includes('6')) return '#f97316';
  if (label.includes('7')) return '#ec4899';
  if (label.includes('♯') || label.includes('♭')) return '#a855f7';
  return '#6366f1';
}
