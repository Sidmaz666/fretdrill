// Exercise Generator for Guitar
// Generates various practice exercises from scale patterns
// Enhanced with more exercise types and proper CAGED pattern shapes

import {
  FretboardNote,
  getScaleOnFretboard,
  getScaleInPosition,
  getCAGEDPositions,
  NOTES,
  NoteName,
  STRING_OPEN_NOTES,
  FRET_COUNT,
} from './music-theory';

export interface ExerciseNote {
  string: number;
  fret: number;
  note: string;
  intervalLabel: string;
  isRoot: boolean;
  sequenceNumber?: number; // Order in the exercise sequence
}

export interface Exercise {
  name: string;
  description: string;
  type: ExerciseType;
  notes: ExerciseNote[];
  tabs: string[];
  patternId?: string; // Which CAGED pattern this exercise belongs to
}

export type ExerciseType = 
  | 'scale-asc' 
  | 'scale-desc' 
  | 'scale-asc-desc'
  | 'reverse-pentatonic'
  | 'thirds' 
  | 'sequence-3' 
  | 'sequence-4'
  | 'sequence-5'
  | 'pedal-tone'
  | 'triads' 
  | 'arpeggios'
  | 'octave-shapes'
  | 'double-stops'
  | 'connecting'
  | 'string-skip'
  | 'lateral-run'
  | 'diagonal'
  | 'position-shift'
  | 'pentatonic-run'
  | 'economy-picking'
  | 'spider-walk'
  | 'interval-jump';

export const EXERCISE_TYPES: Record<ExerciseType, { name: string; description: string }> = {
  'scale-asc': { name: 'Ascending Scale', description: 'Play scale ascending from root to octave' },
  'scale-desc': { name: 'Descending Scale', description: 'Play scale descending from octave to root' },
  'scale-asc-desc': { name: 'Asc/Desc Scale', description: 'Play scale ascending then descending' },
  'reverse-pentatonic': { name: 'Reverse Pentatonic', description: 'Pentatonic pattern descending then ascending' },
  'thirds': { name: 'Diatonic Thirds', description: 'Play scale in thirds (skip one note each time)' },
  'sequence-3': { name: '3-Note Sequences', description: 'Groups of 3 ascending notes, shifting by one degree' },
  'sequence-4': { name: '4-Note Sequences', description: 'Groups of 4 ascending notes, shifting by one degree' },
  'sequence-5': { name: '5-Note Sequences', description: 'Groups of 5 ascending notes, shifting by one degree' },
  'pedal-tone': { name: 'Pedal Tone', description: 'Alternate root with each scale degree' },
  'triads': { name: 'Triad Shapes', description: 'Find and play triad shapes within the scale' },
  'arpeggios': { name: 'Arpeggios', description: 'Arpeggiated patterns built from scale degrees' },
  'octave-shapes': { name: 'Octave Shapes', description: 'Root and octave pairs across the fretboard' },
  'double-stops': { name: 'Double Stops', description: 'Two-note pairs on adjacent strings' },
  'connecting': { name: 'Position Connect', description: 'Connect between adjacent CAGED positions' },
  'string-skip': { name: 'String Skipping', description: 'Skip strings while playing scale notes' },
  'lateral-run': { name: 'Lateral Run', description: 'Run across strings at the same fret position' },
  'diagonal': { name: 'Diagonal Pattern', description: 'Play a diagonal pattern across the fretboard' },
  'position-shift': { name: 'Position Shift', description: 'Shift between CAGED positions smoothly' },
  'pentatonic-run': { name: 'Pentatonic Run', description: 'Classic 2-notes-per-string pentatonic run' },
  'economy-picking': { name: 'Economy Picking', description: 'Practice economy/sweep picking patterns' },
  'spider-walk': { name: 'Spider Walk', description: 'Walking pattern across strings building finger independence' },
  'interval-jump': { name: 'Interval Jump', description: 'Jump between different intervals within the scale' },
};

