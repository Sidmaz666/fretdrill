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
  activeNote?: { string: number; fret: number } | null;
  onNoteClick?: (note: FretboardNote) => void;
  width?: number;
  compact?: boolean;
  className?: string;
}

const STRING_SPACING = 28;
const FRET_SPACING = 36;
const LEFT_MARGIN = 38;
const TOP_MARGIN = 28;
const BOTTOM_MARGIN = 28;
const NOTE_RADIUS = 11;

// Sketch-style color palette
function getSketchColor(label: string): string {
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

export default function FretboardDiagram({
  keyNote,
  scaleId,
  startFret = 0,
  endFret = FRET_COUNT,
  showAllPositions = false,
  positionIndex = 0,
  highlightNotes,
  activeNote,
  onNoteClick,
  width = 560,
  compact = false,
  className = '',
}: FretboardDiagramProps) {
  const [hoveredNote, setHoveredNote] = useState<{ string: number; fret: number } | null>(null);

  const notes = useMemo(() => {
    return getScaleOnFretboard(keyNote, scaleId, startFret, endFret);
  }, [keyNote, scaleId, startFret, endFret]);

  // Always show ALL scale notes; highlightNotes just marks which ones are part of the exercise
  const displayNotes = notes;
  const fretRange = endFret - startFret;
  const stringLabels = ['E', 'A', 'D', 'G', 'B', 'e'];

  const stringSpacing = compact ? 20 : STRING_SPACING;
  const fretSpacing = compact ? 24 : FRET_SPACING;
  const leftMargin = compact ? 28 : LEFT_MARGIN;
  const topMargin = compact ? 20 : TOP_MARGIN;
  const bottomMargin = compact ? 18 : BOTTOM_MARGIN;
  const noteRadius = compact ? 7 : NOTE_RADIUS;

  const svgWidth = Math.max(width, leftMargin + fretRange * fretSpacing + 20);
  const svgHeight = topMargin + 5 * stringSpacing + bottomMargin;

  // Create highlight set for exercise notes
  const highlightSet = useMemo(() => {
    return new Set(
      (highlightNotes || []).map(n => `${n.string}-${n.fret}`)
    );
  }, [highlightNotes]);

  // Calculate note positions — always showing all scale notes
  const notePositions = useMemo(() => {
    return displayNotes.map(note => ({
      ...note,
      x: leftMargin + (note.fret - startFret + 0.5) * fretSpacing,
      y: topMargin + (5 - note.string) * stringSpacing,
      isHighlighted: highlightSet.has(`${note.string}-${note.fret}`),
    }));
  }, [displayNotes, startFret, highlightSet]);

  // Fret marker positions
  const fretMarkerPositions = useMemo(() => {
    return FRET_MARKERS
      .filter(f => f >= startFret && f <= endFret)
      .map(fret => ({
        fret,
        x: leftMargin + (fret - startFret + 0.5) * fretSpacing,
        isDouble: DOUBLE_MARKERS.includes(fret),
      }));
  }, [startFret, endFret]);

  const isNoteActive = useCallback((note: { string: number; fret: number }) => {
    if (activeNote && activeNote.string === note.string && activeNote.fret === note.fret) return true;
    if (hoveredNote && hoveredNote.string === note.string && hoveredNote.fret === note.fret) return true;
    return false;
  }, [activeNote, hoveredNote]);

  const fontSize = compact ? 7 : (noteRadius >= 11 ? 10 : 8);
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
              <circle cx={marker.x - 6} cy={topMargin + 1.5 * stringSpacing} r={compact ? 2 : 3} fill="#c4b89c" opacity={0.6} />
              <circle cx={marker.x + 6} cy={topMargin + 3.5 * stringSpacing} r={compact ? 2 : 3} fill="#c4b89c" opacity={0.6} />
            </React.Fragment>
          ) : (
            <circle key={`marker-${marker.fret}`} cx={marker.x} cy={topMargin + 2.5 * stringSpacing} r={compact ? 2 : 3} fill="#c4b89c" opacity={0.6} />
          )
        ))}

        {/* Fret lines (vertical) */}
        {Array.from({ length: fretRange + 1 }, (_, i) => {
          const fretNum = startFret + i;
          const x = leftMargin + i * fretSpacing;
          const isNut = fretNum === 0;
          return (
            <line
              key={`fret-${fretNum}`}
              x1={x} y1={topMargin - 8}
              x2={x} y2={topMargin + 5 * stringSpacing + 8}
              stroke={isNut ? '#5a4a3a' : '#c4b89c'}
              strokeWidth={isNut ? 4 : 1.2}
              strokeLinecap="round"
            />
          );
        })}

        {/* Fret numbers */}
        {Array.from({ length: fretRange + 1 }, (_, i) => {
          const fretNum = startFret + i;
          if (fretNum === 0) return null;
          const x = leftMargin + (i + 0.5) * fretSpacing;
          // Only show every other fret number if compact
          if (compact && fretNum % 2 !== 0 && fretNum !== startFret + 1) return null;
          return (
            <text
              key={`fretnum-${fretNum}`}
              x={x} y={svgHeight - 4}
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
          const y = topMargin + stringIdx * stringSpacing;
          // Thicker for low strings, thinner for high
          const thickness = stringIdx <= 1 ? 2.5 : stringIdx <= 3 ? 1.8 : 1.2;
          return (
            <line
              key={`string-${stringIdx}`}
              x1={leftMargin - 6} y1={y}
              x2={leftMargin + fretRange * fretSpacing + 6} y2={y}
              stroke="#6b5b47"
              strokeWidth={thickness}
              strokeLinecap="round"
              opacity={0.7}
            />
          );
        })}

        {/* String labels */}
        {stringLabels.map((label, idx) => {
          const y = topMargin + idx * stringSpacing;
          return (
            <text
              key={`label-${idx}`}
              x={leftMargin - 16} y={y + 4}
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

        {/* Note markers */}
        {notePositions.map((note, i) => {
          const color = getSketchColor(note.intervalLabel);
          const isActive = isNoteActive(note);
          const isHighlight = note.isHighlighted && highlightNotes;
          const r = isActive ? noteRadius + 2 : noteRadius;

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
                <circle
                  cx={note.x} cy={note.y} r={r + 4}
                  fill={color} opacity={0.15}
                />
              )}

              {/* Exercise highlight ring */}
              {isHighlight && !isActive && (
                <circle
                  cx={note.x} cy={note.y} r={r + 3}
                  fill="none"
                  stroke={color}
                  strokeWidth={2}
                  strokeDasharray="4 2"
                  opacity={0.7}
                />
              )}

              {/* Root note double ring */}
              {note.isRoot && !compact && (
                <circle
                  cx={note.x} cy={note.y} r={r + 4}
                  fill="none"
                  stroke={color}
                  strokeWidth={1.5}
                  opacity={0.4}
                />
              )}

              {/* Note circle */}
              <circle
                cx={note.x} cy={note.y} r={r}
                fill={isActive ? color + '50' : (isHighlight ? color + '40' : (note.isRoot ? color + '25' : color + '15'))}
                stroke={isActive ? color : (isHighlight ? color : color + '80')}
                strokeWidth={isActive ? 2.5 : (note.isRoot ? 2 : 1.2)}
              />

              {/* Crosshatch for root */}
              {note.isRoot && !compact && (
                <g opacity={0.1} clipPath={`circle(${r}px at ${note.x}px ${note.y}px)`}>
                  <line x1={note.x - r} y1={note.y - r} x2={note.x + r} y2={note.y + r} stroke={color} strokeWidth={0.7} />
                  <line x1={note.x - r + 3} y1={note.y - r} x2={note.x + r} y2={note.y + r - 3} stroke={color} strokeWidth={0.7} />
                  <line x1={note.x - r} y1={note.y - r + 3} x2={note.x + r - 3} y2={note.y + r} stroke={color} strokeWidth={0.7} />
                  <line x1={note.x + r} y1={note.y - r} x2={note.x - r} y2={note.y + r} stroke={color} strokeWidth={0.7} />
                  <line x1={note.x + r - 3} y1={note.y - r} x2={note.x - r} y2={note.y + r - 3} stroke={color} strokeWidth={0.7} />
                  <line x1={note.x + r} y1={note.y - r + 3} x2={note.x - r + 3} y2={note.y + r} stroke={color} strokeWidth={0.7} />
                </g>
              )}

              {/* Interval label */}
              <text
                x={note.x} y={note.y + (compact ? 2.5 : 4)}
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
                  x={note.x} y={note.y - r - 4}
                  textAnchor="middle"
                  fill={color}
                  fontSize={8}
                  fontFamily="'Georgia', serif"
                  fontStyle="italic"
                  opacity={0.8}
                >
                  {note.note}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
