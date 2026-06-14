'use client';

import React, { useMemo } from 'react';
import {
  FretboardNote,
  getScaleOnFretboard,
  FRET_MARKERS,
  DOUBLE_MARKERS,
  NoteName,
} from '@/lib/music-theory';

interface PatternDiagramProps {
  keyNote: NoteName;
  scaleId: string;
  fretStart: number;
  fretEnd: number;
  positionNumber: number;
  /** Optional exercise notes to highlight with sequence numbers */
  exerciseNotes?: Array<{ string: number; fret: number; sequenceNumber?: number }>;
  /** Click handler for notes */
  onNoteClick?: (note: { string: number; fret: number }) => void;
  /** Whether this pattern is currently selected */
  selected?: boolean;
  /** Custom label to display instead of position number */
  customLabel?: string;
}

// Fixed layout constants — all cards have the SAME dimensions
const FIXED_FRET_RANGE = 6; // Normalize to 6-fret width for all positions
const SS = 22; // string spacing
const FS = 28; // fret spacing (slightly smaller to fit 6 frets comfortably)
const LM = 28; // left margin
const TM = 20; // top margin
const BM = 18; // bottom margin
const NR = 8;  // note radius

// Fixed SVG dimensions so all cards are identical size
const SVG_WIDTH = LM + FIXED_FRET_RANGE * FS + 16;
const SVG_HEIGHT = TM + 5 * SS + BM;

// Interval color palette
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

