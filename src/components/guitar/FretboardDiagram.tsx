'use client';

import React, { useMemo } from 'react';
import {
  FretboardNote,
  getScaleOnFretboard,
  STRING_COLORS,
  getIntervalColor,
  FRET_MARKERS,
  DOUBLE_MARKERS,
  STRING_OPEN_NOTES,
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
  width?: number;
  className?: string;
}

const STRING_SPACING = 28;
const FRET_SPACING = 32;
const LEFT_MARGIN = 40;
const TOP_MARGIN = 30;
const BOTTOM_MARGIN = 30;
const NOTE_RADIUS = 11;

export default function FretboardDiagram({
  keyNote,
  scaleId,
  startFret = 0,
  endFret = FRET_COUNT,
  showAllPositions = false,
  positionIndex = 0,
  highlightNotes,
  width = 540,
  className = '',
}: FretboardDiagramProps) {
  const notes = useMemo(() => {
    return getScaleOnFretboard(keyNote, scaleId, startFret, endFret);
  }, [keyNote, scaleId, startFret, endFret]);

  const displayNotes = highlightNotes || notes;
  const fretRange = endFret - startFret;
  const stringLabels = ['E', 'A', 'D', 'G', 'B', 'e'];

  const svgWidth = Math.max(width, LEFT_MARGIN + fretRange * FRET_SPACING + 20);
  const svgHeight = TOP_MARGIN + 5 * STRING_SPACING + BOTTOM_MARGIN + 20;

  // Calculate note positions
  const notePositions = useMemo(() => {
    return displayNotes.map(note => ({
      ...note,
      x: LEFT_MARGIN + (note.fret - startFret + 0.5) * FRET_SPACING,
      y: TOP_MARGIN + (5 - note.string) * STRING_SPACING,
    }));
  }, [displayNotes, startFret]);

  // Generate connecting lines between consecutive notes on adjacent strings
  const connectingLines = useMemo(() => {
    const lines: Array<{ x1: number; y1: number; x2: number; y2: number; color: string }> = [];
    const sorted = [...notePositions].sort((a, b) => {
      if (a.string !== b.string) return b.string - a.string;
      return a.fret - b.fret;
    });

    for (let i = 0; i < sorted.length - 1; i++) {
      const curr = sorted[i];
      const next = sorted[i + 1];
      // Only connect if on same or adjacent strings and close frets
      if (Math.abs(curr.string - next.string) <= 1 && Math.abs(curr.fret - next.fret) <= 3) {
        lines.push({
          x1: curr.x,
          y1: curr.y,
          x2: next.x,
          y2: next.y,
          color: 'rgba(234, 179, 8, 0.3)',
        });
      }
    }
    return lines;
  }, [notePositions]);

  // Fret marker positions
  const fretMarkerPositions = useMemo(() => {
    return FRET_MARKERS
      .filter(f => f >= startFret && f <= endFret)
      .map(fret => ({
        fret,
        x: LEFT_MARGIN + (fret - startFret + 0.5) * FRET_SPACING,
        isDouble: DOUBLE_MARKERS.includes(fret),
      }));
  }, [startFret, endFret]);

  return (
    <div className={`fretboard-container ${className}`}>
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-auto"
      >
        {/* Background */}
        <rect
          x={0}
          y={0}
          width={svgWidth}
          height={svgHeight}
          fill="#0f172a"
          rx={8}
        />

        {/* Fret markers (dots) */}
        {fretMarkerPositions.map(marker => (
          marker.isDouble ? (
            <React.Fragment key={`marker-${marker.fret}`}>
              <circle
                cx={marker.x}
                cy={TOP_MARGIN + 1.5 * STRING_SPACING}
                r={4}
                fill="rgba(148, 163, 184, 0.2)"
              />
              <circle
                cx={marker.x}
                cy={TOP_MARGIN + 3.5 * STRING_SPACING}
                r={4}
                fill="rgba(148, 163, 184, 0.2)"
              />
            </React.Fragment>
          ) : (
            <circle
              key={`marker-${marker.fret}`}
              cx={marker.x}
              cy={TOP_MARGIN + 2.5 * STRING_SPACING}
              r={4}
              fill="rgba(148, 163, 184, 0.2)"
            />
          )
        ))}

        {/* Fret lines */}
        {Array.from({ length: fretRange + 1 }, (_, i) => {
          const fretNum = startFret + i;
          const x = LEFT_MARGIN + i * FRET_SPACING;
          const isNut = fretNum === 0;
          return (
            <line
              key={`fret-${fretNum}`}
              x1={x}
              y1={TOP_MARGIN - 10}
              x2={x}
              y2={TOP_MARGIN + 5 * STRING_SPACING + 10}
              stroke={isNut ? '#94a3b8' : 'rgba(148, 163, 184, 0.4)'}
              strokeWidth={isNut ? 3 : 1}
            />
          );
        })}

        {/* Fret numbers */}
        {Array.from({ length: fretRange + 1 }, (_, i) => {
          const fretNum = startFret + i;
          if (fretNum === 0) return null;
          const x = LEFT_MARGIN + (i + 0.5) * FRET_SPACING;
          return (
            <text
              key={`fretnum-${fretNum}`}
              x={x}
              y={svgHeight - 5}
              textAnchor="middle"
              fill="#64748b"
              fontSize={10}
              fontFamily="monospace"
            >
              {fretNum}
            </text>
          );
        })}

        {/* String lines (colored) */}
        {STRING_COLORS.map((color, stringIdx) => {
          const y = TOP_MARGIN + (5 - stringIdx) * STRING_SPACING;
          return (
            <line
              key={`string-${stringIdx}`}
              x1={LEFT_MARGIN - 5}
              y1={y}
              x2={LEFT_MARGIN + fretRange * FRET_SPACING + 5}
              y2={y}
              stroke={color}
              strokeWidth={1.5}
              opacity={0.5}
            />
          );
        })}

        {/* String labels */}
        {stringLabels.map((label, idx) => {
          const y = TOP_MARGIN + idx * STRING_SPACING;
          return (
            <text
              key={`label-${idx}`}
              x={LEFT_MARGIN - 15}
              y={y + 4}
              textAnchor="middle"
              fill={STRING_COLORS[5 - idx]}
              fontSize={11}
              fontWeight="bold"
              fontFamily="monospace"
            >
              {label}
            </text>
          );
        })}

        {/* Position indicator box */}
        {positionIndex >= 0 && !showAllPositions && (
          <rect
            x={LEFT_MARGIN + 0.5 * FRET_SPACING}
            y={TOP_MARGIN - 15}
            width={(fretRange - 1) * FRET_SPACING}
            height={5 * STRING_SPACING + 30}
            fill="none"
            stroke="rgba(234, 179, 8, 0.3)"
            strokeWidth={2}
            rx={4}
            strokeDasharray="6 3"
          />
        )}

        {/* Connecting lines between notes */}
        {connectingLines.map((line, i) => (
          <line
            key={`line-${i}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke={line.color}
            strokeWidth={2}
          />
        ))}

        {/* Note markers */}
        {notePositions.map((note, i) => {
          const color = getIntervalColor(note.intervalLabel);
          return (
            <g key={`note-${i}`}>
              {/* Glow effect for root notes */}
              {note.isRoot && (
                <circle
                  cx={note.x}
                  cy={note.y}
                  r={NOTE_RADIUS + 4}
                  fill="none"
                  stroke={color}
                  strokeWidth={2}
                  opacity={0.4}
                />
              )}
              {/* Note circle */}
              <circle
                cx={note.x}
                cy={note.y}
                r={NOTE_RADIUS}
                fill={note.isRoot ? color : `${color}cc`}
                stroke={note.isRoot ? '#fff' : 'rgba(255,255,255,0.3)'}
                strokeWidth={note.isRoot ? 2 : 1}
              />
              {/* Interval label */}
              <text
                x={note.x}
                y={note.y + 4}
                textAnchor="middle"
                fill="white"
                fontSize={note.intervalLabel.length > 2 ? 7 : 9}
                fontWeight="bold"
                fontFamily="monospace"
              >
                {note.intervalLabel}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
