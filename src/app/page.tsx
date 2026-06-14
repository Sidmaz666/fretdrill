'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  KEY_NAMES,
  KEY_DISPLAY_NAMES,
  SCALES,
  NoteName,
  getCAGEDPositions,
  getScaleOnFretboard,
  FRET_COUNT,
} from '@/lib/music-theory';
import {
  generateExercise,
  generatePatternExercises,
  computeExerciseStats,
  sortNotesAscending,
  ExerciseType,
  EXERCISE_TYPES,
  EXERCISE_CATEGORIES,
  ExerciseNote,
} from '@/lib/exercise-generator';
import FretboardDiagram from '@/components/guitar/FretboardDiagram';
import PatternDiagram from '@/components/guitar/PatternDiagram';
import TabNotation from '@/components/guitar/TabNotation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  ChevronRight,
  Shuffle,
  Music,
  Zap,
  GitBranch,
  Target,
  Layers,
  Route,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  Timer,
  Drum,
  Search,
  Menu,
  X,
  Guitar,
  FileText,
  BarChart3,
  Eye,
  ChevronDown,
  ChevronUp,
  Star,
  ArrowRight,
  Clock,
  Signal,
  Activity,
  Hash,
  Ruler,
  SkipBack, SkipForward, RotateCcw, Repeat, Gauge, Waves, Metronome as MetronomeIcon, Hand, Shuffle as ShuffleIcon, Dice5, TimerReset, Flag, ChevronFirst, ChevronLast, Siren, Disc3, ToggleLeft, Info, BookOpen, ChevronRight as ChevronRightIcon,
} from 'lucide-react';

// ─── AUDIO ENGINE ───
// Proper standard guitar tuning frequencies (Hz) — E2, A2, D3, G3, B3, E4
const STRING_FREQUENCIES = [82.41, 110.00, 146.83, 196.00, 246.94, 329.63];

let audioCtx: AudioContext | null = null;
let masterCompressor: DynamicsCompressorNode | null = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

// Singleton master compressor
function getMaster(ctx: AudioContext): DynamicsCompressorNode {
  if (!masterCompressor) {
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.setValueAtTime(-20, ctx.currentTime);
    comp.knee.setValueAtTime(10, ctx.currentTime);
    comp.ratio.setValueAtTime(4, ctx.currentTime);
    comp.attack.setValueAtTime(0.003, ctx.currentTime);
    comp.release.setValueAtTime(0.15, ctx.currentTime);
    comp.connect(ctx.destination);
    masterCompressor = comp;
  }
  return masterCompressor;
}

function playGuitarNote(stringIdx: number, fret: number, duration: number = 0.5) {
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const master = getMaster(ctx);
    const baseFreq = STRING_FREQUENCIES[stringIdx];
    const freq = baseFreq * Math.pow(2, fret / 12);
    const now = ctx.currentTime;

    // ── Fundamental (pulse wave — close to plucked string) ──
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, now);
    // Slight pitch envelope (attack transient — string stretches then settles)
    osc1.frequency.setValueAtTime(freq * 1.005, now);
    osc1.frequency.exponentialRampToValueAtTime(freq, now + 0.02);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.32, now + 0.004);  // Fast pluck attack
    gain1.gain.exponentialRampToValueAtTime(0.12, now + 0.08);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // ── 2nd harmonic (octave above, softer) ──
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, now);
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.06, now + 0.003);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.4);

    // ── 3rd harmonic ──
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(freq * 3, now);
    gain3.gain.setValueAtTime(0, now);
    gain3.gain.linearRampToValueAtTime(0.025, now + 0.003);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.25);

    // ── Body resonance (low-pass filtered sub-harmonic) ──
    const oscBody = ctx.createOscillator();
    const gainBody = ctx.createGain();
    const filterBody = ctx.createBiquadFilter();
    oscBody.type = 'sine';
    oscBody.frequency.setValueAtTime(freq * 0.5, now);
    filterBody.type = 'lowpass';
    filterBody.frequency.setValueAtTime(300, now);
    filterBody.Q.setValueAtTime(1, now);
    gainBody.gain.setValueAtTime(0, now);
    gainBody.gain.linearRampToValueAtTime(0.04, now + 0.01);
    gainBody.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.4);

    // ── Brightness (sawtooth → lowpass, simulates pick attack brightness) ──
    const oscBright = ctx.createOscillator();
    const gainBright = ctx.createGain();
    const filterBright = ctx.createBiquadFilter();
    oscBright.type = 'sawtooth';
    oscBright.frequency.setValueAtTime(freq, now);
    filterBright.type = 'lowpass';
    filterBright.frequency.setValueAtTime(4000, now);           // Bright attack
    filterBright.frequency.exponentialRampToValueAtTime(800, now + 0.15); // Dulls quickly
    filterBright.Q.setValueAtTime(0.7, now);
    gainBright.gain.setValueAtTime(0, now);
    gainBright.gain.linearRampToValueAtTime(0.05, now + 0.002);
    gainBright.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.3);

    // ── Pluck noise burst (very short, simulates pick/finger noise) ──
    const noiseLen = 0.015;
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * noiseLen, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) noiseData[i] = (Math.random() * 2 - 1) * 0.3;
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    const noiseGain = ctx.createGain();
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(2000 + stringIdx * 500, now); // Higher strings = brighter noise
    noiseFilter.Q.setValueAtTime(2, now);
    noiseGain.gain.setValueAtTime(0.12, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + noiseLen);

    // Connect everything
    osc1.connect(gain1); gain1.connect(master);
    osc2.connect(gain2); gain2.connect(master);
    osc3.connect(gain3); gain3.connect(master);
    oscBody.connect(filterBody); filterBody.connect(gainBody); gainBody.connect(master);
    oscBright.connect(filterBright); filterBright.connect(gainBright); gainBright.connect(master);
    noiseSource.connect(noiseFilter); noiseFilter.connect(noiseGain); noiseGain.connect(master);

    // Start all
    const stopTime = now + duration + 0.1;
    osc1.start(now); osc2.start(now); osc3.start(now); oscBody.start(now); oscBright.start(now); noiseSource.start(now);
    osc1.stop(stopTime); osc2.stop(stopTime); osc3.stop(stopTime); oscBody.stop(stopTime); oscBright.stop(stopTime);
  } catch (e) {}
}

// Professional metronome — wood block sound
function playMetronomeClick(accent: boolean) {
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;

    // Tone component — short sine burst like a wood block
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(accent ? 1567.98 : 1046.50, now); // G6 (accent) / C6 (normal)
    gain.gain.setValueAtTime(accent ? 0.35 : 0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(gain);

    // Click noise burst (the "clack" of the wood block)
    const noiseLen = 0.008;
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * noiseLen, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) noiseData[i] = (Math.random() * 2 - 1);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    const noiseGain = ctx.createGain();
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(accent ? 3000 : 2000, now);
    noiseGain.gain.setValueAtTime(accent ? 0.15 : 0.07, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + noiseLen);
    noiseSource.connect(noiseFilter); noiseFilter.connect(noiseGain);

    // Resonance body
    const oscBody = ctx.createOscillator();
    const gainBody = ctx.createGain();
    oscBody.type = 'sine';
    oscBody.frequency.setValueAtTime(accent ? 800 : 600, now);
    gainBody.gain.setValueAtTime(accent ? 0.08 : 0.04, now);
    gainBody.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    oscBody.connect(gainBody);

    const master = getMaster(ctx);
    gain.connect(master); noiseGain.connect(master); gainBody.connect(master);

    osc.start(now); noiseSource.start(now); oscBody.start(now);
    osc.stop(now + 0.05); oscBody.stop(now + 0.04);
  } catch (e) {}
}

// Extended metronome sound engine with multiple sound types
function playMetronomeClickByType(accent: boolean, soundType: MetronomeSound, volume: number = 0.8) {
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    const master = getMaster(ctx);
    const vol = volume * (accent ? 1.0 : 0.6);

    switch (soundType) {
      case 'classic':
      case 'woodblock': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(accent ? 1567.98 : 1046.50, now);
        gain.gain.setValueAtTime(vol * 0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.connect(gain); gain.connect(master);
        osc.start(now); osc.stop(now + 0.05);
        const noiseLen = 0.008;
        const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * noiseLen, ctx.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseData.length; i++) noiseData[i] = (Math.random() * 2 - 1);
        const noiseSrc = ctx.createBufferSource(); noiseSrc.buffer = noiseBuffer;
        const nGain = ctx.createGain(); const nFilter = ctx.createBiquadFilter();
        nFilter.type = 'highpass'; nFilter.frequency.setValueAtTime(accent ? 3000 : 2000, now);
        nGain.gain.setValueAtTime(vol * 0.15, now); nGain.gain.exponentialRampToValueAtTime(0.001, now + noiseLen);
        noiseSrc.connect(nFilter); nFilter.connect(nGain); nGain.connect(master);
        noiseSrc.start(now);
        const oscBody = ctx.createOscillator(); const gainBody = ctx.createGain();
        oscBody.type = 'sine'; oscBody.frequency.setValueAtTime(accent ? 800 : 600, now);
        gainBody.gain.setValueAtTime(vol * 0.08, now); gainBody.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        oscBody.connect(gainBody); gainBody.connect(master);
        oscBody.start(now); oscBody.stop(now + 0.04);
        break;
      }
      case 'stick': {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.type = 'triangle'; osc.frequency.setValueAtTime(accent ? 4000 : 2500, now);
        gain.gain.setValueAtTime(vol * 0.3, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
        osc.connect(gain); gain.connect(master);
        osc.start(now); osc.stop(now + 0.02);
        const nLen = 0.005; const nBuf = ctx.createBuffer(1, ctx.sampleRate * nLen, ctx.sampleRate);
        const nD = nBuf.getChannelData(0); for (let i = 0; i < nD.length; i++) nD[i] = (Math.random() * 2 - 1);
        const nS = ctx.createBufferSource(); nS.buffer = nBuf;
        const nG = ctx.createGain(); const nF = ctx.createBiquadFilter();
        nF.type = 'bandpass'; nF.frequency.setValueAtTime(accent ? 6000 : 4000, now); nF.Q.setValueAtTime(2, now);
        nG.gain.setValueAtTime(vol * 0.2, now); nG.gain.exponentialRampToValueAtTime(0.001, now + nLen);
        nS.connect(nF); nF.connect(nG); nG.connect(master); nS.start(now);
        break;
      }
      case 'cowbell': {
        const osc1 = ctx.createOscillator(); const gain1 = ctx.createGain();
        const osc2 = ctx.createOscillator(); const gain2 = ctx.createGain();
        osc1.type = 'square'; osc1.frequency.setValueAtTime(accent ? 800 : 540, now);
        gain1.gain.setValueAtTime(vol * 0.15, now); gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc2.type = 'square'; osc2.frequency.setValueAtTime(accent ? 540 : 360, now);
        gain2.gain.setValueAtTime(vol * 0.12, now); gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.setValueAtTime(700, now); bp.Q.setValueAtTime(3, now);
        const bpGain = ctx.createGain(); bpGain.gain.setValueAtTime(vol * 0.3, now); bpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc1.connect(gain1); gain1.connect(bp); osc2.connect(gain2); gain2.connect(bp); bp.connect(bpGain); bpGain.connect(master);
        osc1.start(now); osc2.start(now); osc1.stop(now + 0.15); osc2.stop(now + 0.15);
        break;
      }
      case 'digital': {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.type = 'sine'; osc.frequency.setValueAtTime(accent ? 1200 : 800, now);
        gain.gain.setValueAtTime(vol * 0.25, now); gain.gain.setValueAtTime(vol * 0.25, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.connect(gain); gain.connect(master);
        osc.start(now); osc.stop(now + 0.07);
        break;
      }
      case 'drumstick': {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.type = 'sine'; osc.frequency.setValueAtTime(accent ? 3000 : 1800, now);
        osc.frequency.exponentialRampToValueAtTime(accent ? 1500 : 900, now + 0.01);
        gain.gain.setValueAtTime(vol * 0.25, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
        osc.connect(gain); gain.connect(master);
        osc.start(now); osc.stop(now + 0.03);
        const body = ctx.createOscillator(); const bGain = ctx.createGain();
        body.type = 'sine'; body.frequency.setValueAtTime(accent ? 200 : 150, now);
        bGain.gain.setValueAtTime(vol * 0.1, now); bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        body.connect(bGain); bGain.connect(master);
        body.start(now); body.stop(now + 0.04);
        break;
      }
      case 'hihat': {
        const nLen = accent ? 0.06 : 0.03;
        const nBuf = ctx.createBuffer(1, ctx.sampleRate * nLen, ctx.sampleRate);
        const nD = nBuf.getChannelData(0); for (let i = 0; i < nD.length; i++) nD[i] = (Math.random() * 2 - 1);
        const nS = ctx.createBufferSource(); nS.buffer = nBuf;
        const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.setValueAtTime(accent ? 8000 : 6000, now);
        const nG = ctx.createGain(); nG.gain.setValueAtTime(vol * 0.15, now); nG.gain.exponentialRampToValueAtTime(0.001, now + nLen);
        nS.connect(hp); hp.connect(nG); nG.connect(master); nS.start(now);
        const osc = ctx.createOscillator(); const g = ctx.createGain();
        osc.type = 'square'; osc.frequency.setValueAtTime(accent ? 6000 : 4000, now);
        g.gain.setValueAtTime(vol * 0.04, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.01);
        osc.connect(g); g.connect(master); osc.start(now); osc.stop(now + 0.02);
        break;
      }
      case 'electronic': {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.type = 'square'; osc.frequency.setValueAtTime(accent ? 1000 : 660, now);
        gain.gain.setValueAtTime(vol * 0.12, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
        osc.connect(gain); gain.connect(master);
        osc.start(now); osc.stop(now + 0.025);
        break;
      }
      case 'mechanical': {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.type = 'sine';
        const freq = accent ? 2200 : 1600;
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.6, now + 0.02);
        gain.gain.setValueAtTime(vol * 0.3, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(3000, now);
        osc.connect(lp); lp.connect(gain); gain.connect(master);
        osc.start(now); osc.stop(now + 0.06);
        const res = ctx.createOscillator(); const rGain = ctx.createGain();
        res.type = 'sine'; res.frequency.setValueAtTime(accent ? 400 : 300, now);
        rGain.gain.setValueAtTime(vol * 0.06, now); rGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        res.connect(rGain); rGain.connect(master);
        res.start(now); res.stop(now + 0.1);
        break;
      }
    }
  } catch (e) {}
}

// ─── INTERVAL COLOR ───
function getIntervalColor(label: string): string {
  if (label === 'R') return '#9b3939';
  if (label.includes('\u266D3') || label.includes('\u266D2')) return '#6b4a7a';
  if (label === '3' || label === '2') return '#4a7a4a';
  if (label === '4') return '#4a5a8a';
  if (label === '5') return '#4a7a7a';
  if (label.includes('5')) return '#4a7a7a';
  if (label.includes('6')) return '#8a6a3a';
  if (label.includes('7')) return '#7a4a6a';
  if (label.includes('\u266F') || label.includes('\u266D')) return '#6b4a7a';
  return '#5a5a6a';
}

// Difficulty stars
function DifficultyBadge({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className={`w-1.5 h-1.5 rounded-sm ${i <= level ? 'bg-[#9b3939]' : 'bg-[#e8e2d6]'}`} />
      ))}
    </div>
  );
}

// ─── VIEW MODES ───
type ViewMode = 'fretboard' | 'tab' | 'hybrid' | 'analysis';

type MetronomeSound = 'classic' | 'woodblock' | 'stick' | 'cowbell' | 'digital' | 'drumstick' | 'hihat' | 'electronic' | 'mechanical';
type Subdivision = 'quarter' | 'eighth' | 'triplets' | 'sixteenth' | 'quintuplets' | 'sextuplets';
type TimeSignatureDisplay = '2/4' | '3/4' | '4/4' | '5/4' | '6/8' | '7/8' | '9/8' | '12/8';
type AccentMode = 'first' | 'every-n' | 'random' | 'none';
type PracticeMode = 'none' | 'tempo-trainer' | 'speed-burst' | 'random-tempo';

interface TempoTrainerConfig {
  startBpm: number;
  targetBpm: number;
  stepSize: number;
  increaseEveryN: number;
  currentReps: number;
  isActive: boolean;
}

interface SpeedBurstConfig {
  burstBpm: number;
  burstEveryN: number;
  burstLength: number;
  currentCount: number;
  isInBurst: boolean;
  isActive: boolean;
}

interface RandomTempoConfig {
  minBpm: number;
  maxBpm: number;
  isActive: boolean;
}

interface PracticeGoals {
  targetReps: number;
  targetBpm: number;
  targetDuration: number; // seconds
}

interface GapClickConfig {
  barsClick: number;
  barsSilent: number;
  currentBar: number;
  isActive: boolean;
}

interface PolyrhythmConfig {
  ratio: '3:2' | '5:4' | '7:4' | '3:4';
  isActive: boolean;
}

const METRONOME_SOUNDS: { value: MetronomeSound; label: string }[] = [
  { value: 'classic', label: 'Classic Click' },
  { value: 'woodblock', label: 'Wood Block' },
  { value: 'stick', label: 'Stick Click' },
  { value: 'cowbell', label: 'Cowbell' },
  { value: 'digital', label: 'Digital Beep' },
  { value: 'drumstick', label: 'Drum Stick' },
  { value: 'hihat', label: 'Hi-Hat' },
  { value: 'electronic', label: 'Electronic Click' },
  { value: 'mechanical', label: 'Mechanical' },
];

const SUBDIVISIONS: { value: Subdivision; label: string; factor: number }[] = [
  { value: 'quarter', label: 'Quarter', factor: 1 },
  { value: 'eighth', label: 'Eighth', factor: 2 },
  { value: 'triplets', label: 'Triplets', factor: 3 },
  { value: 'sixteenth', label: '16th', factor: 4 },
  { value: 'quintuplets', label: '5-tuplet', factor: 5 },
  { value: 'sextuplets', label: '6-tuplet', factor: 6 },
];

const TIME_SIGNATURES: { value: TimeSignatureDisplay; beats: number; noteValue: number }[] = [
  { value: '2/4', beats: 2, noteValue: 4 },
  { value: '3/4', beats: 3, noteValue: 4 },
  { value: '4/4', beats: 4, noteValue: 4 },
  { value: '5/4', beats: 5, noteValue: 4 },
  { value: '6/8', beats: 6, noteValue: 8 },
  { value: '7/8', beats: 7, noteValue: 8 },
  { value: '9/8', beats: 9, noteValue: 8 },
  { value: '12/8', beats: 12, noteValue: 8 },
];

const POLYRHYTHM_RATIOS = ['3:2', '5:4', '7:4', '3:4'] as const;