export default function PatternDiagram({
  keyNote,
  scaleId,
  fretStart,
  fretEnd,
  positionNumber,
  exerciseNotes,
  onNoteClick,
  selected = false,
  customLabel,
}: PatternDiagramProps) {
  const fretRange = fretEnd - fretStart;
  const stringLabels = ['E', 'A', 'D', 'G', 'B', 'e'];

  // Dynamic fret spacing to fit within the fixed SVG width
  const effectiveFS = Math.min(FS, (SVG_WIDTH - LM - 16) / Math.max(fretRange, 1));

  const notes = useMemo(() => {
    return getScaleOnFretboard(keyNote, scaleId, fretStart, fretEnd);
  }, [keyNote, scaleId, fretStart, fretEnd]);

  // Exercise note set for highlighting
  const exerciseSet = useMemo(() => {
    if (!exerciseNotes) return new Set<string>();
    return new Set(exerciseNotes.map(n => `${n.string}-${n.fret}`));
  }, [exerciseNotes]);

  // Exercise note sequence numbers
  const exerciseSeqMap = useMemo(() => {
    if (!exerciseNotes) return new Map<string, number>();
    const map = new Map<string, number>();
    for (const en of exerciseNotes) {
      const key = `${en.string}-${en.fret}`;
      if (!map.has(key) && en.sequenceNumber) {
        map.set(key, en.sequenceNumber);
      }
    }
    return map;
  }, [exerciseNotes]);

  // Calculate note positions using dynamic fret spacing
  const notePositions = useMemo(() => {
    return notes.map(note => {
      const key = `${note.string}-${note.fret}`;
      return {
        ...note,
        x: LM + (note.fret - fretStart + 0.5) * effectiveFS,
        y: TM + (5 - note.string) * SS,
        isExNote: exerciseSet.has(key),
        seqNum: exerciseSeqMap.get(key),
      };
    });
  }, [notes, fretStart, exerciseSet, exerciseSeqMap, effectiveFS]);

  // Pattern shape lines - connect adjacent notes on same string and across strings
  const shapeLines = useMemo(() => {
    const lines: Array<{ x1: number; y1: number; x2: number; y2: number; color: string; isRoot: boolean }> = [];
    
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
    
    // Connect across adjacent strings
    for (let s = 0; s < 5; s++) {
      const lower = byString.get(s) || [];
      const higher = byString.get(s + 1) || [];
      for (const ln of lower) {
        for (const hn of higher) {
          if (Math.abs(ln.fret - hn.fret) <= 2) {
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
  }, [notePositions]);

  // Exercise path lines
  const exercisePathLines = useMemo(() => {
    if (!exerciseNotes || exerciseNotes.length < 2) return [];
    const lines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
    
    for (let i = 0; i < exerciseNotes.length - 1; i++) {
      const curr = exerciseNotes[i];
      const next = exerciseNotes[i + 1];
      const cx = LM + (curr.fret - fretStart + 0.5) * effectiveFS;
      const cy = TM + (5 - curr.string) * SS;
      const nx = LM + (next.fret - fretStart + 0.5) * effectiveFS;
      const ny = TM + (5 - next.string) * SS;
      lines.push({ x1: cx, y1: cy, x2: nx, y2: ny });
    }
    
    return lines;
  }, [exerciseNotes, fretStart, effectiveFS]);

  // Fret markers
  const fretMarkerPositions = useMemo(() => {
    return FRET_MARKERS
      .filter(f => f >= fretStart && f <= fretEnd)
      .map(fret => ({
        fret,
        x: LM + (fret - fretStart + 0.5) * effectiveFS,
        isDouble: DOUBLE_MARKERS.includes(fret),
      }));
  }, [fretStart, fretEnd, effectiveFS]);

  return (
    <div
      className={`relative border-2 rounded-sm transition-all cursor-pointer ${
        selected
          ? 'border-[#8b7355] bg-[rgba(139,115,85,0.08)]'
          : 'border-[#c4b89c] bg-[#faf6ef] hover:border-[#8b7355]'
      }`}
      onClick={() => onNoteClick?.({ string: -1, fret: -1 })}
    >
      {/* Position label */}
      <div className="text-center pt-1.5 pb-0.5">
        <span className="text-[11px] font-bold text-[#4a4a4a] font-serif italic">
          {customLabel || `P${positionNumber}`}
        </span>
        <span className="text-[11px] text-[#8b7355] font-serif italic ml-1">
          ({fretStart}–{fretEnd})
        </span>
      </div>

      <svg
        width={SVG_WIDTH}
        height={SVG_HEIGHT}
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="w-full h-auto"
      >
        {/* Background */}
        <rect x={0} y={0} width={SVG_WIDTH} height={SVG_HEIGHT} fill="#faf6ef" />

        {/* Fret markers */}
        {fretMarkerPositions.map(marker => (
          marker.isDouble ? (
            <React.Fragment key={`m-${marker.fret}`}>
              <circle cx={marker.x - 5} cy={TM + 1.5 * SS} r={2} fill="#c4b89c" opacity={0.5} />
              <circle cx={marker.x + 5} cy={TM + 3.5 * SS} r={2} fill="#c4b89c" opacity={0.5} />
            </React.Fragment>
          ) : (
            <circle key={`m-${marker.fret}`} cx={marker.x} cy={TM + 2.5 * SS} r={2} fill="#c4b89c" opacity={0.5} />
          )
        ))}

        {/* Fret lines */}
        {Array.from({ length: fretRange + 1 }, (_, i) => {
          const fretNum = fretStart + i;
          const x = LM + i * effectiveFS;
          const isNut = fretNum === 0;
          return (
            <line
              key={`f-${fretNum}`}
              x1={x} y1={TM - 6}
              x2={x} y2={TM + 5 * SS + 6}
              stroke={isNut ? '#5a4a3a' : '#c4b89c'}
              strokeWidth={isNut ? 4 : 1.2}
              strokeLinecap="round"
            />
          );
        })}

        {/* Fret numbers */}
        {Array.from({ length: fretRange + 1 }, (_, i) => {
          const fretNum = fretStart + i;
          if (fretNum === 0) return null;
          const x = LM + (i + 0.5) * effectiveFS;
          if (fretNum % 2 !== 0 && fretNum !== fretStart + 1 && fretNum !== 12) return null;
          return (
            <text
              key={`fn-${fretNum}`}
              x={x} y={SVG_HEIGHT - 2}
              textAnchor="middle"
              fill="#8b7355"
              fontSize={10}
              fontFamily="'Georgia', serif"
              fontStyle="italic"
            >
              {fretNum}
            </text>
          );
        })}

        {/* String lines */}
        {stringLabels.map((_, stringIdx) => {
          const y = TM + stringIdx * SS;
          const thickness = stringIdx <= 1 ? 2 : stringIdx <= 3 ? 1.5 : 1;
          return (
            <line
              key={`s-${stringIdx}`}
              x1={LM - 6} y1={y}
              x2={LM + fretRange * effectiveFS + 6} y2={y}
              stroke="#6b5b47"
              strokeWidth={thickness}
              strokeLinecap="round"
              opacity={0.65}
            />
          );
        })}

        {/* String labels */}
        {stringLabels.map((label, idx) => (
          <text
            key={`sl-${idx}`}
            x={LM - 14} y={TM + idx * SS + 3}
            textAnchor="middle"
            fill="#6b5b47"
            fontSize={11}
            fontWeight="bold"
            fontFamily="'Georgia', serif"
            fontStyle="italic"
          >
            {label}
          </text>
        ))}

        {/* Shape lines */}
        {shapeLines.map((line, i) => (
          <line
            key={`sh-${i}`}
            x1={line.x1} y1={line.y1}
            x2={line.x2} y2={line.y2}
            stroke={line.color}
            strokeWidth={1.2}
            strokeLinecap="round"
            opacity={line.isRoot ? 0.3 : 0.2}
          />
        ))}

        {/* Exercise path lines */}
        {exercisePathLines.map((line, i) => (
          <line
            key={`ep-${i}`}
            x1={line.x1} y1={line.y1}
            x2={line.x2} y2={line.y2}
            stroke="#9b3939"
            strokeWidth={2}
            strokeLinecap="round"
            opacity={0.5}
          />
        ))}

        {/* Notes */}
        {notePositions.map((note, i) => {
          const color = getIntervalColor(note.intervalLabel);
          const isExNote = note.isExNote;
          const r = isExNote ? NR + 1 : NR;

          return (
            <g key={`n-${i}`}>
              {/* Exercise highlight ring */}
              {isExNote && (
                <circle
                  cx={note.x} cy={note.y} r={r + 4}
                  fill="none"
                  stroke={color}
                  strokeWidth={2}
                  strokeDasharray="3 1.5"
                  opacity={0.8}
                />
              )}

              {/* Root double ring */}
              {note.isRoot && (
                <circle
                  cx={note.x} cy={note.y} r={r + 4}
                  fill="none"
                  stroke={color}
                  strokeWidth={1}
                  opacity={0.35}
                />
              )}

              {/* Note circle */}
              <circle
                cx={note.x} cy={note.y} r={r}
                fill={isExNote ? color + '40' : (note.isRoot ? color + '28' : color + '15')}
                stroke={isExNote ? color : color + '80'}
                strokeWidth={isExNote ? 1.8 : (note.isRoot ? 1.5 : 1)}
              />

              {/* Interval label */}
              <text
                x={note.x} y={note.y + 3}
                textAnchor="middle"
                fill={isExNote ? '#2a2a2a' : '#3a3a3a'}
                fontSize={note.intervalLabel.length > 2 ? 8 : 9}
                fontWeight="bold"
                fontFamily="'Georgia', serif"
                fontStyle="italic"
              >
                {note.intervalLabel}
              </text>

              {/* Sequence number for exercise notes */}
              {isExNote && note.seqNum && (
                <g>
                  <circle
                    cx={note.x + r + 2} cy={note.y - r - 2}
                    r={5}
                    fill="#9b3939"
                    opacity={0.8}
                  />
                  <text
                    x={note.x + r + 2} y={note.y - r + 0.5}
                    textAnchor="middle"
                    fill="#faf6ef"
                    fontSize={8}
                    fontWeight="bold"
                    fontFamily="'Georgia', serif"
                  >
                    {note.seqNum}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
