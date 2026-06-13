// Exercise Generator for Guitar
// Generates various practice exercises from scale patterns

import {
  FretboardNote,
  getScaleOnFretboard,
  getScaleInPosition,
  getCAGEDPositions,
  NOTES,
  NoteName,
  STRING_OPEN_NOTES,
} from './music-theory';

export interface ExerciseNote {
  string: number;
  fret: number;
  note: string;
  intervalLabel: string;
  isRoot: boolean;
}

export interface Exercise {
  name: string;
  description: string;
  type: ExerciseType;
  notes: ExerciseNote[];
  tabs: string[];
}

export type ExerciseType = 'scale-asc' | 'scale-desc' | 'scale-asc-desc' | 'thirds' | 'sequence-3' | 'sequence-4' | 'triads' | 'connecting';

export const EXERCISE_TYPES: Record<ExerciseType, { name: string; description: string }> = {
  'scale-asc': { name: 'Ascending Scale', description: 'Play the scale ascending from root to octave' },
  'scale-desc': { name: 'Descending Scale', description: 'Play the scale descending from octave to root' },
  'scale-asc-desc': { name: 'Asc/Desc Scale', description: 'Play the scale ascending then descending' },
  'thirds': { name: 'Thirds', description: 'Play the scale in diatonic thirds (skip one note)' },
  'sequence-3': { name: '3-Note Sequences', description: 'Groups of 3 ascending notes, shifting by one scale degree' },
  'sequence-4': { name: '4-Note Sequences', description: 'Groups of 4 ascending notes, shifting by one scale degree' },
  'triads': { name: 'Triad Shapes', description: 'Find and play triad shapes within the scale' },
  'connecting': { name: 'Position Connect', description: 'Connect between adjacent CAGED positions' },
};

function fretboardToExerciseNote(fn: FretboardNote): ExerciseNote {
  return {
    string: fn.string,
    fret: fn.fret,
    note: fn.note,
    intervalLabel: fn.intervalLabel,
    isRoot: fn.isRoot,
  };
}

// Sort notes for playing: ascending by string (high to low for ascending pitch) then by fret
function sortNotesAscending(notes: FretboardNote[]): FretboardNote[] {
  return [...notes].sort((a, b) => {
    // Higher pitch = higher string number OR same string higher fret
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

// Generate tab notation from exercise notes
function generateTabs(notes: ExerciseNote[], fretCount: number = 20): string[] {
  const stringNames = ['e', 'B', 'G', 'D', 'A', 'E']; // high to low for tab
  const tabs: string[] = stringNames.map(s => s + '|');
  
  // Group notes by sequential order for tab display
  // We'll create a simplified representation showing the notes in order
  const maxDisplayNotes = Math.min(notes.length, 16);
  const displayNotes = notes.slice(0, maxDisplayNotes);

  // Build tab columns
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

  // Pad all rows to same length
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
  const exerciseNotes = sorted.map(fretboardToExerciseNote);

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
  const exerciseNotes = sorted.map(fretboardToExerciseNote);

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
  const exerciseNotes = allNotes.map(fretboardToExerciseNote);

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

  // Build thirds: play note i, then note i+2, then advance by 1
  const thirdNotes: FretboardNote[] = [];
  for (let i = 0; i < sorted.length - 2; i++) {
    thirdNotes.push(sorted[i]);
    if (i + 2 < sorted.length) {
      thirdNotes.push(sorted[i + 2]);
    }
  }

  const exerciseNotes = thirdNotes.map(fretboardToExerciseNote);

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

  const exerciseNotes = seqNotes.map(fretboardToExerciseNote);

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

  const exerciseNotes = seqNotes.map(fretboardToExerciseNote);

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

  // Group notes into triads (groups of 3 adjacent string pairs)
  const triadNotes: FretboardNote[] = [];
  // Create triads from adjacent strings
  for (let stringGroup = 0; stringGroup < 4; stringGroup++) {
    const groupNotes = sorted.filter(n => 
      n.string >= stringGroup && n.string <= stringGroup + 2
    );
    // For each string group, find root and build a triad (R, 3/b3, 5)
    const roots = groupNotes.filter(n => n.isRoot);
    for (const root of roots) {
      triadNotes.push(root);
      // Find third (2 or 3 semitones from root)
      const third = groupNotes.find(n => 
        n.string >= root.string && n.string <= root.string + 2 &&
        (n.interval === 3 || n.interval === 4) && n !== root
      );
      if (third) triadNotes.push(third);
      // Find fifth
      const fifth = groupNotes.find(n => 
        n.string >= root.string && n.string <= root.string + 2 &&
        n.interval === 7 && n !== root
      );
      if (fifth) triadNotes.push(fifth);
    }
  }

  const exerciseNotes = triadNotes.map(fretboardToExerciseNote);

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
    // Find overlap and transition notes
    const overlapFret = positions[i].fretEnd;
    const transitionNotes = pos1.filter(n => n.fret >= overlapFret - 1);
    connectNotes.push(...sortNotesAscending(transitionNotes).slice(0, 4));
  }

  const exerciseNotes = connectNotes.map(fretboardToExerciseNote);

  return {
    name: EXERCISE_TYPES['connecting'].name,
    description: EXERCISE_TYPES['connecting'].description,
    type: 'connecting',
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
  const position = positions[positionIndex] || { fretStart: 0, fretEnd: 14 };
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