// ─── MAIN COMPONENT ───
export default function Home() {
  // Core state
  const [keyIndex, setKeyIndex] = useState(9);
  const [scaleId, setScaleId] = useState('minor-pentatonic');
  const [positionIndex, setPositionIndex] = useState(0);
  const [exerciseType, setExerciseType] = useState<ExerciseType>('scale-asc-desc');
  const [showAllPositions, setShowAllPositions] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('hybrid');

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [playingIdx, setPlayingIdx] = useState(-1);
  const [playbackMode, setPlaybackMode] = useState<'idle' | 'exercise' | 'scale'>('idle');
  const [playbackActiveNote, setPlaybackActiveNote] = useState<{ string: number; fret: number } | null>(null);
  const [clickActiveNote, setClickActiveNote] = useState<{ string: number; fret: number } | null>(null);
  const playbackRef = useRef<{ playing: boolean; notes: ExerciseNote[]; idx: number; timeoutId: number | null }>({
    playing: false, notes: [], idx: 0, timeoutId: null,
  });

  // BPM & Metronome
  const [bpm, setBpm] = useState(100);
  const [metronomeOn, setMetronomeOn] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(-1);
  const [timeSignature, setTimeSignature] = useState(4);
  const metronomeRef = useRef(false);
  const metronomeTimeoutRef = useRef<number | null>(null);
  const beatCountRef = useRef(0);
  const tapTimes = useRef<number[]>([]);

  // Metronome Settings
  const [metronomeSound, setMetronomeSound] = useState<MetronomeSound>('classic');
  const [subdivision, setSubdivision] = useState<Subdivision>('quarter');
  const [timeSignatureDisplay, setTimeSignatureDisplay] = useState<TimeSignatureDisplay>('4/4');
  const [accentMode, setAccentMode] = useState<AccentMode>('first');
  const [accentEveryN, setAccentEveryN] = useState(4);
  const [metronomeVolume, setMetronomeVolume] = useState(0.8);

  // Practice Tools
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('none');
  const [tempoTrainer, setTempoTrainer] = useState<TempoTrainerConfig>({
    startBpm: 80, targetBpm: 140, stepSize: 5, increaseEveryN: 2, currentReps: 0, isActive: false,
  });
  const [speedBurst, setSpeedBurst] = useState<SpeedBurstConfig>({
    burstBpm: 120, burstEveryN: 3, burstLength: 1, currentCount: 0, isInBurst: false, isActive: false,
  });
  const [randomTempo, setRandomTempo] = useState<RandomTempoConfig>({
    minBpm: 70, maxBpm: 130, isActive: false,
  });
  const [repetitionCount, setRepetitionCount] = useState(0);
  const [repetitionGoal, setRepetitionGoal] = useState(20);
  const [practiceTimer, setPracticeTimer] = useState(0);
  const [practiceTimerActive, setPracticeTimerActive] = useState(false);
  const [practiceGoals] = useState<PracticeGoals>({
    targetReps: 20, targetBpm: 140, targetDuration: 1800,
  });

  // Advanced Metronome
  const [gapClick, setGapClick] = useState<GapClickConfig>({
    barsClick: 2, barsSilent: 2, currentBar: 0, isActive: false,
  });
  const [silentMeasureEnabled, setSilentMeasureEnabled] = useState(false);
  const [silentEveryN, setSilentEveryN] = useState(2);
  const [randomAccent, setRandomAccent] = useState(false);
  const [polyrhythm, setPolyrhythm] = useState<PolyrhythmConfig>({
    ratio: '3:2', isActive: false,
  });

  // UI State for Practice Engine
  const [practicePanelOpen, setPracticePanelOpen] = useState(false);
  const [advancedMetronomeOpen, setAdvancedMetronomeOpen] = useState(false);
  const [bpmEditing, setBpmEditing] = useState(false);
  const [bpmInput, setBpmInput] = useState('');
  const [mobileMetronomeSheetOpen, setMobileMetronomeSheetOpen] = useState(false);

  // Refs for practice timers
  const practiceTimerRef = useRef<number | null>(null);
  const repCountRef = useRef(0);
  const measureCountRef = useRef(0);

  // Session timer
  const [sessionStart] = useState(Date.now());
  const [sessionElapsed, setSessionElapsed] = useState(0);
  const [exercisesPlayed, setExercisesPlayed] = useState(0);

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string>('scale-runs');
  const [rightPanelExpanded, setRightPanelExpanded] = useState(true);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [infoPageOpen, setInfoPageOpen] = useState(false);

  // Derived state
  const keyNote = KEY_NAMES[keyIndex];
  const scale = SCALES[scaleId];
  const positions = useMemo(() => getCAGEDPositions(keyNote, scaleId), [keyNote, scaleId]);
  const currentPosition = positions[positionIndex] || { fretStart: 0, fretEnd: FRET_COUNT, name: 'Full Fretboard' };
  const startFret = showAllPositions ? 0 : currentPosition.fretStart;
  const endFret = showAllPositions ? FRET_COUNT : currentPosition.fretEnd;

  // Current exercise
  const currentExercise = useMemo(
    () => generateExercise(exerciseType, keyNote, scaleId, positionIndex),
    [exerciseType, keyNote, scaleId, positionIndex]
  );

  // Exercise stats (verbose, nerdy)
  const exerciseStats = useMemo(() => computeExerciseStats(currentExercise), [currentExercise]);

  // Exercise type metadata
  const exerciseMeta = EXERCISE_TYPES[exerciseType];

  // Breadcrumb
  const exerciseCategory = useMemo(() => {
    for (const cat of EXERCISE_CATEGORIES) {
      if (cat.types.includes(exerciseType)) return cat;
    }
    return EXERCISE_CATEGORIES[0];
  }, [exerciseType]);

  // Scale notes for playback
  const scaleNotesForPlayback = useMemo(() => {
    const notes = getScaleOnFretboard(keyNote, scaleId, startFret, endFret);
    const sorted = sortNotesAscending(notes);
    const ascDesc = [...sorted, ...sorted.slice(0, -1).reverse()];
    return ascDesc.map((n, i) => ({
      string: n.string, fret: n.fret, note: n.note, intervalLabel: n.intervalLabel, isRoot: n.isRoot, sequenceNumber: i + 1,
    }));
  }, [keyNote, scaleId, startFret, endFret]);

  const exerciseHighlightNotes = useMemo(() => {
    if (!currentExercise || !currentExercise.notes.length) return undefined;
    const allScaleNotes = getScaleOnFretboard(keyNote, scaleId, 0, FRET_COUNT);
    const exerciseNoteKeys = new Set(currentExercise.notes.map(n => `${n.string}-${n.fret}`));
    return allScaleNotes.filter(n => exerciseNoteKeys.has(`${n.string}-${n.fret}`));
  }, [currentExercise, keyNote, scaleId]);

  const exercisePath = useMemo(() => {
    if (!currentExercise || !currentExercise.notes.length) return undefined;
    const seen = new Set<string>();
    const path: Array<{ string: number; fret: number; sequenceNumber?: number }> = [];
    for (const note of currentExercise.notes) {
      const key = `${note.string}-${note.fret}`;
      if (!seen.has(key)) { seen.add(key); path.push({ string: note.string, fret: note.fret, sequenceNumber: note.sequenceNumber }); }
    }
    return path;
  }, [currentExercise]);

  const patternExercises = useMemo(() => generatePatternExercises(keyNote, scaleId), [keyNote, scaleId]);

  const scaleNotes = useMemo(() => {
    return scale.intervals.map(interval => {
      const noteIndex = (KEY_NAMES.indexOf(keyNote) + interval) % 12;
      return KEY_NAMES[noteIndex];
    });
  }, [keyNote, scale]);

  const effectiveActiveNote = playbackActiveNote || (isPlaying ? null : clickActiveNote);

  // Session timer
  useEffect(() => {
    const interval = setInterval(() => setSessionElapsed(Math.floor((Date.now() - sessionStart) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [sessionStart]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // ─── HANDLERS ───

  const handleRandomize = useCallback(() => {
    const types = Object.keys(EXERCISE_TYPES) as ExerciseType[];
    setExerciseType(types[Math.floor(Math.random() * types.length)]);
    setExercisesPlayed(p => p + 1);
  }, []);


  const handleFretboardNoteClick = useCallback((note: { string: number; fret: number }) => {
    if (soundEnabled) playGuitarNote(note.string, note.fret, 0.6);
    setClickActiveNote(prev => prev && prev.string === note.string && prev.fret === note.fret ? null : note);
  }, [soundEnabled]);

  const handleTabNoteClick = useCallback((note: ExerciseNote) => {
    if (soundEnabled) playGuitarNote(note.string, note.fret, 0.6);
    if (!isPlaying) { setClickActiveNote({ string: note.string, fret: note.fret }); setTimeout(() => setClickActiveNote(null), 1500); }
  }, [soundEnabled, isPlaying]);

  const handlePatternClick = useCallback((posIdx: number) => { setPositionIndex(posIdx); setShowAllPositions(false); }, []);

  // ─── PLAYBACK ENGINE ───
  const stopPlayback = useCallback(() => {
    playbackRef.current.playing = false;
    if (playbackRef.current.timeoutId) { clearTimeout(playbackRef.current.timeoutId); playbackRef.current.timeoutId = null; }
    setIsPlaying(false); setIsPaused(false); setPlayingIdx(-1); setPlaybackMode('idle'); setPlaybackActiveNote(null);
  }, []);

  const startPlayback = useCallback((mode: 'exercise' | 'scale', startFromIdx: number = 0) => {
    stopPlayback(); setClickActiveNote(null);
    const notes = mode === 'exercise' ? currentExercise.notes : scaleNotesForPlayback;
    if (!notes.length) return;
    setIsPlaying(true); setIsPaused(false); setPlaybackMode(mode);
    if (mode === 'exercise') setExercisesPlayed(p => p + 1);
    playbackRef.current = { playing: true, notes, idx: startFromIdx, timeoutId: null };
    const intervalMs = (60 / bpm) * 1000;
    const playNext = () => {
      if (!playbackRef.current.playing) return;
      const idx = playbackRef.current.idx;
      if (idx >= notes.length) { stopPlayback(); return; }
      const note = notes[idx];
      setPlayingIdx(idx); setPlaybackActiveNote({ string: note.string, fret: note.fret });
      if (soundEnabled) playGuitarNote(note.string, note.fret, Math.min(intervalMs / 1000 * 0.8, 0.6));
      playbackRef.current.idx = idx + 1;
      playbackRef.current.timeoutId = window.setTimeout(playNext, intervalMs);
    };
    playNext();
  }, [currentExercise, scaleNotesForPlayback, bpm, soundEnabled, stopPlayback]);

  const togglePausePlayback = useCallback(() => {
    if (isPaused) {
      setIsPaused(false); playbackRef.current.playing = true;
      const notes = playbackRef.current.notes; const intervalMs = (60 / bpm) * 1000;
      const playNext = () => {
        if (!playbackRef.current.playing) return;
        const idx = playbackRef.current.idx;
        if (idx >= notes.length) { stopPlayback(); return; }
        const note = notes[idx];
        setPlayingIdx(idx); setPlaybackActiveNote({ string: note.string, fret: note.fret });
        if (soundEnabled) playGuitarNote(note.string, note.fret, Math.min(intervalMs / 1000 * 0.8, 0.6));
        playbackRef.current.idx = idx + 1;
        playbackRef.current.timeoutId = window.setTimeout(playNext, intervalMs);
      };
      playNext();
    } else {
      playbackRef.current.playing = false;
      if (playbackRef.current.timeoutId) { clearTimeout(playbackRef.current.timeoutId); playbackRef.current.timeoutId = null; }
      setIsPaused(true);
    }
  }, [isPaused, bpm, soundEnabled, stopPlayback]);

  const handlePlayExercise = useCallback(() => {
    if (isPlaying && playbackMode === 'exercise') { togglePausePlayback(); }
    else if (isPlaying) { stopPlayback(); startPlayback('exercise'); }
    else { startPlayback('exercise'); }
  }, [isPlaying, playbackMode, togglePausePlayback, stopPlayback, startPlayback]);

  const handlePlayScale = useCallback(() => {
    if (isPlaying && playbackMode === 'scale') { togglePausePlayback(); }
    else if (isPlaying) { stopPlayback(); startPlayback('scale'); }
    else { startPlayback('scale'); }
  }, [isPlaying, playbackMode, togglePausePlayback, stopPlayback, startPlayback]);

  // ─── METRONOME ───
  const startMetronome = useCallback(() => {
    metronomeRef.current = true; beatCountRef.current = 0; setMetronomeOn(true);
    const tick = () => {
      if (!metronomeRef.current) return;
      const accent = beatCountRef.current % timeSignature === 0;
      setCurrentBeat(beatCountRef.current % timeSignature);
      if (soundEnabled) playMetronomeClick(accent);
      beatCountRef.current++;
      metronomeTimeoutRef.current = window.setTimeout(tick, (60 / bpm) * 1000);
    };
    tick();
  }, [bpm, soundEnabled, timeSignature]);

  const stopMetronome = useCallback(() => {
    metronomeRef.current = false;
    if (metronomeTimeoutRef.current) clearTimeout(metronomeTimeoutRef.current);
    setMetronomeOn(false); setCurrentBeat(-1);
  }, []);

  const toggleMetronome = useCallback(() => { if (metronomeOn) stopMetronome(); else startMetronome(); }, [metronomeOn, startMetronome, stopMetronome]);

  useEffect(() => { return () => { playbackRef.current.playing = false; metronomeRef.current = false; }; }, []);

  const handleTapTempo = useCallback(() => {
    const now = Date.now();
    if (tapTimes.current.length > 0 && now - tapTimes.current[tapTimes.current.length - 1] > 2000) tapTimes.current = [];
    tapTimes.current.push(now);
    if (tapTimes.current.length > 5) tapTimes.current.shift();
    if (tapTimes.current.length >= 2) {
      const intervals = [];
      for (let i = 1; i < tapTimes.current.length; i++) intervals.push(tapTimes.current[i] - tapTimes.current[i - 1]);
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      setBpm(Math.max(40, Math.min(220, Math.round(60000 / avgInterval))));
    }
  }, []);

  // Parse time signature display to beats count
  const getTimeSignatureBeats = useCallback((ts: TimeSignatureDisplay): number => {
    const found = TIME_SIGNATURES.find(t => t.value === ts);
    return found ? found.beats : 4;
  }, []);

  // Get subdivision interval factor
  const getSubdivisionFactor = useCallback((sub: Subdivision): number => {
    const found = SUBDIVISIONS.find(s => s.value === sub);
    return found ? found.factor : 1;
  }, []);

  // Handle time signature change
  const handleTimeSignatureChange = useCallback((ts: TimeSignatureDisplay) => {
    setTimeSignatureDisplay(ts);
    setTimeSignature(getTimeSignatureBeats(ts));
  }, [getTimeSignatureBeats]);

  // Handle BPM edit
  const handleBpmClick = useCallback(() => {
    setBpmEditing(true);
    setBpmInput(String(bpm));
  }, [bpm]);

  const handleBpmSubmit = useCallback(() => {
    const val = parseInt(bpmInput, 10);
    if (!isNaN(val)) setBpm(Math.max(30, Math.min(300, val)));
    setBpmEditing(false);
  }, [bpmInput]);

  const handleBpmKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleBpmSubmit();
    else if (e.key === 'Escape') setBpmEditing(false);
    else if (e.key === 'ArrowUp') { e.preventDefault(); setBpm(prev => Math.min(300, prev + 1)); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setBpm(prev => Math.max(30, prev - 1)); }
  }, [handleBpmSubmit]);

  // Enhanced metronome with subdivision support
  const startEnhancedMetronome = useCallback(() => {
    metronomeRef.current = true;
    beatCountRef.current = 0;
    measureCountRef.current = 0;
    repCountRef.current = 0;
    setMetronomeOn(true);
    setRepetitionCount(0);

    const beats = getTimeSignatureBeats(timeSignatureDisplay);
    const subFactor = getSubdivisionFactor(subdivision);
    const baseInterval = (60 / bpm) * 1000;
    const subInterval = baseInterval / subFactor;
    let subBeatInMeasure = 0;

    const tick = () => {
      if (!metronomeRef.current) return;

      const currentBeatInMeasure = subBeatInMeasure % beats;
      const isDownbeat = currentBeatInMeasure === 0;
      const isSubBeat = subBeatInMeasure % subFactor !== 0;

      // Determine if this beat should be silent (gap click / silent measure)
      let shouldClick = true;
      if (gapClick.isActive) {
        const totalBars = gapClick.barsClick + gapClick.barsSilent;
        const currentBarCycle = measureCountRef.current % totalBars;
        if (currentBarCycle >= gapClick.barsClick) shouldClick = false;
      }
      if (silentMeasureEnabled) {
        const cyclePos = measureCountRef.current % (silentEveryN + 1);
        if (cyclePos === silentEveryN) shouldClick = false;
      }

      // Only show visual beat on main beats (not subdivisions)
      if (!isSubBeat) {
        setCurrentBeat(currentBeatInMeasure);

        // Track measures
        if (isDownbeat && subBeatInMeasure > 0) {
          measureCountRef.current++;
          repCountRef.current++;
          setRepetitionCount(repCountRef.current);

          // Practice mode logic
          if (practiceMode === 'tempo-trainer' && tempoTrainer.isActive) {
            if (repCountRef.current % tempoTrainer.increaseEveryN === 0) {
              const newBpm = Math.min(tempoTrainer.targetBpm, bpm + tempoTrainer.stepSize);
              if (newBpm !== bpm) setBpm(newBpm);
            }
          }
          if (practiceMode === 'speed-burst' && speedBurst.isActive) {
            const newCount = speedBurst.currentCount + 1;
            if (newCount >= speedBurst.burstEveryN && !speedBurst.isInBurst) {
              setSpeedBurst(prev => ({ ...prev, isInBurst: true, currentCount: 0 }));
            } else if (speedBurst.isInBurst && newCount >= speedBurst.burstLength) {
              setSpeedBurst(prev => ({ ...prev, isInBurst: false, currentCount: 0 }));
            } else {
              setSpeedBurst(prev => ({ ...prev, currentCount: newCount }));
            }
          }
          if (practiceMode === 'random-tempo' && randomTempo.isActive && isDownbeat) {
            const range = randomTempo.maxBpm - randomTempo.minBpm;
            const newBpm = Math.round(randomTempo.minBpm + Math.random() * range);
            setBpm(newBpm);
          }
        }
      }

      // Determine accent
      let accent = isDownbeat && !isSubBeat;
      if (accentMode === 'every-n' && !isSubBeat) {
        accent = (beatCountRef.current % accentEveryN) === 0;
      }
      if (accentMode === 'none') accent = false;
      if (randomAccent && !isSubBeat) accent = Math.random() > 0.7;

      // Play the click sound
      if (soundEnabled && shouldClick) {
        playMetronomeClickByType(accent, metronomeSound, metronomeVolume);
      }

      // Polyrhythm secondary pulse
      if (polyrhythm.isActive && !isSubBeat) {
        const [a, b] = polyrhythm.ratio.split(':').map(Number);
        if (beatCountRef.current % b === 0 && soundEnabled && shouldClick) {
          playMetronomeClickByType(false, metronomeSound, metronomeVolume * 0.3);
        }
      }

      if (!isSubBeat) beatCountRef.current++;
      subBeatInMeasure++;

      // Calculate interval - use effective BPM for speed burst
      const effectiveBpm = (practiceMode === 'speed-burst' && speedBurst.isInBurst) ? speedBurst.burstBpm : bpm;
      const currentInterval = (60 / effectiveBpm) * 1000 / subFactor;

      metronomeTimeoutRef.current = window.setTimeout(tick, currentInterval);
    };
    tick();
  }, [bpm, soundEnabled, timeSignatureDisplay, subdivision, metronomeSound, metronomeVolume, accentMode, accentEveryN, randomAccent, gapClick, silentMeasureEnabled, silentEveryN, polyrhythm, practiceMode, tempoTrainer, speedBurst, randomTempo, getTimeSignatureBeats, getSubdivisionFactor]);

  // Replace the existing toggleMetronome to use enhanced version
  const toggleEnhancedMetronome = useCallback(() => {
    if (metronomeOn) {
      stopMetronome();
      setPracticeMode('none');
      setTempoTrainer(prev => ({ ...prev, isActive: false }));
      setSpeedBurst(prev => ({ ...prev, isActive: false }));
      setRandomTempo(prev => ({ ...prev, isActive: false }));
    } else {
      startEnhancedMetronome();
    }
  }, [metronomeOn, stopMetronome, startEnhancedMetronome]);

  // Restart metronome when BPM or time signature changes
  useEffect(() => { if (metronomeOn) { stopMetronome(); startEnhancedMetronome(); } }, [bpm, timeSignature, stopMetronome, startEnhancedMetronome]); // eslint-disable-line

  // Practice timer
  useEffect(() => {
    if (practiceTimerActive) {
      practiceTimerRef.current = window.setInterval(() => {
        setPracticeTimer(prev => prev + 1);
      }, 1000);
    } else if (practiceTimerRef.current) {
      clearInterval(practiceTimerRef.current);
      practiceTimerRef.current = null;
    }
    return () => { if (practiceTimerRef.current) clearInterval(practiceTimerRef.current); };
  }, [practiceTimerActive]);

  // Auto-start practice timer when metronome starts
  useEffect(() => {
    if (metronomeOn) setPracticeTimerActive(true);
  }, [metronomeOn]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case ' ':
          e.preventDefault();
          if (isPlaying) togglePausePlayback();
          else startPlayback('exercise');
          break;
        case 'Escape':
          stopPlayback();
          if (metronomeOn) stopMetronome();
          break;
        case 'm': case 'M':
          toggleEnhancedMetronome();
          break;
        case 'ArrowLeft':
          if (e.shiftKey) setBpm(prev => Math.max(30, prev - 5));
          else setBpm(prev => Math.max(30, prev - 1));
          break;
        case 'ArrowRight':
          if (e.shiftKey) setBpm(prev => Math.min(300, prev + 5));
          else setBpm(prev => Math.min(300, prev + 1));
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, metronomeOn, togglePausePlayback, startPlayback, stopPlayback, stopMetronome, toggleEnhancedMetronome]);

  // Filtered exercises for search
  const filteredCategories = useMemo(() => {
    if (!exerciseSearch.trim()) return EXERCISE_CATEGORIES;
    const q = exerciseSearch.toLowerCase();
    return EXERCISE_CATEGORIES.map(cat => ({
      ...cat,
      types: cat.types.filter(t => EXERCISE_TYPES[t].name.toLowerCase().includes(q) || EXERCISE_TYPES[t].description.toLowerCase().includes(q)),
    })).filter(cat => cat.types.length > 0);
  }, [exerciseSearch]);

  // Group categories by section
  const sectionGroups = useMemo(() => {
    const groups: Array<{ section: string; categories: typeof EXERCISE_CATEGORIES }> = [];
    for (const cat of filteredCategories) {
      const existing = groups.find(g => g.section === cat.section);
      if (existing) existing.categories.push(cat);
      else groups.push({ section: cat.section, categories: [cat] });
    }
    return groups;
  }, [filteredCategories]);

  // ─── RENDER ───
  return (
    <div className="h-screen flex flex-col bg-[#f5f0e8] text-[#2c2c2c] overflow-hidden">

      {/* ═══ TOP STICKY GLOBAL CONTEXT BAR ═══ */}
      <header className="border-b-2 border-[#8b7355] bg-[#faf6ef] shrink-0 z-40">
        <div className="px-3 py-1.5 flex items-center gap-2">
          <button className="lg:hidden sketch-btn p-1 border-[#c4b89c]" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-6 h-6 rounded-sm border-2 border-[#8b7355] flex items-center justify-center bg-[#f5f0e8]">
              <Guitar className="w-3.5 h-3.5 text-[#6b5b47]" />
            </div>
            <h1 className="text-[12px] font-bold text-[#2c2c2c] hidden sm:block" style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic' }}>FretBoard Forge</h1>
          </div>
          <div className="w-px h-5 bg-[#c4b89c] hidden md:block" />
          {/* Key */}
          <div className="hidden md:flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] uppercase tracking-[0.1em] text-[#8b7355] font-serif italic font-bold">Key</span>
            <Select value={String(keyIndex)} onValueChange={(v) => { const idx = parseInt(v, 10); if (!isNaN(idx)) { setKeyIndex(idx); setPositionIndex(0); stopPlayback(); } }}>
              <SelectTrigger className="bg-[#f5f0e8] border-[#c4b89c] text-[#2c2c2c] text-[11px] rounded-sm h-6 w-[80px] cursor-pointer"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#faf6ef] border-[#c4b89c]">
                {KEY_DISPLAY_NAMES.map((key, idx) => (
                  <SelectItem key={idx} value={String(idx)} className="text-[11px] text-[#2c2c2c] cursor-pointer">{key}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-px h-5 bg-[#c4b89c] hidden md:block" />
          {/* Scale */}
          <div className="hidden md:flex items-center gap-1 shrink-0">
            <span className="text-[10px] uppercase tracking-[0.1em] text-[#8b7355] font-serif italic font-bold">Scale</span>
            <Select value={scaleId} onValueChange={(v) => { setScaleId(v); setPositionIndex(0); stopPlayback(); }}>
              <SelectTrigger className="bg-[#f5f0e8] border-[#c4b89c] text-[#2c2c2c] text-[11px] rounded-sm h-6 w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#faf6ef] border-[#c4b89c]">
                {Object.entries(SCALES).map(([id, s]) => (
                  <SelectItem key={id} value={id} className="text-[11px] text-[#2c2c2c]">{s.name} ({s.intervals.length})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-px h-5 bg-[#c4b89c] hidden md:block" />
          {/* Position */}
          <div className="hidden md:flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] uppercase tracking-[0.1em] text-[#8b7355] font-serif italic font-bold">Pos</span>
            <div className="flex items-center gap-1">
              {positions.map((_, idx) => (
                <button key={idx} className={`h-6 w-7 text-[10px] font-semibold rounded-sm transition-all border p-0 cursor-pointer ${!showAllPositions && positionIndex === idx ? 'sketch-btn-active border-[#6b5b47]' : 'sketch-btn border-[#c4b89c] hover:border-[#8b7355]'}`}
                  onClick={() => { setPositionIndex(idx); setShowAllPositions(false); stopPlayback(); }}>{idx + 1}</button>
              ))}
              <button className={`h-6 px-2 text-[10px] font-semibold rounded-sm transition-all border p-0 cursor-pointer ${showAllPositions ? 'sketch-btn-active border-[#6b5b47]' : 'sketch-btn border-[#c4b89c] hover:border-[#8b7355]'}`}
                onClick={() => { setShowAllPositions(true); stopPlayback(); }}>All</button>
            </div>
          </div>
          {/* Mobile context pill */}
          <div className="md:hidden flex-1 flex items-center justify-center">
            <span className="text-[11px] font-serif italic text-[#4a4a4a] font-bold">{keyNote} {scale.name} · P{positionIndex + 1}</span>
          </div>
          <div className="flex-1 hidden md:block" />
          <div className="hidden lg:flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] text-[#8b7355] font-serif italic">{currentPosition.name} · Frets {currentPosition.fretStart}–{currentPosition.fretEnd}</span>
            <span className="text-[10px] text-[#b8a88a] font-serif italic">· {Object.keys(EXERCISE_TYPES).length} exercises</span>
          </div>
          <button className={`sketch-btn px-1.5 py-0.5 text-[10px] flex items-center gap-0.5 shrink-0 ${soundEnabled ? 'border-[#6b5b47]' : 'border-[#c4b89c] opacity-50'}`}
            onClick={() => setSoundEnabled(!soundEnabled)}>
            {soundEnabled ? <Volume2 className="w-2.5 h-2.5" /> : <VolumeX className="w-2.5 h-2.5" />}
          </button>
          <button className="sketch-btn px-1.5 py-0.5 text-[10px] flex items-center gap-0.5 shrink-0 border-[#8b7355]"
            onClick={() => setInfoPageOpen(true)} title="App Guide & Documentation">
            <Info className="w-2.5 h-2.5" />
            <span className="hidden sm:inline text-[9px] font-serif italic">Guide</span>
          </button>
        </div>
      </header>

      {/* ═══ MAIN WORK AREA ═══ */}
      <div className="flex-1 flex overflow-hidden">

        {/* ─── LEFT SIDEBAR ─── */}
        {sidebarOpen && <div className="lg:hidden fixed inset-0 z-30 bg-black/30" onClick={() => setSidebarOpen(false)} />}
        <aside className={`fixed lg:relative inset-y-0 left-0 z-30 lg:z-0 w-[250px] lg:w-[250px] shrink-0 bg-[#faf6ef] border-r-2 border-[#8b7355] overflow-y-auto transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} pt-[38px] lg:pt-0`}>
          <div className="p-2.5 pb-16 space-y-1.5">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] uppercase tracking-[0.15em] text-[#8b7355] font-serif italic font-bold">Exercise Library</h3>
              <button className="lg:hidden" onClick={() => setSidebarOpen(false)}><X className="w-3.5 h-3.5 text-[#8b7355]" /></button>
            </div>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-[#8b7355]" />
              <input type="text" placeholder="Search..." value={exerciseSearch} onChange={e => setExerciseSearch(e.target.value)}
                className="w-full pl-5 pr-2 py-1 text-[10px] bg-[#f5f0e8] border border-[#c4b89c] rounded-sm focus:outline-none focus:border-[#8b7355] font-serif italic" />
            </div>
            {/* Random */}
            <button className="sketch-btn w-full text-[10px] py-1 border-[#8b7355] text-[#6b5b47] font-semibold flex items-center justify-center gap-1" onClick={handleRandomize}>
              <Shuffle className="w-2.5 h-2.5" /> Random Exercise
            </button>

            {/* Category groups by section */}
            {sectionGroups.map(group => (
              <div key={group.section}>
                <div className="text-[9px] uppercase tracking-[0.2em] text-[#9b3939] font-serif italic font-bold pt-2 pb-0.5 border-b border-[#e8e2d6] mb-0.5">
                  {group.section}
                </div>
                {group.categories.map(cat => {
                  const isActiveCat = cat.types.includes(exerciseType);
                  const isExpanded = expandedCategory === cat.id;
                  return (
                    <div key={cat.id}>
                      <button className={`w-full flex items-center gap-1 px-1.5 py-1 rounded-sm text-[10px] font-serif italic font-bold transition-all ${isActiveCat ? 'bg-[rgba(155,57,57,0.08)] text-[#9b3939]' : 'text-[#6b5b47] hover:bg-[rgba(139,115,85,0.06)]'}`}
                        onClick={() => setExpandedCategory(isExpanded ? '' : cat.id)}>
                        <span className="flex-1 text-left">{cat.label}</span>
                        <span className="text-[8px] opacity-50">{cat.types.length}</span>
                        {isExpanded ? <ChevronUp className="w-2.5 h-2.5 opacity-40" /> : <ChevronDown className="w-2.5 h-2.5 opacity-40" />}
                      </button>
                      {(isExpanded || isActiveCat) && (
                        <div className="ml-3 mt-0.5 space-y-0.5">
                          {cat.types.map(typeId => {
                            const info = EXERCISE_TYPES[typeId];
                            const isSelected = exerciseType === typeId;
                            return (
                              <button key={typeId} className={`w-full text-left flex items-center gap-1 text-[9px] py-0.5 px-1.5 rounded-sm transition-all ${isSelected ? 'bg-[rgba(155,57,57,0.12)] text-[#9b3939] font-bold' : 'text-[#4a4a4a] hover:bg-[rgba(139,115,85,0.08)]'}`}
                                onClick={() => { setExerciseType(typeId); stopPlayback(); setSidebarOpen(false); }}>
                                <DifficultyBadge level={info.difficulty} />
                                <span className="flex-1 truncate">{info.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Intervals legend */}
            <div className="border-t border-[#e8e2d6] pt-2 mt-2">
              <h4 className="text-[10px] uppercase tracking-[0.12em] text-[#8b7355] font-serif italic font-bold mb-1">Intervals</h4>
              <div className="flex flex-wrap gap-0.5">
                {scale.intervalLabels.map((label, idx) => (
                  <span key={idx} className="inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] font-bold font-serif italic border rounded-sm"
                    style={{ borderColor: getIntervalColor(label) + '55', color: getIntervalColor(label), backgroundColor: getIntervalColor(label) + '12' }}>{label}</span>
                ))}
              </div>
            </div>
            {/* Scale notes */}
            <div className="border-t border-[#e8e2d6] pt-2 mt-1">
              <h4 className="text-[10px] uppercase tracking-[0.12em] text-[#8b7355] font-serif italic font-bold mb-1">Scale Notes</h4>
              <div className="flex flex-wrap gap-0.5">
                {scaleNotes.map((note, idx) => {
                  const label = scale.intervalLabels[idx]; const color = getIntervalColor(label);
                  return (
                    <span key={idx} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-serif italic border rounded-sm"
                      style={{ borderColor: color + '40', color, backgroundColor: color + '08' }}>
                      <span className="font-bold">{note}</span><span className="opacity-40 text-[8px]">{label}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>

        {/* ─── CENTER PANEL ─── */}
        <main className="flex-1 overflow-y-auto min-w-0 pb-[46px]">
          <div className="p-2.5 lg:p-3 space-y-2">

            {/* Exercise Header (Sticky within center) */}
            <div className="sticky top-0 z-10 bg-[#faf6ef] border-b-2 border-[#8b7355] -mx-2.5 lg:-mx-3 px-2.5 lg:px-3 pb-2 pt-1">
              {/* Breadcrumb */}
              <div className="flex items-center gap-1 text-[9px] text-[#8b7355] font-serif italic mb-0.5">
                <span>{exerciseCategory.section}</span>
                <ChevronRight className="w-2 h-2" />
                <span>{exerciseCategory.label}</span>
                <ChevronRight className="w-2 h-2" />
                <span className="text-[#9b3939] font-bold">{exerciseMeta.name}</span>
              </div>
              {/* Title + metadata */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-bold text-[#9b3939] font-serif italic truncate">{currentExercise?.name}</span>
                    <DifficultyBadge level={exerciseMeta.difficulty} />
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-[9px] text-[#6b5b47] font-serif italic font-semibold">{keyNote} {scale.name} · {showAllPositions ? 'All Pos' : `P${positionIndex + 1}`}</span>
                    <span className="text-[9px] text-[#b8a88a] font-serif italic">{exerciseMeta.focus}</span>
                    <span className="text-[9px] text-[#b8a88a] font-serif italic">~{exerciseMeta.estimatedTime}</span>
                    {isPlaying && playbackActiveNote && (
                      <span className="text-[9px] text-[#9b3939] font-serif italic font-bold">▸ {playingIdx + 1}/{playbackMode === 'exercise' ? currentExercise.notes.length : scaleNotesForPlayback.length}</span>
                    )}
                  </div>
                </div>
                {/* Quick actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button className="sketch-btn h-6 px-1 text-[9px] border-[#c4b89c] text-[#8b7355]" onClick={handleRandomize} title="Random"><Shuffle className="w-3 h-3" /></button>
                </div>
              </div>
            </div>

            {/* View Switcher + Inline play */}
            <div className="flex items-center gap-1">
              {([
                { mode: 'fretboard' as ViewMode, icon: Guitar, label: 'Fretboard' },
                { mode: 'tab' as ViewMode, icon: FileText, label: 'Tab' },
                { mode: 'hybrid' as ViewMode, icon: Eye, label: 'Hybrid' },
                { mode: 'analysis' as ViewMode, icon: BarChart3, label: 'Analysis' },
              ]).map(({ mode, icon: Icon, label }) => (
                <button key={mode} className={`flex items-center gap-0.5 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider border-2 rounded-sm transition-all ${viewMode === mode ? 'sketch-btn-active border-[#6b5b47] text-[#2c2c2c]' : 'sketch-btn border-[#c4b89c] text-[#8b7355] hover:border-[#8b7355]'}`}
                  onClick={() => setViewMode(mode)}>
                  <Icon className="w-2.5 h-2.5" /><span className="hidden sm:inline">{label}</span>
                </button>
              ))}
              <div className="flex-1" />
              <button className={`px-2 py-1 text-[10px] font-bold flex items-center gap-0.5 border-2 rounded-sm transition-all ${isPlaying && playbackMode === 'exercise' && !isPaused ? 'bg-[#9b3939] text-white border-[#9b3939]' : 'sketch-btn border-[#6b5b47]'}`} onClick={handlePlayExercise}>
                {isPlaying && playbackMode === 'exercise' && !isPaused ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
              </button>
              <button className={`px-2 py-1 text-[10px] font-bold flex items-center gap-0.5 border-2 rounded-sm transition-all ${isPlaying && playbackMode === 'scale' && !isPaused ? 'bg-[#4a5a8a] text-white border-[#4a5a8a]' : 'sketch-btn border-[#4a5a8a]'}`} onClick={handlePlayScale}>
                {isPlaying && playbackMode === 'scale' && !isPaused ? <Pause className="w-2.5 h-2.5" /> : <Music className="w-2.5 h-2.5" />}
              </button>
              {isPlaying && <button className="px-2 py-1 text-[10px] font-bold flex items-center gap-0.5 border-2 rounded-sm bg-[#4a4a4a] text-white border-[#4a4a4a]" onClick={stopPlayback}><Square className="w-3 h-3" /></button>}
            </div>

            {/* ─── View Content ─── */}

            {/* Fretboard Only */}
            {viewMode === 'fretboard' && (
              <div className="sketch-card bg-[#faf6ef] overflow-hidden">
                <div className="px-1 py-1 overflow-x-auto">
                  <FretboardDiagram keyNote={keyNote} scaleId={scaleId} startFret={startFret} endFret={endFret}
                    showAllPositions={showAllPositions} positionIndex={positionIndex}
                    highlightNotes={exerciseHighlightNotes}
                    exercisePath={exercisePath}
                    activeNote={effectiveActiveNote} onNoteClick={handleFretboardNoteClick}
                    showPatternLines={true} fullFretboard={true} />
                </div>
              </div>
            )}

            {/* Tab Only */}
            {viewMode === 'tab' && (
              <TabNotation exercise={currentExercise} onNoteClick={handleTabNoteClick} playingIdx={playingIdx}
                isPlaying={isPlaying} isPaused={isPaused} playbackMode={playbackMode}
                activePlayingNote={playbackActiveNote}
                onPlayExercise={handlePlayExercise} onPlayScale={handlePlayScale} onPause={togglePausePlayback} onStop={stopPlayback} />
            )}

            {/* Hybrid — Fretboard + Tab */}
            {viewMode === 'hybrid' && (
              <>
                <div className="sketch-card bg-[#faf6ef] overflow-hidden">
                  <div className="px-1 py-1 overflow-x-auto">
                    <FretboardDiagram keyNote={keyNote} scaleId={scaleId} startFret={startFret} endFret={endFret}
                      showAllPositions={showAllPositions} positionIndex={positionIndex}
                      highlightNotes={exerciseHighlightNotes}
                      exercisePath={exercisePath}
                      activeNote={effectiveActiveNote} onNoteClick={handleFretboardNoteClick}
                      showPatternLines={true} fullFretboard={true} />
                  </div>
                </div>
                <TabNotation exercise={currentExercise} onNoteClick={handleTabNoteClick} playingIdx={playingIdx}
                  isPlaying={isPlaying} isPaused={isPaused} playbackMode={playbackMode}
                  activePlayingNote={playbackActiveNote}
                  onPlayExercise={handlePlayExercise} onPlayScale={handlePlayScale} onPause={togglePausePlayback} onStop={stopPlayback} />
              </>
            )}

            {/* Analysis — Verbose Nerdy Stats */}
            {viewMode === 'analysis' && (
              <div className="sketch-card bg-[#faf6ef] p-3 space-y-3">
                {/* Overview Stats Grid */}
                <div>
                  <h3 className="text-[11px] uppercase tracking-[0.15em] text-[#8b7355] font-serif italic font-bold mb-1.5 flex items-center gap-1"><Activity className="w-3 h-3" /> Exercise Overview</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {[
                      { label: 'Total Notes', value: exerciseStats.totalNotes, icon: Hash },
                      { label: 'Fret Range', value: `${exerciseStats.fretRange[0]}–${exerciseStats.fretRange[1]}`, icon: Ruler },
                      { label: 'String Changes', value: exerciseStats.stringChanges, icon: ArrowRight },
                      { label: 'Pos. Shifts', value: exerciseStats.positionShifts, icon: Zap },
                    ].map(({ label, value, icon: Icon }) => (
                      <div key={label} className="bg-[#f5f0e8] border border-[#e8e2d6] rounded-sm p-1.5">
                        <div className="flex items-center gap-0.5 text-[9px] text-[#8b7355] font-serif italic uppercase"><Icon className="w-3 h-3" />{label}</div>
                        <div className="text-[14px] font-bold text-[#2c2c2c] font-serif italic">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Deep Stats */}
                <div>
                  <h3 className="text-[11px] uppercase tracking-[0.15em] text-[#8b7355] font-serif italic font-bold mb-1.5 flex items-center gap-1"><Signal className="w-3.5 h-3.5" /> Detailed Metrics</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                    {[
                      { label: 'Avg Jump', value: exerciseStats.avgFretJump },
                      { label: 'Max Jump', value: exerciseStats.maxFretJump },
                      { label: 'Strings Used', value: `${exerciseStats.uniqueStrings}/6` },
                      { label: 'Unique Frets', value: exerciseStats.uniqueFrets },
                      { label: 'Difficulty', value: `${exerciseStats.difficulty}/5` },
                      { label: 'Pattern', value: exerciseStats.patternType },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-[#f5f0e8] border border-[#e8e2d6] rounded-sm p-1.5">
                        <div className="text-[8px] text-[#8b7355] font-serif italic uppercase">{label}</div>
                        <div className="text-[12px] font-bold text-[#2c2c2c] font-serif italic">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Interval Distribution */}
                <div>
                  <h3 className="text-[11px] uppercase tracking-[0.15em] text-[#8b7355] font-serif italic font-bold mb-1.5">Interval Distribution</h3>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(exerciseStats.intervalDistribution).sort((a, b) => b[1] - a[1]).map(([label, count]) => {
                      const color = getIntervalColor(label);
                      const maxCount = Math.max(...Object.values(exerciseStats.intervalDistribution));
                      const width = Math.max(20, (count / maxCount) * 100);
                      return (
                        <div key={label} className="flex items-center gap-1">
                          <div className="h-3 rounded-sm overflow-hidden" style={{ width: `${width}px`, backgroundColor: color + '20', border: `1px solid ${color}40` }}>
                            <div className="h-full rounded-sm" style={{ width: `${(count / maxCount) * 100}%`, backgroundColor: color + '60' }} />
                          </div>
                          <span className="text-[9px] font-serif italic" style={{ color }}>{label}: <b>{count}</b></span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* String Coverage */}
                <div>
                  <h3 className="text-[11px] uppercase tracking-[0.15em] text-[#8b7355] font-serif italic font-bold mb-1.5">String Coverage</h3>
                  <div className="flex gap-1.5">
                    {['E', 'A', 'D', 'G', 'B', 'e'].map((s, idx) => {
                      const used = currentExercise.notes.some(n => n.string === idx);
                      const noteCount = currentExercise.notes.filter(n => n.string === idx).length;
                      return (
                        <div key={s} className={`flex flex-col items-center w-8 rounded-sm border-2 p-1 ${used ? 'border-[#8b7355] bg-[rgba(139,115,85,0.1)]' : 'border-[#e8e2d6]'}`}>
                          <span className={`text-[11px] font-bold font-serif italic ${used ? 'text-[#4a4a4a]' : 'text-[#c4b89c]'}`}>{s}</span>
                          {used && <span className="text-[8px] text-[#8b7355] font-serif italic">{noteCount}n</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Scale Formula */}
                <div>
                  <h3 className="text-[11px] uppercase tracking-[0.15em] text-[#8b7355] font-serif italic font-bold mb-1.5">Scale Formula</h3>
                  <div className="flex flex-wrap gap-1 mb-1">
                    {scaleNotes.map((note, idx) => {
                      const label = scale.intervalLabels[idx]; const color = getIntervalColor(label);
                      return (
                        <span key={idx} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-serif italic border rounded-sm"
                          style={{ borderColor: color + '50', color, backgroundColor: color + '0a' }}>
                          <span className="font-bold">{note}</span><span className="opacity-50 text-[8px]">{label}</span>
                        </span>
                      );
                    })}
                  </div>
                  <p className="text-[9px] text-[#8b7355] font-serif italic">
                    Steps: {scale.intervals.slice(1).map((interval, idx) => {
                      const prevInterval = idx === 0 ? 0 : scale.intervals[idx]; const step = interval - prevInterval;
                      return step === 1 ? 'H' : step === 2 ? 'W' : `${step}H`;
                    }).join(' − ')}
                  </p>
                </div>

                {/* Picking Direction */}
                <div>
                  <h3 className="text-[11px] uppercase tracking-[0.15em] text-[#8b7355] font-serif italic font-bold mb-1.5">Suggested Picking</h3>
                  <div className="flex flex-wrap gap-px">
                    {exerciseStats.pickingDirection.slice(0, 40).map((dir, idx) => (
                      <span key={idx} className={`w-4 h-4 rounded-sm flex items-center justify-center text-[8px] font-bold border ${
                        dir === 'D' ? 'border-[#4a7a4a] text-[#4a7a4a] bg-[rgba(74,122,74,0.06)]' : 'border-[#4a5a8a] text-[#4a5a8a] bg-[rgba(74,90,138,0.06)]'
                      }`}>{dir}</span>
                    ))}
                    {exerciseStats.pickingDirection.length > 40 && <span className="text-[8px] text-[#8b7355] font-serif italic ml-0.5">+{exerciseStats.pickingDirection.length - 40}</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[8px] text-[#4a7a4a] font-serif italic">D = Downstroke</span>
                    <span className="text-[8px] text-[#4a5a8a] font-serif italic">U = Upstroke</span>
                  </div>
                </div>

                {/* Exercise Metadata */}
                <div>
                  <h3 className="text-[11px] uppercase tracking-[0.15em] text-[#8b7355] font-serif italic font-bold mb-1.5 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Exercise Info</h3>
                  <div className="bg-[#f5f0e8] border border-[#e8e2d6] rounded-sm p-2 space-y-1">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                      <div className="flex justify-between text-[9px]"><span className="text-[#8b7355] font-serif italic">Focus</span><span className="text-[#4a4a4a] font-bold">{exerciseMeta.focus}</span></div>
                      <div className="flex justify-between text-[9px]"><span className="text-[#8b7355] font-serif italic">Duration</span><span className="text-[#4a4a4a] font-bold">{exerciseMeta.estimatedTime}</span></div>
                      <div className="flex justify-between text-[9px]"><span className="text-[#8b7355] font-serif italic">Position</span><span className="text-[#4a4a4a] font-bold">{showAllPositions ? 'All' : `P${positionIndex + 1}`} ({currentPosition.fretStart}–{currentPosition.fretEnd})</span></div>
                      <div className="flex justify-between text-[9px]"><span className="text-[#8b7355] font-serif italic">Category</span><span className="text-[#4a4a4a] font-bold">{exerciseStats.patternType}</span></div>
                      <div className="flex justify-between text-[9px]"><span className="text-[#8b7355] font-serif italic">Notes</span><span className="text-[#4a4a4a] font-bold">{exerciseStats.totalNotes}</span></div>
                      <div className="flex justify-between text-[9px]"><span className="text-[#8b7355] font-serif italic">Fret Span</span><span className="text-[#4a4a4a] font-bold">{exerciseStats.fretRange[1] - exerciseStats.fretRange[0] + 1} frets</span></div>
                    </div>
                    <div className="flex flex-wrap gap-0.5 pt-1 border-t border-[#e8e2d6]">
                      {exerciseMeta.tags.map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 text-[8px] font-serif italic bg-[rgba(139,115,85,0.08)] text-[#6b5b47] border border-[#e8e2d6] rounded-sm">{tag}</span>
                      ))}
                    </div>
                    <p className="text-[9px] text-[#4a4a4a] font-serif italic pt-1 border-t border-[#e8e2d6]">
                      {exerciseStats.positionShifts > 0 ? 'Contains position shifts — practice slowly, focus on smooth transitions.' :
                        exerciseStats.stringChanges > exerciseStats.totalNotes * 0.6 ? 'High string-crossing density — keep picking hand relaxed, use efficient alternate picking.' :
                        'Focus on clean articulation and consistent timing with the metronome.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile: Explorer section */}
            <div className="xl:hidden">
              <button className="w-full sketch-card bg-[#faf6ef] px-2 py-1 flex items-center justify-between"
                onClick={() => setRightPanelExpanded(!rightPanelExpanded)}>
                <span className="text-[10px] uppercase tracking-[0.12em] text-[#8b7355] font-serif italic font-bold">Scale Explorer</span>
                {rightPanelExpanded ? <ChevronUp className="w-2.5 h-2.5 text-[#8b7355]" /> : <ChevronDown className="w-2.5 h-2.5 text-[#8b7355]" />}
              </button>
              {rightPanelExpanded && (
                <div className="mt-1.5">
                  <div className="sketch-card bg-[#faf6ef] p-2">
                    <h4 className="text-[10px] uppercase tracking-[0.12em] text-[#8b7355] font-serif italic font-bold mb-1.5">CAGED Positions</h4>
                    <div className="grid grid-cols-5 gap-1.5">
                      {patternExercises.map((pat) => (
                        <button key={pat.position} onClick={() => handlePatternClick(pat.position - 1)} className="text-left">
                          <PatternDiagram keyNote={keyNote} scaleId={scaleId} fretStart={pat.fretStart} fretEnd={pat.fretEnd}
                            positionNumber={pat.position} exerciseNotes={pat.notes}
                            selected={positionIndex === pat.position - 1 && !showAllPositions} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* ─── RIGHT SIDEBAR ─── */}
        <aside className="hidden xl:block w-[280px] shrink-0 border-l-2 border-[#8b7355] bg-[#faf6ef] overflow-y-auto">
          <div className="p-2.5 pb-16 space-y-2.5">

            {/* Card 1: Current Scale */}
            <div className="sketch-card bg-[#f5f0e8] p-2.5">
              <h4 className="text-[10px] uppercase tracking-[0.12em] text-[#8b7355] font-serif italic font-bold mb-1.5">Current Scale</h4>
              <div className="text-[13px] font-bold text-[#9b3939] font-serif italic mb-1">{keyNote} {scale.name}</div>
              <div className="flex flex-wrap gap-0.5 mb-1.5">
                {scaleNotes.map((note, idx) => {
                  const label = scale.intervalLabels[idx]; const color = getIntervalColor(label);
                  return <span key={idx} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-serif italic border rounded-sm"
                    style={{ borderColor: color + '40', color, backgroundColor: color + '08' }}>
                    <span className="font-bold">{note}</span><span className="opacity-40 text-[8px]">{label}</span>
                  </span>;
                })}
              </div>
              <p className="text-[8px] text-[#8b7355] font-serif italic">{scale.intervals.length} notes · Steps: {scale.intervals.slice(1).map((interval, idx) => {
                const prevInterval = idx === 0 ? 0 : scale.intervals[idx]; const step = interval - prevInterval;
                return step === 1 ? 'H' : step === 2 ? 'W' : `${step}H`;
              }).join('−')}</p>
            </div>

            {/* Card 2: Current Position */}
            <div className="sketch-card bg-[#f5f0e8] p-2.5">
              <h4 className="text-[10px] uppercase tracking-[0.12em] text-[#8b7355] font-serif italic font-bold mb-1.5">Current Position</h4>
              <div className="space-y-1.5">
                {patternExercises.map((pat) => (
                  <button key={pat.position} onClick={() => handlePatternClick(pat.position - 1)} className="w-full text-left">
                    <PatternDiagram keyNote={keyNote} scaleId={scaleId} fretStart={pat.fretStart} fretEnd={pat.fretEnd}
                      positionNumber={pat.position} exerciseNotes={pat.notes}
                      selected={positionIndex === pat.position - 1 && !showAllPositions} />
                  </button>
                ))}
              </div>
            </div>

            {/* Card 3: Related Exercises */}
            <div className="sketch-card bg-[#f5f0e8] p-2.5">
              <h4 className="text-[10px] uppercase tracking-[0.12em] text-[#8b7355] font-serif italic font-bold mb-1.5">Related Exercises</h4>
              <div className="space-y-0.5">
                {exerciseCategory.types.filter(t => t !== exerciseType).slice(0, 5).map(typeId => {
                  const info = EXERCISE_TYPES[typeId];
                  return (
                    <button key={typeId} className="w-full text-left flex items-center gap-1 px-1.5 py-1 rounded-sm text-[9px] text-[#4a4a4a] hover:bg-[rgba(139,115,85,0.08)] transition-all"
                      onClick={() => { setExerciseType(typeId); stopPlayback(); }}>
                      <ArrowRight className="w-2 h-2 text-[#8b7355] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="font-serif italic">{info.name}</span>
                        <span className="text-[8px] text-[#8b7355] ml-1">{info.focus}</span>
                      </div>
                      <DifficultyBadge level={info.difficulty} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Card 4: Next Suggested */}
            <div className="sketch-card bg-[#f5f0e8] p-2.5">
              <h4 className="text-[10px] uppercase tracking-[0.12em] text-[#8b7355] font-serif italic font-bold mb-1.5">Suggested Next</h4>
              {(() => {
                const currentIdx = exerciseCategory.types.indexOf(exerciseType);
                const nextType = currentIdx >= 0 && currentIdx < exerciseCategory.types.length - 1 ? exerciseCategory.types[currentIdx + 1] : null;
                const nextMeta = nextType ? EXERCISE_TYPES[nextType] : null;
                if (!nextType || !nextMeta) return <p className="text-[9px] text-[#b8a88a] font-serif italic">Complete!</p>;
                return (
                  <button className="w-full text-left bg-[rgba(155,57,57,0.05)] border border-[#9b393930] rounded-sm p-1.5 hover:bg-[rgba(155,57,57,0.1)] transition-all"
                    onClick={() => { setExerciseType(nextType); stopPlayback(); }}>
                    <div className="flex items-center gap-1">
                      <Play className="w-2.5 h-2.5 text-[#9b3939]" />
                      <span className="text-[10px] font-bold text-[#9b3939] font-serif italic">{nextMeta.name}</span>
                    </div>
                    <p className="text-[8px] text-[#8b7355] font-serif italic mt-0.5">{nextMeta.description} · {nextMeta.focus}</p>
                  </button>
                );
              })()}
            </div>

            {/* Card 5: Session */}
            <div className="sketch-card bg-[#f5f0e8] p-2.5">
              <h4 className="text-[10px] uppercase tracking-[0.12em] text-[#8b7355] font-serif italic font-bold mb-1.5 flex items-center gap-1"><Clock className="w-3 h-3" /> Session</h4>
              <div className="grid grid-cols-2 gap-1.5">
                <div><div className="text-[8px] text-[#8b7355] font-serif italic uppercase">Time</div><div className="text-[13px] font-bold text-[#2c2c2c] font-mono">{formatTime(sessionElapsed)}</div></div>
                <div><div className="text-[8px] text-[#8b7355] font-serif italic uppercase">Played</div><div className="text-[13px] font-bold text-[#2c2c2c] font-mono">{exercisesPlayed}</div></div>
                <div><div className="text-[8px] text-[#8b7355] font-serif italic uppercase">Tempo</div><div className="text-[13px] font-bold text-[#2c2c2c] font-mono">{bpm}</div></div>
                <div><div className="text-[8px] text-[#8b7355] font-serif italic uppercase">Library</div><div className="text-[13px] font-bold text-[#2c2c2c] font-mono">{Object.keys(EXERCISE_TYPES).length}</div></div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* ═══ BOTTOM PRACTICE ENGINE ═══ */}

      {/* Practice Panel - Expandable area above the toolbar */}
      {practicePanelOpen && (
        <div className="fixed bottom-[38px] left-0 right-0 z-30 border-t-2 border-[#8b7355] bg-[#faf6ef] shadow-lg max-h-[50vh] overflow-y-auto">
          <div className="px-3 py-2 space-y-3">

            {/* METRONOME SETTINGS */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Drum className="w-3 h-3 text-[#9b3939]" />
                <span className="text-[10px] uppercase tracking-[0.15em] text-[#8b7355] font-serif italic font-bold">Metronome</span>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {/* Sound */}
                <div>
                  <label className="text-[8px] uppercase tracking-[0.1em] text-[#8b7355] font-serif italic block mb-0.5">Sound</label>
                  <Select value={metronomeSound} onValueChange={(v) => setMetronomeSound(v as MetronomeSound)}>
                    <SelectTrigger className="bg-[#f5f0e8] border-[#c4b89c] text-[10px] rounded-sm h-7 cursor-pointer"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#faf6ef] border-[#c4b89c]">
                      {METRONOME_SOUNDS.map(s => <SelectItem key={s.value} value={s.value} className="text-[10px] text-[#2c2c2c] cursor-pointer">{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {/* Time Signature */}
                <div>
                  <label className="text-[8px] uppercase tracking-[0.1em] text-[#8b7355] font-serif italic block mb-0.5">Time Sig</label>
                  <Select value={timeSignatureDisplay} onValueChange={(v) => handleTimeSignatureChange(v as TimeSignatureDisplay)}>
                    <SelectTrigger className="bg-[#f5f0e8] border-[#c4b89c] text-[10px] rounded-sm h-7 cursor-pointer"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#faf6ef] border-[#c4b89c]">
                      {TIME_SIGNATURES.map(ts => <SelectItem key={ts.value} value={ts.value} className="text-[10px] text-[#2c2c2c] cursor-pointer">{ts.value}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {/* Subdivision */}
                <div>
                  <label className="text-[8px] uppercase tracking-[0.1em] text-[#8b7355] font-serif italic block mb-0.5">Subdivision</label>
                  <Select value={subdivision} onValueChange={(v) => setSubdivision(v as Subdivision)}>
                    <SelectTrigger className="bg-[#f5f0e8] border-[#c4b89c] text-[10px] rounded-sm h-7 cursor-pointer"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#faf6ef] border-[#c4b89c]">
                      {SUBDIVISIONS.map(s => <SelectItem key={s.value} value={s.value} className="text-[10px] text-[#2c2c2c] cursor-pointer">{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {/* Accent Mode */}
                <div>
                  <label className="text-[8px] uppercase tracking-[0.1em] text-[#8b7355] font-serif italic block mb-0.5">Accent</label>
                  <Select value={accentMode} onValueChange={(v) => setAccentMode(v as AccentMode)}>
                    <SelectTrigger className="bg-[#f5f0e8] border-[#c4b89c] text-[10px] rounded-sm h-7 cursor-pointer"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#faf6ef] border-[#c4b89c]">
                      <SelectItem value="first" className="text-[10px] text-[#2c2c2c] cursor-pointer">First Beat</SelectItem>
                      <SelectItem value="every-n" className="text-[10px] text-[#2c2c2c] cursor-pointer">Every N Beats</SelectItem>
                      <SelectItem value="random" className="text-[10px] text-[#2c2c2c] cursor-pointer">Random</SelectItem>
                      <SelectItem value="none" className="text-[10px] text-[#2c2c2c] cursor-pointer">No Accent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Accent every N + Volume */}
              <div className="flex items-center gap-3 mt-2">
                {accentMode === 'every-n' && (
                  <div className="flex items-center gap-1">
                    <span className="text-[8px] text-[#8b7355] font-serif italic">Every</span>
                    <input type="number" min={2} max={16} value={accentEveryN} onChange={e => setAccentEveryN(Math.max(2, Math.min(16, parseInt(e.target.value) || 2)))}
                      className="w-8 h-5 text-[10px] font-mono font-bold text-center bg-[#f5f0e8] border border-[#c4b89c] rounded-sm px-0.5" />
                    <span className="text-[8px] text-[#8b7355] font-serif italic">beats</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 ml-auto">
                  <Volume2 className="w-2.5 h-2.5 text-[#8b7355]" />
                  <Slider value={[metronomeVolume]} min={0} max={1} step={0.05} onValueChange={([v]) => setMetronomeVolume(v)}
                    className="w-16 cursor-pointer" />
                </div>
              </div>

              {/* Beat Visualizer */}
              <div className="flex items-center gap-1 mt-2">
                {Array.from({ length: timeSignature }, (_, i) => {
                  const isAccent = accentMode === 'first' ? i === 0 : accentMode === 'every-n' ? i % accentEveryN === 0 : false;
                  return (
                    <div key={i} className={`flex-1 h-4 rounded-sm border-2 transition-all duration-75 flex items-center justify-center ${
                      metronomeOn && currentBeat === i
                        ? isAccent ? 'bg-[#9b3939] border-[#9b3939] scale-105' : 'bg-[#8b7355] border-[#8b7355] scale-105'
                        : isAccent ? 'bg-[rgba(155,57,57,0.1)] border-[#9b3939]/50' : 'bg-transparent border-[#c4b89c]'
                    }`}>
                      <span className={`text-[7px] font-bold ${metronomeOn && currentBeat === i ? 'text-white' : isAccent ? 'text-[#9b3939]/60' : 'text-[#c4b89c]'}`}>{i + 1}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PRACTICE TOOLS */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Target className="w-3 h-3 text-[#4a5a8a]" />
                <span className="text-[10px] uppercase tracking-[0.15em] text-[#8b7355] font-serif italic font-bold">Practice Tools</span>
              </div>

              {/* Practice Mode Selector */}
              <div className="flex gap-1 mb-2">
                {([
                  { mode: 'none' as PracticeMode, label: 'Off', icon: Square },
                  { mode: 'tempo-trainer' as PracticeMode, label: 'Trainer', icon: Gauge },
                  { mode: 'speed-burst' as PracticeMode, label: 'Burst', icon: Zap },
                  { mode: 'random-tempo' as PracticeMode, label: 'Random', icon: Shuffle },
                ]).map(({ mode, label, icon: Icon }) => (
                  <button key={mode} className={`flex items-center gap-0.5 px-2 py-1 text-[9px] font-bold border rounded-sm transition-all cursor-pointer ${
                    practiceMode === mode ? 'bg-[rgba(74,90,138,0.15)] border-[#4a5a8a] text-[#4a5a8a]' : 'sketch-btn border-[#c4b89c]'
                  }`} onClick={() => {
                    setPracticeMode(mode);
                    setTempoTrainer(prev => ({ ...prev, isActive: mode === 'tempo-trainer' }));
                    setSpeedBurst(prev => ({ ...prev, isActive: mode === 'speed-burst' }));
                    setRandomTempo(prev => ({ ...prev, isActive: mode === 'random-tempo' }));
                  }}>
                    <Icon className="w-2.5 h-2.5" />{label}
                  </button>
                ))}
              </div>

              {/* Tempo Trainer Config */}
              {practiceMode === 'tempo-trainer' && (
                <div className="bg-[#f5f0e8] border border-[#e8e2d6] rounded-sm p-2 space-y-1.5">
                  <div className="text-[9px] font-bold text-[#4a5a8a] font-serif italic">Tempo Trainer</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[8px] text-[#8b7355] font-serif italic">Start BPM</label>
                      <input type="number" min={30} max={300} value={tempoTrainer.startBpm}
                        onChange={e => setTempoTrainer(prev => ({ ...prev, startBpm: Math.max(30, Math.min(300, parseInt(e.target.value) || 80)) }))}
                        className="w-full h-6 text-[10px] font-mono font-bold bg-[#faf6ef] border border-[#c4b89c] rounded-sm px-1.5 cursor-pointer" />
                    </div>
                    <div>
                      <label className="text-[8px] text-[#8b7355] font-serif italic">Target BPM</label>
                      <input type="number" min={30} max={300} value={tempoTrainer.targetBpm}
                        onChange={e => setTempoTrainer(prev => ({ ...prev, targetBpm: Math.max(30, Math.min(300, parseInt(e.target.value) || 140)) }))}
                        className="w-full h-6 text-[10px] font-mono font-bold bg-[#faf6ef] border border-[#c4b89c] rounded-sm px-1.5 cursor-pointer" />
                    </div>
                    <div>
                      <label className="text-[8px] text-[#8b7355] font-serif italic">Step Size</label>
                      <input type="number" min={1} max={20} value={tempoTrainer.stepSize}
                        onChange={e => setTempoTrainer(prev => ({ ...prev, stepSize: Math.max(1, Math.min(20, parseInt(e.target.value) || 5)) }))}
                        className="w-full h-6 text-[10px] font-mono font-bold bg-[#faf6ef] border border-[#c4b89c] rounded-sm px-1.5 cursor-pointer" />
                    </div>
                    <div>
                      <label className="text-[8px] text-[#8b7355] font-serif italic">Increase Every N Reps</label>
                      <input type="number" min={1} max={20} value={tempoTrainer.increaseEveryN}
                        onChange={e => setTempoTrainer(prev => ({ ...prev, increaseEveryN: Math.max(1, Math.min(20, parseInt(e.target.value) || 2)) }))}
                        className="w-full h-6 text-[10px] font-mono font-bold bg-[#faf6ef] border border-[#c4b89c] rounded-sm px-1.5 cursor-pointer" />
                    </div>
                  </div>
                  <button className="sketch-btn text-[9px] px-2 py-1 border-[#4a5a8a] text-[#4a5a8a] font-semibold cursor-pointer"
                    onClick={() => { setBpm(tempoTrainer.startBpm); setTempoTrainer(prev => ({ ...prev, currentReps: 0, isActive: true })); repCountRef.current = 0; setRepetitionCount(0); }}>
                    Reset &amp; Start from {tempoTrainer.startBpm} BPM
                  </button>
                </div>
              )}

              {/* Speed Burst Config */}
              {practiceMode === 'speed-burst' && (
                <div className="bg-[#f5f0e8] border border-[#e8e2d6] rounded-sm p-2 space-y-1.5">
                  <div className="text-[9px] font-bold text-[#4a5a8a] font-serif italic">Speed Burst</div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[8px] text-[#8b7355] font-serif italic">Burst BPM</label>
                      <input type="number" min={30} max={300} value={speedBurst.burstBpm}
                        onChange={e => setSpeedBurst(prev => ({ ...prev, burstBpm: Math.max(30, Math.min(300, parseInt(e.target.value) || 120)) }))}
                        className="w-full h-6 text-[10px] font-mono font-bold bg-[#faf6ef] border border-[#c4b89c] rounded-sm px-1.5 cursor-pointer" />
                    </div>
                    <div>
                      <label className="text-[8px] text-[#8b7355] font-serif italic">Burst Every N</label>
                      <input type="number" min={1} max={10} value={speedBurst.burstEveryN}
                        onChange={e => setSpeedBurst(prev => ({ ...prev, burstEveryN: Math.max(1, Math.min(10, parseInt(e.target.value) || 3)) }))}
                        className="w-full h-6 text-[10px] font-mono font-bold bg-[#faf6ef] border border-[#c4b89c] rounded-sm px-1.5 cursor-pointer" />
                    </div>
                    <div>
                      <label className="text-[8px] text-[#8b7355] font-serif italic">Burst Length</label>
                      <input type="number" min={1} max={8} value={speedBurst.burstLength}
                        onChange={e => setSpeedBurst(prev => ({ ...prev, burstLength: Math.max(1, Math.min(8, parseInt(e.target.value) || 1)) }))}
                        className="w-full h-6 text-[10px] font-mono font-bold bg-[#faf6ef] border border-[#c4b89c] rounded-sm px-1.5 cursor-pointer" />
                    </div>
                  </div>
                  {speedBurst.isInBurst && (
                    <div className="text-[9px] text-[#9b3939] font-serif italic font-bold animate-pulse">⚡ BURST MODE ACTIVE — {speedBurst.burstBpm} BPM</div>
                  )}
                </div>
              )}

              {/* Random Tempo Config */}
              {practiceMode === 'random-tempo' && (
                <div className="bg-[#f5f0e8] border border-[#e8e2d6] rounded-sm p-2 space-y-1.5">
                  <div className="text-[9px] font-bold text-[#4a5a8a] font-serif italic">Random Tempo</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[8px] text-[#8b7355] font-serif italic">Min BPM</label>
                      <input type="number" min={30} max={300} value={randomTempo.minBpm}
                        onChange={e => setRandomTempo(prev => ({ ...prev, minBpm: Math.max(30, Math.min(300, parseInt(e.target.value) || 70)) }))}
                        className="w-full h-6 text-[10px] font-mono font-bold bg-[#faf6ef] border border-[#c4b89c] rounded-sm px-1.5 cursor-pointer" />
                    </div>
                    <div>
                      <label className="text-[8px] text-[#8b7355] font-serif italic">Max BPM</label>
                      <input type="number" min={30} max={300} value={randomTempo.maxBpm}
                        onChange={e => setRandomTempo(prev => ({ ...prev, maxBpm: Math.max(30, Math.min(300, parseInt(e.target.value) || 130)) }))}
                        className="w-full h-6 text-[10px] font-mono font-bold bg-[#faf6ef] border border-[#c4b89c] rounded-sm px-1.5 cursor-pointer" />
                    </div>
                  </div>
                </div>
              )}

              {/* Session Stats Row */}
              <div className="flex items-center gap-3 mt-2 pt-2 border-t border-[#e8e2d6]">
                <div className="flex items-center gap-1">
                  <Hash className="w-2.5 h-2.5 text-[#8b7355]" />
                  <span className="text-[9px] text-[#8b7355] font-serif italic">Reps</span>
                  <span className="text-[10px] font-mono font-bold text-[#4a4a4a]">{repetitionCount}<span className="text-[8px] text-[#8b7355]">/{repetitionGoal}</span></span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5 text-[#8b7355]" />
                  <span className="text-[9px] text-[#8b7355] font-serif italic">Practice</span>
                  <span className="text-[10px] font-mono font-bold text-[#4a4a4a]">{formatTime(practiceTimer)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Timer className="w-2.5 h-2.5 text-[#8b7355]" />
                  <span className="text-[9px] text-[#8b7355] font-serif italic">Session</span>
                  <span className="text-[10px] font-mono font-bold text-[#4a4a4a]">{formatTime(sessionElapsed)}</span>
                </div>
                <button className="sketch-btn text-[8px] px-1.5 py-0.5 border-[#c4b89c] ml-auto cursor-pointer"
                  onClick={() => { setRepetitionCount(0); repCountRef.current = 0; setPracticeTimer(0); }}>
                  Reset
                </button>
              </div>
            </div>

            {/* ADVANCED METRONOME */}
            <Collapsible open={advancedMetronomeOpen} onOpenChange={setAdvancedMetronomeOpen}>
              <CollapsibleTrigger className="flex items-center gap-1.5 w-full cursor-pointer">
                <Waves className="w-3 h-3 text-[#6b4a7a]" />
                <span className="text-[10px] uppercase tracking-[0.15em] text-[#8b7355] font-serif italic font-bold">Advanced</span>
                {advancedMetronomeOpen ? <ChevronUp className="w-2.5 h-2.5 text-[#8b7355]" /> : <ChevronDown className="w-2.5 h-2.5 text-[#8b7355]" />}
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 space-y-2">
                  {/* Gap Click */}
                  <div className="bg-[#f5f0e8] border border-[#e8e2d6] rounded-sm p-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-bold text-[#6b4a7a] font-serif italic">Gap Click Training</span>
                      <Switch checked={gapClick.isActive} onCheckedChange={(v) => setGapClick(prev => ({ ...prev, isActive: v }))} className="cursor-pointer" />
                    </div>
                    {gapClick.isActive && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[8px] text-[#8b7355] font-serif italic">Bars Click</label>
                          <input type="number" min={1} max={16} value={gapClick.barsClick}
                            onChange={e => setGapClick(prev => ({ ...prev, barsClick: Math.max(1, parseInt(e.target.value) || 2) }))}
                            className="w-full h-6 text-[10px] font-mono font-bold bg-[#faf6ef] border border-[#c4b89c] rounded-sm px-1.5 cursor-pointer" />
                        </div>
                        <div>
                          <label className="text-[8px] text-[#8b7355] font-serif italic">Bars Silent</label>
                          <input type="number" min={1} max={16} value={gapClick.barsSilent}
                            onChange={e => setGapClick(prev => ({ ...prev, barsSilent: Math.max(1, parseInt(e.target.value) || 2) }))}
                            className="w-full h-6 text-[10px] font-mono font-bold bg-[#faf6ef] border border-[#c4b89c] rounded-sm px-1.5 cursor-pointer" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Silent Measures */}
                  <div className="bg-[#f5f0e8] border border-[#e8e2d6] rounded-sm p-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-bold text-[#6b4a7a] font-serif italic">Silent Measure Training</span>
                      <Switch checked={silentMeasureEnabled} onCheckedChange={setSilentMeasureEnabled} className="cursor-pointer" />
                    </div>
                    {silentMeasureEnabled && (
                      <div>
                        <label className="text-[8px] text-[#8b7355] font-serif italic">Silent every N measures</label>
                        <input type="number" min={1} max={8} value={silentEveryN}
                          onChange={e => setSilentEveryN(Math.max(1, Math.min(8, parseInt(e.target.value) || 2)))}
                          className="w-full h-6 text-[10px] font-mono font-bold bg-[#faf6ef] border border-[#c4b89c] rounded-sm px-1.5 cursor-pointer" />
                      </div>
                    )}
                  </div>

                  {/* Random Accent */}
                  <div className="bg-[#f5f0e8] border border-[#e8e2d6] rounded-sm p-2 flex items-center justify-between">
                    <span className="text-[9px] font-bold text-[#6b4a7a] font-serif italic">Random Accents</span>
                    <Switch checked={randomAccent} onCheckedChange={setRandomAccent} className="cursor-pointer" />
                  </div>

                  {/* Polyrhythm */}
                  <div className="bg-[#f5f0e8] border border-[#e8e2d6] rounded-sm p-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-bold text-[#6b4a7a] font-serif italic">Polyrhythm</span>
                      <Switch checked={polyrhythm.isActive} onCheckedChange={(v) => setPolyrhythm(prev => ({ ...prev, isActive: v }))} className="cursor-pointer" />
                    </div>
                    {polyrhythm.isActive && (
                      <div className="flex gap-1">
                        {POLYRHYTHM_RATIOS.map(r => (
                          <button key={r} className={`px-2 py-0.5 text-[9px] font-bold border rounded-sm cursor-pointer transition-all ${
                            polyrhythm.ratio === r ? 'bg-[rgba(107,74,122,0.15)] border-[#6b4a7a] text-[#6b4a7a]' : 'sketch-btn border-[#c4b89c]'
                          }`} onClick={() => setPolyrhythm(prev => ({ ...prev, ratio: r }))}>{r}</button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      )}

      {/* Compact Toolbar - Always visible */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t-2 border-[#8b7355] bg-[#faf6ef]">
        <div className="px-2 py-1 flex items-center gap-1.5 h-[38px]">

          {/* GROUP 1: TRANSPORT */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button className={`w-6 h-6 flex items-center justify-center border rounded-sm transition-all cursor-pointer ${
              isPlaying && playbackMode === 'exercise' && !isPaused ? 'bg-[#9b3939] text-white border-[#9b3939]' : 'sketch-btn border-[#6b5b47]'
            }`} onClick={handlePlayExercise} title="Play exercise (Space)">
              {isPlaying && playbackMode === 'exercise' && !isPaused ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </button>
            <button className={`w-6 h-6 flex items-center justify-center border rounded-sm transition-all cursor-pointer ${
              isPlaying && playbackMode === 'scale' && !isPaused ? 'bg-[#4a5a8a] text-white border-[#4a5a8a]' : 'sketch-btn border-[#4a5a8a]'
            }`} onClick={handlePlayScale} title="Play scale">
              {isPlaying && playbackMode === 'scale' && !isPaused ? <Pause className="w-3 h-3" /> : <Music className="w-3 h-3" />}
            </button>
            {(isPlaying || metronomeOn) && (
              <button className="w-6 h-6 flex items-center justify-center border-2 rounded-sm bg-[#4a4a4a] text-white border-[#4a4a4a] cursor-pointer" onClick={() => { stopPlayback(); if (metronomeOn) stopMetronome(); }} title="Stop (Esc)">
                <Square className="w-2.5 h-2.5" />
              </button>
            )}
          </div>

          <div className="w-px h-4 bg-[#e8e2d6]" />

          {/* GROUP 2: TEMPO */}
          <div className="flex items-center gap-1 min-w-0">
            {/* -5 / -1 buttons */}
            <div className="hidden sm:flex items-center gap-px">
              <button className="sketch-btn h-5 px-1 text-[8px] font-bold border-[#c4b89c] cursor-pointer" onClick={() => setBpm(Math.max(30, bpm - 5))} title="-5 BPM">-5</button>
              <button className="sketch-btn h-5 px-1 text-[8px] font-bold border-[#c4b89c] cursor-pointer" onClick={() => setBpm(Math.max(30, bpm - 1))} title="-1 BPM">-1</button>
            </div>
            <button className="sm:hidden sketch-btn h-5 w-5 flex items-center justify-center border-[#c4b89c] text-[10px] font-bold cursor-pointer" onClick={() => setBpm(Math.max(30, bpm - 1))} title="-1 BPM">-</button>

            {/* BPM Display - Clickable to edit */}
            {bpmEditing ? (
              <input type="number" min={30} max={300} value={bpmInput}
                onChange={e => setBpmInput(e.target.value)}
                onKeyDown={handleBpmKeyDown}
                onBlur={handleBpmSubmit}
                autoFocus
                className="w-10 h-6 text-[13px] font-mono font-bold text-center bg-[#f5f0e8] border-2 border-[#8b7355] rounded-sm px-0.5" />
            ) : (
              <button className="text-[13px] font-mono font-bold text-[#4a4a4a] w-8 text-center cursor-pointer hover:text-[#9b3939] transition-colors" onClick={handleBpmClick} title="Click to edit BPM">
                {bpm}
              </button>
            )}
            <span className="text-[9px] text-[#8b7355] font-serif italic shrink-0">BPM</span>

            {/* +1 / +5 buttons */}
            <div className="hidden sm:flex items-center gap-px">
              <button className="sketch-btn h-5 px-1 text-[8px] font-bold border-[#c4b89c] cursor-pointer" onClick={() => setBpm(Math.min(300, bpm + 1))} title="+1 BPM">+1</button>
              <button className="sketch-btn h-5 px-1 text-[8px] font-bold border-[#c4b89c] cursor-pointer" onClick={() => setBpm(Math.min(300, bpm + 5))} title="+5 BPM">+5</button>
            </div>
            <button className="sm:hidden sketch-btn h-5 w-5 flex items-center justify-center border-[#c4b89c] text-[10px] font-bold cursor-pointer" onClick={() => setBpm(Math.min(300, bpm + 1))} title="+1 BPM">+</button>

            {/* Slider */}
            <Slider value={[bpm]} min={30} max={300} step={1} onValueChange={([v]) => setBpm(v)}
              className="w-12 sm:w-20 md:w-28 lg:w-36 cursor-pointer" />

            {/* Tap Tempo */}
            <button className="sketch-btn text-[8px] px-1.5 py-0.5 border-[#8b7355] text-[#6b5b47] font-semibold cursor-pointer hidden sm:block" onClick={handleTapTempo} title="Tap Tempo">TAP</button>
          </div>

          <div className="w-px h-4 bg-[#e8e2d6]" />

          {/* GROUP 3: METRONOME */}
          <div className="flex items-center gap-1 shrink-0">
            <button className={`px-1.5 py-0.5 text-[9px] font-bold flex items-center gap-0.5 border-2 rounded-sm transition-all cursor-pointer ${
              metronomeOn ? 'bg-[#9b3939] text-white border-[#9b3939]' : 'sketch-btn border-[#6b5b47]'
            }`} onClick={toggleEnhancedMetronome} title="Metronome (M)">
              <Drum className="w-2.5 h-2.5" />
              <span className="hidden sm:inline">{metronomeOn ? 'ON' : 'MET'}</span>
            </button>

            {/* Compact beat dots */}
            <div className="hidden sm:flex items-center gap-px">
              {Array.from({ length: Math.min(timeSignature, 8) }, (_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full border transition-all duration-75 ${
                  metronomeOn && currentBeat === i ? 'bg-[#9b3939] border-[#9b3939] scale-125' : 'bg-transparent border-[#c4b89c]'
                }`} />
              ))}
            </div>

            {/* Time sig badge */}
            <span className="text-[9px] font-mono font-bold text-[#6b5b47] hidden md:inline">{timeSignatureDisplay}</span>

            {/* Subdivision badge */}
            {subdivision !== 'quarter' && (
              <span className="text-[8px] font-mono text-[#4a5a8a] hidden lg:inline">{SUBDIVISIONS.find(s => s.value === subdivision)?.label}</span>
            )}

            {/* Practice mode indicator */}
            {practiceMode !== 'none' && metronomeOn && (
              <span className={`text-[8px] font-bold font-serif italic ${
                practiceMode === 'tempo-trainer' ? 'text-[#4a5a8a]' :
                practiceMode === 'speed-burst' ? 'text-[#9b3939]' :
                'text-[#6b4a7a]'
              }`}>
                {practiceMode === 'tempo-trainer' ? 'TRN' : practiceMode === 'speed-burst' ? 'BRST' : 'RND'}
              </span>
            )}
          </div>

          <div className="w-px h-4 bg-[#e8e2d6] hidden md:block" />

          {/* GROUP 4: SESSION (compact) */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-0.5">
              <Hash className="w-2 h-2 text-[#8b7355]" />
              <span className="text-[9px] font-mono font-bold text-[#4a4a4a]">{repetitionCount}/{repetitionGoal}</span>
            </div>
            <div className="flex items-center gap-0.5">
              <Clock className="w-2 h-2 text-[#8b7355]" />
              <span className="text-[9px] font-mono font-bold text-[#4a4a4a]">{formatTime(practiceTimer)}</span>
            </div>
          </div>

          <div className="flex-1" />

          {/* Playback status */}
          {isPlaying && (
            <div className="hidden lg:flex items-center gap-0.5 shrink-0">
              <span className="text-[8px] text-[#9b3939] font-serif italic font-bold">{playbackMode === 'exercise' ? 'EX' : 'SC'}</span>
              <span className="text-[8px] text-[#4a4a4a] font-mono">{playingIdx + 1}/{playbackMode === 'exercise' ? currentExercise.notes.length : scaleNotesForPlayback.length}</span>
            </div>
          )}

          {/* Expand/Collapse Practice Panel */}
          <button className={`sketch-btn h-6 px-1.5 text-[8px] font-bold flex items-center gap-0.5 border-[#8b7355] cursor-pointer ${practicePanelOpen ? 'bg-[rgba(139,115,85,0.15)]' : ''}`}
            onClick={() => setPracticePanelOpen(!practicePanelOpen)} title="Practice Tools">
            <Target className="w-2.5 h-2.5" />
            <span className="hidden sm:inline">{practicePanelOpen ? 'Close' : 'Tools'}</span>
            {practicePanelOpen ? <ChevronDown className="w-2 h-2" /> : <ChevronUp className="w-2 h-2" />}
          </button>

          {/* Mobile scale selector */}
          <div className="md:hidden shrink-0">
            <Select value={scaleId} onValueChange={(v) => { setScaleId(v); setPositionIndex(0); stopPlayback(); }}>
              <SelectTrigger className="bg-[#f5f0e8] border-[#c4b89c] text-[9px] rounded-sm h-6 w-[90px] cursor-pointer"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#faf6ef] border-[#c4b89c]">
                {Object.entries(SCALES).map(([id, s]) => (<SelectItem key={id} value={id} className="text-[9px] text-[#2c2c2c] cursor-pointer">{s.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ═══ INFO / DOCUMENTATION SHEET ═══ */}
      <Sheet open={infoPageOpen} onOpenChange={setInfoPageOpen}>
        <SheetContent side="right" className="w-full sm:max-w-[700px] p-0 bg-[#faf6ef] border-l-2 border-[#8b7355] overflow-y-auto">
          <SheetHeader className="sticky top-0 z-10 bg-[#faf6ef] border-b-2 border-[#8b7355] px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded border-2 border-[#8b7355] flex items-center justify-center bg-[#f5f0e8]">
                <Guitar className="w-5 h-5 text-[#6b5b47]" />
              </div>
              <div>
                <SheetTitle className="text-lg font-bold text-[#2c2c2c]" style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic' }}>FretBoard Forge — Complete Guide</SheetTitle>
                <SheetDescription className="text-xs text-[#8b7355] font-serif italic">Everything you need to know about mastering the fretboard</SheetDescription>
              </div>
            </div>
          </SheetHeader>
          <div className="px-6 py-6 space-y-8 text-[13px] text-[#2c2c2c] leading-relaxed">

            {/* ─── Welcome ─── */}
            <section>
              <h2 className="text-base font-bold text-[#9b3939] mb-3 flex items-center gap-2" style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic' }}>
                <BookOpen className="w-4 h-4" /> Welcome to FretBoard Forge
              </h2>
              <p className="mb-2">FretBoard Forge is an interactive guitar practice tool designed to help guitarists of all levels master the fretboard. It provides a visual, hands-on approach to learning scales, positions, exercises, and music theory directly on a realistic fretboard diagram. Whether you are a beginner learning your first pentatonic shape or an advanced player working through complex arpeggio sequences, this tool adapts to your needs.</p>
              <p className="mb-2">At its core, FretBoard Forge shows you <strong>exactly where to place your fingers</strong> on the fretboard for any scale, in any key, at any position. It then generates structured exercises from those scale patterns, complete with tab notation, playback, and a professional metronome to keep your timing solid.</p>
              <p>The philosophy behind this tool is simple: <em>see it, hear it, play it, internalize it</em>. Visual learning combined with auditory feedback and structured repetition is the fastest path to fretboard mastery.</p>
            </section>

            <hr className="border-[#e8e2d6]" />

            {/* ─── Getting Started ─── */}
            <section>
              <h2 className="text-base font-bold text-[#9b3939] mb-3 flex items-center gap-2" style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic' }}>
                <Target className="w-4 h-4" /> Getting Started
              </h2>
              <div className="space-y-3">
                <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-3">
                  <h3 className="font-bold text-[11px] uppercase tracking-wider text-[#8b7355] mb-1">Step 1: Choose Your Key</h3>
                  <p className="text-[12px]">Use the <strong>Key</strong> dropdown in the header to select any of the 12 musical keys (C, C#/Db, D, etc.). The entire fretboard will instantly update to show the notes available in your chosen key.</p>
                </div>
                <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-3">
                  <h3 className="font-bold text-[11px] uppercase tracking-wider text-[#8b7355] mb-1">Step 2: Choose Your Scale</h3>
                  <p className="text-[12px]">Use the <strong>Scale</strong> dropdown to select from 12 scale types: Minor Pentatonic, Major Pentatonic, Blues, Major, Natural Minor, Harmonic Minor, Melodic Minor, Dorian, Phrygian, Lydian, Mixolydian, and Locrian. Each scale highlights different intervals, giving you a unique palette of notes to work with.</p>
                </div>
                <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-3">
                  <h3 className="font-bold text-[11px] uppercase tracking-wider text-[#8b7355] mb-1">Step 3: Choose Your Position</h3>
                  <p className="text-[12px]">The <strong>Position</strong> buttons (1–5 + All) let you focus on a specific CAGED position or view the entire fretboard at once. Positions correspond to the five fundamental scale shapes that every guitarist should know, based on the C-A-G-E-D chord shape system.</p>
                </div>
                <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-3">
                  <h3 className="font-bold text-[11px] uppercase tracking-wider text-[#8b7355] mb-1">Step 4: Pick an Exercise</h3>
                  <p className="text-[12px]">Browse the <strong>Exercise Library</strong> in the left sidebar. With 232+ exercise types across 43 categories and 700+ variations, you will find exercises for every skill level and focus area — from complete beginner chromatic warmups to advanced modal runs and odd groupings. Click any exercise to see it visualized on the fretboard with tab notation and detailed stats.</p>
                </div>
                <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-3">
                  <h3 className="font-bold text-[11px] uppercase tracking-wider text-[#8b7355] mb-1">Step 5: Play Along</h3>
                  <p className="text-[12px]">Hit the <strong>Play</strong> button (or press Space) to hear each note played back in sequence. Enable the <strong>metronome</strong> to practice with a steady beat. Use the practice tools like Tempo Trainer, Speed Burst, and more to progressively build speed and accuracy.</p>
                </div>
              </div>
            </section>

            <hr className="border-[#e8e2d6]" />

            {/* ─── Scales & Modes ─── */}
            <section>
              <h2 className="text-base font-bold text-[#9b3939] mb-3 flex items-center gap-2" style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic' }}>
                <Music className="w-4 h-4" /> Scales & Modes Explained
              </h2>
              <p className="mb-3">Scales are the foundation of all melody and improvisation. Each scale has a unique combination of intervals that gives it its characteristic sound. Here is a breakdown of every scale available in FretBoard Forge:</p>
              <div className="space-y-3">
                <div className="border-l-3 border-[#9b3939] pl-3">
                  <h3 className="font-bold text-[12px]">Minor Pentatonic</h3>
                  <p className="text-[11px] text-[#4a4a4a]">The most essential scale in rock, blues, and pop. Contains 5 notes: Root, flat 3rd, 4th, 5th, and flat 7th. Its simplicity makes it the perfect starting point for improvisation. Every guitarist should have all five positions memorized. The missing 2nd and 6th degrees are what give it that open, bluesy quality — there are no wrong notes to hit.</p>
                </div>
                <div className="border-l-3 border-[#4a5a8a] pl-3">
                  <h3 className="font-bold text-[12px]">Major Pentatonic</h3>
                  <p className="text-[11px] text-[#4a4a4a]">The happy counterpart to the minor pentatonic. Contains Root, 2nd, 3rd, 5th, and 6th. Used extensively in country, pop, and classic rock. It shares the same shapes as minor pentatonic but shifted down three frets (relative major/minor relationship). Try mixing major and minor pentatonic for classic blues-rock sounds.</p>
                </div>
                <div className="border-l-3 border-[#9b3939] pl-3">
                  <h3 className="font-bold text-[12px]">Blues Scale</h3>
                  <p className="text-[11px] text-[#4a4a4a]">The minor pentatonic with one crucial addition: the flat 5th (the blue note). This single note adds tension and release that defines the blues. Use it as a passing note between the 4th and 5th for that classic blues wail. The blue note works especially well when bent into or approached chromatically.</p>
                </div>
                <div className="border-l-3 border-[#4a5a8a] pl-3">
                  <h3 className="font-bold text-[12px]">Major Scale (Ionian)</h3>
                  <p className="text-[11px] text-[#4a4a4a]">The mother of all Western music theory. Seven notes: Root, 2nd, 3rd, 4th, 5th, 6th, 7th. Understanding the major scale unlocks everything — chords, modes, intervals, and harmony all derive from it. Practice this scale until you can play it in any key, any position, without thinking.</p>
                </div>
                <div className="border-l-3 border-[#9b3939] pl-3">
                  <h3 className="font-bold text-[12px]">Natural Minor (Aeolian)</h3>
                  <p className="text-[11px] text-[#4a4a4a]">The sixth mode of the major scale. Darker and more somber than the major scale, it is the foundation of rock and metal. The flat 3rd, flat 6th, and flat 7th give it its minor quality. Compare it to the major scale to hear the emotional difference that just three altered notes can make.</p>
                </div>
                <div className="border-l-3 border-[#6b4a7a] pl-3">
                  <h3 className="font-bold text-[12px]">Harmonic Minor</h3>
                  <p className="text-[11px] text-[#4a4a4a]">The natural minor with a raised 7th (natural 7th instead of flat 7th). This creates an exotic, classical sound with a signature augmented 2nd interval between the flat 6th and natural 7th. Widely used in classical, neoclassical, and metal. The raised 7th creates a stronger resolution back to the root, which is why it is the basis for minor-key harmony.</p>
                </div>
                <div className="border-l-3 border-[#6b4a7a] pl-3">
                  <h3 className="font-bold text-[12px]">Melodic Minor</h3>
                  <p className="text-[11px] text-[#4a4a4a]">The jazz musician's secret weapon. Ascending, it has a natural 6th and 7th (like major with a flat 3rd). Descending, it reverts to natural minor. In jazz practice, it is often used with the ascending form in both directions (jazz minor). This scale unlocks altered dominant sounds and is the basis for many advanced improvisational concepts.</p>
                </div>
                <div className="border-l-3 border-[#4a5a8a] pl-3">
                  <h3 className="font-bold text-[12px]">Dorian</h3>
                  <p className="text-[11px] text-[#4a4a4a]">The second mode of the major scale. Think of it as natural minor with a raised 6th. This single note change gives Dorian its unique jazzy, funky quality. It works beautifully over minor chords and ii-V progressions. Carlos Santana and many jazz greats rely heavily on this mode. The major 6th is the sweet note that distinguishes Dorian from Aeolian.</p>
                </div>
                <div className="border-l-3 border-[#6b4a7a] pl-3">
                  <h3 className="font-bold text-[12px]">Phrygian</h3>
                  <p className="text-[11px] text-[#4a4a4a]">The third mode, featuring a flat 2nd that creates an immediately dark, Spanish/flamenco flavor. The half-step between the root and flat 2nd is its defining characteristic. Used extensively in flamenco, metal, and progressive rock. Try it over minor chords for instant exotic tension.</p>
                </div>
                <div className="border-l-3 border-[#4a5a8a] pl-3">
                  <h3 className="font-bold text-[12px]">Lydian</h3>
                  <p className="text-[11px] text-[#4a4a4a]">The fourth mode with a raised 4th (sharp 4th). This creates a dreamy, floating quality. Joe Satriani and Steve Vai use Lydian extensively for its otherworldly sound. The sharp 4th over a major chord creates a beautiful tension that never quite resolves, giving Lydian its signature suspended-in-air feeling.</p>
                </div>
                <div className="border-l-3 border-[#4a5a8a] pl-3">
                  <h3 className="font-bold text-[12px]">Mixolydian</h3>
                  <p className="text-[11px] text-[#4a4a4a]">The fifth mode — essentially a major scale with a flat 7th. This is the dominant scale, the sound of rock, blues-rock, and funk. The flat 7th makes it perfect over dominant 7th chords. Think of the Grateful Dead, Allman Brothers, or any blues-rock solo — Mixolydian is the foundation.</p>
                </div>
                <div className="border-l-3 border-[#6b4a7a] pl-3">
                  <h3 className="font-bold text-[12px]">Locrian</h3>
                  <p className="text-[11px] text-[#4a4a4a]">The seventh and most dissonant mode. With a flat 2nd, flat 3rd, flat 5th, flat 6th, and flat 7th, it creates maximum tension. Used over half-diminished chords in jazz. While it may sound harsh on its own, understanding Locrian completes your modal knowledge and is essential for advanced jazz improvisation.</p>
                </div>
              </div>
            </section>

            <hr className="border-[#e8e2d6]" />

            {/* ─── CAGED System ─── */}
            <section>
              <h2 className="text-base font-bold text-[#9b3939] mb-3 flex items-center gap-2" style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic' }}>
                <Layers className="w-4 h-4" /> The CAGED System
              </h2>
              <p className="mb-2">The CAGED system is the most important fretboard navigation concept you will ever learn. It is based on the fact that the five basic open chord shapes — <strong>C, A, G, E, D</strong> — can be moved up the neck as barre chords to play any chord in any position. When applied to scales, these same five shapes give you a complete map of the fretboard.</p>
              <p className="mb-2">In FretBoard Forge, when you select a key and scale, the five CAGED positions are calculated automatically. Each position covers a 4–5 fret zone and connects to the next position through overlapping notes. Position 1 starts at the root on the low E string, and each subsequent position shifts higher up the neck.</p>
              <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-3 mb-2">
                <h3 className="font-bold text-[11px] uppercase tracking-wider text-[#8b7355] mb-1">The Five Shapes</h3>
                <ul className="text-[11px] space-y-1">
                  <li><strong>C Shape:</strong> Open C chord shape moved up the neck. Root on the A string. Wide stretch, great for rhythm playing.</li>
                  <li><strong>A Shape:</strong> Based on the open A chord. Root on the low E string. The most commonly used barre chord shape.</li>
                  <li><strong>G Shape:</strong> Based on the open G chord. Often the hardest shape to finger, but essential for connecting positions.</li>
                  <li><strong>E Shape:</strong> The classic F barre chord shape. Root on the low E string. The most familiar shape for most guitarists.</li>
                  <li><strong>D Shape:</strong> Based on the open D chord. Root on the D string. A smaller shape that works great in the upper register.</li>
                </ul>
              </div>
              <p className="text-[12px]">The real power of CAGED comes from <strong>connecting</strong> the positions. Use the Connecting and CAGED Cycle exercises to practice moving smoothly between shapes. The All Positions view shows you how all five shapes tile the entire fretboard like puzzle pieces.</p>
            </section>

            <hr className="border-[#e8e2d6]" />

            {/* ─── Exercise Library ─── */}
            <section>
              <h2 className="text-base font-bold text-[#9b3939] mb-3 flex items-center gap-2" style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic' }}>
                <FileText className="w-4 h-4" /> Exercise Library — Complete Reference
              </h2>
              <p className="mb-3">FretBoard Forge includes 232+ exercise types organized into 43+ categories across four sections, with over 700+ variations. Every exercise is dynamically generated based on your selected key, scale, and position. This is one of the most comprehensive guitar exercise libraries available anywhere. Here is a complete breakdown:</p>

              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-[12px] text-[#9b3939] mb-2">PRACTICE Exercises</h3>
                  <div className="space-y-2">
                    <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-2">
                      <h4 className="font-bold text-[11px] text-[#6b5b47]">Scale Runs (8 types)</h4>
                      <p className="text-[10px] text-[#4a4a4a]">Ascending Scale, Descending Scale, Asc/Desc Scale, Desc/Asc Scale, Reverse Pentatonic, Skip Note Scale, 3-Note Fragments, 4-Note Fragments. These are the bread and butter of scale practice. Start with ascending and descending runs, then progress to fragments and skip-note patterns for variety.</p>
                    </div>
                    <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-2">
                      <h4 className="font-bold text-[11px] text-[#6b5b47]">Sequences (12 types)</h4>
                      <p className="text-[10px] text-[#4a4a4a]">Diatonic Thirds, Fourths, Fifths, Sixths, Sevenths, plus 3- through 7-Note Sequences, and Pedal Tone patterns. Sequences train your ear to hear interval relationships while building picking speed and finger independence.</p>
                    </div>
                    <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-2">
                      <h4 className="font-bold text-[11px] text-[#6b5b47]">Shapes (10 types)</h4>
                      <p className="text-[10px] text-[#4a4a4a]">Triads, 1st/2nd Inversion Triads, Arpeggios, Octave Shapes, Double Stops, Shell Voicings, Dyads, Chord Scale, Power Shapes. Understanding shapes is how you move from playing scales to making music.</p>
                    </div>
                    <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-2">
                      <h4 className="font-bold text-[11px] text-[#6b5b47]">Arpeggios (6 types)</h4>
                      <p className="text-[10px] text-[#4a4a4a]">Sweep Arpeggios, String-Skipped Arps, Triad Arps Ascending, 7th Chord Arps, Inverted Arps, Connecting Arps. Arpeggios are the key to outlining chord changes in solos.</p>
                    </div>
                    <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-2">
                      <h4 className="font-bold text-[11px] text-[#6b5b47]">Rhythm (9 types)</h4>
                      <p className="text-[10px] text-[#4a4a4a]">Subdivisions, Syncopation, Rest Positions, Accents, Swing Feel, Tied Notes, Gallop Rhythm, Triplets, Dotted Rhythms. Rhythm practice is often overlooked but is essential for musicality.</p>
                    </div>
                    <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-2">
                      <h4 className="font-bold text-[11px] text-[#6b5b47]">Advanced Scale Runs (5 types)</h4>
                      <p className="text-[10px] text-[#4a4a4a]">3 Notes Per String (3NPS), Single String Runs, Zigzag Patterns, Wide Skip Patterns, Chromatic Passing Tones. These run patterns expand your fretboard vocabulary beyond basic positions.</p>
                    </div>
                    <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-2">
                      <h4 className="font-bold text-[11px] text-[#6b5b47]">Scale Patterns (5 types)</h4>
                      <p className="text-[10px] text-[#4a4a4a]">2NPS, 4NPS, Offset Runs, Spiral Patterns, Box Run Connections. Different note-per-string approaches change how you navigate the fretboard and open new melodic possibilities.</p>
                    </div>
                    <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-2">
                      <h4 className="font-bold text-[11px] text-[#6b5b47]">Blues (7 types)</h4>
                      <p className="text-[10px] text-[#4a4a4a]">Blues Lick 1, Blues Lick 2, Blues Turnaround, Blues Shuffle, Blues Bend Lick, Blues Rake, Blues Grace Notes. Essential vocabulary for blues and rock playing. The shuffle pattern is the backbone of blues rhythm. Turnarounds are the signature move that signals the end of a 12-bar progression. Rakes and grace notes add authentic blues expression.</p>
                    </div>
                    <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-2">
                      <h4 className="font-bold text-[11px] text-[#6b5b47]">Open String Exercises (4 types)</h4>
                      <p className="text-[10px] text-[#4a4a4a]">Alternate Picking Across Open Strings, Open + Fretted Combo, Open String Bass Run, Open String Arpeggio. Open string exercises develop picking hand coordination, teach the relationship between open and fretted notes, and build fingerstyle arpeggiation skills. Great for beginners and essential for fingerstyle players.</p>
                    </div>
                    <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-2">
                      <h4 className="font-bold text-[11px] text-[#6b5b47]">Chord Exercises (5 types)</h4>
                      <p className="text-[10px] text-[#4a4a4a]">Triad Chords Ascending/Descending, Power Fifth Shapes, Shell Voicing Comping, Barre Chord Drill. Chord exercises bridge the gap between single-note playing and rhythm guitar. Power chords are the foundation of rock, shell voicings are essential for jazz comping, and barre drills build hand strength and chord vocabulary.</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-[12px] text-[#4a5a8a] mb-2">TECHNIQUE Exercises</h3>
                  <div className="space-y-2">
                    <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-2">
                      <h4 className="font-bold text-[11px] text-[#6b5b47]">Picking (4 types)</h4>
                      <p className="text-[10px] text-[#4a4a4a]">String Skipping, Economy Picking, Cross-String Picking, Speed Bursts. Picking technique is the engine that drives everything else. Clean, efficient picking unlocks speed.</p>
                    </div>
                    <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-2">
                      <h4 className="font-bold text-[11px] text-[#6b5b47]">Legato (7 types)</h4>
                      <p className="text-[10px] text-[#4a4a4a]">Hammer-Ons/Pull-Offs, Slides, Ascending/Descending Hammer-Ons, Ascending/Descending Pull-Offs, Trills. Legato playing produces smooth, flowing lines and reduces pick dependency.</p>
                    </div>
                    <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-2">
                      <h4 className="font-bold text-[11px] text-[#6b5b47]">String Work (6 types)</h4>
                      <p className="text-[10px] text-[#4a4a4a]">Lateral Runs, Diagonal Patterns, Position Shifts, Pentatonic Runs, Spider Walk, Interval Jumps. These exercises develop your ability to move fluidly across the entire fretboard.</p>
                    </div>
                    <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-2">
                      <h4 className="font-bold text-[11px] text-[#6b5b47]">Spider Exercises (5 types)</h4>
                      <p className="text-[10px] text-[#4a4a4a]">Classic Chromatic Spider Walk, Cross-String Spider (ascending/descending), Inward Spider, Outward Spider. The spider walk is one of the most effective finger independence exercises ever devised. It forces each finger to operate independently while crossing strings.</p>
                    </div>
                    <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-2">
                      <h4 className="font-bold text-[11px] text-[#6b5b47]">String Crossing (4 types)</h4>
                      <p className="text-[10px] text-[#4a4a4a]">Ascending, Descending, Skip, and Alternate String Crossing. String crossing is where most picking problems occur. These exercises isolate and fix crossing issues.</p>
                    </div>
                    <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-2">
                      <h4 className="font-bold text-[11px] text-[#6b5b47]">Sweep Picking (4 types)</h4>
                      <p className="text-[10px] text-[#4a4a4a]">3-String Sweep, 5-String Sweep, Minor Sweep, Major Sweep. Sweep picking creates cascading arpeggio sounds that are impossible with alternate picking alone.</p>
                    </div>
                    <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-2">
                      <h4 className="font-bold text-[11px] text-[#6b5b47]">Position Shifting (3 types)</h4>
                      <p className="text-[10px] text-[#4a4a4a]">1-Fret, 2-Fret, and 3-Fret Shifts. Position shifting exercises teach you to slide your hand smoothly up and down the neck without losing your place.</p>
                    </div>
                    <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-2">
                      <h4 className="font-bold text-[11px] text-[#6b5b47]">Bending and Expression (8 types)</h4>
                      <p className="text-[10px] text-[#4a4a4a]">Unison Bends, Half-Step Bends, Full-Step Bends, Pre-Bends, Vibrato Control, Bend and Release, 1-Step Bends, 1.5-Step Bends. Bending is what makes the guitar sing — these exercises develop pitch accuracy and expressive control.</p>
                    </div>
                    <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-2">
                      <h4 className="font-bold text-[11px] text-[#6b5b47]">Tapping (7 types)</h4>
                      <p className="text-[10px] text-[#4a4a4a]">Basic Tapping, Arpeggio Tapping, Scale Tapping, Tapped Harmonics, 8-Finger Tapping, Sweep Tapping, Tap-Pull Combinations. Tapping extends your range and enables rapid arpeggio playing impossible with conventional technique.</p>
                    </div>
                    <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-2">
                      <h4 className="font-bold text-[11px] text-[#6b5b47]">Harmonics (5 types)</h4>
                      <p className="text-[10px] text-[#4a4a4a]">Natural Harmonics, Artificial Harmonics, Pinch Harmonics, Tapped Harmonics, Pinch Harmonics Scale. Harmonics add ethereal textures and are essential for advanced expression.</p>
                    </div>
                    <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-2">
                      <h4 className="font-bold text-[11px] text-[#6b5b47]">Advanced Technique (6 types)</h4>
                      <p className="text-[10px] text-[#4a4a4a]">Hybrid Picking, Chicken Pickin', Banjo Rolls, Palm Muting, Staccato, Sweep and Tap Combos. These specialized techniques add color and vocabulary to your playing style.</p>
                    </div>
                    <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-2">
                      <h4 className="font-bold text-[11px] text-[#6b5b47]">Speed and Agility (3 types)</h4>
                      <p className="text-[10px] text-[#4a4a4a]">Speed Ladder, 16th Note Speed Bursts, Triplet Speed Runs. Designed specifically to push your maximum tempo higher with structured progressive exercises.</p>
                    </div>
                    <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-2">
                      <h4 className="font-bold text-[11px] text-[#6b5b47]">Finger Independence Drills (6 types)</h4>
                      <p className="text-[10px] text-[#4a4a4a]">1-2-1-3, 1-2-1-4, 1-3-1-4, 2-1-2-3, 2-1-2-4, 3-1-3-2 Drill. These alternating finger pair exercises specifically target the independence between each finger combination. They isolate problem pairs like ring-pinky and middle-ring that most guitarists struggle with.</p>
                    </div>
                    <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-2">
                      <h4 className="font-bold text-[11px] text-[#6b5b47]">Slide Exercises (3 types)</h4>
                      <p className="text-[10px] text-[#4a4a4a]">Slide Up 1 Fret, Slide Up 2 Frets, Slide Down 1 Fret. Slides are one of the most expressive legato techniques on guitar. These exercises develop precise sliding technique with accurate target note arrival.</p>
                    </div>
                    <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-2">
                      <h4 className="font-bold text-[11px] text-[#6b5b47]">Picking Drills (4 types)</h4>
                      <p className="text-[10px] text-[#4a4a4a]">Alternate Picking 1 String, Alternate Picking 2 Strings, Sweep Pick Drill, Cross Picking Drill. Isolated picking exercises that target specific picking mechanics. The single-string drill builds raw speed, cross-picking develops bluegrass vocabulary, and sweep drills form the foundation for arpeggio technique.</p>
                    </div>
                    <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-2">
                      <h4 className="font-bold text-[11px] text-[#6b5b47]">Tremolo and Trill (3 types)</h4>
                      <p className="text-[10px] text-[#4a4a4a]">Single String Tremolo, Chord Tremolo, Trill Speed Drill. Tremolo technique is essential for classical and flamenco playing. The trill drill builds the rapid hammer-pull speed that makes legato passages effortless.</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-[12px] text-[#6b4a7a] mb-2">ADVANCED Exercises</h3>
                  <div className="space-y-2">
                    <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-2">
                      <h4 className="font-bold text-[11px] text-[#6b5b47]">Connections (4 types)</h4>
                      <p className="text-[10px] text-[#4a4a4a]">Position Connecting, Position Sweep, CAGED Cycle, CAGED Run. These exercises teach you to flow between positions without hesitation — the mark of an advanced player.</p>
                    </div>
                    <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-2">
                      <h4 className="font-bold text-[11px] text-[#6b5b47]">Intervals (10 types)</h4>
                      <p className="text-[10px] text-[#4a4a4a]">2nd through 7th Intervals, Octave Drills, Tritone Studies, Compound Intervals, Chromatic Interval Walking. Interval knowledge is the bridge between theory and ear training.</p>
                    </div>
                    <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-2">
                      <h4 className="font-bold text-[11px] text-[#6b5b47]">Arpeggio Studies (6 types)</h4>
                      <p className="text-[10px] text-[#4a4a4a]">Diminished, Augmented, Minor 7th, Dominant 7th, Major 7th, Minor 9th Arpeggios. Extended arpeggios are essential for jazz and progressive playing.</p>
                    </div>
                    <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-2">
                      <h4 className="font-bold text-[11px] text-[#6b5b47]">Advanced Sequences (5 types)</h4>
                      <p className="text-[10px] text-[#4a4a4a]">Enclosures, Bebop Scales, Cycle of 4ths, Cycle of 5ths, Chromatic Enclosures. Jazz vocabulary that adds sophistication to any line.</p>
                    </div>
                    <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-2">
                      <h4 className="font-bold text-[11px] text-[#6b5b47]">Advanced Shapes (5 types)</h4>
                      <p className="text-[10px] text-[#4a4a4a]">Barre Shapes, Drop 2 Voicings, Guide Tones, Quartal Voicings, Stacked Fourths. Chord voicing knowledge transforms your rhythm and comping abilities.</p>
                    </div>
                    <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-2">
                      <h4 className="font-bold text-[11px] text-[#6b5b47]">Fretboard Navigation (8 types)</h4>
                      <p className="text-[10px] text-[#4a4a4a]">Note Finder, Octave Drill, Unison Drill, Interval Matrix, CAGED Shapes, Note Triplets, Relative Note Finding, Fretboard Mapping. These drills build deep fretboard knowledge that makes everything easier.</p>
                    </div>
                    <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-2">
                      <h4 className="font-bold text-[11px] text-[#6b5b47]">Advanced String Skipping (4 types)</h4>
                      <p className="text-[10px] text-[#4a4a4a]">Skip 3rd String, Skip 4th String, Octave String Skip, Scale String Skip. Advanced string skipping exercises that push beyond basic skipping patterns. Octave skips develop your ear for intervals across wide distances, while scale skipping patterns build true fretboard freedom.</p>
                    </div>
                    <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-2">
                      <h4 className="font-bold text-[11px] text-[#6b5b47]">Modal Exercises (4 types)</h4>
                      <p className="text-[10px] text-[#4a4a4a]">Dorian Modal Run, Mixolydian Modal Run, Lydian Modal Run, Phrygian Modal Run. Each modal run emphasizes the characteristic note that defines that mode — the natural 6th in Dorian, the flat 7th in Mixolydian, the sharp 4th in Lydian, and the flat 2nd in Phrygian. Understanding modes is essential for improvising over chord changes.</p>
                    </div>
                    <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-2">
                      <h4 className="font-bold text-[11px] text-[#6b5b47]">Odd Groupings (4 types)</h4>
                      <p className="text-[10px] text-[#4a4a4a]">5-Note Groupings, 7-Note Groupings, 9-Note Groupings, Rhythmic Displacement. Playing in groups of 5, 7, or 9 against a 4/4 beat creates fascinating rhythmic tension and release. Rhythmic displacement shifts the same phrase to start on different beats, creating entirely new musical feels from the same notes. These are advanced concepts used by virtuoso players like John McLaughlin and Allan Holdsworth.</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-[12px] text-[#8b7355] mb-2">WARMUP Exercises</h3>
                  <div className="space-y-2">
                    <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-2">
                      <h4 className="font-bold text-[11px] text-[#6b5b47]">Chromatic Drills (12 types)</h4>
                      <p className="text-[10px] text-[#4a4a4a]">Classic 1-2-3-4, Reverse 4-3-2-1, plus 10 finger permutation patterns (1-3-2-4, 1-4-2-3, 2-4-1-3, 2-3-4-1, 3-1-4-2, 4-1-3-2, 3-2-4-1, and more), descending chromatic warmup, and full-range chromatic runs. These are the most fundamental warmup exercises and should be part of every practice session.</p>
                    </div>
                    <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-2">
                      <h4 className="font-bold text-[11px] text-[#6b5b47]">Complete Chromatic Permutations (14 types)</h4>
                      <p className="text-[10px] text-[#4a4a4a]">The remaining 14 of all 24 possible permutations of fingers 1-2-3-4: 1-2-4-3, 1-3-4-2, 1-4-3-2, 2-1-3-4, 2-1-4-3, 2-3-1-4, 2-4-3-1, 3-1-2-4, 3-2-1-4, 3-4-1-2, 3-4-2-1, 4-1-2-3, 4-2-1-3, 4-2-3-1. Together with the Chromatic Drills, every single one of the 24 possible finger permutations is covered. No gaps.</p>
                    </div>
                    <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-2">
                      <h4 className="font-bold text-[11px] text-[#6b5b47]">Warmups (4 types)</h4>
                      <p className="text-[10px] text-[#4a4a4a]">Chromatic Warmup, Spider Warmup, Finger Gym, String Cross Warmup. General warmup exercises to get blood flowing and fingers limber before serious practice.</p>
                    </div>
                    <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-2">
                      <h4 className="font-bold text-[11px] text-[#6b5b47]">Finger Stretch (4 types)</h4>
                      <p className="text-[10px] text-[#4a4a4a]">Progressive stretch patterns plus dedicated 1-4 stretch exercises with 1-fret, 2-fret, and wide stretch variations. These build the finger independence and reach needed for wide intervallic leaps and chord voicings.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <hr className="border-[#e8e2d6]" />

            {/* ─── Practice Engine ─── */}
            <section>
              <h2 className="text-base font-bold text-[#9b3939] mb-3 flex items-center gap-2" style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic' }}>
                <Target className="w-4 h-4" /> Practice Engine and Metronome
              </h2>
              <p className="mb-2">The bottom toolbar is your complete practice command center. It combines a professional metronome with structured practice tools designed to systematically improve your playing.</p>
              <div className="space-y-3">
                <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-3">
                  <h3 className="font-bold text-[11px] uppercase tracking-wider text-[#8b7355] mb-1">Transport Controls</h3>
                  <p className="text-[11px]">Play, Pause, Stop, and Skip buttons control exercise playback. Press Space to play/pause, Escape to stop. Each note is played with a realistic guitar tone synthesis using Web Audio, so you can hear exactly what each note should sound like.</p>
                </div>
                <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-3">
                  <h3 className="font-bold text-[11px] uppercase tracking-wider text-[#8b7355] mb-1">Tempo Control</h3>
                  <p className="text-[11px]">Adjust BPM from 30 to 300 using the slider, or click the BPM number to type a specific value. Use arrow keys (Left/Right) for fine adjustment, or Shift+Arrow for 5 BPM jumps. The Tap Tempo button lets you set the BPM by tapping in time.</p>
                </div>
                <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-3">
                  <h3 className="font-bold text-[11px] uppercase tracking-wider text-[#8b7355] mb-1">Metronome</h3>
                  <p className="text-[11px]">9 sound types: Classic Woodblock, Stick, Cowbell, Digital, Drumstick, Hi-Hat, Electronic, Rim Shot, and Shaker. Supports subdivisions from quarter notes through sextuplets, time signatures from 2/4 to 12/8, accent modes (first beat, every Nth beat, random), gap click training, silent measures, and polyrhythm overlays. Press M to toggle the metronome.</p>
                </div>
                <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-3">
                  <h3 className="font-bold text-[11px] uppercase tracking-wider text-[#8b7355] mb-1">Practice Tools</h3>
                  <ul className="text-[11px] space-y-1 mt-1">
                    <li><strong>Tempo Trainer:</strong> Automatically increases BPM after a set number of repetitions. Start slow and build speed progressively.</li>
                    <li><strong>Speed Burst:</strong> Alternates between your base tempo and a faster burst tempo. Great for pushing your upper limit.</li>
                    <li><strong>Random Tempo:</strong> Changes tempo randomly within a range. Trains adaptability and prevents mechanical playing.</li>
                    <li><strong>Repetition Counter:</strong> Track how many times you have played through the exercise. Set goals to stay focused.</li>
                    <li><strong>Practice Timer:</strong> Tracks total practice time in the current session.</li>
                  </ul>
                </div>
              </div>
            </section>

            <hr className="border-[#e8e2d6]" />

            {/* ─── Music Theory ─── */}
            <section>
              <h2 className="text-base font-bold text-[#9b3939] mb-3 flex items-center gap-2" style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic' }}>
                <Music className="w-4 h-4" /> Essential Guitar Theory
              </h2>
              <div className="space-y-3">
                <div>
                  <h3 className="font-bold text-[12px] mb-1">Intervals</h3>
                  <p className="text-[11px] mb-1">Intervals are the distance between two notes, measured in semitones (half steps). Every scale, chord, and melody is built from intervals. Understanding them is the key to ear training and improvisation.</p>
                  <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-2 text-[10px]">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                      <span><strong>0 semitones</strong> — Unison (same note)</span>
                      <span><strong>1 semitone</strong> — Minor 2nd</span>
                      <span><strong>2 semitones</strong> — Major 2nd</span>
                      <span><strong>3 semitones</strong> — Minor 3rd</span>
                      <span><strong>4 semitones</strong> — Major 3rd</span>
                      <span><strong>5 semitones</strong> — Perfect 4th</span>
                      <span><strong>6 semitones</strong> — Tritone (aug 4th / dim 5th)</span>
                      <span><strong>7 semitones</strong> — Perfect 5th</span>
                      <span><strong>8 semitones</strong> — Minor 6th</span>
                      <span><strong>9 semitones</strong> — Major 6th</span>
                      <span><strong>10 semitones</strong> — Minor 7th</span>
                      <span><strong>11 semitones</strong> — Major 7th</span>
                      <span><strong>12 semitones</strong> — Octave</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-[12px] mb-1">The Nashville Number System</h3>
                  <p className="text-[11px]">FretBoard Forge uses scale degrees (R, 2, 3, 4, 5, 6, 7 for major; R, flat 3, 4, 5, flat 7 for minor pentatonic, etc.) to label notes. This is similar to the Nashville Number System used by session musicians worldwide. By thinking in numbers rather than note names, you can transpose any pattern to any key instantly — just change the root and the intervals stay the same.</p>
                </div>
                <div>
                  <h3 className="font-bold text-[12px] mb-1">Relative Major/Minor</h3>
                  <p className="text-[11px]">Every major key has a relative minor key that shares the same notes (and vice versa). The relative minor is found 3 semitones below the major root. For example, C Major and A Minor share identical notes — the difference is which note feels like home. This is why the minor pentatonic and major pentatonic shapes overlap on the fretboard.</p>
                </div>
                <div>
                  <h3 className="font-bold text-[12px] mb-1">Chord Construction</h3>
                  <p className="text-[11px]">Chords are built by stacking intervals: Major triad = Root + Major 3rd + Perfect 5th. Minor triad = Root + Minor 3rd + Perfect 5th. Diminished = Root + Minor 3rd + Diminished 5th. Augmented = Root + Major 3rd + Augmented 5th. Seventh chords add a fourth note. Understanding construction lets you find any chord anywhere on the neck.</p>
                </div>
                <div>
                  <h3 className="font-bold text-[12px] mb-1">Diatonic Harmony</h3>
                  <p className="text-[11px]">In any major key, chords naturally occur in this order: I (major), ii (minor), iii (minor), IV (major), V (major), vi (minor), viio (diminished). This is the foundation of most Western music. The V7 chord resolving to I is the strongest cadence in music. Practice the Chord Scale exercise to see and hear this relationship on the fretboard.</p>
                </div>
                <div>
                  <h3 className="font-bold text-[12px] mb-1">The Fretboard Layout</h3>
                  <p className="text-[11px]">The guitar fretboard repeats every 12 frets (one octave). Fret 12 is the octave of the open string. The dots at frets 3, 5, 7, 9, and the double dot at 12 are visual landmarks. Learning the notes on the low E and A strings first gives you anchor points for finding every other note using octave shapes. The Note Finder and Octave Drill exercises are specifically designed to build this knowledge.</p>
                </div>
                <div>
                  <h3 className="font-bold text-[12px] mb-1">String Tuning and Standard Tuning</h3>
                  <p className="text-[11px]">FretBoard Forge uses standard tuning: E-A-D-G-B-E (low to high). The intervals between adjacent strings are: 4th, 4th, 4th, Major 3rd, 4th — that Major 3rd between G and B strings is the B string bump that makes guitar tuning unique and requires a fret adjustment when crossing between the G and B strings.</p>
                </div>
              </div>
            </section>

            <hr className="border-[#e8e2d6]" />

            {/* ─── View Modes ─── */}
            <section>
              <h2 className="text-base font-bold text-[#9b3939] mb-3 flex items-center gap-2" style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic' }}>
                <Eye className="w-4 h-4" /> View Modes
              </h2>
              <p className="mb-2">FretBoard Forge offers three view modes, selectable with the eye icon in the right panel:</p>
              <div className="space-y-2">
                <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-2">
                  <h4 className="font-bold text-[11px] text-[#6b5b47]">Hybrid View</h4>
                  <p className="text-[10px]">Shows both the fretboard diagram and pattern diagram simultaneously. This is the default and recommended view for most practice sessions. You can see the big picture (fretboard) and the detailed exercise pattern (diagram) at the same time.</p>
                </div>
                <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-2">
                  <h4 className="font-bold text-[11px] text-[#6b5b47]">Fretboard Only</h4>
                  <p className="text-[10px]">Full-width fretboard view for seeing the complete scale layout. Ideal for learning note positions and understanding how shapes connect across the neck. Notes light up as they play in sequence.</p>
                </div>
                <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-2">
                  <h4 className="font-bold text-[11px] text-[#6b5b47]">Diagram Only</h4>
                  <p className="text-[10px]">Pattern diagram with tab notation. Shows the exercise shape clearly with numbered finger positions. Best for focused practice on a specific exercise pattern without fretboard distractions.</p>
                </div>
              </div>
            </section>

            <hr className="border-[#e8e2d6]" />

            {/* ─── Color Coding ─── */}
            <section>
              <h2 className="text-base font-bold text-[#9b3939] mb-3 flex items-center gap-2" style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic' }}>
                <Star className="w-4 h-4" /> Color Coding System
              </h2>
              <p className="mb-2">Notes on the fretboard are color-coded by interval function, making it easy to see the structure of any scale at a glance:</p>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full" style={{ backgroundColor: '#ef4444' }} /> <span><strong>Red</strong> — Root (R)</span></div>
                <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full" style={{ backgroundColor: '#a855f7' }} /> <span><strong>Purple</strong> — Flat intervals</span></div>
                <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full" style={{ backgroundColor: '#22c55e' }} /> <span><strong>Green</strong> — Natural intervals</span></div>
                <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full" style={{ backgroundColor: '#3b82f6' }} /> <span><strong>Blue</strong> — Fourth (4)</span></div>
                <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full" style={{ backgroundColor: '#06b6d4' }} /> <span><strong>Cyan</strong> — Fifth (5)</span></div>
                <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full" style={{ backgroundColor: '#f97316' }} /> <span><strong>Orange</strong> — Sixth intervals</span></div>
                <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full" style={{ backgroundColor: '#ec4899' }} /> <span><strong>Pink</strong> — Seventh intervals</span></div>
              </div>
              <p className="mt-2 text-[11px]">String pairs share colors: Low E and A strings are red, D and G strings are yellow, B and High E strings are green. This visual grouping helps you quickly identify which strings you are looking at.</p>
            </section>

            <hr className="border-[#e8e2d6]" />

            {/* ─── Difficulty Levels ─── */}
            <section>
              <h2 className="text-base font-bold text-[#9b3939] mb-3 flex items-center gap-2" style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic' }}>
                <BarChart3 className="w-4 h-4" /> Difficulty Levels
              </h2>
              <p className="mb-2">Every exercise is rated on a 1–5 difficulty scale, shown as dots next to the exercise name:</p>
              <div className="space-y-1 text-[11px]">
                <div><strong>Level 1:</strong> Beginner. Single-direction scale runs, basic chromatic patterns. Anyone can start here regardless of experience.</div>
                <div><strong>Level 2:</strong> Early Intermediate. Sequences like thirds, pedal tones, simple triad shapes. Requires comfort with alternate picking and basic position playing.</div>
                <div><strong>Level 3:</strong> Intermediate. More complex sequences, string skipping, inversions, wider intervals. You should be comfortable with all five CAGED positions.</div>
                <div><strong>Level 4:</strong> Advanced. Extended arpeggios, bebop vocabulary, compound intervals, advanced string crossing. Requires solid technique and fretboard knowledge.</div>
                <div><strong>Level 5:</strong> Expert. Sweep tapping, 8-finger tapping, complex enclosures, advanced voicings. These push the limits of guitar technique.</div>
              </div>
            </section>

            <hr className="border-[#e8e2d6]" />

            {/* ─── Keyboard Shortcuts ─── */}
            <section>
              <h2 className="text-base font-bold text-[#9b3939] mb-3 flex items-center gap-2" style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic' }}>
                <Hash className="w-4 h-4" /> Keyboard Shortcuts
              </h2>
              <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-3">
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[11px]">
                  <div><kbd className="bg-[#e8e2d6] px-1 rounded text-[9px] font-mono">Space</kbd> — Play / Pause</div>
                  <div><kbd className="bg-[#e8e2d6] px-1 rounded text-[9px] font-mono">Esc</kbd> — Stop</div>
                  <div><kbd className="bg-[#e8e2d6] px-1 rounded text-[9px] font-mono">M</kbd> — Toggle Metronome</div>
                  <div><kbd className="bg-[#e8e2d6] px-1 rounded text-[9px] font-mono">Left</kbd> — BPM -1</div>
                  <div><kbd className="bg-[#e8e2d6] px-1 rounded text-[9px] font-mono">Right</kbd> — BPM +1</div>
                  <div><kbd className="bg-[#e8e2d6] px-1 rounded text-[9px] font-mono">Shift+Left</kbd> — BPM -5</div>
                  <div><kbd className="bg-[#e8e2d6] px-1 rounded text-[9px] font-mono">Shift+Right</kbd> — BPM +5</div>
                </div>
              </div>
            </section>

            <hr className="border-[#e8e2d6]" />

            {/* ─── Practice Tips ─── */}
            <section>
              <h2 className="text-base font-bold text-[#9b3939] mb-3 flex items-center gap-2" style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic' }}>
                <Zap className="w-4 h-4" /> Practice Tips
              </h2>
              <div className="space-y-2">
                <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-2">
                  <h4 className="font-bold text-[11px] text-[#6b5b47]">Start Slow, Build Speed</h4>
                  <p className="text-[10px]">Always begin at a tempo where you can play perfectly. Use the Tempo Trainer to gradually increase BPM. Speed is a byproduct of accuracy — never sacrifice clean playing for tempo.</p>
                </div>
                <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-2">
                  <h4 className="font-bold text-[11px] text-[#6b5b47]">Use the Metronome Always</h4>
                  <p className="text-[10px]">Timing separates good guitarists from great ones. Even simple exercises become valuable when practiced with strict time. Start with quarter notes, then progress to eighth notes, triplets, and sixteenths.</p>
                </div>
                <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-2">
                  <h4 className="font-bold text-[11px] text-[#6b5b47]">Practice All Positions</h4>
                  <p className="text-[10px]">Do not get stuck in Position 1. Work through all five CAGED positions. The All Positions view shows you the complete fretboard map — aim to be equally comfortable in every zone.</p>
                </div>
                <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-2">
                  <h4 className="font-bold text-[11px] text-[#6b5b47]">Practice All Keys</h4>
                  <p className="text-[10px]">Many guitarists only practice in guitar-friendly keys (E, A, D, G, C). Force yourself to work in all 12 keys. The fretboard patterns are identical — only the starting position changes. Use the Cycle of 4ths or Cycle of 5ths exercises to practice key changes systematically.</p>
                </div>
                <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-2">
                  <h4 className="font-bold text-[11px] text-[#6b5b47]">Mix Exercise Types</h4>
                  <p className="text-[10px]">Alternate between scale runs, arpeggios, and technique exercises in each session. This develops well-rounded musicianship rather than narrow specialization. A good session might include: 5 min chromatic warmup, 10 min scale sequences, 10 min arpeggios, 10 min technique work, 5 min free improvisation.</p>
                </div>
                <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-2">
                  <h4 className="font-bold text-[11px] text-[#6b5b47]">Listen to the Playback</h4>
                  <p className="text-[10px]">Use the play button to hear each exercise before attempting it. This builds the crucial ear-finger connection. Try to sing or hum each note as you play it — if you can sing it, you truly hear it.</p>
                </div>
                <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-2">
                  <h4 className="font-bold text-[11px] text-[#6b5b47]">The Spider Walk is Your Best Friend</h4>
                  <p className="text-[10px]">The Chromatic Spider Walk is one of the most effective finger independence exercises ever created. It forces each finger to move independently while crossing strings. Do it daily as a warmup, starting at 60 BPM and working up to 120+ BPM over weeks.</p>
                </div>
                <div className="bg-[#f5f0e8] rounded border border-[#c4b89c] p-2">
                  <h4 className="font-bold text-[11px] text-[#6b5b47]">Consistency Over Duration</h4>
                  <p className="text-[10px]">Twenty minutes of focused daily practice beats two hours of unfocused practice once a week. Use the built-in practice timer and repetition counter to maintain structure. Set a goal (e.g., 20 clean repetitions) and stop when you achieve it.</p>
                </div>
              </div>
            </section>

            <hr className="border-[#e8e2d6]" />

            {/* ─── FAQ ─── */}
            <section>
              <h2 className="text-base font-bold text-[#9b3939] mb-3 flex items-center gap-2" style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic' }}>
                <Route className="w-4 h-4" /> Frequently Asked Questions
              </h2>
              <div className="space-y-3">
                <div>
                  <h3 className="font-bold text-[12px]">What does the All position button do?</h3>
                  <p className="text-[11px]">It shows the complete scale across the entire fretboard (frets 0-15) instead of restricting to a single CAGED position. This is useful for seeing the big picture and understanding how all five positions connect.</p>
                </div>
                <div>
                  <h3 className="font-bold text-[12px]">Why are there 5 positions?</h3>
                  <p className="text-[11px]">The 5 positions correspond to the C-A-G-E-D chord shapes. Each shape covers a 4-5 fret zone and connects to the next. Together, these 5 shapes tile the entire fretboard without gaps.</p>
                </div>
                <div>
                  <h3 className="font-bold text-[12px]">How do I know which exercise to start with?</h3>
                  <p className="text-[11px]">Begin with Level 1 exercises (marked with one dot): Ascending Scale, Descending Scale, or Chromatic 1-2-3-4. These build the foundation. Progress to Level 2 once you can play Level 1 exercises cleanly at 80+ BPM with the metronome.</p>
                </div>
                <div>
                  <h3 className="font-bold text-[12px]">What is the difference between Intervals and Sequences?</h3>
                  <p className="text-[11px]">Sequences play through the scale in a specific pattern (e.g., play 3 notes, shift up one, repeat). Intervals specifically target the distance between two notes (e.g., find every major 3rd above each root). Sequences build technique; intervals build ear training and fretboard knowledge.</p>
                </div>
                <div>
                  <h3 className="font-bold text-[12px]">Can I use this for bass guitar?</h3>
                  <p className="text-[11px]">While designed for 6-string guitar in standard tuning, the scale and interval theory applies directly to bass (which uses the same tuning for the low 4 strings). The exercises work on bass — simply ignore the B and high E strings.</p>
                </div>
                <div>
                  <h3 className="font-bold text-[12px]">What BPM should I practice at?</h3>
                  <p className="text-[11px]">Start at 60-80 BPM for new exercises. Increase by 5 BPM only when you can play perfectly at the current tempo. Most intermediate players work between 100-140 BPM. Advanced players may reach 160-200+ BPM for scale runs.</p>
                </div>
                <div>
                  <h3 className="font-bold text-[12px]">What is the Enclosure exercise?</h3>
                  <p className="text-[11px]">An enclosure is a jazz technique where you approach a target note from above and below before landing on it. For example, to target C, you might play C#-B-C (chromatic enclosure) or D-B-C (diatonic enclosure). This creates melodic interest and is a hallmark of bebop vocabulary.</p>
                </div>
                <div>
                  <h3 className="font-bold text-[12px]">How do the metronome subdivisions work?</h3>
                  <p className="text-[11px]">Quarter notes = 1 click per beat. Eighth notes = 2 clicks per beat. Triplets = 3 clicks per beat. Sixteenths = 4 clicks per beat. Sextuplets = 6 clicks per beat. Start with quarter notes and gradually subdivide further as your timing improves.</p>
                </div>
              </div>
            </section>

            {/* Closing */}
            <div className="text-center py-4 border-t-2 border-[#8b7355] mt-6">
              <div className="w-8 h-8 rounded border-2 border-[#8b7355] flex items-center justify-center bg-[#f5f0e8] mx-auto mb-2">
                <Guitar className="w-5 h-5 text-[#6b5b47]" />
              </div>
              <p className="text-[12px] font-serif italic text-[#8b7355] font-bold">FretBoard Forge</p>
              <p className="text-[10px] text-[#b8a88a] font-serif italic">Master the fretboard, one note at a time.</p>
            </div>

          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