function fretboardToExerciseNote(fn: FretboardNote, seqNum?: number): ExerciseNote {
  return {
    string: fn.string,
    fret: fn.fret,
    note: fn.note,
    intervalLabel: fn.intervalLabel,
    isRoot: fn.isRoot,
    sequenceNumber: seqNum,
  };
}

// Sort notes for playing: ascending by pitch
export function sortNotesAscending(notes: FretboardNote[]): FretboardNote[] {
  return [...notes].sort((a, b) => {
    // Calculate pitch: each string is roughly 5 semitones apart
    const pitchA = (5 - a.string) * 5 + a.fret; // high strings = higher pitch
    const pitchB = (5 - b.string) * 5 + b.fret;
    if (pitchA !== pitchB) return pitchA - pitchB;
    return a.fret - b.fret;
  });
}

function sortNotesDescending(notes: FretboardNote[]): FretboardNote[] {
  return [...notes].sort((a, b) => {
    const pitchA = (5 - a.string) * 5 + a.fret;
    const pitchB = (5 - b.string) * 5 + b.fret;
    if (pitchA !== pitchB) return pitchB - pitchA;
    return b.fret - a.fret;
  });
}

// Add sequence numbers to exercise notes
function addSequenceNumbers(notes: ExerciseNote[]): ExerciseNote[] {
  return notes.map((n, i) => ({ ...n, sequenceNumber: i + 1 }));
}

// Generate tab notation from exercise notes
function generateTabs(notes: ExerciseNote[], fretCount: number = 20): string[] {
  const stringNames = ['e', 'B', 'G', 'D', 'A', 'E'];
  const tabs: string[] = stringNames.map(s => s + '|');
  
  const maxDisplayNotes = Math.min(notes.length, 20);
  const displayNotes = notes.slice(0, maxDisplayNotes);

  for (const note of displayNotes) {
    const stringRow = 5 - note.string;
    for (let row = 0; row < 6; row++) {
      if (row === stringRow) {
        const fretStr = note.fret.toString();
        tabs[row] += '-' + fretStr + '-';
      } else {
        tabs[row] += '---';
      }
    }
  }

  const maxLen = Math.max(...tabs.map(t => t.length));
  for (let i = 0; i < tabs.length; i++) {
    while (tabs[i].length < maxLen) tabs[i] += '-';
  }

  return tabs;
}

// ─── EXERCISE GENERATORS ───

function generateAscendingScale(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(notes);
  const exerciseNotes = addSequenceNumbers(sorted.map(fretboardToExerciseNote));
  return { name: EXERCISE_TYPES['scale-asc'].name, description: EXERCISE_TYPES['scale-asc'].description, type: 'scale-asc', notes: exerciseNotes, tabs: generateTabs(exerciseNotes) };
}

function generateDescendingScale(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesDescending(notes);
  const exerciseNotes = addSequenceNumbers(sorted.map(fretboardToExerciseNote));
  return { name: EXERCISE_TYPES['scale-desc'].name, description: EXERCISE_TYPES['scale-desc'].description, type: 'scale-desc', notes: exerciseNotes, tabs: generateTabs(exerciseNotes) };
}

function generateAscDescScale(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const ascSorted = sortNotesAscending(notes);
  const descSorted = sortNotesDescending(notes);
  const allNotes = [...ascSorted, ...descSorted.slice(1)]; // avoid duplicate top note
  const exerciseNotes = addSequenceNumbers(allNotes.map(fretboardToExerciseNote));
  return { name: EXERCISE_TYPES['scale-asc-desc'].name, description: EXERCISE_TYPES['scale-asc-desc'].description, type: 'scale-asc-desc', notes: exerciseNotes, tabs: generateTabs(exerciseNotes) };
}

