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
  exercisePath?: { string: number; fret: number; sequenceNumber?: number }[];
  activeNote?: { string: number; fret: number } | null;
  onNoteClick?: (note: FretboardNote) => void;
  width?: number;
  compact?: boolean;
  showPatternLines?: boolean;
  className?: string;
  /** Always show full fretboard regardless of position */
  fullFretboard?: boolean;
}

// Layout constants for full fretboard view
const FULL_STRING_SPACING = 26;
const FULL_FRET_SPACING = 42;
const FULL_LEFT_MARGIN = 36;
const FULL_TOP_MARGIN = 28;
const FULL_BOTTOM_MARGIN = 24;
const FULL_NOTE_RADIUS = 10;

// Compact view constants
const COMPACT_STRING_SPACING = 20;
const COMPACT_FRET_SPACING = 28;
const COMPACT_LEFT_MARGIN = 28;
const COMPACT_TOP_MARGIN = 20;
const COMPACT_BOTTOM_MARGIN = 18;
const COMPACT_NOTE_RADIUS = 7;

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
  width,
  compact = false,
  showPatternLines = true,
  className = '',
  fullFretboard = false,
}: FretboardDiagramProps) {
  const [hoveredNote, setHoveredNote] = useState<{ string: number; fret: number } | null>(null);

  // Always show full fretboard in the main view
  const effectiveStartFret = fullFretboard ? 0 : startFret;
  const effectiveEndFret = fullFretboard ? FRET_COUNT : endFret;

  const notes = useMemo(() => {
    return getScaleOnFretboard(keyNote, scaleId, effectiveStartFret, effectiveEndFret);
  }, [keyNote, scaleId, effectiveStartFret, effectiveEndFret]);

  const fretRange = effectiveEndFret - effectiveStartFret;
  const stringLabels = ['E', 'A', 'D', 'G', 'B', 'e'];

  // Layout sizing
  const ss = compact ? COMPACT_STRING_SPACING : FULL_STRING_SPACING;
  const fs = compact ? COMPACT_FRET_SPACING : FULL_FRET_SPACING;
  const lm = compact ? COMPACT_LEFT_MARGIN : FULL_LEFT_MARGIN;
  const tm = compact ? COMPACT_TOP_MARGIN : FULL_TOP_MARGIN;
  const bm = compact ? COMPACT_BOTTOM_MARGIN : FULL_BOTTOM_MARGIN;
  const nr = compact ? COMPACT_NOTE_RADIUS : FULL_NOTE_RADIUS;

  const svgWidth = Math.max(width || 0, lm + fretRange * fs + 20);
  const svgHeight = tm + 5 * ss + bm;

  // Highlight set for exercise notes
  const highlightSet = useMemo(() => {
    return new Set((highlightNotes || []).map(n => `${n.string}-${n.fret}`));
  }, [highlightNotes]);

  // Position range for visual highlighting
  const positionHighlight = useMemo(() => {
    if (fullFretboard && !showAllPositions && startFret !== undefined && endFret !== undefined) {
      return { start: startFret, end: endFret };
    }
    return null;
  }, [fullFretboard, showAllPositions, startFret, endFret]);

  // Calculate note positions
  const notePositions = useMemo(() => {
    return notes.map(note => ({
      ...note,
      x: lm + (note.fret - effectiveStartFret + 0.5) * fs,
      y: tm + (5 - note.string) * ss,
      isHighlighted: highlightSet.has(`${note.string}-${note.fret}`),
      isInPosition: positionHighlight 
        ? (note.fret >= positionHighlight.start && note.fret <= positionHighlight.end)
        : true,
    }));
  }, [notes, effectiveStartFret, highlightSet, positionHighlight, lm, fs, ss, tm]);

  // Generate pattern lines connecting scale notes into CAGED shapes
  const patternLines = useMemo(() => {
    if (!showPatternLines || compact) return [];
    const lines: Array<{ x1: number; y1: number; x2: number; y2: number; color: string; isRoot: boolean; inPosition: boolean }> = [];
    
    // Group notes by string
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
          const bothInPos = curr.isInPosition && next.isInPosition;
          lines.push({
            x1: curr.x, y1: curr.y,
            x2: next.x, y2: next.y,
            color: curr.isRoot || next.isRoot ? '#9b3939' : '#8b7355',
            isRoot: curr.isRoot || next.isRoot,
            inPosition: bothInPos,
          });
        }
      }
    }
    
    // Connect notes across adjacent strings (same fret or ±1 fret) to form the shape
    for (let s = 0; s < 5; s++) {
      const lower = byString.get(s) || [];
      const higher = byString.get(s + 1) || [];
      for (const ln of lower) {
        for (const hn of higher) {
          if (Math.abs(ln.fret - hn.fret) <= 2) {
            const bothInPos = ln.isInPosition && hn.isInPosition;
            lines.push({
              x1: ln.x, y1: ln.y,
              x2: hn.x, y2: hn.y,
              color: ln.isRoot || hn.isRoot ? '#9b3939' : '#8b7355',
              isRoot: ln.isRoot || hn.isRoot,
              inPosition: bothInPos,
            });
          }
        }
      }
    }
    
    return lines;
  }, [notePositions, showPatternLines, compact]);

  // Generate exercise path lines (ordered sequence with arrows)
  const exercisePathLines = useMemo(() => {
    if (!exercisePath || exercisePath.length < 2) return [];
    const lines: Array<{ x1: number; y1: number; x2: number; y2: number; idx: number }> = [];
    
    for (let i = 0; i < exercisePath.length - 1; i++) {
      const curr = exercisePath[i];
      const next = exercisePath[i + 1];
      const cx = lm + (curr.fret - effectiveStartFret + 0.5) * fs;
      const cy = tm + (5 - curr.string) * ss;
      const nx = lm + (next.fret - effectiveStartFret + 0.5) * fs;
      const ny = tm + (5 - next.string) * ss;
      lines.push({ x1: cx, y1: cy, x2: nx, y2: ny, idx: i });
    }
    
    return lines;
  }, [exercisePath, effectiveStartFret, lm, fs, tm, ss]);

  // Exercise path note positions for numbering
  const exerciseNotePositions = useMemo(() => {
    if (!exercisePath) return [];
    // Deduplicate while preserving order
    const seen = new Set<string>();
    const result: Array<{ string: number; fret: number; x: number; y: number; idx: number; sequenceNumber?: number }> = [];
    
    for (let i = 0; i < exercisePath.length; i++) {
      const en = exercisePath[i];
      const key = `${en.string}-${en.fret}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push({
          string: en.string,
          fret: en.fret,
          x: lm + (en.fret - effectiveStartFret + 0.5) * fs,
          y: tm + (5 - en.string) * ss,
          idx: result.length,
          sequenceNumber: en.sequenceNumber,
        });
      }
    }
    return result;
  }, [exercisePath, effectiveStartFret, lm, fs, tm, ss]);

  // Fret marker positions
  const fretMarkerPositions = useMemo(() => {
    return FRET_MARKERS
      .filter(f => f >= effectiveStartFret && f <= effectiveEndFret)
      .map(fret => ({
        fret,
        x: lm + (fret - effectiveStartFret + 0.5) * fs,
        isDouble: DOUBLE_MARKERS.includes(fret),
      }));
  }, [effectiveStartFret, effectiveEndFret, lm, fs]);

  // Position range highlight rectangle
  const positionRect = useMemo(() => {
    if (!positionHighlight || showAllPositions) return null;
    const x1 = lm + (positionHighlight.start - effectiveStartFret) * fs;
    const x2 = lm + (positionHighlight.end - effectiveStartFret + 1) * fs;
    return {
      x: x1,
      width: x2 - x1,
      y: tm - 12,
      height: 5 * ss + 24,
    };
  }, [positionHighlight, showAllPositions, effectiveStartFret, lm, fs, tm, ss]);

  const isNoteActive = useCallback((note: { string: number; fret: number }) => {
    if (activeNote && activeNote.string === note.string && activeNote.fret === note.fret) return true;
    if (hoveredNote && hoveredNote.string === note.string && hoveredNote.fret === note.fret) return true;
    return false;
  }, [activeNote, hoveredNote]);

  const fontSize = compact ? 7 : 9;
  const smallFontSize = compact ? 5 : 7;

  return (
    <div className={`fretboard-container ${className}`}>
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-auto"
        style={{ maxWidth: svgWidth, minWidth: compact ? undefined : svgWidth }}
      >
        {/* Paper background */}
        <rect x={0} y={0} width={svgWidth} height={svgHeight} fill="#faf6ef" rx={2} />

        {/* Position highlight background */}
        {positionRect && (
          <rect
            x={positionRect.x}
            y={positionRect.y}
            width={positionRect.width}
            height={positionRect.height}
            fill="rgba(139, 115, 85, 0.06)"
            stroke="rgba(139, 115, 85, 0.2)"
            strokeWidth={1}
            strokeDasharray="4 2"
            rx={3}
          />
        )}

        {/* Fret markers (dots) */}
        {fretMarkerPositions.map(marker => (
          marker.isDouble ? (
            <React.Fragment key={`marker-${marker.fret}`}>
              <circle cx={marker.x - 7} cy={tm + 1.5 * ss} r={compact ? 2 : 3} fill="#c4b89c" opacity={0.5} />
              <circle cx={marker.x + 7} cy={tm + 3.5 * ss} r={compact ? 2 : 3} fill="#c4b89c" opacity={0.5} />
            </React.Fragment>
          ) : (
            <circle key={`marker-${marker.fret}`} cx={marker.x} cy={tm + 2.5 * ss} r={compact ? 2 : 3} fill="#c4b89c" opacity={0.5} />
          )
        ))}

        {/* Fret lines (vertical) */}
        {Array.from({ length: fretRange + 1 }, (_, i) => {
          const fretNum = effectiveStartFret + i;
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
          const fretNum = effectiveStartFret + i;
          if (fretNum === 0) return null;
          const x = lm + (i + 0.5) * fs;
          // Show every fret number for full fretboard, every other for compact
          if (compact && fretNum % 2 !== 0 && fretNum !== effectiveStartFret + 1) return null;
          // For full fretboard, show all numbers but at even spacing
          if (fullFretboard && !compact && fretRange > 10) {
            if (fretNum % 2 !== 0 && fretNum !== 1 && fretNum !== 12) return null;
          }
          return (
            <text
              key={`fretnum-${fretNum}`}
              x={x} y={svgHeight - 4}
              textAnchor="middle"
              fill="#8b7355"
              fontSize={compact ? 8 : 10}
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
          const thickness = stringIdx <= 1 ? 2.5 : stringIdx <= 3 ? 1.8 : 1.2;
          return (
            <line
              key={`string-${stringIdx}`}
              x1={lm - 8} y1={y}
              x2={lm + fretRange * fs + 8} y2={y}
              stroke="#6b5b47"
              strokeWidth={thickness}
              strokeLinecap="round"
              opacity={0.7}
            />
          );
        })}

        {/* String labels */}
        {stringLabels.map((label, idx) => {
          const y = tm + idx * ss;
          return (
            <text
              key={`label-${idx}`}
              x={lm - 16} y={y + 4}
              textAnchor="middle"
              fill="#6b5b47"
              fontSize={compact ? 9 : 12}
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
            strokeWidth={line.inPosition ? 1.5 : 0.8}
            strokeLinecap="round"
            opacity={line.inPosition ? (line.isRoot ? 0.3 : 0.2) : 0.08}
          />
        ))}

        {/* Exercise path lines (ordered sequence with direction arrows) */}
        {exercisePathLines.map((line, i) => (
          <g key={`expath-${i}`}>
            <line
              x1={line.x1} y1={line.y1}
              x2={line.x2} y2={line.y2}
              stroke="#9b3939"
              strokeWidth={2.5}
              strokeLinecap="round"
              opacity={0.6}
            />
            {/* Arrow head */}
            {(() => {
              const dx = line.x2 - line.x1;
              const dy = line.y2 - line.y1;
              const len = Math.sqrt(dx * dx + dy * dy);
              if (len < 5) return null;
              const nx = dx / len;
              const ny = dy / len;
              const arrowSize = 5;
              // Place arrow at 70% along the line
              const ax = line.x1 + dx * 0.7;
              const ay = line.y1 + dy * 0.7;
              return (
                <polygon
                  points={`${ax + nx * arrowSize},${ay + ny * arrowSize} ${ax - ny * arrowSize * 0.5 - nx * arrowSize * 0.3},${ay + nx * arrowSize * 0.5 - ny * arrowSize * 0.3} ${ax + ny * arrowSize * 0.5 - nx * arrowSize * 0.3},${ay - nx * arrowSize * 0.5 - ny * arrowSize * 0.3}`}
                  fill="#9b3939"
                  opacity={0.6}
                />
              );
            })()}
          </g>
        ))}

        {/* Note markers */}
        {notePositions.map((note, i) => {
          const color = getIntervalColor(note.intervalLabel);
          const isActive = isNoteActive(note);
          const isHighlight = note.isHighlighted && highlightNotes;
          const isExercisePath = exercisePath && exercisePath.some(en => en.string === note.string && en.fret === note.fret);
          const isInPos = note.isInPosition;
          
          // Determine note appearance
          const isExNote = isHighlight || isExercisePath;
          const dimmed = fullFretboard && !isInPos && !isExNote;
          
          const r = isActive ? nr + 3 : (isExNote ? nr + 1 : nr);
          const baseOpacity = dimmed ? 0.35 : 1;

          return (
            <g
              key={`note-${i}`}
              style={{ cursor: onNoteClick ? 'pointer' : 'default' }}
              onClick={() => onNoteClick?.(note)}
              onMouseEnter={() => setHoveredNote({ string: note.string, fret: note.fret })}
              onMouseLeave={() => setHoveredNote(null)}
              opacity={baseOpacity}
            >
              {/* Active/hover glow */}
              {isActive && (
                <circle cx={note.x} cy={note.y} r={r + 8} fill={color} opacity={0.15} />
              )}

              {/* Exercise highlight ring */}
              {isExNote && !isActive && (
                <circle
                  cx={note.x} cy={note.y} r={r + 5}
                  fill="none"
                  stroke={color}
                  strokeWidth={2.5}
                  strokeDasharray="5 2"
                  opacity={0.9}
                />
              )}

              {/* Root note double ring */}
              {note.isRoot && !compact && (
                <circle
                  cx={note.x} cy={note.y} r={r + 6}
                  fill="none"
                  stroke={color}
                  strokeWidth={1.5}
                  opacity={0.4}
                />
              )}

              {/* Note circle */}
              <circle
                cx={note.x} cy={note.y} r={r}
                fill={isActive ? color + '55' : (isExNote ? color + '45' : (note.isRoot ? color + '30' : color + '15'))}
                stroke={isActive ? color : (isExNote ? color : color + '90')}
                strokeWidth={isActive ? 2.5 : (isExNote ? 2 : (note.isRoot ? 2 : 1))}
              />

              {/* Crosshatch for root */}
              {note.isRoot && !compact && (
                <g opacity={0.15}>
                  <line x1={note.x - r + 2} y1={note.y - r + 2} x2={note.x + r - 2} y2={note.y + r - 2} stroke={color} strokeWidth={0.7} />
                  <line x1={note.x - r + 5} y1={note.y - r + 2} x2={note.x + r - 2} y2={note.y + r - 5} stroke={color} strokeWidth={0.7} />
                  <line x1={note.x - r + 2} y1={note.y - r + 5} x2={note.x + r - 5} y2={note.y + r - 2} stroke={color} strokeWidth={0.7} />
                  <line x1={note.x + r - 2} y1={note.y - r + 2} x2={note.x - r + 2} y2={note.y + r - 2} stroke={color} strokeWidth={0.7} />
                  <line x1={note.x + r - 5} y1={note.y - r + 2} x2={note.x - r + 2} y2={note.y + r - 5} stroke={color} strokeWidth={0.7} />
                  <line x1={note.x + r - 2} y1={note.y - r + 5} x2={note.x - r + 5} y2={note.y + r - 2} stroke={color} strokeWidth={0.7} />
                </g>
              )}

              {/* Interval label inside note */}
              <text
                x={note.x} y={note.y + (compact ? 2.5 : 4)}
                textAnchor="middle"
                fill={isActive ? '#1a1a1a' : (isExNote ? '#2a2a2a' : '#3a3a3a')}
                fontSize={note.intervalLabel.length > 2 ? smallFontSize : fontSize}
                fontWeight="bold"
                fontFamily="'Georgia', serif"
                fontStyle="italic"
              >
                {note.intervalLabel}
              </text>

              {/* Note name on hover/active */}
              {(isActive || isExNote) && !compact && (
                <text
                  x={note.x} y={note.y - r - 5}
                  textAnchor="middle"
                  fill={color}
                  fontSize={8}
                  fontFamily="'Georgia', serif"
                  fontStyle="italic"
                  fontWeight="bold"
                  opacity={0.9}
                >
                  {note.note}
                </text>
              )}
            </g>
          );
        })}

        {/* Exercise path sequence numbers */}
        {exerciseNotePositions.map((en) => {
          const seqNum = en.sequenceNumber || (en.idx + 1);
          // Only show every Nth number to avoid clutter, but always show first and last
          const total = exerciseNotePositions.length;
          const showEvery = total > 20 ? 4 : total > 12 ? 3 : total > 6 ? 2 : 1;
          const showThis = seqNum === 1 || seqNum === total || seqNum % showEvery === 0;
          if (!showThis) return null;
          
          return (
            <g key={`exnum-${en.idx}`}>
              <circle
                cx={en.x + nr + 3} cy={en.y - nr - 3}
                r={7}
                fill="#9b3939"
                opacity={0.8}
              />
              <text
                x={en.x + nr + 3} y={en.y - nr + 0.5}
                textAnchor="middle"
                fill="#faf6ef"
                fontSize={7}
                fontWeight="bold"
                fontFamily="'Georgia', serif"
              >
                {seqNum}
              </text>
            </g>
          );
        })}

        {/* Position label on full fretboard */}
        {positionRect && !compact && (
          <text
            x={positionRect.x + positionRect.width / 2}
            y={positionRect.y - 2}
            textAnchor="middle"
            fill="#8b7355"
            fontSize={10}
            fontFamily="'Georgia', serif"
            fontStyle="italic"
            fontWeight="bold"
          >
            P{positionIndex + 1}
          </text>
        )}
      </svg>
    </div>
  );
}
