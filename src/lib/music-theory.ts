// Music Theory Engine for Guitar
// Handles notes, scales, intervals, fretboard mapping, and CAGED positions

export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
export const NOTE_ALIASES: Record<string, string> = {
  'Db': 'C#', 'Eb': 'D#', 'Fb': 'E', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#', 'Cb': 'B',
  'C#': 'C#', 'D#': 'D#', 'F#': 'F#', 'G#': 'G#', 'A#': 'A#',
};

export type NoteName = typeof NOTES[number];

// Standard guitar tuning (low to high)
export const STANDARD_TUNING: NoteName[] = ['E', 'B', 'G', 'D', 'A', 'E'];

// String index to note at open string
export const STRING_OPEN_NOTES: NoteName[] = ['E', 'A', 'D', 'G', 'B', 'E']; // index 0 = low E, 5 = high E

// Number of frets to display
export const FRET_COUNT = 15;

// Scale definitions: interval patterns relative to root (in semitones)
export interface ScaleDefinition {
  name: string;
  intervals: number[]; // semitones from root
  intervalLabels: string[]; // scale degree labels
}

export const SCALES: Record<string, ScaleDefinition> = {
  'minor-pentatonic': {
    name: 'Minor Pentatonic',
    intervals: [0, 3, 5, 7, 10],
    intervalLabels: ['R', '♭3', '4', '5', '♭7'],
  },
  'major-pentatonic': {
    name: 'Major Pentatonic',
    intervals: [0, 2, 4, 7, 9],
    intervalLabels: ['R', '2', '3', '5', '6'],
  },
  'blues': {
    name: 'Blues',
    intervals: [0, 3, 5, 6, 7, 10],
    intervalLabels: ['R', '♭3', '4', '♭5', '5', '♭7'],
  },
  'major': {
    name: 'Major Scale',
    intervals: [0, 2, 4, 5, 7, 9, 11],
    intervalLabels: ['R', '2', '3', '4', '5', '6', '7'],
  },
  'natural-minor': {
    name: 'Natural Minor',
    intervals: [0, 2, 3, 5, 7, 8, 10],
    intervalLabels: ['R', '2', '♭3', '4', '5', '♭6', '♭7'],
  },
  'harmonic-minor': {
    name: 'Harmonic Minor',
    intervals: [0, 2, 3, 5, 7, 8, 11],
    intervalLabels: ['R', '2', '♭3', '4', '5', '♭6', '7'],
  },
  'melodic-minor': {
    name: 'Melodic Minor',
    intervals: [0, 2, 3, 5, 7, 9, 11],
    intervalLabels: ['R', '2', '♭3', '4', '5', '6', '7'],
  },
  'dorian': {
    name: 'Dorian',
    intervals: [0, 2, 3, 5, 7, 9, 10],
    intervalLabels: ['R', '2', '♭3', '4', '5', '6', '♭7'],
  },
  'phrygian': {
    name: 'Phrygian',
    intervals: [0, 1, 3, 5, 7, 8, 10],
    intervalLabels: ['R', '♭2', '♭3', '4', '5', '♭6', '♭7'],
  },
  'lydian': {
    name: 'Lydian',
    intervals: [0, 2, 4, 6, 7, 9, 11],
    intervalLabels: ['R', '2', '3', '♯4', '5', '6', '7'],
  },
  'mixolydian': {
    name: 'Mixolydian',
    intervals: [0, 2, 4, 5, 7, 9, 10],
    intervalLabels: ['R', '2', '3', '4', '5', '6', '♭7'],
  },
  'locrian': {
    name: 'Locrian',
    intervals: [0, 1, 3, 5, 6, 8, 10],
    intervalLabels: ['R', '♭2', '♭3', '4', '♭5', '♭6', '♭7'],
  },
};