function generateReversePentatonic(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const descSorted = sortNotesDescending(notes);
  const ascSorted = sortNotesAscending(notes);
  const allNotes = [...descSorted, ...ascSorted.slice(1)];
  const exerciseNotes = addSequenceNumbers(allNotes.map(fretboardToExerciseNote));
  return { name: EXERCISE_TYPES['reverse-pentatonic'].name, description: EXERCISE_TYPES['reverse-pentatonic'].description, type: 'reverse-pentatonic', notes: exerciseNotes, tabs: generateTabs(exerciseNotes) };
}

function generateThirds(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(notes);
  const thirdNotes: FretboardNote[] = [];
  for (let i = 0; i < sorted.length - 2; i++) {
    thirdNotes.push(sorted[i]);
    if (i + 2 < sorted.length) thirdNotes.push(sorted[i + 2]);
  }
  const exerciseNotes = addSequenceNumbers(thirdNotes.map(fretboardToExerciseNote));
  return { name: EXERCISE_TYPES['thirds'].name, description: EXERCISE_TYPES['thirds'].description, type: 'thirds', notes: exerciseNotes, tabs: generateTabs(exerciseNotes) };
}

function generateSequence3(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(notes);
  const seqNotes: FretboardNote[] = [];
  for (let i = 0; i < sorted.length - 2; i++) {
    for (let j = 0; j < 3 && (i + j) < sorted.length; j++) {
      seqNotes.push(sorted[i + j]);
    }
  }
  const exerciseNotes = addSequenceNumbers(seqNotes.map(fretboardToExerciseNote));
  return { name: EXERCISE_TYPES['sequence-3'].name, description: EXERCISE_TYPES['sequence-3'].description, type: 'sequence-3', notes: exerciseNotes, tabs: generateTabs(exerciseNotes) };
}

function generateSequence4(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(notes);
  const seqNotes: FretboardNote[] = [];
  for (let i = 0; i < sorted.length - 3; i++) {
    for (let j = 0; j < 4 && (i + j) < sorted.length; j++) {
      seqNotes.push(sorted[i + j]);
    }
  }
  const exerciseNotes = addSequenceNumbers(seqNotes.map(fretboardToExerciseNote));
  return { name: EXERCISE_TYPES['sequence-4'].name, description: EXERCISE_TYPES['sequence-4'].description, type: 'sequence-4', notes: exerciseNotes, tabs: generateTabs(exerciseNotes) };
}

function generateSequence5(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(notes);
  const seqNotes: FretboardNote[] = [];
  for (let i = 0; i < sorted.length - 4; i++) {
    for (let j = 0; j < 5 && (i + j) < sorted.length; j++) {
      seqNotes.push(sorted[i + j]);
    }
  }
  const exerciseNotes = addSequenceNumbers(seqNotes.map(fretboardToExerciseNote));
  return { name: EXERCISE_TYPES['sequence-5'].name, description: EXERCISE_TYPES['sequence-5'].description, type: 'sequence-5', notes: exerciseNotes, tabs: generateTabs(exerciseNotes) };
}

function generatePedalTone(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(notes);
  const roots = sorted.filter(n => n.isRoot);
  const primaryRoot = roots[0];
  if (!primaryRoot) {
    const exerciseNotes = addSequenceNumbers(sorted.map(fretboardToExerciseNote));
    return { name: EXERCISE_TYPES['pedal-tone'].name, description: EXERCISE_TYPES['pedal-tone'].description, type: 'pedal-tone', notes: exerciseNotes, tabs: generateTabs(exerciseNotes) };
  }
  const pedalNotes: FretboardNote[] = [];
  for (const note of sorted) {
    if (note === primaryRoot) continue;
    pedalNotes.push(primaryRoot);
    pedalNotes.push(note);
  }
  pedalNotes.push(primaryRoot); // end on root
  const exerciseNotes = addSequenceNumbers(pedalNotes.map(fretboardToExerciseNote));
  return { name: EXERCISE_TYPES['pedal-tone'].name, description: EXERCISE_TYPES['pedal-tone'].description, type: 'pedal-tone', notes: exerciseNotes, tabs: generateTabs(exerciseNotes) };
}

