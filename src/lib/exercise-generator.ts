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
  | 'thirds' 
  | 'sequence-3' 
  | 'sequence-4' 
  | 'triads' 
  | 'connecting'
  | 'string-skip'
  | 'lateral-run'
  | 'diagonal'
  | 'position-shift'
  | 'pentatonic-run'
  | 'economy-picking';

export const EXERCISE_TYPES: Record<ExerciseType, { name: string; description: string }> = {
  'scale-asc': { name: 'Ascending Scale', description: 'Play scale ascending from root to octave' },
  'scale-desc': { name: 'Descending Scale', description: 'Play scale descending from octave to root' },
  'scale-asc-desc': { name: 'Asc/Desc Scale', description: 'Play scale ascending then descending' },
  'thirds': { name: 'Diatonic Thirds', description: 'Play scale in thirds (skip one note each time)' },
  'sequence-3': { name: '3-Note Sequences', description: 'Groups of 3 ascending notes, shifting by one degree' },
  'sequence-4': { name: '4-Note Sequences', description: 'Groups of 4 ascending notes, shifting by one degree' },
  'triads': { name: 'Triad Shapes', description: 'Find and play triad shapes within the scale' },
  'connecting': { name: 'Position Connect', description: 'Connect between adjacent CAGED positions' },
  'string-skip': { name: 'String Skipping', description: 'Skip strings while playing scale notes' },
  'lateral-run': { name: 'Lateral Run', description: 'Run across strings at the same fret position' },
  'diagonal': { name: 'Diagonal Pattern', description: 'Play a diagonal pattern across the fretboard' },
  'position-shift': { name: 'Position Shift', description: 'Shift between CAGED positions smoothly' },
  'pentatonic-run': { name: 'Pentatonic Run', description: 'Classic 2-notes-per-string pentatonic run' },
  'economy-picking': { name: 'Economy Picking', description: 'Practice economy/sweep picking patterns' },
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

// Sort notes for playing: ascending by string (high to low for ascending pitch) then by fret
function sortNotesAscending(notes: FretboardNote[]): FretboardNote[] {
  return [...notes].sort((a, b) => {
    // Calculate approximate pitch: string * 5 + fret (rough pitch ordering)
    const pitchA = a.string * 5 + a.fret;
    const pitchB = b.string * 5 + b.fret;
    // For same string, sort by fret
    if (a.string !== b.string) return b.string - a.string; // high E first for ascending
    return a.fret - b.fret;
  });
}

function sortNotesDescending(notes: FretboardNote[]): FretboardNote[] {
  return [...notes].sort((a, b) => {
    if (a.string !== b.string) return a.string - b.string; // low E first for descending
    return b.fret - a.fret;
  });
}

// Add sequence numbers to exercise notes
function addSequenceNumbers(notes: ExerciseNote[]): ExerciseNote[] {
  return notes.map((n, i) => ({ ...n, sequenceNumber: i + 1 }));
}

// Generate tab notation from exercise notes
function generateTabs(notes: ExerciseNote[], fretCount: number = 20): string[] {
  const stringNames = ['e', 'B', 'G', 'D', 'A', 'E']; // high to low for tab
  const tabs: string[] = stringNames.map(s => s + '|');
  
  const maxDisplayNotes = Math.min(notes.length, 20);
  const displayNotes = notes.slice(0, maxDisplayNotes);

  for (const note of displayNotes) {
    const stringRow = 5 - note.string; // convert string index to tab row (high e = 0)
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

// Generate ascending scale exercise
function generateAscendingScale(
  key: NoteName,
  scaleId: string,
  startFret: number,
  endFret: number
): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(notes);
  const exerciseNotes = addSequenceNumbers(sorted.map(fretboardToExerciseNote));

  return {
    name: EXERCISE_TYPES['scale-asc'].name,
    description: EXERCISE_TYPES['scale-asc'].description,
    type: 'scale-asc',
    notes: exerciseNotes,
    tabs: generateTabs(exerciseNotes),
  };
}

// Generate descending scale exercise
function generateDescendingScale(
  key: NoteName,
  scaleId: string,
  startFret: number,
  endFret: number
): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesDescending(notes);
  const exerciseNotes = addSequenceNumbers(sorted.map(fretboardToExerciseNote));

  return {
    name: EXERCISE_TYPES['scale-desc'].name,
    description: EXERCISE_TYPES['scale-desc'].description,
    type: 'scale-desc',
    notes: exerciseNotes,
    tabs: generateTabs(exerciseNotes),
  };
}

// Generate ascending + descending scale exercise
function generateAscDescScale(
  key: NoteName,
  scaleId: string,
  startFret: number,
  endFret: number
): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const ascSorted = sortNotesAscending(notes);
  const descSorted = sortNotesDescending(notes);
  const allNotes = [...ascSorted, ...descSorted];
  const exerciseNotes = addSequenceNumbers(allNotes.map(fretboardToExerciseNote));

  return {
    name: EXERCISE_TYPES['scale-asc-desc'].name,
    description: EXERCISE_TYPES['scale-asc-desc'].description,
    type: 'scale-asc-desc',
    notes: exerciseNotes,
    tabs: generateTabs(exerciseNotes),
  };
}

