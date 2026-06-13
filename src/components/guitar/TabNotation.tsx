'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Exercise, ExerciseNote } from '@/lib/exercise-generator';
import { toPng, toSvg } from 'html-to-image';
import {
  Download,
  Printer,
  Copy,
  Share2,
  FileImage,
  FileText,
  Check,
} from 'lucide-react';

interface TabNotationProps {
  exercise: Exercise | null;
  onNoteClick?: (note: ExerciseNote) => void;
  activeNoteIndex?: number;
  playingIdx?: number;
  activePlayingNote?: ExerciseNote | null;
  className?: string;
}

// Layout constants for SVG tab rendering
const TAB_LEFT_MARGIN = 36;
const TAB_STRING_SPACING = 20;
const TAB_CELL_WIDTH = 28;
const TAB_TOP_MARGIN = 12;
const TAB_BOTTOM_MARGIN = 16;
const TAB_ROW_GAP = 20;
const TAB_NOTES_PER_ROW = 16;
const TAB_LINE_HEIGHT = 5 * TAB_STRING_SPACING + TAB_TOP_MARGIN + TAB_BOTTOM_MARGIN;

export default function TabNotation({ exercise, onNoteClick, activeNoteIndex = -1, playingIdx = -1, activePlayingNote = null, className = '' }: TabNotationProps) {
  const [hoveredNote, setHoveredNote] = useState<string | null>(null); // "row-string-fret" key
  const [copied, setCopied] = useState(false);
  const tabRef = useRef<HTMLDivElement>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close export menu on outside click
  useEffect(() => {
    if (!showExportMenu) return;
    const handler = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showExportMenu]);

  const isNoteActive = useCallback((noteKey: string) => {
    return hoveredNote === noteKey;
  }, [hoveredNote]);

  const isPlayingNote = useCallback((note: ExerciseNote | null, rowOffset: number) => {
    if (!note || playingIdx < 0 || !activePlayingNote) return false;
    return activePlayingNote.string === note.string && activePlayingNote.fret === note.fret;
  }, [playingIdx, activePlayingNote]);

  if (!exercise || !exercise.notes.length) {
    return (
      <div className={`sketch-card bg-[#faf6ef] flex items-center justify-center h-28 ${className}`}>
        <div className="text-center">
          <p className="text-[#8b7355] text-sm italic font-serif">Select an exercise to see tabs...</p>
          <p className="text-[#b8a88a] text-[9px] italic font-serif mt-1">Choose from the exercise categories above</p>
        </div>
      </div>
    );
  }

  const stringLabels = ['e', 'B', 'G', 'D', 'A', 'E'];
  const allNotes = exercise.notes;

  // Split notes into rows that wrap properly
  const rows: ExerciseNote[][] = [];
  for (let i = 0; i < allNotes.length; i += TAB_NOTES_PER_ROW) {
    rows.push(allNotes.slice(i, i + TAB_NOTES_PER_ROW));
  }

  // Generate plain text tab for copy
  const generatePlainText = () => {
    const lines: string[] = [];
    lines.push(`${exercise.name} — ${exercise.description}`);
    lines.push('');
    
    for (const row of rows) {
      const tabLines: string[] = stringLabels.map(label => label + '|');
      for (const note of row) {
        const stringRow = 5 - note.string;
        for (let r = 0; r < 6; r++) {
          if (r === stringRow) {
            const fretStr = note.fret.toString();
            tabLines[r] += fretStr.length > 1 ? fretStr + '-' : '-' + fretStr + '-';
          } else {
            tabLines[r] += '---';
          }
        }
      }
      const maxLen = Math.max(...tabLines.map(t => t.length));
      for (let i = 0; i < tabLines.length; i++) {
        while (tabLines[i].length < maxLen) tabLines[i] += '-';
        tabLines[i] += '|';
      }
      lines.push(...tabLines, '');
    }
    return lines.join('\n');
  };

  // Export handlers
  const handleDownloadPNG = async () => {
    if (!tabRef.current) return;
    try {
      const dataUrl = await toPng(tabRef.current, {
        backgroundColor: '#faf6ef',
        pixelRatio: 2,
        quality: 0.95,
      });
      const link = document.createElement('a');
      link.download = `${exercise.name.replace(/\s+/g, '_')}_tab.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error('PNG export failed:', e);
    }
    setShowExportMenu(false);
  };

  const handleDownloadSVG = async () => {
    if (!tabRef.current) return;
    try {
      const dataUrl = await toSvg(tabRef.current, {
        backgroundColor: '#faf6ef',
      });
      const link = document.createElement('a');
      link.download = `${exercise.name.replace(/\s+/g, '_')}_tab.svg`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error('SVG export failed:', e);
    }
    setShowExportMenu(false);
  };

  const handlePrint = () => {
    if (!tabRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>${exercise.name} — FretBoard Forge</title>
          <style>
            body { margin: 20px; font-family: Georgia, serif; background: white; }
            h1 { font-size: 18px; margin-bottom: 4px; }
            p { font-size: 12px; color: #666; margin-top: 0; }
            img { max-width: 100%; }
          </style>
        </head>
        <body>
          <h1>${exercise.name}</h1>
          <p>${exercise.description} · ${exercise.notes.length} notes</p>
          <div id="content"></div>
        </body>
      </html>
    `);
    toPng(tabRef.current, { backgroundColor: '#ffffff', pixelRatio: 2 }).then(dataUrl => {
      const img = printWindow.document.createElement('img');
      img.src = dataUrl;
      printWindow.document.getElementById('content')?.appendChild(img);
      img.onload = () => {
        printWindow.print();
      };
    });
    setShowExportMenu(false);
  };

  const handleCopyText = async () => {
    const text = generatePlainText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Copy failed:', e);
    }
    setShowExportMenu(false);
  };

  const handleCopyImage = async () => {
    if (!tabRef.current) return;
    try {
      const dataUrl = await toPng(tabRef.current, {
        backgroundColor: '#faf6ef',
        pixelRatio: 2,
      });
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Copy image failed:', e);
    }
    setShowExportMenu(false);
  };

  // Calculate SVG dimensions
  const svgWidth = TAB_LEFT_MARGIN + TAB_NOTES_PER_ROW * TAB_CELL_WIDTH + 20;
  const totalHeight = rows.length * TAB_LINE_HEIGHT + (rows.length - 1) * TAB_ROW_GAP + 8;

  return (
    <div className={`sketch-card bg-[#faf6ef] p-4 ${className}`}>
      {/* Exercise title bar */}
      <div className="mb-3 flex items-center justify-between border-b border-[#e8e2d6] pb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[12px] font-bold text-[#9b3939] font-serif italic">{exercise.name}</span>
          <span className="text-[10px] text-[#8b7355] font-serif italic">— {exercise.description}</span>
          <span className="text-[9px] text-[#b8a88a] font-serif italic">· {exercise.notes.length} notes</span>
        </div>
        <div className="flex items-center gap-2">
          {activePlayingNote && (
            <span className="text-[10px] text-[#9b3939] font-serif italic font-bold animate-pulse mr-2">
              {activePlayingNote.note} ({activePlayingNote.intervalLabel}) · S{6 - activePlayingNote.string} · F{activePlayingNote.fret}
            </span>
          )}
          
          {/* Export menu */}
          <div className="relative" ref={exportMenuRef}>
            <button
              className="sketch-btn text-[10px] px-2 py-1 border-[#8b7355] text-[#6b5b47] font-semibold flex items-center gap-1"
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              <Share2 className="w-3 h-3" />
              Export
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 z-50 sketch-card bg-[#faf6ef] py-1 min-w-[160px]">
                <button className="w-full text-left px-3 py-1.5 text-[10px] text-[#4a4a4a] hover:bg-[rgba(139,115,85,0.1)] flex items-center gap-2 font-serif italic" onClick={handleDownloadPNG}>
                  <FileImage className="w-3 h-3 text-[#8b7355]" /> Download PNG
                </button>
                <button className="w-full text-left px-3 py-1.5 text-[10px] text-[#4a4a4a] hover:bg-[rgba(139,115,85,0.1)] flex items-center gap-2 font-serif italic" onClick={handleDownloadSVG}>
                  <Download className="w-3 h-3 text-[#8b7355]" /> Download SVG
                </button>
                <div className="border-t border-[#e8e2d6] my-1" />
                <button className="w-full text-left px-3 py-1.5 text-[10px] text-[#4a4a4a] hover:bg-[rgba(139,115,85,0.1)] flex items-center gap-2 font-serif italic" onClick={handleCopyText}>
                  <FileText className="w-3 h-3 text-[#8b7355]" /> Copy as Text
                </button>
                <button className="w-full text-left px-3 py-1.5 text-[10px] text-[#4a4a4a] hover:bg-[rgba(139,115,85,0.1)] flex items-center gap-2 font-serif italic" onClick={handleCopyImage}>
                  <Copy className="w-3 h-3 text-[#8b7355]" /> Copy as Image
                </button>
                <div className="border-t border-[#e8e2d6] my-1" />
                <button className="w-full text-left px-3 py-1.5 text-[10px] text-[#4a4a4a] hover:bg-[rgba(139,115,85,0.1)] flex items-center gap-2 font-serif italic" onClick={handlePrint}>
                  <Printer className="w-3 h-3 text-[#8b7355]" /> Print...
                </button>
              </div>
            )}
          </div>

          {copied && (
            <span className="text-[10px] text-[#4a7a4a] font-serif italic font-bold flex items-center gap-1">
              <Check className="w-3 h-3" /> Copied!
            </span>
          )}
        </div>
      </div>

      {/* SVG Tab Notation — properly wrapping with multiple rows */}
      <div ref={tabRef} className="bg-[#faf6ef] overflow-x-auto">
        <svg
          width={svgWidth}
          height={totalHeight}
          viewBox={`0 0 ${svgWidth} ${totalHeight}`}
          className="w-full h-auto"
          style={{ minWidth: svgWidth }}
        >
          {rows.map((rowNotes, rowIdx) => {
            const yOffset = rowIdx * (TAB_LINE_HEIGHT + TAB_ROW_GAP);
            const isLastRow = rowIdx === rows.length - 1;
            const noteCount = rowNotes.length;
            const rowWidth = TAB_LEFT_MARGIN + noteCount * TAB_CELL_WIDTH + 10;
            
            return (
              <g key={`row-${rowIdx}`} transform={`translate(0, ${yOffset})`}>
                {/* Paper background for this row */}
                <rect
                  x={0} y={0}
                  width={svgWidth} height={TAB_LINE_HEIGHT}
                  fill="#faf6ef"
                  rx={1}
                />

                {/* String lines */}
                {stringLabels.map((_, stringIdx) => {
                  const y = TAB_TOP_MARGIN + stringIdx * TAB_STRING_SPACING;
                  const thickness = stringIdx <= 1 ? 1.8 : stringIdx <= 3 ? 1.2 : 0.8;
                  return (
                    <line
                      key={`str-${rowIdx}-${stringIdx}`}
                      x1={TAB_LEFT_MARGIN - 4} y1={y}
                      x2={TAB_LEFT_MARGIN + noteCount * TAB_CELL_WIDTH + 4} y2={y}
                      stroke="#6b5b47"
                      strokeWidth={thickness}
                      strokeLinecap="round"
                      opacity={0.5}
                    />
                  );
                })}

                {/* String labels */}
                {stringLabels.map((label, stringIdx) => {
                  const y = TAB_TOP_MARGIN + stringIdx * TAB_STRING_SPACING;
                  return (
                    <text
                      key={`lbl-${rowIdx}-${stringIdx}`}
                      x={TAB_LEFT_MARGIN - 14}
                      y={y + 4}
                      textAnchor="middle"
                      fill="#6b5b47"
                      fontSize={11}
                      fontWeight="bold"
                      fontFamily="'Georgia', serif"
                      fontStyle="italic"
                    >
                      {label}
                    </text>
                  );
                })}

                {/* Opening bar line */}
                <line
                  x1={TAB_LEFT_MARGIN - 4} y1={TAB_TOP_MARGIN - 4}
                  x2={TAB_LEFT_MARGIN - 4} y2={TAB_TOP_MARGIN + 5 * TAB_STRING_SPACING + 4}
                  stroke="#6b5b47"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
                {/* Closing bar line */}
                <line
                  x1={TAB_LEFT_MARGIN + noteCount * TAB_CELL_WIDTH + 4}
                  y1={TAB_TOP_MARGIN - 4}
                  x2={TAB_LEFT_MARGIN + noteCount * TAB_CELL_WIDTH + 4}
                  y2={TAB_TOP_MARGIN + 5 * TAB_STRING_SPACING + 4}
                  stroke={isLastRow ? '#6b5b47' : '#c4b89c'}
                  strokeWidth={isLastRow ? 2.5 : 1.5}
                  strokeLinecap="round"
                />
                {/* Double bar at end of last row */}
                {isLastRow && (
                  <line
                    x1={TAB_LEFT_MARGIN + noteCount * TAB_CELL_WIDTH + 8}
                    y1={TAB_TOP_MARGIN - 4}
                    x2={TAB_LEFT_MARGIN + noteCount * TAB_CELL_WIDTH + 8}
                    y2={TAB_TOP_MARGIN + 5 * TAB_STRING_SPACING + 4}
                    stroke="#6b5b47"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                  />
                )}

                {/* Tab notes */}
                {rowNotes.map((note, noteIdx) => {
                  const globalIdx = rowIdx * TAB_NOTES_PER_ROW + noteIdx;
                  const x = TAB_LEFT_MARGIN + noteIdx * TAB_CELL_WIDTH + TAB_CELL_WIDTH / 2;
                  const y = TAB_TOP_MARGIN + (5 - note.string) * TAB_STRING_SPACING;
                  const noteKey = `${rowIdx}-${note.string}-${note.fret}-${noteIdx}`;
                  const isHovered = isNoteActive(noteKey);
                  const isCurrentlyPlaying = isPlayingNote(note, rowIdx);
                  const isPlayingIdx = playingIdx === globalIdx;
                  const isActive = isHovered || isCurrentlyPlaying || isPlayingIdx;
                  
                  const fretStr = note.fret.toString();
                  const fontSize = fretStr.length > 1 ? 11 : 13;
                  const cellW = fretStr.length > 1 ? TAB_CELL_WIDTH + 4 : TAB_CELL_WIDTH;

                  return (
                    <g
                      key={`note-${rowIdx}-${noteIdx}`}
                      style={{ cursor: onNoteClick ? 'pointer' : 'default' }}
                      onMouseEnter={() => setHoveredNote(noteKey)}
                      onMouseLeave={() => setHoveredNote(null)}
                      onClick={() => onNoteClick?.(note)}
                    >
                      {/* Active background highlight */}
                      {isActive && (
                        <rect
                          x={x - cellW / 2}
                          y={y - TAB_STRING_SPACING / 2 + 2}
                          width={cellW}
                          height={TAB_STRING_SPACING - 4}
                          fill="rgba(155,57,57,0.15)"
                          rx={2}
                        />
                      )}
                      {/* Playing pulse ring */}
                      {isCurrentlyPlaying && (
                        <circle
                          cx={x} cy={y}
                          r={14}
                          fill="rgba(155,57,57,0.1)"
                          stroke="#9b3939"
                          strokeWidth={1.5}
                          opacity={0.6}
                        />
                      )}
                      {/* Fret number */}
                      <text
                        x={x} y={y + 4.5}
                        textAnchor="middle"
                        fill={isActive ? '#9b3939' : '#3a3a3a'}
                        fontSize={fontSize}
                        fontWeight="bold"
                        fontFamily="'Courier New', monospace"
                        opacity={isActive ? 1 : 0.85}
                      >
                        {fretStr}
                      </text>
                    </g>
                  );
                })}

                {/* Row continuation indicator */}
                {!isLastRow && (
                  <text
                    x={TAB_LEFT_MARGIN + noteCount * TAB_CELL_WIDTH + 16}
                    y={TAB_TOP_MARGIN + 2.5 * TAB_STRING_SPACING + 4}
                    fill="#8b7355"
                    fontSize={14}
                    fontFamily="'Georgia', serif"
                    fontStyle="italic"
                  >
                    →
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