function generateTriads(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(notes);
  const triadNotes: FretboardNote[] = [];
  for (let stringGroup = 0; stringGroup < 4; stringGroup++) {
    const groupNotes = sorted.filter(n => n.string >= stringGroup && n.string <= stringGroup + 2);
    const roots = groupNotes.filter(n => n.isRoot);
    for (const root of roots) {
      triadNotes.push(root);
      const third = groupNotes.find(n => n.string >= root.string && n.string <= root.string + 2 && (n.interval === 3 || n.interval === 4) && n !== root);
      if (third) triadNotes.push(third);
      const fifth = groupNotes.find(n => n.string >= root.string && n.string <= root.string + 2 && n.interval === 7 && n !== root);
      if (fifth) triadNotes.push(fifth);
    }
  }
  const exerciseNotes = addSequenceNumbers(triadNotes.map(fretboardToExerciseNote));
  return { name: EXERCISE_TYPES['triads'].name, description: EXERCISE_TYPES['triads'].description, type: 'triads', notes: exerciseNotes, tabs: generateTabs(exerciseNotes) };
}

function generateArpeggios(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(notes);
  const arpNotes: FretboardNote[] = [];
  const seen = new Set<string>();

  // Build arpeggios from each scale degree: root, 3rd/2nd, 5th/4th
  const scale = { intervals: notes.length > 0 ? [...new Set(notes.map(n => n.interval))].sort((a, b) => a - b) : [] };
  
  // For each unique interval/degree, find a triad-like grouping
  for (let i = 0; i < sorted.length; i++) {
    const root = sorted[i];
    const key = `${root.string}-${root.fret}`;
    if (seen.has(key)) continue;

    // Find 3rd and 5th relative to this note within the scale
    const thirdCandidates = sorted.filter(n => 
      !seen.has(`${n.string}-${n.fret}`) &&
      n !== root &&
      (n.interval === (root.interval + 3) % 12 || n.interval === (root.interval + 4) % 12) &&
      Math.abs(n.string - root.string) <= 2
    );
    const fifthCandidates = sorted.filter(n => 
      !seen.has(`${n.string}-${n.fret}`) && 
      n !== root &&
      (n.interval === (root.interval + 7) % 12) &&
      Math.abs(n.string - root.string) <= 3
    );

    if (root.isRoot || i % 2 === 0) { // Only build arps from every other note to keep it manageable
      seen.add(key);
      arpNotes.push(root);
      if (thirdCandidates.length > 0) {
        const third = thirdCandidates[0];
        seen.add(`${third.string}-${third.fret}`);
        arpNotes.push(third);
      }
      if (fifthCandidates.length > 0) {
        const fifth = fifthCandidates[0];
        seen.add(`${fifth.string}-${fifth.fret}`);
        arpNotes.push(fifth);
      }
    }
  }

  // If too few notes generated, fall back to ascending pattern
  if (arpNotes.length < 4) {
    return generateAscendingScale(key, scaleId, startFret, endFret);
  }

  const exerciseNotes = addSequenceNumbers(arpNotes.map(fretboardToExerciseNote));
  return { name: EXERCISE_TYPES['arpeggios'].name, description: EXERCISE_TYPES['arpeggios'].description, type: 'arpeggios', notes: exerciseNotes, tabs: generateTabs(exerciseNotes) };
}