// Generate diatonic thirds exercise
function generateThirds(
  key: NoteName,
  scaleId: string,
  startFret: number,
  endFret: number
): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(notes);

  const thirdNotes: FretboardNote[] = [];
  for (let i = 0; i < sorted.length - 2; i++) {
    thirdNotes.push(sorted[i]);
    if (i + 2 < sorted.length) {
      thirdNotes.push(sorted[i + 2]);
    }
  }

  const exerciseNotes = addSequenceNumbers(thirdNotes.map(fretboardToExerciseNote));

  return {
    name: EXERCISE_TYPES['thirds'].name,
    description: EXERCISE_TYPES['thirds'].description,
    type: 'thirds',
    notes: exerciseNotes,
    tabs: generateTabs(exerciseNotes),
  };
}

// Generate 3-note sequence exercise
function generateSequence3(
  key: NoteName,
  scaleId: string,
  startFret: number,
  endFret: number
): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(notes);

  const seqNotes: FretboardNote[] = [];
  for (let i = 0; i < sorted.length - 2; i++) {
    for (let j = 0; j < 3 && (i + j) < sorted.length; j++) {
      seqNotes.push(sorted[i + j]);
    }
  }

  const exerciseNotes = addSequenceNumbers(seqNotes.map(fretboardToExerciseNote));

  return {
    name: EXERCISE_TYPES['sequence-3'].name,
    description: EXERCISE_TYPES['sequence-3'].description,
    type: 'sequence-3',
    notes: exerciseNotes,
    tabs: generateTabs(exerciseNotes),
  };
}

// Generate 4-note sequence exercise
function generateSequence4(
  key: NoteName,
  scaleId: string,
  startFret: number,
  endFret: number
): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(notes);

  const seqNotes: FretboardNote[] = [];
  for (let i = 0; i < sorted.length - 3; i++) {
    for (let j = 0; j < 4 && (i + j) < sorted.length; j++) {
      seqNotes.push(sorted[i + j]);
    }
  }

  const exerciseNotes = addSequenceNumbers(seqNotes.map(fretboardToExerciseNote));

  return {
    name: EXERCISE_TYPES['sequence-4'].name,
    description: EXERCISE_TYPES['sequence-4'].description,
    type: 'sequence-4',
    notes: exerciseNotes,
    tabs: generateTabs(exerciseNotes),
  };
}

