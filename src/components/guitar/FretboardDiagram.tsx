'use client';

import React, { useMemo, useState, useCallback } from 'react';
import {
  FretboardNote,
  getScaleOnFretboard,
  FRET_MARKERS,
  DOUBLE_MARKERS,
  FRET_COUNT,
  NoteName,
} from '@/lib/music-theory';

interface FretboardDiagramProps {
  keyNote: NoteName;
  scaleId: string;
  startFret?: number;
  endFret?: number;
  showAllPositions?: boolean;
  positionIndex?: number;
  highlightNotes?: FretboardNote[];
  exercisePath?: { string: number; fret: number }[];
  activeNote?: { string: number; fret: number } | null;
  onNoteClick?: (note: FretboardNote) => void;
  width?: number;
  compact?: boolean;
  showPatternLines?: boolean;
  className?: string;
}

const STRING_SPACING = 30;
const FRET_SPACING = 38;
const LEFT_MARGIN = 40;
const TOP_MARGIN = 30;
const BOTTOM_MARGIN = 30;
const NOTE_RADIUS = 12;

// Color palette for intervals
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

export default function FretboardDiagram({
  keyNote,
  scaleId,
  startFret = 0,
  endFret = FRET_COUNT,
  showAllPositions = false,
  positionIndex = 0,
  highlightNotes,
  exercisePath,
  activeNote,
  onNoteClick,
  width = 560,
  compact = false,
  showPatternLines = true,
  className = '',
}: FretboardDiagramProps) {
  const [hoveredNote, setHoveredNote] = useState<{ string: number; fret: number } | null>(null);

  const notes = useMemo(() => {
    return getScaleOnFretboard(keyNote, scaleId, startFret, endFret);
  }, [keyNote, scaleId, startFret, endFret]);

  const fretRange = endFret - startFret;
  const stringLabels = ['E', 'A', 'D', 'G', 'B', 'e'];

  const ss = compact ? 22 : STRING_SPACING;
  const fs = compact ? 26 : FRET_SPACING;
  const lm = compact ? 30 : LEFT_MARGIN;
  const tm = compact ? 22 : TOP_MARGIN;
  const bm = compact ? 20 : BOTTOM_MARGIN;
  const nr = compact ? 8 : NOTE_RADIUS;

  const svgWidth = Math.max(width, lm + fretRange * fs + 20);
  const svgHeight = tm + 5 * ss + bm;

  // Highlight set for exercise notes
  const highlightSet = useMemo(() => {
    return new Set((highlightNotes || []).map(n => `${n.string}-${n.fret}`));
  }, [highlightNotes]);

  // Calculate note positions
  const notePositions = useMemo(() => {
    return notes.map(note => ({
      ...note,
      x: lm + (note.fret - startFret + 0.5) * fs,
      y: tm + (5 - note.string) * ss,
      isHighlighted: highlightSet.has(`${note.string}-${note.fret}`),
    }));
  }, [notes, startFret, highlightSet]);

  // Generate pattern lines: connect notes within each string that are adjacent
  // and also connect across strings at the same or adjacent frets
  const patternLines = useMemo(() => {
    if (!showPatternLines || compact) return [];
    const lines: Array<{ x1: number; y1: number; x2: number; y2: number; color: string; isRoot: boolean }> = [];
    
    // Sort notes: group by string, then by fret
    const byString: Map<number, typeof notePositions> = new Map();
    for (const note of notePositions) {
      if (!byString.has(note.string)) byString.set(note.string, []);
      byString.get(note.string)!.push(note);
    }
    
    // Connect adjacent notes on the same string
    for (const [, stringNotes] of byString) {
      const sorted = [...stringNotes].sort((a, b) => a.fret - b.fret);
      for (let i = 0; i < sorted.length - 1; i++) {
        const curr = sorted[i];
        const next = sorted[i + 1];
        if (next.fret - curr.fret <= 3) {
          lines.push({
            x1: curr.x, y1: curr.y,
            x2: next.x, y2: next.y,
            color: curr.isRoot || next.isRoot ? '#9b3939' : '#8b7355',
            isRoot: curr.isRoot || next.isRoot,
          });
        }
      }
    }
    
    // Connect notes across adjacent strings (same fret or ±1 fret)
    for (let s = 0; s < 5; s++) {
      const lower = byString.get(s) || [];
      const higher = byString.get(s + 1) || [];
      for (const ln of lower) {
        for (const hn of higher) {
          if (Math.abs(ln.fret - hn.fret) <= 2 && ln.fret !== hn.fret) {
            // Only connect if they're the closest pair
            lines.push({
              x1: ln.x, y1: ln.y,
              x2: hn.x, y2: hn.y,
              color: ln.isRoot || hn.isRoot ? '#9b3939' : '#8b7355',
              isRoot: ln.isRoot || hn.isRoot,
            });
          }
        }
      }
    }
    
    return lines;
  }, [notePositions, showPatternLines, compact]);

  // Generate exercise path lines (ordered sequence)
  const exercisePathLines = useMemo(() => {
    if (!exercisePath || exercisePath.length < 2) return [];
    const lines: Array<{ x1: number; y1: number; x2: number; y2: number; idx: number }> = [];
    
    for (let i = 0; i < exercisePath.length - 1; i++) {
      const curr = exercisePath[i];
      const next = exercisePath[i + 1];
      const cx = lm + (curr.fret - startFret + 0.5) * fs;
      const cy = tm + (5 - curr.string) * ss;
      const nx = lm + (next.fret - startFret + 0.5) * fs;
      const ny = tm + (5 - next.string) * ss;
      lines.push({ x1: cx, y1: cy, x2: nx, y2: ny, idx: i });
    }
    
    return lines;
  }, [exercisePath, startFret, lm, fs, tm, ss]);

  // Exercise path note positions for numbering
  const exerciseNotePositions = useMemo(() => {
    if (!exercisePath) return [];
    return exercisePath.map((en, idx) => ({
      ...en,
      x: lm + (en.fret - startFret + 0.5) * fs,
      y: tm + (5 - en.string) * ss,
      idx,
    }));
  }, [exercisePath, startFret, lm, fs, tm, ss]);

  // Fret marker positions
  const fretMarkerPositions = useMemo(() => {
    return FRET_MARKERS
      .filter(f => f >= startFret && f <= endFret)
      .map(fret => ({
        fret,
        x: lm + (fret - startFret + 0.5) * fs,
        isDouble: DOUBLE_MARKERS.includes(fret),
      }));
  }, [startFret, endFret]);

  const isNoteActive = useCallback((note: { string: number; fret: number }) => {
    if (activeNote && activeNote.string === note.string && activeNote.fret === note.fret) return true;
    if (hoveredNote && hoveredNote.string === note.string && hoveredNote.fret === note.fret) return true;
    return false;
  }, [activeNote, hoveredNote]);

  const fontSize = compact ? 7 : 10;
  const smallFontSize = compact ? 5 : 7;

  return (
    <div className={`fretboard-container ${className}`}>
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-auto"
        style={{ maxWidth: svgWidth }}
      >
        {/* Paper background */}
        <rect x={0} y={0} width={svgWidth} height={svgHeight} fill="#faf6ef" rx={2} />

        {/* Fret markers (dots) */}
        {fretMarkerPositions.map(marker => (
          marker.isDouble ? (
            <React.Fragment key={`marker-${marker.fret}`}>
              <circle cx={marker.x - 7} cy={tm + 1.5 * ss} r={compact ? 2 : 3.5} fill="#c4b89c" opacity={0.5} />
              <circle cx={marker.x + 7} cy={tm + 3.5 * ss} r={compact ? 2 : 3.5} fill="#c4b89c" opacity={0.5} />
            </React.Fragment>
          ) : (
            <circle key={`marker-${marker.fret}`} cx={marker.x} cy={tm + 2.5 * ss} r={compact ? 2 : 3.5} fill="#c4b89c" opacity={0.5} />
          )
        ))}

        {/* Fret lines (vertical) */}
        {Array.from({ length: fretRange + 1 }, (_, i) => {
          const fretNum = startFret + i;
          const x = lm + i * fs;
          const isNut = fretNum === 0;
          return (
            <line
              key={`fret-${fretNum}`}
              x1={x} y1={tm - 10}
              x2={x} y2={tm + 5 * ss + 10}
              stroke={isNut ? '#5a4a3a' : '#c4b89c'}
              strokeWidth={isNut ? 5 : 1.5}
              strokeLinecap="round"
            />
          );
        })}

        {/* Fret numbers */}
        {Array.from({ length: fretRange + 1 }, (_, i) => {
          const fretNum = startFret + i;
          if (fretNum === 0) return null;
          const x = lm + (i + 0.5) * fs;
          if (compact && fretNum % 2 !== 0 && fretNum !== startFret + 1) return null;
          return (
            <text
              key={`fretnum-${fretNum}`}
              x={x} y={svgHeight - 5}
              textAnchor="middle"
              fill="#8b7355"
              fontSize={compact ? 8 : 11}
              fontFamily="'Georgia', serif"
              fontStyle="italic"
            >
              {fretNum}
            </text>
          );
        })}

        {/* String lines (horizontal) */}
        {stringLabels.map((_, stringIdx) => {
          const y = tm + stringIdx * ss;
          const thickness = stringIdx <= 1 ? 2.8 : stringIdx <= 3 ? 2 : 1.3;
          return (
            <line
              key={`string-${stringIdx}`}
              x1={lm - 8} y1={y}
              x2={lm + fretRange * fs + 8} y2={y}
              stroke="#6b5b47"
              strokeWidth={thickness}
              strokeLinecap="round"
              opacity={0.75}
            />
          );
        })}

        {/* String labels */}
        {stringLabels.map((label, idx) => {
          const y = tm + idx * ss;
          return (
            <text
              key={`label-${idx}`}
              x={lm - 18} y={y + 4}
              textAnchor="middle"
              fill="#6b5b47"
              fontSize={compact ? 9 : 13}
              fontWeight="bold"
              fontFamily="'Georgia', serif"
              fontStyle="italic"
            >
              {label}
            </text>
          );
        })}

        {/* Pattern lines (connecting scale notes to show the shape) */}
        {patternLines.map((line, i) => (
          <line
            key={`pattern-${i}`}
            x1={line.x1} y1={line.y1}
            x2={line.x2} y2={line.y2}
            stroke={line.color}
            strokeWidth={1.2}
            strokeLinecap="round"
            opacity={line.isRoot ? 0.25 : 0.15}
          />
        ))}

        {/* Exercise path lines (ordered sequence with direction) */}
        {exercisePathLines.map((line, i) => (
          <line
            key={`expath-${i}`}
            x1={line.x1} y1={line.y1}
            x2={line.x2} y2={line.y2}
            stroke="#9b3939"
            strokeWidth={2}
            strokeLinecap="round"
            opacity={0.5}
            strokeDasharray="6 3"
          />
        ))}

        {/* Note markers */}
        {notePositions.map((note, i) => {
          const color = getIntervalColor(note.intervalLabel);
          const isActive = isNoteActive(note);
          const isHighlight = note.isHighlighted && highlightNotes;
          const isExercisePath = exercisePath && exercisePath.some(en => en.string === note.string && en.fret === note.fret);
          const r = isActive ? nr + 3 : nr;

          return (
            <g
              key={`note-${i}`}
              style={{ cursor: onNoteClick ? 'pointer' : 'default' }}
              onClick={() => onNoteClick?.(note)}
              onMouseEnter={() => setHoveredNote({ string: note.string, fret: note.fret })}
              onMouseLeave={() => setHoveredNote(null)}
            >
              {/* Active/hover glow */}
              {isActive && (
                <circle cx={note.x} cy={note.y} r={r + 6} fill={color} opacity={0.12} />
              )}

              {/* Exercise highlight ring */}
              {(isHighlight || isExercisePath) && !isActive && (
                <circle
                  cx={note.x} cy={note.y} r={r + 4}
                  fill="none"
                  stroke={color}
                  strokeWidth={2}
                  strokeDasharray="4 2"
                  opacity={0.8}
                />
              )}

              {/* Root note double ring */}
              {note.isRoot && !compact && (
                <circle
                  cx={note.x} cy={note.y} r={r + 5}
                  fill="none"
                  stroke={color}
                  strokeWidth={1.5}
                  opacity={0.35}
                />
              )}

              {/* Note circle */}
              <circle
                cx={note.x} cy={note.y} r={r}
                fill={isActive ? color + '55' : (isHighlight || isExercisePath ? color + '45' : (note.isRoot ? color + '30' : color + '18'))}
                stroke={isActive ? color : (isHighlight || isExercisePath ? color : color + '90')}
                strokeWidth={isActive ? 2.5 : (note.isRoot ? 2 : 1.2)}
              />

              {/* Crosshatch for root */}
              {note.isRoot && !compact && (
                <g opacity={0.12} clipPath={`circle(${r}px at ${note.x}px ${note.y}px)`}>
                  <line x1={note.x - r} y1={note.y - r} x2={note.x + r} y2={note.y + r} stroke={color} strokeWidth={0.8} />
                  <line x1={note.x - r + 4} y1={note.y - r} x2={note.x + r} y2={note.y + r - 4} stroke={color} strokeWidth={0.8} />
                  <line x1={note.x - r} y1={note.y - r + 4} x2={note.x + r - 4} y2={note.y + r} stroke={color} strokeWidth={0.8} />
                  <line x1={note.x + r} y1={note.y - r} x2={note.x - r} y2={note.y + r} stroke={color} strokeWidth={0.8} />
                  <line x1={note.x + r - 4} y1={note.y - r} x2={note.x - r} y2={note.y + r - 4} stroke={color} strokeWidth={0.8} />
                  <line x1={note.x + r} y1={note.y - r + 4} x2={note.x - r + 4} y2={note.y + r} stroke={color} strokeWidth={0.8} />
                </g>
              )}

              {/* Interval label */}
              <text
                x={note.x} y={note.y + (compact ? 3 : 4.5)}
                textAnchor="middle"
                fill={isActive ? '#1a1a1a' : '#3a3a3a'}
                fontSize={note.intervalLabel.length > 2 ? smallFontSize : fontSize}
                fontWeight="bold"
                fontFamily="'Georgia', serif"
                fontStyle="italic"
              >
                {note.intervalLabel}
              </text>

              {/* Note name on hover/active */}
              {(isActive || isHighlight) && !compact && (
                <text
                  x={note.x} y={note.y - r - 5}
                  textAnchor="middle"
                  fill={color}
                  fontSize={9}
                  fontFamily="'Georgia', serif"
                  fontStyle="italic"
                  fontWeight="bold"
                  opacity={0.85}
                >
                  {note.note}
                </text>
              )}
            </g>
          );
        })}

        {/* Exercise path sequence numbers */}
        {exerciseNotePositions.map((en, i) => {
          // Only show number for every Nth note to avoid clutter
          const showEvery = exerciseNotePositions.length > 16 ? 3 : exerciseNotePositions.length > 10 ? 2 : 1;
          if (i % showEvery !== 0 && i !== exerciseNotePositions.length - 1) return null;
          
          return (
            <g key={`exnum-${i}`}>
              <circle
                cx={en.x + nr + 2} cy={en.y - nr - 2}
                r={6}
                fill="#9b3939"
                opacity={0.75}
              />
              <text
                x={en.x + nr + 2} y={en.y - nr + 1}
                textAnchor="middle"
                fill="#faf6ef"
                fontSize={7}
                fontWeight="bold"
                fontFamily="'Georgia', serif"
              >
                {i + 1}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