function generateOctaveShapes(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(notes);
  const octaveNotes: FretboardNote[] = [];
  const seen = new Set<string>();

  // Find root-octave pairs
  const roots = sorted.filter(n => n.isRoot);
  for (const root of roots) {
    const rootKey = `${root.string}-${root.fret}`;
    if (seen.has(rootKey)) continue;
    seen.add(rootKey);
    octaveNotes.push(root);

    // Find octave: same note name, 12 semitones up, or on different string pair
    const octave = sorted.find(n => 
      n.note === root.note && 
      n !== root && 
      !seen.has(`${n.string}-${n.fret}`) &&
      (n.fret === root.fret + 12 || (Math.abs(n.string - root.string) === 2 && Math.abs(n.fret - root.fret) <= 3) || (Math.abs(n.string - root.string) >= 1 && n.fret > root.fret))
    );
    if (octave) {
      seen.add(`${octave.string}-${octave.fret}`);
      octaveNotes.push(octave);
    }
  }

  if (octaveNotes.length < 4) {
    return generateAscendingScale(key, scaleId, startFret, endFret);
  }

  const exerciseNotes = addSequenceNumbers(octaveNotes.map(fretboardToExerciseNote));
  return { name: EXERCISE_TYPES['octave-shapes'].name, description: EXERCISE_TYPES['octave-shapes'].description, type: 'octave-shapes', notes: exerciseNotes, tabs: generateTabs(exerciseNotes) };
}

function generateDoubleStops(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const dsNotes: FretboardNote[] = [];
  const seen = new Set<string>();

  // Find pairs of notes on adjacent strings at similar frets
  for (let s = 0; s < 5; s++) {
    const lowerNotes = notes.filter(n => n.string === s);
    const higherNotes = notes.filter(n => n.string === s + 1);
    
    for (const ln of lowerNotes) {
      for (const hn of higherNotes) {
        if (Math.abs(ln.fret - hn.fret) <= 2) {
          const lk = `${ln.string}-${ln.fret}`;
          const hk = `${hn.string}-${hn.fret}`;
          if (!seen.has(lk)) { seen.add(lk); dsNotes.push(ln); }
          if (!seen.has(hk)) { seen.add(hk); dsNotes.push(hn); }
        }
      }
    }
  }

  if (dsNotes.length < 4) {
    return generateAscendingScale(key, scaleId, startFret, endFret);
  }

  const exerciseNotes = addSequenceNumbers(dsNotes.map(fretboardToExerciseNote));
  return { name: EXERCISE_TYPES['double-stops'].name, description: EXERCISE_TYPES['double-stops'].description, type: 'double-stops', notes: exerciseNotes, tabs: generateTabs(exerciseNotes) };
}

function generateConnecting(key: NoteName, scaleId: string): Exercise {
  const positions = getCAGEDPositions(key, scaleId);
  const connectNotes: FretboardNote[] = [];
  for (let i = 0; i < positions.length - 1; i++) {
    const pos1 = getScaleInPosition(key, scaleId, positions[i]);
    const pos2 = getScaleInPosition(key, scaleId, positions[i + 1]);
    const overlapFret = positions[i].fretEnd;
    const transitionNotes = pos1.filter(n => n.fret >= overlapFret - 1);
    connectNotes.push(...sortNotesAscending(transitionNotes).slice(0, 4));
  }
  const exerciseNotes = addSequenceNumbers(connectNotes.map(fretboardToExerciseNote));
  return { name: EXERCISE_TYPES['connecting'].name, description: EXERCISE_TYPES['connecting'].description, type: 'connecting', notes: exerciseNotes, tabs: generateTabs(exerciseNotes) };
}

function generateStringSkip(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(notes);
  const skipNotes: FretboardNote[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    skipNotes.push(current);
    const skipString = current.string + (current.string % 2 === 0 ? 2 : -2);
    if (skipString >= 0 && skipString <= 5) {
      const skipNote = sorted.find(n => n.string === skipString && Math.abs(n.fret - current.fret) <= 3 && n !== current);
      if (skipNote) skipNotes.push(skipNote);
    }
  }
  const exerciseNotes = addSequenceNumbers(skipNotes.map(fretboardToExerciseNote));
  return { name: EXERCISE_TYPES['string-skip'].name, description: EXERCISE_TYPES['string-skip'].description, type: 'string-skip', notes: exerciseNotes, tabs: generateTabs(exerciseNotes) };
}