// Generate triad shapes exercise
function generateTriads(
  key: NoteName,
  scaleId: string,
  startFret: number,
  endFret: number
): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(notes);

  const triadNotes: FretboardNote[] = [];
  for (let stringGroup = 0; stringGroup < 4; stringGroup++) {
    const groupNotes = sorted.filter(n => 
      n.string >= stringGroup && n.string <= stringGroup + 2
    );
    const roots = groupNotes.filter(n => n.isRoot);
    for (const root of roots) {
      triadNotes.push(root);
      const third = groupNotes.find(n => 
        n.string >= root.string && n.string <= root.string + 2 &&
        (n.interval === 3 || n.interval === 4) && n !== root
      );
      if (third) triadNotes.push(third);
      const fifth = groupNotes.find(n => 
        n.string >= root.string && n.string <= root.string + 2 &&
        n.interval === 7 && n !== root
      );
      if (fifth) triadNotes.push(fifth);
    }
  }

  const exerciseNotes = addSequenceNumbers(triadNotes.map(fretboardToExerciseNote));

  return {
    name: EXERCISE_TYPES['triads'].name,
    description: EXERCISE_TYPES['triads'].description,
    type: 'triads',
    notes: exerciseNotes,
    tabs: generateTabs(exerciseNotes),
  };
}

// Generate connecting positions exercise
function generateConnecting(
  key: NoteName,
  scaleId: string
): Exercise {
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

  return {
    name: EXERCISE_TYPES['connecting'].name,
    description: EXERCISE_TYPES['connecting'].description,
    type: 'connecting',
    notes: exerciseNotes,
    tabs: generateTabs(exerciseNotes),
  };
}

// Generate string skipping exercise
function generateStringSkip(
  key: NoteName,
  scaleId: string,
  startFret: number,
  endFret: number
): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(notes);

  // Build string-skip pattern: play note, skip a string, play note, come back
  const skipNotes: FretboardNote[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    skipNotes.push(current);
    // Find a note 2 strings away with similar pitch range
    const skipString = current.string + (current.string % 2 === 0 ? 2 : -2);
    if (skipString >= 0 && skipString <= 5) {
      const skipNote = sorted.find(n => 
        n.string === skipString && 
        Math.abs(n.fret - current.fret) <= 3 &&
        n !== current
      );
      if (skipNote) {
        skipNotes.push(skipNote);
      }
    }
  }

  const exerciseNotes = addSequenceNumbers(skipNotes.map(fretboardToExerciseNote));

  return {
    name: EXERCISE_TYPES['string-skip'].name,
    description: EXERCISE_TYPES['string-skip'].description,
    type: 'string-skip',
    notes: exerciseNotes,
    tabs: generateTabs(exerciseNotes),
  };
}

// Generate lateral run exercise (across strings at same position)
function generateLateralRun(
  key: NoteName,
  scaleId: string,
  startFret: number,
  endFret: number
): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  
  // Group notes by string and play them string by string
  const byString: Map<number, FretboardNote[]> = new Map();
  for (const note of notes) {
    if (!byString.has(note.string)) byString.set(note.string, []);
    byString.get(note.string)!.push(note);
  }
  
  const lateralNotes: FretboardNote[] = [];
  // Go string by string from high to low then back
  const stringOrder = [5, 4, 3, 2, 1, 0, 1, 2, 3, 4, 5];
  for (const stringIdx of stringOrder) {
    const stringNotes = byString.get(stringIdx);
    if (stringNotes) {
      const sorted = [...stringNotes].sort((a, b) => a.fret - b.fret);
      lateralNotes.push(...sorted);
    }
  }

  const exerciseNotes = addSequenceNumbers(lateralNotes.map(fretboardToExerciseNote));

  return {
    name: EXERCISE_TYPES['lateral-run'].name,
    description: EXERCISE_TYPES['lateral-run'].description,
    type: 'lateral-run',
    notes: exerciseNotes,
    tabs: generateTabs(exerciseNotes),
  };
}

