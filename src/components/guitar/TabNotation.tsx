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

  if (!exercise || !exercise.notes.length) {
    return (
      <div className={`flex items-center justify-center h-32 bg-[#faf6ef] border border-[#c4b89c] rounded-sm ${className}`}>
        <p className="text-[#8b7355] text-sm italic font-serif">Select an exercise to see tabs...</p>
      </div>
    );
  }

  const stringNames = ['e', 'B', 'G', 'D', 'A', 'E'];
  const maxNotes = 24;
  const displayNotes = exercise.notes.slice(0, maxNotes);
  const cellWidth = 26;

  // Build tab grid: each note gets a column, 6 rows (strings)
  const tabGrid: (ExerciseNote | null)[][] = stringNames.map(() => []);

  for (let noteIdx = 0; noteIdx < displayNotes.length; noteIdx++) {
    const note = displayNotes[noteIdx];
    const row = 5 - note.string; // string 0 (low E) = row 5, string 5 (high e) = row 0
    for (let r = 0; r < 6; r++) {
      if (r === row) {
        tabGrid[r].push(note);
      } else {
        tabGrid[r].push(null);
      }
    }
  }

  const isActive = useCallback((noteIdx: number) => {
    return activeNoteIndex === noteIdx || hoveredIdx === noteIdx;
  }, [activeNoteIndex, hoveredIdx]);

  return (
    <div className={`bg-[#faf6ef] border border-[#c4b89c] p-3 overflow-x-auto rounded-sm ${className}`}>
      {/* Exercise title */}
      <div className="mb-2 flex items-center gap-2 border-b border-[#c4b89c] pb-2">
        <span className="text-[#4a4a4a] text-sm font-semibold italic font-serif">{exercise.name}</span>
        <span className="text-[#b8a88a] text-xs font-serif italic">— {exercise.description}</span>
      </div>

      {/* Tab notation */}
      <div className="font-mono text-sm leading-relaxed select-none">
        {stringNames.map((name, rowIdx) => (
          <div key={rowIdx} className="flex items-center whitespace-nowrap">
            <span className="text-[#8b7355] w-4 text-right mr-2 font-serif italic text-xs">{name}</span>
            <span className="text-[#8b7355] font-bold">|</span>
            {tabGrid[rowIdx].map((note, cellIdx) => {
              const noteIdx = cellIdx; // column index maps to note index
              const noteActive = note !== null && isActive(noteIdx);
              return (
                <span
                  key={cellIdx}
                  className={`inline-block text-center cursor-pointer transition-colors duration-100 ${
                    note
                      ? noteActive
                        ? 'text-[#2c2c2c] font-bold bg-[rgba(139,115,85,0.15)] rounded-sm'
                        : 'text-[#4a4a4a] font-bold hover:text-[#2c2c2c] hover:bg-[rgba(139,115,85,0.08)] rounded-sm'
                      : 'text-[#c4b89c]'
                  }`}
                  style={{ width: cellWidth, minWidth: cellWidth }}
                  onMouseEnter={() => {
                    if (note) setHoveredIdx(noteIdx);
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
            <span className="text-[#8b7355] font-bold">|</span>
          </div>
        ))}
      </div>

      {exercise.notes.length > maxNotes && (
        <p className="text-[#b8a88a] text-xs mt-2 font-serif italic">
          Showing first {maxNotes} of {exercise.notes.length} notes...
        </p>
      )}
    </div>
  );
}