function generateLateralRun(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const byString: Map<number, FretboardNote[]> = new Map();
  for (const note of notes) {
    if (!byString.has(note.string)) byString.set(note.string, []);
    byString.get(note.string)!.push(note);
  }
  const lateralNotes: FretboardNote[] = [];
  const stringOrder = [5, 4, 3, 2, 1, 0, 1, 2, 3, 4, 5];
  for (const stringIdx of stringOrder) {
    const stringNotes = byString.get(stringIdx);
    if (stringNotes) {
      lateralNotes.push(...[...stringNotes].sort((a, b) => a.fret - b.fret));
    }
  }
  const exerciseNotes = addSequenceNumbers(lateralNotes.map(fretboardToExerciseNote));
  return { name: EXERCISE_TYPES['lateral-run'].name, description: EXERCISE_TYPES['lateral-run'].description, type: 'lateral-run', notes: exerciseNotes, tabs: generateTabs(exerciseNotes) };
}

function generateDiagonal(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(notes);
  const diagNotes: FretboardNote[] = [];
  const seen = new Set<string>();
  
  for (let stringIdx = 5; stringIdx >= 0; stringIdx--) {
    const stringNotes = sorted.filter(n => n.string === stringIdx);
    const targetFret = startFret + (5 - stringIdx) * 2;
    const closest = stringNotes.reduce((best, n) => {
      if (!best) return n;
      return Math.abs(n.fret - targetFret) < Math.abs(best.fret - targetFret) ? n : best;
    }, null as FretboardNote | null);
    if (closest) {
      const k = `${closest.string}-${closest.fret}`;
      if (!seen.has(k)) { seen.add(k); diagNotes.push(closest); }
    }
  }
  for (let stringIdx = 0; stringIdx <= 5; stringIdx++) {
    const stringNotes = sorted.filter(n => n.string === stringIdx);
    const targetFret = endFret - stringIdx * 2;
    const closest = stringNotes.reduce((best, n) => {
      if (!best) return n;
      return Math.abs(n.fret - targetFret) < Math.abs(best.fret - targetFret) ? n : best;
    }, null as FretboardNote | null);
    if (closest) {
      const k = `${closest.string}-${closest.fret}`;
      if (!seen.has(k)) { seen.add(k); diagNotes.push(closest); }
    }
  }
  const exerciseNotes = addSequenceNumbers(diagNotes.map(fretboardToExerciseNote));
  return { name: EXERCISE_TYPES['diagonal'].name, description: EXERCISE_TYPES['diagonal'].description, type: 'diagonal', notes: exerciseNotes, tabs: generateTabs(exerciseNotes) };
}

function generatePositionShift(key: NoteName, scaleId: string): Exercise {
  const positions = getCAGEDPositions(key, scaleId);
  const shiftNotes: FretboardNote[] = [];
  for (const pos of positions) {
    const posNotes = getScaleInPosition(key, scaleId, pos);
    shiftNotes.push(...sortNotesAscending(posNotes).slice(0, 4));
  }
  const exerciseNotes = addSequenceNumbers(shiftNotes.map(fretboardToExerciseNote));
  return { name: EXERCISE_TYPES['position-shift'].name, description: EXERCISE_TYPES['position-shift'].description, type: 'position-shift', notes: exerciseNotes, tabs: generateTabs(exerciseNotes) };
}

function generatePentatonicRun(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const byString: Map<number, FretboardNote[]> = new Map();
  for (const note of notes) {
    if (!byString.has(note.string)) byString.set(note.string, []);
    byString.get(note.string)!.push(note);
  }
  const runNotes: FretboardNote[] = [];
  for (let stringIdx = 5; stringIdx >= 0; stringIdx--) {
    const stringNotes = byString.get(stringIdx);
    if (stringNotes) runNotes.push(...[...stringNotes].sort((a, b) => a.fret - b.fret).slice(0, 2));
  }
  for (let stringIdx = 0; stringIdx <= 5; stringIdx++) {
    const stringNotes = byString.get(stringIdx);
    if (stringNotes) runNotes.push(...[...stringNotes].sort((a, b) => b.fret - a.fret).slice(0, 2));
  }
  const exerciseNotes = addSequenceNumbers(runNotes.map(fretboardToExerciseNote));
  return { name: EXERCISE_TYPES['pentatonic-run'].name, description: EXERCISE_TYPES['pentatonic-run'].description, type: 'pentatonic-run', notes: exerciseNotes, tabs: generateTabs(exerciseNotes) };
}