// Key definitions
export const KEY_NAMES: NoteName[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const KEY_DISPLAY_NAMES: string[] = ['C', 'C#/Db', 'D', 'D#/Eb', 'E', 'F', 'F#/Gb', 'G', 'G#/Ab', 'A', 'A#/Bb', 'B'];

// Get the note at a given string and fret
export function getNoteAtPosition(stringIndex: number, fret: number): NoteName {
  const openNote = STRING_OPEN_NOTES[stringIndex];
  const openIndex = NOTES.indexOf(openNote);
  return NOTES[(openIndex + fret) % 12];
}

// Get all positions of a note on the fretboard
export function getNotePositions(note: NoteName, maxFret: number = FRET_COUNT): Array<{ string: number; fret: number }> {
  const positions: Array<{ string: number; fret: number }> = [];
  const noteIndex = NOTES.indexOf(note);

  for (let stringIdx = 0; stringIdx < 6; stringIdx++) {
    const openNote = STRING_OPEN_NOTES[stringIdx];
    const openIndex = NOTES.indexOf(openNote);
    // Find the first occurrence
    let fret = (noteIndex - openIndex + 12) % 12;
    while (fret <= maxFret) {
      positions.push({ string: stringIdx, fret });
      fret += 12;
    }
  }
  return positions;
}

// Scale note on the fretboard
export interface FretboardNote {
  string: number; // 0=low E, 5=high E
  fret: number;
  note: NoteName;
  interval: number; // semitones from root
  intervalLabel: string;
  isRoot: boolean;
}

// Get all notes of a scale on the fretboard within a position range
export function getScaleOnFretboard(
  key: NoteName,
  scaleId: string,
  startFret: number = 0,
  endFret: number = FRET_COUNT
): FretboardNote[] {
  const scale = SCALES[scaleId];
  if (!scale) return [];

  const rootIndex = NOTES.indexOf(key);
  const notes: FretboardNote[] = [];

  for (let stringIdx = 0; stringIdx < 6; stringIdx++) {
    for (let fret = startFret; fret <= endFret; fret++) {
      const noteIndex = (NOTES.indexOf(STRING_OPEN_NOTES[stringIdx]) + fret) % 12;
      const intervalFromRoot = (noteIndex - rootIndex + 12) % 12;

      const scaleIdx = scale.intervals.indexOf(intervalFromRoot);
      if (scaleIdx !== -1) {
        notes.push({
          string: stringIdx,
          fret,
          note: NOTES[noteIndex],
          interval: intervalFromRoot,
          intervalLabel: scale.intervalLabels[scaleIdx],
          isRoot: intervalFromRoot === 0,
        });
      }
    }
  }
  return notes;
}

// CAGED position definitions for minor pentatonic (fret ranges for each position)
export interface CAGEDPosition {
  name: string;
  fretStart: number;
  fretEnd: number;
  rootString: number; // which string has the root note that defines this position
}

// Calculate CAGED positions dynamically based on key
// Generates 5 standard positions spanning the fretboard
// Based on the well-known minor pentatonic / CAGED position system
export function getCAGEDPositions(key: NoteName, scaleId: string): CAGEDPosition[] {
  const scale = SCALES[scaleId];
  if (!scale) return [];

  const rootIndex = NOTES.indexOf(key);
  const lowEOpen = NOTES.indexOf(STRING_OPEN_NOTES[0]); // E = index 4
  // Root fret on low E string (Position 1 anchor)
  const rootFretLowE = (rootIndex - lowEOpen + 12) % 12;
  
  const isMinor = scaleId.includes('minor') || scaleId === 'blues' || 
                  scaleId === 'dorian' || scaleId === 'phrygian' || scaleId === 'locrian';
  
  // For minor scales: Position 1 starts at root on low E string
  // For major scales: Position 1 starts 3 frets below (relative minor position)
  const baseFret = isMinor ? rootFretLowE : (rootFretLowE - 3 + 12) % 12;
  
  // Standard 5 position offsets from the base fret (in frets)
  // These represent the starting fret of each position relative to Position 1
  // P1→P2: up 3 frets, P2→P3: up 2, P3→P4: up 2, P4→P5: up 3
  // Cumulative: [0, 3, 5, 7, 10]
  const offsets = [0, 3, 5, 7, 10];
  
  const positions: CAGEDPosition[] = [];
  
  for (let i = 0; i < 5; i++) {
    let fretStart = (baseFret + offsets[i]) % 12;
    
    // Positions that wrap past 12 go to the second octave (frets 12+)
    // unless they'd be too narrow, in which case keep in first octave
    if (offsets[i] > 0 && fretStart < baseFret) {
      // This position wraps around - check if first octave position has enough room
      if (fretStart + 5 <= 12) {
        // Keep in first octave (open/low position)
        fretStart = fretStart;
      } else {
        // Move to second octave
        fretStart = fretStart + 12;
      }
    }
    
    const fretEnd = Math.min(FRET_COUNT, fretStart + 5);
    
    // Only add if we have at least 4 frets of range
    if (fretEnd - fretStart >= 4) {
      positions.push({
        name: '',
        fretStart,
        fretEnd,
        rootString: 0,
      });
    }
  }
  
  // Sort by fret position
  positions.sort((a, b) => a.fretStart - b.fretStart);
  
  // Re-number after sorting
  for (let i = 0; i < positions.length; i++) {
    positions[i].name = `Position ${i + 1}`;
  }
  
  return positions;
}

// Get scale notes in a specific CAGED position
export function getScaleInPosition(
  key: NoteName,
  scaleId: string,
  position: CAGEDPosition
): FretboardNote[] {
  return getScaleOnFretboard(key, scaleId, position.fretStart, position.fretEnd);
}

// String colors matching the screenshots
export const STRING_COLORS: string[] = [
  '#ef4444', // String 0 (Low E) - Red
  '#ef4444', // String 1 (A) - Red
  '#eab308', // String 2 (D) - Yellow
  '#eab308', // String 3 (G) - Yellow
  '#22c55e', // String 4 (B) - Green
  '#22c55e', // String 5 (High E) - Green
];

// Interval color mapping
export function getIntervalColor(intervalLabel: string): string {
  if (intervalLabel === 'R') return '#ef4444'; // Root = Red
  if (intervalLabel.includes('♭3') || intervalLabel.includes('♭2')) return '#a855f7'; // Flat intervals = Purple
  if (intervalLabel === '3' || intervalLabel === '2') return '#22c55e'; // Natural = Green
  if (intervalLabel === '4') return '#3b82f6'; // Fourth = Blue
  if (intervalLabel.includes('5') || intervalLabel === '5') return '#06b6d4'; // Fifth = Cyan
  if (intervalLabel.includes('6')) return '#f97316'; // Sixth = Orange
  if (intervalLabel.includes('7')) return '#ec4899'; // Seventh = Pink
  if (intervalLabel.includes('♯') || intervalLabel.includes('♭')) return '#a855f7'; // Altered = Purple
  return '#6366f1'; // Default = Indigo
}

// Fret markers (dots on the fretboard)
export const FRET_MARKERS = [3, 5, 7, 9, 12, 15, 17, 19, 21];
export const DOUBLE_MARKERS = [12, 24]; // Double dots at octave
