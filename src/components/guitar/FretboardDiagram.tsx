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

const STRING_SPACING = 30;
const FRET_SPACING = 34;
const LEFT_MARGIN = 45;
const TOP_MARGIN = 35;
const BOTTOM_MARGIN = 35;
const NOTE_RADIUS = 12;

// SVG filter for hand-drawn/sketchy effect
const SKETCH_FILTER_ID = 'sketch-filter';

export default function FretboardDiagram({
  keyNote,
  scaleId,
  startFret = 0,
  endFret = FRET_COUNT,
  showAllPositions = false,
  positionIndex = 0,
  highlightNotes,
  width = 560,
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
    const lines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
    const sorted = [...notePositions].sort((a, b) => {
      if (a.string !== b.string) return b.string - a.string;
      return a.fret - b.fret;
    });

    for (let i = 0; i < sorted.length - 1; i++) {
      const curr = sorted[i];
      const next = sorted[i + 1];
      if (Math.abs(curr.string - next.string) <= 1 && Math.abs(curr.fret - next.fret) <= 3) {
        lines.push({
          x1: curr.x,
          y1: curr.y,
          x2: next.x,
          y2: next.y,
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

  // Generate a slightly wobbly path for hand-drawn lines
  const sketchyLine = (x1: number, y1: number, x2: number, y2: number, wobble: number = 0.8) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const segments = Math.max(2, Math.floor(len / 20));
    let path = `M ${x1} ${y1}`;
    
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const nx = x1 + dx * t + (Math.random() - 0.5) * wobble * (i < segments ? 1 : 0.1);
      const ny = y1 + dy * t + (Math.random() - 0.5) * wobble * (i < segments ? 1 : 0.1);
      path += ` L ${nx.toFixed(1)} ${ny.toFixed(1)}`;
    }
    return path;
  };

  // Sketch-style color palette (muted, pencil-like)
  const sketchStringColors = [
    '#8b4a4a', // Low E - muted red
    '#8b4a4a', // A - muted red
    '#8b7d3a', // D - muted yellow/olive
    '#8b7d3a', // G - muted yellow/olive
    '#4a7a4a', // B - muted green
    '#4a7a4a', // High E - muted green
  ];

  const getSketchIntervalColor = (label: string): string => {
    if (label === 'R') return '#8b4a4a'; // Root = muted red
    if (label.includes('♭3') || label.includes('♭2')) return '#6b4a7a'; // muted purple
    if (label === '3' || label === '2') return '#4a7a4a'; // muted green
    if (label === '4') return '#4a5a8a'; // muted blue
    if (label.includes('5') || label === '5') return '#4a7a7a'; // muted teal
    if (label.includes('6')) return '#8a6a3a'; // muted orange
    if (label.includes('7')) return '#7a4a6a'; // muted pink
    if (label.includes('♯') || label.includes('♭')) return '#6b4a7a';
    return '#5a5a6a';
  };

  return (
    <div className={`fretboard-container ${className}`}>
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-auto"
      >
        {/* Sketch SVG filter - subtle roughness */}
        <defs>
          <filter id={SKETCH_FILTER_ID} x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="3" result="noise" seed="2" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>

        {/* Paper background */}
        <rect
          x={0}
          y={0}
          width={svgWidth}
          height={svgHeight}
          fill="#faf6ef"
          rx={2}
        />

        {/* Subtle paper grain texture */}
        <rect
          x={0}
          y={0}
          width={svgWidth}
          height={svgHeight}
          fill="url(#paper-grain)"
          opacity={0.3}
          rx={2}
        />

        {/* Fret markers (sketch dots - hand-drawn circles) */}
        {fretMarkerPositions.map(marker => (
          marker.isDouble ? (
            <React.Fragment key={`marker-${marker.fret}`}>
              <circle
                cx={marker.x}
                cy={TOP_MARGIN + 1.5 * STRING_SPACING}
                r={3.5}
                fill="none"
                stroke="#b8a88a"
                strokeWidth={1.2}
              />
              <circle
                cx={marker.x}
                cy={TOP_MARGIN + 3.5 * STRING_SPACING}
                r={3.5}
                fill="none"
                stroke="#b8a88a"
                strokeWidth={1.2}
              />
            </React.Fragment>
          ) : (
            <circle
              key={`marker-${marker.fret}`}
              cx={marker.x}
              cy={TOP_MARGIN + 2.5 * STRING_SPACING}
              r={3.5}
              fill="none"
              stroke="#b8a88a"
              strokeWidth={1.2}
            />
          )
        ))}

        {/* Fret lines (pencil-drawn horizontal lines) */}
        {Array.from({ length: fretRange + 1 }, (_, i) => {
          const fretNum = startFret + i;
          const x = LEFT_MARGIN + i * FRET_SPACING;
          const isNut = fretNum === 0;
          return (
            <line
              key={`fret-${fretNum}`}
              x1={x}
              y1={TOP_MARGIN - 12}
              x2={x}
              y2={TOP_MARGIN + 5 * STRING_SPACING + 12}
              stroke={isNut ? '#6b5b47' : '#c4b89c'}
              strokeWidth={isNut ? 3 : 1}
              strokeLinecap="round"
              filter={isNut ? undefined : `url(#${SKETCH_FILTER_ID})`}
            />
          );
        })}

        {/* Fret numbers (handwritten-style) */}
        {Array.from({ length: fretRange + 1 }, (_, i) => {
          const fretNum = startFret + i;
          if (fretNum === 0) return null;
          const x = LEFT_MARGIN + (i + 0.5) * FRET_SPACING;
          return (
            <text
              key={`fretnum-${fretNum}`}
              x={x}
              y={svgHeight - 8}
              textAnchor="middle"
              fill="#8b7355"
              fontSize={11}
              fontFamily="'Georgia', 'Times New Roman', serif"
              fontStyle="italic"
            >
              {fretNum}
            </text>
          );
        })}

        {/* String lines (sketchy, colored) */}
        {sketchStringColors.map((color, stringIdx) => {
          const y = TOP_MARGIN + (5 - stringIdx) * STRING_SPACING;
          const thickness = stringIdx === 0 ? 2.5 : stringIdx === 5 ? 1 : 1.5;
          return (
            <line
              key={`string-${stringIdx}`}
              x1={LEFT_MARGIN - 8}
              y1={y}
              x2={LEFT_MARGIN + fretRange * FRET_SPACING + 8}
              y2={y}
              stroke={color}
              strokeWidth={thickness}
              strokeLinecap="round"
              opacity={0.75}
              filter={`url(#${SKETCH_FILTER_ID})`}
            />
          );
        })}

        {/* String labels (italic serif) */}
        {stringLabels.map((label, idx) => {
          const y = TOP_MARGIN + idx * STRING_SPACING;
          return (
            <text
              key={`label-${idx}`}
              x={LEFT_MARGIN - 18}
              y={y + 5}
              textAnchor="middle"
              fill={sketchStringColors[5 - idx]}
              fontSize={13}
              fontWeight="bold"
              fontFamily="'Georgia', 'Times New Roman', serif"
              fontStyle="italic"
            >
              {label}
            </text>
          );
        })}

        {/* Position indicator box (dashed sketch) */}
        {positionIndex >= 0 && !showAllPositions && (
          <rect
            x={LEFT_MARGIN + 0.5 * FRET_SPACING}
            y={TOP_MARGIN - 18}
            width={(fretRange - 1) * FRET_SPACING}
            height={5 * STRING_SPACING + 36}
            fill="none"
            stroke="#8b7355"
            strokeWidth={1.5}
            strokeDasharray="8 4"
            rx={1}
            opacity={0.5}
            filter={`url(#${SKETCH_FILTER_ID})`}
          />
        )}

        {/* Connecting lines between notes (sketch pencil lines) */}
        {connectingLines.map((line, i) => (
          <line
            key={`line-${i}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="#b8a88a"
            strokeWidth={1.5}
            strokeLinecap="round"
            opacity={0.4}
            filter={`url(#${SKETCH_FILTER_ID})`}
          />
        ))}

        {/* Note markers (hand-drawn circles with interval labels) */}
        {notePositions.map((note, i) => {
          const color = getSketchIntervalColor(note.intervalLabel);
          return (
            <g key={`note-${i}`}>
              {/* Root note double ring */}
              {note.isRoot && (
                <circle
                  cx={note.x}
                  cy={note.y}
                  r={NOTE_RADIUS + 4}
                  fill="none"
                  stroke={color}
                  strokeWidth={1.5}
                  opacity={0.5}
                  strokeDasharray="3 2"
                />
              )}
              {/* Note circle - sketch style with visible fill */}
              <circle
                cx={note.x}
                cy={note.y}
                r={NOTE_RADIUS}
                fill={note.isRoot ? `${color}30` : `${color}20`}
                stroke={color}
                strokeWidth={note.isRoot ? 2.5 : 1.5}
              />
              {/* Crosshatch fill for root notes */}
              {note.isRoot && (
                <g opacity={0.15} clipPath={`circle(${NOTE_RADIUS}px at ${note.x}px ${note.y}px)`}>
                  <line x1={note.x - NOTE_RADIUS} y1={note.y - NOTE_RADIUS} x2={note.x + NOTE_RADIUS} y2={note.y + NOTE_RADIUS} stroke={color} strokeWidth={0.8} />
                  <line x1={note.x - NOTE_RADIUS + 3} y1={note.y - NOTE_RADIUS} x2={note.x + NOTE_RADIUS} y2={note.y + NOTE_RADIUS - 3} stroke={color} strokeWidth={0.8} />
                  <line x1={note.x - NOTE_RADIUS} y1={note.y - NOTE_RADIUS + 3} x2={note.x + NOTE_RADIUS - 3} y2={note.y + NOTE_RADIUS} stroke={color} strokeWidth={0.8} />
                  <line x1={note.x + NOTE_RADIUS} y1={note.y - NOTE_RADIUS} x2={note.x - NOTE_RADIUS} y2={note.y + NOTE_RADIUS} stroke={color} strokeWidth={0.8} />
                  <line x1={note.x + NOTE_RADIUS - 3} y1={note.y - NOTE_RADIUS} x2={note.x - NOTE_RADIUS} y2={note.y + NOTE_RADIUS - 3} stroke={color} strokeWidth={0.8} />
                  <line x1={note.x + NOTE_RADIUS} y1={note.y - NOTE_RADIUS + 3} x2={note.x - NOTE_RADIUS + 3} y2={note.y + NOTE_RADIUS} stroke={color} strokeWidth={0.8} />
                </g>
              )}
              {/* Interval label - handwritten style with strong contrast */}
              <text
                x={note.x}
                y={note.y + 4.5}
                textAnchor="middle"
                fill={note.isRoot ? '#2c2c2c' : '#3a3a3a'}
                fontSize={note.intervalLabel.length > 2 ? 8 : 10}
                fontWeight="bold"
                fontFamily="'Georgia', 'Times New Roman', serif"
                fontStyle="italic"
              >
                {note.intervalLabel}
              </text>
            </g>
          );
        })}

        {/* Annotation arrows / labels for key positions */}
        {notePositions.filter(n => n.isRoot).slice(0, 2).map((note, i) => (
          <g key={`anno-${i}`} opacity={0.6}>
            <text
              x={note.x}
              y={note.y - NOTE_RADIUS - 8}
              textAnchor="middle"
              fill="#8b7355"
              fontSize={8}
              fontFamily="'Georgia', serif"
              fontStyle="italic"
            >
              root
            </text>
            <line
              x1={note.x}
              y1={note.y - NOTE_RADIUS - 4}
              x2={note.x}
              y2={note.y - NOTE_RADIUS - 1}
              stroke="#8b7355"
              strokeWidth={0.8}
              markerEnd="none"
            />
          </g>
        ))}
      </svg>
    </div>
  );
}