// Generate diagonal pattern exercise
function generateDiagonal(
  key: NoteName,
  scaleId: string,
  startFret: number,
  endFret: number
): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(notes);

  // Create a diagonal pattern: play a note on each string, moving up frets
  const diagNotes: FretboardNote[] = [];
  const seen = new Set<string>();
  
  // Pick one note per string going from high E to low E, shifting frets
  for (let stringIdx = 5; stringIdx >= 0; stringIdx--) {
    const stringNotes = sorted.filter(n => n.string === stringIdx);
    // Pick the note closest to a diagonal line
    const targetFret = startFret + (5 - stringIdx) * 2; // Diagonal line
    const closest = stringNotes.reduce((best, n) => {
      if (!best) return n;
      return Math.abs(n.fret - targetFret) < Math.abs(best.fret - targetFret) ? n : best;
    }, null as FretboardNote | null);
    
    if (closest) {
      const key = `${closest.string}-${closest.fret}`;
      if (!seen.has(key)) {
        seen.add(key);
        diagNotes.push(closest);
      }
    }
  }
  
  // Then descend diagonally
  for (let stringIdx = 0; stringIdx <= 5; stringIdx++) {
    const stringNotes = sorted.filter(n => n.string === stringIdx);
    const targetFret = endFret - stringIdx * 2;
    const closest = stringNotes.reduce((best, n) => {
      if (!best) return n;
      return Math.abs(n.fret - targetFret) < Math.abs(best.fret - targetFret) ? n : best;
    }, null as FretboardNote | null);
    
    if (closest) {
      const key = `${closest.string}-${closest.fret}`;
      if (!seen.has(key)) {
        seen.add(key);
        diagNotes.push(closest);
      }
    }
  }

  const exerciseNotes = addSequenceNumbers(diagNotes.map(fretboardToExerciseNote));

  return {
    name: EXERCISE_TYPES['diagonal'].name,
    description: EXERCISE_TYPES['diagonal'].description,
    type: 'diagonal',
    notes: exerciseNotes,
    tabs: generateTabs(exerciseNotes),
  };
}

// Generate position shift exercise
function generatePositionShift(
  key: NoteName,
  scaleId: string
): Exercise {
  const positions = getCAGEDPositions(key, scaleId);
  const shiftNotes: FretboardNote[] = [];

  // Play ascending through each position, shifting up
  for (const pos of positions) {
    const posNotes = getScaleInPosition(key, scaleId, pos);
    const sorted = sortNotesAscending(posNotes);
    // Take the first 3-4 notes of each position
    shiftNotes.push(...sorted.slice(0, 4));
  }

  const exerciseNotes = addSequenceNumbers(shiftNotes.map(fretboardToExerciseNote));

  return {
    name: EXERCISE_TYPES['position-shift'].name,
    description: EXERCISE_TYPES['position-shift'].description,
    type: 'position-shift',
    notes: exerciseNotes,
    tabs: generateTabs(exerciseNotes),
  };
}

// Generate pentatonic run exercise
function generatePentatonicRun(
  key: NoteName,
  scaleId: string,
  startFret: number,
  endFret: number
): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  
  // Build a 2-notes-per-string pattern
  const byString: Map<number, FretboardNote[]> = new Map();
  for (const note of notes) {
    if (!byString.has(note.string)) byString.set(note.string, []);
    byString.get(note.string)!.push(note);
  }
  
  const runNotes: FretboardNote[] = [];
  // Ascending: 2 notes per string, low to high string
  for (let stringIdx = 5; stringIdx >= 0; stringIdx--) {
    const stringNotes = byString.get(stringIdx);
    if (stringNotes) {
      const sorted = [...stringNotes].sort((a, b) => a.fret - b.fret);
      runNotes.push(...sorted.slice(0, 2));
    }
  }
  // Descending: 2 notes per string, high to low string
  for (let stringIdx = 0; stringIdx <= 5; stringIdx++) {
    const stringNotes = byString.get(stringIdx);
    if (stringNotes) {
      const sorted = [...stringNotes].sort((a, b) => b.fret - a.fret);
      runNotes.push(...sorted.slice(0, 2));
    }
  }

  const exerciseNotes = addSequenceNumbers(runNotes.map(fretboardToExerciseNote));

  return {
    name: EXERCISE_TYPES['pentatonic-run'].name,
    description: EXERCISE_TYPES['pentatonic-run'].description,
    type: 'pentatonic-run',
    notes: exerciseNotes,
    tabs: generateTabs(exerciseNotes),
  };
}

