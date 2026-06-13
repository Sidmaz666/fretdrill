'use client';

import React, { useState, useCallback } from 'react';
import { Exercise, ExerciseNote } from '@/lib/exercise-generator';

interface TabNotationProps {
  exercise: Exercise | null;
  onNoteClick?: (note: ExerciseNote) => void;
  activeNoteIndex?: number;
  className?: string;
}

export default function TabNotation({ exercise, onNoteClick, activeNoteIndex = -1, className = '' }: TabNotationProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const isActive = useCallback((noteIdx: number) => {
    return activeNoteIndex === noteIdx || hoveredIdx === noteIdx;
  }, [activeNoteIndex, hoveredIdx]);

  if (!exercise || !exercise.notes.length) {
    return (
      <div className={`sketch-card bg-[#faf6ef] flex items-center justify-center h-24 ${className}`}>
        <p className="text-[#8b7355] text-sm italic font-serif">Select an exercise to see tabs...</p>
      </div>
    );
  }

  const stringNames = ['e', 'B', 'G', 'D', 'A', 'E'];
  const maxNotes = 28;
  const displayNotes = exercise.notes.slice(0, maxNotes);
  const cellWidth = 24;

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
        <span className="text-[9px] text-[#b8a88a] font-serif italic">
          {exercise.notes.length} notes
        </span>
      </div>

      {/* Tab notation */}
      <div className="font-mono text-sm leading-relaxed select-none">
        {stringNames.map((name, rowIdx) => (
          <div key={rowIdx} className="flex items-center whitespace-nowrap">
            <span className="text-[#8b7355] w-5 text-right mr-2 font-serif italic text-xs font-bold">{name}</span>
            <span className="text-[#8b7355] font-bold opacity-70">|</span>
            {tabGrid[rowIdx].map((note, cellIdx) => {
              const noteActive = note !== null && isActive(cellIdx);
              return (
                <span
                  key={cellIdx}
                  className={`inline-block text-center cursor-pointer transition-colors duration-100 ${
                    note
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

      {exercise.notes.length > maxNotes && (
        <p className="text-[10px] text-[#8b7355] mt-2 font-serif italic">
          Showing first {maxNotes} of {exercise.notes.length} notes...
        </p>
      )}
    </div>
  );
}
