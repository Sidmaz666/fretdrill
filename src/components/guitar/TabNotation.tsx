'use client';

import React, { useState, useCallback } from 'react';
import { Exercise, ExerciseNote } from '@/lib/exercise-generator';

interface TabNotationProps {
  exercise: Exercise | null;
  onNoteClick?: (note: ExerciseNote) => void;
  activeNoteIndex?: number;
  playingIdx?: number;
  activePlayingNote?: ExerciseNote | null;
  className?: string;
}

export default function TabNotation({ exercise, onNoteClick, activeNoteIndex = -1, playingIdx = -1, activePlayingNote = null, className = '' }: TabNotationProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const isActive = useCallback((noteIdx: number) => {
    return activeNoteIndex === noteIdx || hoveredIdx === noteIdx || playingIdx === noteIdx;
  }, [activeNoteIndex, hoveredIdx, playingIdx]);

  if (!exercise || !exercise.notes.length) {
    return (
      <div className={`sketch-card bg-[#faf6ef] flex items-center justify-center h-28 ${className}`}>
        <div className="text-center">
          <p className="text-[#8b7355] text-sm italic font-serif">Select an exercise to see tabs...</p>
          <p className="text-[#b8a88a] text-[9px] italic font-serif mt-1">Choose from the exercise categories above</p>
        </div>
      </div>
    );
  }

  const stringNames = ['e', 'B', 'G', 'D', 'A', 'E'];
  const maxNotes = 32;
  const displayNotes = exercise.notes.slice(0, maxNotes);
  const cellWidth = 22;

  // Build tab grid
  const tabGrid: (ExerciseNote | null)[][] = stringNames.map(() => []);

  for (let noteIdx = 0; noteIdx < displayNotes.length; noteIdx++) {
    const note = displayNotes[noteIdx];
    const row = 5 - note.string;
    for (let r = 0; r < 6; r++) {
      if (r === row) {
        tabGrid[r].push(note);
      } else {
        tabGrid[r].push(null);
      }
    }
  }

  return (
    <div className={`sketch-card bg-[#faf6ef] p-4 overflow-x-auto ${className}`}>
      {/* Exercise title bar */}
      <div className="mb-3 flex items-center justify-between border-b border-[#e8e2d6] pb-2">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-bold text-[#9b3939] font-serif italic">{exercise.name}</span>
          <span className="text-[10px] text-[#8b7355] font-serif italic">— {exercise.description}</span>
        </div>
        <div className="flex items-center gap-3">
          {activePlayingNote && (
            <span className="text-[10px] text-[#9b3939] font-serif italic font-bold animate-pulse">
              Playing: {activePlayingNote.note} ({activePlayingNote.intervalLabel}) · String {6 - activePlayingNote.string} · Fret {activePlayingNote.fret}
            </span>
          )}
          <span className="text-[9px] text-[#b8a88a] font-serif italic">
            {exercise.notes.length} notes
          </span>
        </div>
      </div>

      {/* Tab notation grid */}
      <div className="font-mono text-sm leading-relaxed select-none">
        {stringNames.map((name, rowIdx) => (
          <div key={rowIdx} className="flex items-center whitespace-nowrap">
            <span className="text-[#8b7355] w-5 text-right mr-2 font-serif italic text-xs font-bold">{name}</span>
            <span className="text-[#8b7355] font-bold opacity-70">|</span>
            {tabGrid[rowIdx].map((note, cellIdx) => {
              const noteActive = note !== null && isActive(cellIdx);
              const isPlaying = note !== null && playingIdx === cellIdx;
              const isCurrentPlaying = activePlayingNote && note && 
                activePlayingNote.string === note.string && 
                activePlayingNote.fret === note.fret;
              return (
                <span
                  key={cellIdx}
                  className={`inline-block text-center cursor-pointer transition-all duration-75 ${
                    isCurrentPlaying || isPlaying
                      ? 'text-[#9b3939] font-bold bg-[rgba(155,57,57,0.25)] rounded-sm scale-110'
                      : note
                        ? noteActive
                          ? 'text-[#9b3939] font-bold bg-[rgba(155,57,57,0.1)] rounded-sm'
                          : 'text-[#4a4a4a] font-bold hover:text-[#9b3939] hover:bg-[rgba(155,57,57,0.05)] rounded-sm'
                        : 'text-[#c4b89c]'
                  }`}
                  style={{ width: cellWidth, minWidth: cellWidth }}
                  onMouseEnter={() => {
                    if (note) setHoveredIdx(cellIdx);
                  }}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={() => {
                    if (note && onNoteClick) onNoteClick(note);
                  }}
                >
                  {note ? note.fret : '—'}
                </span>
              );
            })}
            <span className="text-[#8b7355] font-bold opacity-70">|</span>
          </div>
        ))}
      </div>

      {/* Note info footer */}
      {exercise.notes.length > maxNotes && (
        <p className="text-[10px] text-[#8b7355] mt-2 font-serif italic">
          Showing first {maxNotes} of {exercise.notes.length} notes...
        </p>
      )}
    </div>
  );
}