// Generate economy picking exercise
function generateEconomyPicking(
  key: NoteName,
  scaleId: string,
  startFret: number,
  endFret: number
): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  
  // Build 3-note-per-string patterns for economy/sweep picking
  const byString: Map<number, FretboardNote[]> = new Map();
  for (const note of notes) {
    if (!byString.has(note.string)) byString.set(note.string, []);
    byString.get(note.string)!.push(note);
  }
  
  const econNotes: FretboardNote[] = [];
  // Play 3 notes on each string going up, sweeping down
  for (let stringIdx = 5; stringIdx >= 0; stringIdx--) {
    const stringNotes = byString.get(stringIdx);
    if (stringNotes) {
      const sorted = [...stringNotes].sort((a, b) => a.fret - b.fret);
      econNotes.push(...sorted.slice(0, 3));
    }
  }

  const exerciseNotes = addSequenceNumbers(econNotes.map(fretboardToExerciseNote));

  return {
    name: EXERCISE_TYPES['economy-picking'].name,
    description: EXERCISE_TYPES['economy-picking'].description,
    type: 'economy-picking',
    notes: exerciseNotes,
    tabs: generateTabs(exerciseNotes),
  };
}

// Main exercise generator
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
    case 'scale-asc':
      return generateAscendingScale(key, scaleId, startFret, endFret);
    case 'scale-desc':
      return generateDescendingScale(key, scaleId, startFret, endFret);
    case 'scale-asc-desc':
      return generateAscDescScale(key, scaleId, startFret, endFret);
    case 'thirds':
      return generateThirds(key, scaleId, startFret, endFret);
    case 'sequence-3':
      return generateSequence3(key, scaleId, startFret, endFret);
    case 'sequence-4':
      return generateSequence4(key, scaleId, startFret, endFret);
    case 'triads':
      return generateTriads(key, scaleId, startFret, endFret);
    case 'connecting':
      return generateConnecting(key, scaleId);
    case 'string-skip':
      return generateStringSkip(key, scaleId, startFret, endFret);
    case 'lateral-run':
      return generateLateralRun(key, scaleId, startFret, endFret);
    case 'diagonal':
      return generateDiagonal(key, scaleId, startFret, endFret);
    case 'position-shift':
      return generatePositionShift(key, scaleId);
    case 'pentatonic-run':
      return generatePentatonicRun(key, scaleId, startFret, endFret);
    case 'economy-picking':
      return generateEconomyPicking(key, scaleId, startFret, endFret);
    default:
      return generateAscendingScale(key, scaleId, startFret, endFret);
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
// showing the full scale shape for that position
export function generatePatternExercises(
  key: NoteName,
  scaleId: string
): Array<{ position: number; fretStart: number; fretEnd: number; notes: ExerciseNote[] }> {
  const positions = getCAGEDPositions(key, scaleId);
  
  return positions.map((pos, idx) => {
    const notes = getScaleOnFretboard(key, scaleId, pos.fretStart, pos.fretEnd);
    // Sort by string descending then fret ascending (natural playing order)
    const sorted = sortNotesAscending(notes);
    const exerciseNotes = addSequenceNumbers(sorted.map(fretboardToExerciseNote));
    
    return {
      position: idx + 1,
      fretStart: pos.fretStart,
      fretEnd: pos.fretEnd,
      notes: exerciseNotes,
    };
  });
}