function generateEconomyPicking(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const byString: Map<number, FretboardNote[]> = new Map();
  for (const note of notes) {
    if (!byString.has(note.string)) byString.set(note.string, []);
    byString.get(note.string)!.push(note);
  }
  const econNotes: FretboardNote[] = [];
  for (let stringIdx = 5; stringIdx >= 0; stringIdx--) {
    const stringNotes = byString.get(stringIdx);
    if (stringNotes) econNotes.push(...[...stringNotes].sort((a, b) => a.fret - b.fret).slice(0, 3));
  }
  const exerciseNotes = addSequenceNumbers(econNotes.map(fretboardToExerciseNote));
  return { name: EXERCISE_TYPES['economy-picking'].name, description: EXERCISE_TYPES['economy-picking'].description, type: 'economy-picking', notes: exerciseNotes, tabs: generateTabs(exerciseNotes) };
}

function generateSpiderWalk(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const byString: Map<number, FretboardNote[]> = new Map();
  for (const note of notes) {
    if (!byString.has(note.string)) byString.set(note.string, []);
    byString.get(note.string)!.push(note);
  }
  const spiderNotes: FretboardNote[] = [];
  
  // Walk pattern: on each string play ascending, then walk to next string
  // Pattern: string 5 low-high, string 4 low-high, etc.
  for (let stringIdx = 5; stringIdx >= 0; stringIdx--) {
    const stringNotes = byString.get(stringIdx);
    if (stringNotes) {
      const sorted = [...stringNotes].sort((a, b) => a.fret - b.fret).slice(0, 4);
      spiderNotes.push(...sorted);
    }
  }
  // Then walk back
  for (let stringIdx = 0; stringIdx <= 5; stringIdx++) {
    const stringNotes = byString.get(stringIdx);
    if (stringNotes) {
      const sorted = [...stringNotes].sort((a, b) => b.fret - a.fret).slice(0, 4);
      spiderNotes.push(...sorted);
    }
  }

  if (spiderNotes.length < 4) {
    return generateAscendingScale(key, scaleId, startFret, endFret);
  }

  const exerciseNotes = addSequenceNumbers(spiderNotes.map(fretboardToExerciseNote));
  return { name: EXERCISE_TYPES['spider-walk'].name, description: EXERCISE_TYPES['spider-walk'].description, type: 'spider-walk', notes: exerciseNotes, tabs: generateTabs(exerciseNotes) };
}

function generateIntervalJump(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(notes);
  const jumpNotes: FretboardNote[] = [];
  
  if (sorted.length < 4) {
    return generateAscendingScale(key, scaleId, startFret, endFret);
  }

  // Jump pattern: play low note, high note, medium low, medium high
  // Creates interval jumps for ear training
  const mid = Math.floor(sorted.length / 2);
  const patterns = [
    0, sorted.length - 1,  // low -> high (large jump)
    1, sorted.length - 2,  // slightly less
    mid, 0,                // mid -> low
    mid + 1, sorted.length - 1, // mid+1 -> high
    mid - 1, 1,            // mid-1 -> low+1
    sorted.length - 1, mid, // high -> mid
    0, mid + 1,            // low -> mid+1
  ];
  
  const seen = new Set<number>();
  for (const idx of patterns) {
    if (idx >= 0 && idx < sorted.length && !seen.has(idx)) {
      seen.add(idx);
      jumpNotes.push(sorted[idx]);
    }
  }
  // Add remaining notes
  for (let i = 0; i < sorted.length; i++) {
    if (!seen.has(i)) {
      seen.add(i);
      jumpNotes.push(sorted[i]);
    }
  }

  const exerciseNotes = addSequenceNumbers(jumpNotes.map(fretboardToExerciseNote));
  return { name: EXERCISE_TYPES['interval-jump'].name, description: EXERCISE_TYPES['interval-jump'].description, type: 'interval-jump', notes: exerciseNotes, tabs: generateTabs(exerciseNotes) };
}

