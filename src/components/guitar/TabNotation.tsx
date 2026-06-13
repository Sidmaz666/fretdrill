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
  Play,
  Pause,
  Square,
  Music,
} from 'lucide-react';

interface TabNotationProps {
  exercise: Exercise | null;
  onNoteClick?: (note: ExerciseNote) => void;
  playingIdx?: number;
  isPlaying?: boolean;
  isPaused?: boolean;
  playbackMode?: 'idle' | 'exercise' | 'scale';
  onPlayExercise?: () => void;
  onPlayScale?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  className?: string;
}

// Layout constants — truly compact
const LM = 18;        // left margin
const SS = 11;        // string spacing
const CW = 16;        // cell width
const TM = 6;         // top margin
const BM = 4;         // bottom margin
const RG = 6;         // row gap
const NPR = 24;       // notes per row
const LH = 5 * SS + TM + BM; // line height

export default function TabNotation({
  exercise,
  onNoteClick,
  playingIdx = -1,
  isPlaying = false,
  isPaused = false,
  playbackMode = 'idle',
  onPlayExercise,
  onPlayScale,
  onPause,
  onStop,
  className = '',
}: TabNotationProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const tabRef = useRef<HTMLDivElement>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

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

  if (!exercise || !exercise.notes.length) {
    return (
      <div className={`sketch-card bg-[#faf6ef] flex items-center justify-center h-20 ${className}`}>
        <p className="text-[#8b7355] text-xs italic font-serif">Select an exercise to see tabs...</p>
      </div>
    );
  }

  const stringLabels = ['e', 'B', 'G', 'D', 'A', 'E'];
  const allNotes = exercise.notes;

  // Split into rows
  const rows: ExerciseNote[][] = [];
  for (let i = 0; i < allNotes.length; i += NPR) {
    rows.push(allNotes.slice(i, i + NPR));
  }

  const generatePlainText = () => {
    const lines: string[] = [`${exercise.name} — ${exercise.description}`, ''];
    for (const row of rows) {
      const tabLines: string[] = stringLabels.map(l => l + '|');
      for (const note of row) {
        const r = 5 - note.string;
        for (let i = 0; i < 6; i++) {
          tabLines[i] += i === r ? (note.fret < 10 ? '-' + note.fret + '-' : note.fret + '-') : '---';
        }
      }
      const mx = Math.max(...tabLines.map(t => t.length));
      for (let i = 0; i < 6; i++) { while (tabLines[i].length < mx) tabLines[i] += '-'; tabLines[i] += '|'; }
      lines.push(...tabLines, '');
    }
    return lines.join('\n');
  };

  const handleDownloadPNG = async () => {
    if (!tabRef.current) return;
    try {
      const dataUrl = await toPng(tabRef.current, { backgroundColor: '#faf6ef', pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `${exercise.name.replace(/\s+/g, '_')}_tab.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) { console.error('PNG export failed:', e); }
    setShowExportMenu(false);
  };

  const handleDownloadSVG = async () => {
    if (!tabRef.current) return;
    try {
      const dataUrl = await toSvg(tabRef.current, { backgroundColor: '#faf6ef' });
      const link = document.createElement('a');
      link.download = `${exercise.name.replace(/\s+/g, '_')}_tab.svg`;
      link.href = dataUrl;
      link.click();
    } catch (e) { console.error('SVG export failed:', e); }
    setShowExportMenu(false);
  };

  const handlePrint = () => {
    if (!tabRef.current) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><head><title>${exercise.name}</title><style>body{margin:20px;font-family:Georgia,serif;background:#fff}h1{font-size:16px;margin:0 0 4px}p{font-size:11px;color:#666;margin:0 0 12px}img{max-width:100%}</style></head><body><h1>${exercise.name}</h1><p>${exercise.description} · ${exercise.notes.length} notes</p><div id="c"></div></body></html>`);
    toPng(tabRef.current, { backgroundColor: '#fff', pixelRatio: 2 }).then(url => {
      const img = w.document.createElement('img'); img.src = url;
      w.document.getElementById('c')?.appendChild(img);
      img.onload = () => w.print();
    });
    setShowExportMenu(false);
  };

  const handleCopyText = async () => {
    try { await navigator.clipboard.writeText(generatePlainText()); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch (e) { console.error('Copy failed:', e); }
    setShowExportMenu(false);
  };

  const handleCopyImage = async () => {
    if (!tabRef.current) return;
    try {
      const url = await toPng(tabRef.current, { backgroundColor: '#faf6ef', pixelRatio: 2 });
      const res = await fetch(url); const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    } catch (e) { console.error('Copy image failed:', e); }
    setShowExportMenu(false);
  };

  const svgWidth = LM + NPR * CW + 12;
  const totalHeight = rows.length * LH + (rows.length - 1) * RG + 4;

  // Currently playing note info
  // Only highlight in tabs during exercise playback, NOT during scale playback (which has different notes)
  const showTabHighlight = isPlaying && playbackMode === 'exercise';
  const currentPlayingNote = showTabHighlight && playingIdx >= 0 && playingIdx < allNotes.length ? allNotes[playingIdx] : null;

  return (
    <div className={`sketch-card bg-[#faf6ef] p-3 ${className}`}>
      {/* Title bar + controls */}
      <div className="mb-2 flex items-center justify-between border-b border-[#e8e2d6] pb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-[#9b3939] font-serif italic">{exercise.name}</span>
          <span className="text-[9px] text-[#8b7355] font-serif italic">— {exercise.description}</span>
          <span className="text-[8px] text-[#b8a88a] font-serif italic">· {exercise.notes.length} notes</span>
          {currentPlayingNote && (
            <span className="text-[9px] text-[#9b3939] font-serif italic font-bold ml-1">
              ▸ {currentPlayingNote.note} ({currentPlayingNote.intervalLabel}) S{6 - currentPlayingNote.string} F{currentPlayingNote.fret}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {/* Play / Pause / Stop buttons */}
          <button
            className={`h-6 px-2 text-[9px] font-bold flex items-center gap-1 border-2 rounded-sm transition-all ${
              isPlaying && playbackMode === 'exercise' && !isPaused
                ? 'bg-[#9b3939] text-white border-[#9b3939]'
                : 'sketch-btn border-[#6b5b47]'
            }`}
            onClick={isPlaying && playbackMode === 'exercise' && !isPaused ? onPause : onPlayExercise}
            title="Play exercise"
          >
            {isPlaying && playbackMode === 'exercise' && !isPaused ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
            {isPlaying && playbackMode === 'exercise' && !isPaused ? '' : '▶'}
          </button>
          <button
            className={`h-6 px-2 text-[9px] font-bold flex items-center gap-1 border-2 rounded-sm transition-all ${
              isPlaying && playbackMode === 'scale' && !isPaused
                ? 'bg-[#4a5a8a] text-white border-[#4a5a8a]'
                : 'sketch-btn border-[#4a5a8a]'
            }`}
            onClick={isPlaying && playbackMode === 'scale' && !isPaused ? onPause : onPlayScale}
            title="Play scale"
          >
            {isPlaying && playbackMode === 'scale' && !isPaused ? <Pause className="w-2.5 h-2.5" /> : <Music className="w-2.5 h-2.5" />}
            {isPlaying && playbackMode === 'scale' && !isPaused ? '' : '♪'}
          </button>
          {isPlaying && (
            <button className="h-6 px-2 text-[9px] font-bold flex items-center gap-1 border-2 rounded-sm bg-[#4a4a4a] text-white border-[#4a4a4a]" onClick={onStop} title="Stop">
              <Square className="w-2.5 h-2.5" />
            </button>
          )}

          {/* Export */}
          <div className="relative" ref={exportMenuRef}>
            <button className="sketch-btn h-6 text-[9px] px-1.5 border-[#c4b89c] text-[#8b7355] flex items-center gap-0.5" onClick={() => setShowExportMenu(!showExportMenu)}>
              <Share2 className="w-2.5 h-2.5" />
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 z-50 sketch-card bg-[#faf6ef] py-1 min-w-[140px]">
                <button className="w-full text-left px-2.5 py-1 text-[9px] text-[#4a4a4a] hover:bg-[rgba(139,115,85,0.1)] flex items-center gap-1.5 font-serif italic" onClick={handleDownloadPNG}><FileImage className="w-2.5 h-2.5" /> PNG</button>
                <button className="w-full text-left px-2.5 py-1 text-[9px] text-[#4a4a4a] hover:bg-[rgba(139,115,85,0.1)] flex items-center gap-1.5 font-serif italic" onClick={handleDownloadSVG}><Download className="w-2.5 h-2.5" /> SVG</button>
                <button className="w-full text-left px-2.5 py-1 text-[9px] text-[#4a4a4a] hover:bg-[rgba(139,115,85,0.1)] flex items-center gap-1.5 font-serif italic" onClick={handleCopyText}><FileText className="w-2.5 h-2.5" /> Text</button>
                <button className="w-full text-left px-2.5 py-1 text-[9px] text-[#4a4a4a] hover:bg-[rgba(139,115,85,0.1)] flex items-center gap-1.5 font-serif italic" onClick={handleCopyImage}><Copy className="w-2.5 h-2.5" /> Image</button>
                <div className="border-t border-[#e8e2d6] my-0.5" />
                <button className="w-full text-left px-2.5 py-1 text-[9px] text-[#4a4a4a] hover:bg-[rgba(139,115,85,0.1)] flex items-center gap-1.5 font-serif italic" onClick={handlePrint}><Printer className="w-2.5 h-2.5" /> Print</button>
              </div>
            )}
          </div>
          {copied && <span className="text-[8px] text-[#4a7a4a] font-serif italic font-bold flex items-center gap-0.5"><Check className="w-2.5 h-2.5" />OK</span>}
        </div>
      </div>

      {/* SVG Tab — compact, properly wrapping */}
      <div ref={tabRef} className="bg-[#faf6ef] overflow-x-auto">
        <svg
          width={svgWidth}
          height={totalHeight}
          viewBox={`0 0 ${svgWidth} ${totalHeight}`}
          className="w-full h-auto"
          style={{ minWidth: Math.min(svgWidth, 400) }}
        >
          {rows.map((rowNotes, rowIdx) => {
            const yOff = rowIdx * (LH + RG);
            const isLast = rowIdx === rows.length - 1;
            const nc = rowNotes.length;

            return (
              <g key={`r${rowIdx}`} transform={`translate(0,${yOff})`}>
                {/* String lines */}
                {stringLabels.map((_, si) => {
                  const y = TM + si * SS;
                  const th = si <= 1 ? 1 : si <= 3 ? 0.7 : 0.4;
                  return <line key={`s${rowIdx}${si}`} x1={LM - 2} y1={y} x2={LM + nc * CW + 2} y2={y} stroke="#6b5b47" strokeWidth={th} strokeLinecap="round" opacity={0.45} />;
                })}

                {/* String labels */}
                {stringLabels.map((l, si) => (
                  <text key={`l${rowIdx}${si}`} x={LM - 6} y={TM + si * SS + 2.5} textAnchor="middle" fill="#6b5b47" fontSize={6} fontWeight="bold" fontFamily="Georgia,serif" fontStyle="italic">{l}</text>
                ))}

                {/* Bar lines */}
                <line x1={LM - 2} y1={TM - 2} x2={LM - 2} y2={TM + 5 * SS + 2} stroke="#6b5b47" strokeWidth={1.2} strokeLinecap="round" />
                <line x1={LM + nc * CW + 2} y1={TM - 2} x2={LM + nc * CW + 2} y2={TM + 5 * SS + 2} stroke={isLast ? '#6b5b47' : '#c4b89c'} strokeWidth={isLast ? 1.5 : 0.8} strokeLinecap="round" />
                {isLast && <line x1={LM + nc * CW + 5} y1={TM - 2} x2={LM + nc * CW + 5} y2={TM + 5 * SS + 2} stroke="#6b5b47" strokeWidth={0.8} strokeLinecap="round" />}

                {/* Notes */}
                {rowNotes.map((note, ni) => {
                  const gi = rowIdx * NPR + ni; // global index — THE ONLY source of truth
                  const x = LM + ni * CW + CW / 2;
                  const y = TM + (5 - note.string) * SS;
                  const isHov = hoveredIdx === gi;
                  const isPlay = showTabHighlight && playingIdx === gi;
                  const isAct = isHov || isPlay;

                  const fs = note.fret.toString();
                  const fz = fs.length > 1 ? 6.5 : 7.5;

                  return (
                    <g key={`n${rowIdx}${ni}`}
                      style={{ cursor: onNoteClick ? 'pointer' : 'default' }}
                      onMouseEnter={() => setHoveredIdx(gi)}
                      onMouseLeave={() => setHoveredIdx(null)}
                      onClick={() => onNoteClick?.(note)}
                    >
                      {isAct && <rect x={x - CW / 2} y={y - SS / 2 + 0.5} width={CW} height={SS - 1} fill={isPlay ? 'rgba(155,57,57,0.2)' : 'rgba(155,57,57,0.08)'} rx={1} />}
                      <text x={x} y={y + 2.5} textAnchor="middle" fill={isAct ? '#9b3939' : '#3a3a3a'} fontSize={fz} fontWeight="bold" fontFamily="'Courier New',monospace" opacity={isAct ? 1 : 0.8}>
                        {fs}
                      </text>
                    </g>
                  );
                })}

                {/* Continuation arrow */}
                {!isLast && <text x={LM + nc * CW + 8} y={TM + 2.5 * SS + 2} fill="#8b7355" fontSize={7} fontFamily="Georgia,serif" fontStyle="italic">→</text>}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
