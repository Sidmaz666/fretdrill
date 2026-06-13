'use client';

import React from 'react';
import { Exercise } from '@/lib/exercise-generator';

interface TabNotationProps {
  exercise: Exercise | null;
  className?: string;
}

export default function TabNotation({ exercise, className = '' }: TabNotationProps) {
  if (!exercise || !exercise.notes.length) {
    return (
      <div className={`flex items-center justify-center h-40 bg-[#faf6ef] border border-[#c4b89c] rounded-sm ${className}`}>
        <p className="text-[#8b7355] text-sm italic font-serif">Select an exercise to see tabs...</p>
      </div>
    );
  }

  const stringNames = ['e', 'B', 'G', 'D', 'A', 'E'];
  const maxNotes = 20;
  const displayNotes = exercise.notes.slice(0, maxNotes);

  // Build tab grid
  const cellWidth = 28;
  const tabRows: string[][] = stringNames.map(() => []);

  for (const note of displayNotes) {
    const row = 5 - note.string;
    for (let r = 0; r < 6; r++) {
      if (r === row) {
        tabRows[r].push(note.fret.toString());
      } else {
        tabRows[r].push('');
      }
    }
  }

  return (
    <div className={`bg-[#faf6ef] border border-[#c4b89c] p-4 overflow-x-auto rounded-sm ${className}`}>
      {/* Exercise title - sketch annotation style */}
      <div className="mb-3 flex items-center gap-2 border-b border-[#c4b89c] pb-2">
        <span className="text-[#6b5b47] text-sm font-semibold italic font-serif">{exercise.name}</span>
        <span className="text-[#b8a88a] text-xs font-serif italic">— {exercise.description}</span>
      </div>

      {/* Tab notation - monospace, pencil-on-paper style */}
      <div className="font-mono text-sm leading-relaxed">
        {stringNames.map((name, rowIdx) => (
          <div key={rowIdx} className="flex items-center whitespace-nowrap">
            <span className="text-[#8b7355] w-4 text-right mr-2 font-serif italic text-xs">{name}</span>
            <span className="text-[#8b7355] font-bold">|</span>
            {tabRows[rowIdx].map((cell, cellIdx) => (
              <span
                key={cellIdx}
                className={`inline-block text-center ${
                  cell
                    ? 'text-[#4a4a4a] font-bold'
                    : 'text-[#c4b89c]'
                }`}
                style={{ width: cellWidth, minWidth: cellWidth }}
              >
                {cell || '—'}
              </span>
            ))}
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
