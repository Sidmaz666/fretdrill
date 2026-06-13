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
      <div className={`flex items-center justify-center h-40 bg-slate-900 rounded-lg ${className}`}>
        <p className="text-slate-500 text-sm">Select an exercise to see tabs</p>
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
    const row = 5 - note.string; // Convert string index to tab row
    for (let r = 0; r < 6; r++) {
      if (r === row) {
        const fretStr = note.fret.toString();
        if (note.fret >= 10) {
          tabRows[r].push(fretStr);
        } else {
          tabRows[r].push(fretStr);
        }
      } else {
        tabRows[r].push('');
      }
    }
  }

  return (
    <div className={`bg-slate-900 rounded-lg p-4 overflow-x-auto ${className}`}>
      <div className="mb-2 flex items-center gap-2">
        <span className="text-amber-400 text-sm font-semibold">{exercise.name}</span>
        <span className="text-slate-500 text-xs">— {exercise.description}</span>
      </div>
      <div className="font-mono text-sm">
        {stringNames.map((name, rowIdx) => (
          <div key={rowIdx} className="flex items-center whitespace-nowrap">
            <span className="text-slate-400 w-4 text-right mr-2">{name}</span>
            <span className="text-slate-400">|</span>
            {tabRows[rowIdx].map((cell, cellIdx) => (
              <span
                key={cellIdx}
                className={`inline-block text-center ${
                  cell
                    ? 'text-emerald-400 font-bold'
                    : 'text-slate-600'
                }`}
                style={{ width: cellWidth, minWidth: cellWidth }}
              >
                {cell || '—'}
              </span>
            ))}
            <span className="text-slate-400">|</span>
          </div>
        ))}
      </div>
      {exercise.notes.length > maxNotes && (
        <p className="text-slate-500 text-xs mt-2">
          Showing first {maxNotes} of {exercise.notes.length} notes
        </p>
      )}
    </div>
  );
}