// ─── MAIN GENERATOR ───

export function generateExercise(
  type: ExerciseType,
  key: NoteName,
  scaleId: string,
  positionIndex: number = 0
): Exercise {
  const positions = getCAGEDPositions(key, scaleId);
  const position = positions[positionIndex] || { fretStart: 0, fretEnd: FRET_COUNT };
  const startFret = position.fretStart;
  const endFret = position.fretEnd;

  switch (type) {
    case 'scale-asc': return generateAscendingScale(key, scaleId, startFret, endFret);
    case 'scale-desc': return generateDescendingScale(key, scaleId, startFret, endFret);
    case 'scale-asc-desc': return generateAscDescScale(key, scaleId, startFret, endFret);
    case 'reverse-pentatonic': return generateReversePentatonic(key, scaleId, startFret, endFret);
    case 'thirds': return generateThirds(key, scaleId, startFret, endFret);
    case 'sequence-3': return generateSequence3(key, scaleId, startFret, endFret);
    case 'sequence-4': return generateSequence4(key, scaleId, startFret, endFret);
    case 'sequence-5': return generateSequence5(key, scaleId, startFret, endFret);
    case 'pedal-tone': return generatePedalTone(key, scaleId, startFret, endFret);
    case 'triads': return generateTriads(key, scaleId, startFret, endFret);
    case 'arpeggios': return generateArpeggios(key, scaleId, startFret, endFret);
    case 'octave-shapes': return generateOctaveShapes(key, scaleId, startFret, endFret);
    case 'double-stops': return generateDoubleStops(key, scaleId, startFret, endFret);
    case 'connecting': return generateConnecting(key, scaleId);
    case 'string-skip': return generateStringSkip(key, scaleId, startFret, endFret);
    case 'lateral-run': return generateLateralRun(key, scaleId, startFret, endFret);
    case 'diagonal': return generateDiagonal(key, scaleId, startFret, endFret);
    case 'position-shift': return generatePositionShift(key, scaleId);
    case 'pentatonic-run': return generatePentatonicRun(key, scaleId, startFret, endFret);
    case 'economy-picking': return generateEconomyPicking(key, scaleId, startFret, endFret);
    case 'spider-walk': return generateSpiderWalk(key, scaleId, startFret, endFret);
    case 'interval-jump': return generateIntervalJump(key, scaleId, startFret, endFret);
    default: return generateAscendingScale(key, scaleId, startFret, endFret);
  }
}

// Generate all exercises for a given key and scale
export function generateAllExercises(
  key: NoteName,
  scaleId: string,
  positionIndex: number = 0
): Exercise[] {
  return Object.keys(EXERCISE_TYPES).map(type => 
    generateExercise(type as ExerciseType, key, scaleId, positionIndex)
  );
}

// Generate CAGED pattern exercises — returns one exercise per CAGED position
export function generatePatternExercises(
  key: NoteName,
  scaleId: string
): Array<{ position: number; fretStart: number; fretEnd: number; notes: ExerciseNote[] }> {
  const positions = getCAGEDPositions(key, scaleId);
  return positions.map((pos, idx) => {
    const notes = getScaleOnFretboard(key, scaleId, pos.fretStart, pos.fretEnd);
    const sorted = sortNotesAscending(notes);
    const exerciseNotes = addSequenceNumbers(sorted.map(fretboardToExerciseNote));
    return { position: idx + 1, fretStart: pos.fretStart, fretEnd: pos.fretEnd, notes: exerciseNotes };
  });
}
