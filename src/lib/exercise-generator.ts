// Exercise Generator for Guitar
// Generates various practice exercises from scale patterns
// Expanded: 107 base exercise types, 250+ variations, rich metadata

import {
  FretboardNote,
  getScaleOnFretboard,
  getScaleInPosition,
  getCAGEDPositions,
  NOTES,
  NoteName,
  STRING_OPEN_NOTES,
  FRET_COUNT,
  SCALES,
} from './music-theory';

// ─── CORE INTERFACES ───

export interface ExerciseNote {
  string: number;
  fret: number;
  note: string;
  intervalLabel: string;
  isRoot: boolean;
  sequenceNumber?: number;
}

export interface Exercise {
  name: string;
  description: string;
  type: ExerciseType;
  notes: ExerciseNote[];
  tabs: string[];
  patternId?: string;
}

// ─── EXERCISE TYPE UNION (107 types) ───

export type ExerciseType =
  // Scale Runs (8)
  | 'scale-asc'
  | 'scale-desc'
  | 'scale-asc-desc'
  | 'scale-desc-asc'
  | 'reverse-pentatonic'
  | 'scale-skip-note'
  | 'scale-fragment-3'
  | 'scale-fragment-4'
  // Sequences (12)
  | 'thirds'
  | 'fourths'
  | 'fifths'
  | 'sixths'
  | 'sevenths'
  | 'sequence-3'
  | 'sequence-4'
  | 'sequence-5'
  | 'sequence-6'
  | 'sequence-7'
  | 'pedal-tone'
  | 'pedal-tone-inv'
  // Shapes (10)
  | 'triads'
  | 'triads-inv1'
  | 'triads-inv2'
  | 'arpeggios'
  | 'octave-shapes'
  | 'double-stops'
  | 'shell-voicings'
  | 'dyads'
  | 'chord-scale'
  | 'power-shapes'
  // Technique (12)
  | 'string-skip'
  | 'lateral-run'
  | 'diagonal'
  | 'position-shift'
  | 'pentatonic-run'
  | 'economy-picking'
  | 'spider-walk'
  | 'interval-jump'
  | 'hammer-pull'
  | 'slide-exercise'
  | 'cross-string'
  | 'speed-burst'
  // Connections (4)
  | 'connecting'
  | 'position-sweep'
  | 'caged-cycle'
  | 'caged-run'
  // Intervals (6)
  | 'intervals-2nd'
  | 'intervals-3rd'
  | 'intervals-4th'
  | 'intervals-5th'
  | 'intervals-6th'
  | 'intervals-7th'
  // Arpeggios (6)
  | 'arp-sweep'
  | 'arp-string-skip'
  | 'arp-triad-up'
  | 'arp-seventh'
  | 'arp-inverted'
  | 'arp-connect'
  // Warmups (4)
  | 'chromatic-warmup'
  | 'spider-warmup'
  | 'finger-gym'
  | 'string-cross-warmup'
  // Rhythm (6)
  | 'rhythm-subdivisions'
  | 'rhythm-syncopation'
  | 'rhythm-rest'
  | 'rhythm-accent'
  | 'rhythm-swing'
  | 'rhythm-tied'
  // Bending & Expression (5)
  | 'bend-unison'
  | 'bend-half'
  | 'bend-full'
  | 'bend-pre'
  | 'vibrato-control'
  // Tapping (4)
  | 'tap-basic'
  | 'tap-arpeggio'
  | 'tap-scale'
  | 'tap-harmonic'
  // Harmonics (3)
  | 'harmonics-natural'
  | 'harmonics-artificial'
  | 'harmonics-pinch'
  // Extended Sequences (5)
  | 'enclosure'
  | 'bebop-scale'
  | 'cycle-of-4ths'
  | 'cycle-of-5ths'
  | 'chromatic-enclosure'
  // Extended Scale Runs (5)
  | 'scale-3nps'
  | 'scale-single-string'
  | 'scale-zigzag'
  | 'scale-wide-skip'
  | 'scale-chromatic-passing'
  // Extended Technique (6)
  | 'hybrid-picking'
  | 'chicken-pick'
  | 'banjo-roll'
  | 'palm-mute'
  | 'staccato'
  | 'sweep-tap'
  // Extended Shapes (5)
  | 'barre-shapes'
  | 'drop2-voicings'
  | 'guide-tones'
  | 'quartal-voicings'
  | 'stacked-fourths'
  // Fretboard Navigation (4)
  | 'note-finder'
  | 'octave-drill'
  | 'unison-drill'
  | 'interval-matrix'
  // Extended Warmups (6)
  | 'chromatic-1234'
  | 'chromatic-4321'
  | 'chromatic-1324'
  | 'chromatic-1423'
  | 'chromatic-2413'
  | 'finger-stretch';

// ─── EXTENDED METADATA ───

export interface ExerciseTypeMeta {
  name: string;
  description: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  focus: string;
  estimatedTime: string;
  tags: string[];
}

export const EXERCISE_TYPES: Record<ExerciseType, ExerciseTypeMeta> = {
  // ── Scale Runs ──
  'scale-asc': { name: 'Ascending Scale', description: 'Play scale ascending from root to octave', difficulty: 1, focus: 'Alternate Picking', estimatedTime: '2-3 min', tags: ['picking', 'basics', 'scale'] },
  'scale-desc': { name: 'Descending Scale', description: 'Play scale descending from octave to root', difficulty: 1, focus: 'Alternate Picking', estimatedTime: '2-3 min', tags: ['picking', 'basics', 'scale'] },
  'scale-asc-desc': { name: 'Asc/Desc Scale', description: 'Play scale ascending then descending', difficulty: 1, focus: 'Alternate Picking', estimatedTime: '3-5 min', tags: ['picking', 'basics', 'scale'] },
  'scale-desc-asc': { name: 'Desc/Asc Scale', description: 'Play scale descending then ascending', difficulty: 2, focus: 'Alternate Picking', estimatedTime: '3-5 min', tags: ['picking', 'scale', 'direction'] },
  'reverse-pentatonic': { name: 'Reverse Pentatonic', description: 'Pentatonic pattern descending then ascending', difficulty: 2, focus: 'Alternate Picking', estimatedTime: '3-5 min', tags: ['picking', 'pentatonic', 'direction'] },
  'scale-skip-note': { name: 'Skip Note Scale', description: 'Play every other note of the scale', difficulty: 2, focus: 'Ear Training', estimatedTime: '3-5 min', tags: ['ear', 'intervals', 'scale'] },
  'scale-fragment-3': { name: '3-Note Fragments', description: '3-note ascending groups from each scale degree', difficulty: 3, focus: 'Dexterity', estimatedTime: '3-5 min', tags: ['dexterity', 'sequence', 'scale'] },
  'scale-fragment-4': { name: '4-Note Fragments', description: '4-note ascending groups from each scale degree', difficulty: 3, focus: 'Dexterity', estimatedTime: '3-5 min', tags: ['dexterity', 'sequence', 'scale'] },

  // ── Sequences ──
  'thirds': { name: 'Diatonic Thirds', description: 'Play scale in thirds (skip one note each time)', difficulty: 2, focus: 'Ear Training', estimatedTime: '3-5 min', tags: ['ear', 'intervals', 'sequence'] },
  'fourths': { name: 'Diatonic Fourths', description: 'Play scale in fourths (skip two notes)', difficulty: 3, focus: 'Ear Training', estimatedTime: '3-5 min', tags: ['ear', 'intervals', 'sequence'] },
  'fifths': { name: 'Diatonic Fifths', description: 'Play scale in fifths (skip three notes)', difficulty: 3, focus: 'Ear Training', estimatedTime: '3-5 min', tags: ['ear', 'intervals', 'sequence'] },
  'sixths': { name: 'Diatonic Sixths', description: 'Play scale in sixths (skip four notes)', difficulty: 4, focus: 'Ear Training', estimatedTime: '3-5 min', tags: ['ear', 'intervals', 'sequence'] },
  'sevenths': { name: 'Diatonic Sevenths', description: 'Play scale in sevenths (skip five notes)', difficulty: 4, focus: 'Ear Training', estimatedTime: '3-5 min', tags: ['ear', 'intervals', 'sequence'] },
  'sequence-3': { name: '3-Note Sequences', description: 'Groups of 3 ascending notes, shifting by one degree', difficulty: 2, focus: 'Alternate Picking', estimatedTime: '3-5 min', tags: ['picking', 'sequence', 'speed'] },
  'sequence-4': { name: '4-Note Sequences', description: 'Groups of 4 ascending notes, shifting by one degree', difficulty: 3, focus: 'Alternate Picking', estimatedTime: '3-5 min', tags: ['picking', 'sequence', 'speed'] },
  'sequence-5': { name: '5-Note Sequences', description: 'Groups of 5 ascending notes, shifting by one degree', difficulty: 3, focus: 'Alternate Picking', estimatedTime: '4-6 min', tags: ['picking', 'sequence', 'speed'] },
  'sequence-6': { name: '6-Note Sequences', description: 'Groups of 6 ascending notes, shifting by one degree', difficulty: 4, focus: 'Alternate Picking', estimatedTime: '4-6 min', tags: ['picking', 'sequence', 'speed'] },
  'sequence-7': { name: '7-Note Sequences', description: 'Groups of 7 ascending notes, shifting by one degree', difficulty: 4, focus: 'Alternate Picking', estimatedTime: '4-6 min', tags: ['picking', 'sequence', 'speed'] },
  'pedal-tone': { name: 'Pedal Tone', description: 'Alternate root with each scale degree', difficulty: 2, focus: 'Timing', estimatedTime: '3-5 min', tags: ['timing', 'root', 'control'] },
  'pedal-tone-inv': { name: 'Pedal Tone (5th)', description: 'Alternate 5th with each scale degree', difficulty: 3, focus: 'Timing', estimatedTime: '3-5 min', tags: ['timing', 'fifth', 'control'] },

  // ── Shapes ──
  'triads': { name: 'Triad Shapes', description: 'Find and play triad shapes within the scale', difficulty: 2, focus: 'Chord Knowledge', estimatedTime: '3-5 min', tags: ['chords', 'triads', 'shapes'] },
  'triads-inv1': { name: 'Triads 1st Inversion', description: 'First inversion triad shapes within the scale', difficulty: 3, focus: 'Chord Knowledge', estimatedTime: '3-5 min', tags: ['chords', 'triads', 'inversion'] },
  'triads-inv2': { name: 'Triads 2nd Inversion', description: 'Second inversion triad shapes within the scale', difficulty: 3, focus: 'Chord Knowledge', estimatedTime: '3-5 min', tags: ['chords', 'triads', 'inversion'] },
  'arpeggios': { name: 'Arpeggios', description: 'Arpeggiated patterns built from scale degrees', difficulty: 3, focus: 'Sweep Picking', estimatedTime: '3-5 min', tags: ['sweep', 'arpeggio', 'chords'] },
  'octave-shapes': { name: 'Octave Shapes', description: 'Root and octave pairs across the fretboard', difficulty: 2, focus: 'Fretboard Knowledge', estimatedTime: '2-3 min', tags: ['fretboard', 'octaves', 'navigation'] },
  'double-stops': { name: 'Double Stops', description: 'Two-note pairs on adjacent strings', difficulty: 2, focus: 'Hybrid Picking', estimatedTime: '3-5 min', tags: ['picking', 'double-stops', 'harmony'] },
  'shell-voicings': { name: 'Shell Voicings', description: 'Root-3rd-7th or Root-7th-3rd chord shells', difficulty: 3, focus: 'Chord Knowledge', estimatedTime: '3-5 min', tags: ['chords', 'jazz', 'voicings'] },
  'dyads': { name: 'Dyads', description: 'Two-note combinations on adjacent strings', difficulty: 2, focus: 'Ear Training', estimatedTime: '2-4 min', tags: ['ear', 'intervals', 'harmony'] },
  'chord-scale': { name: 'Chord Scale', description: 'Chords built on each scale degree', difficulty: 4, focus: 'Chord Knowledge', estimatedTime: '5-8 min', tags: ['chords', 'harmony', 'progression'] },
  'power-shapes': { name: 'Power Shapes', description: 'Root-5th power chord shapes across the neck', difficulty: 1, focus: 'Rhythm', estimatedTime: '2-3 min', tags: ['rhythm', 'power-chords', 'basics'] },

  // ── Technique ──
  'string-skip': { name: 'String Skipping', description: 'Skip strings while playing scale notes', difficulty: 3, focus: 'Alternate Picking', estimatedTime: '3-5 min', tags: ['picking', 'string-skip', 'accuracy'] },
  'lateral-run': { name: 'Lateral Run', description: 'Run across strings at the same fret position', difficulty: 2, focus: 'Alternate Picking', estimatedTime: '2-4 min', tags: ['picking', 'lateral', 'speed'] },
  'diagonal': { name: 'Diagonal Pattern', description: 'Play a diagonal pattern across the fretboard', difficulty: 3, focus: 'Position Playing', estimatedTime: '3-5 min', tags: ['position', 'diagonal', 'navigation'] },
  'position-shift': { name: 'Position Shift', description: 'Shift between CAGED positions smoothly', difficulty: 3, focus: 'Position Playing', estimatedTime: '3-5 min', tags: ['position', 'shift', 'caged'] },
  'pentatonic-run': { name: 'Pentatonic Run', description: 'Classic 2-notes-per-string pentatonic run', difficulty: 2, focus: 'Alternate Picking', estimatedTime: '3-5 min', tags: ['picking', 'pentatonic', 'speed'] },
  'economy-picking': { name: 'Economy Picking', description: 'Practice economy/sweep picking patterns', difficulty: 4, focus: 'Economy Picking', estimatedTime: '3-5 min', tags: ['economy', 'sweep', 'picking'] },
  'spider-walk': { name: 'Spider Walk', description: 'Walking pattern across strings building finger independence', difficulty: 2, focus: 'Finger Independence', estimatedTime: '3-5 min', tags: ['independence', 'dexterity', 'fingers'] },
  'interval-jump': { name: 'Interval Jump', description: 'Jump between different intervals within the scale', difficulty: 3, focus: 'Ear Training', estimatedTime: '3-5 min', tags: ['ear', 'intervals', 'accuracy'] },
  'hammer-pull': { name: 'Hammer-Pull', description: 'Hammer-on and pull-off patterns across strings', difficulty: 2, focus: 'Legato', estimatedTime: '3-5 min', tags: ['legato', 'hammer-on', 'pull-off'] },
  'slide-exercise': { name: 'Slide Exercise', description: 'Slide between positions on the same string', difficulty: 3, focus: 'Sliding', estimatedTime: '2-4 min', tags: ['slide', 'legato', 'position'] },
  'cross-string': { name: 'Cross-String Picking', description: 'Cross-string alternate picking patterns', difficulty: 3, focus: 'Alternate Picking', estimatedTime: '3-5 min', tags: ['picking', 'cross-string', 'accuracy'] },
  'speed-burst': { name: 'Speed Burst', description: 'Fast repeated pattern bursts for speed development', difficulty: 4, focus: 'Speed', estimatedTime: '2-4 min', tags: ['speed', 'burst', 'picking'] },

  // ── Connections ──
  'connecting': { name: 'Position Connect', description: 'Connect between adjacent CAGED positions', difficulty: 3, focus: 'Fretboard Knowledge', estimatedTime: '3-5 min', tags: ['caged', 'navigation', 'connection'] },
  'position-sweep': { name: 'Position Sweep', description: 'Sweep through all CAGED positions', difficulty: 4, focus: 'Fretboard Knowledge', estimatedTime: '4-6 min', tags: ['caged', 'sweep', 'navigation'] },
  'caged-cycle': { name: 'CAGED Cycle', description: 'Play through all 5 CAGED shapes', difficulty: 4, focus: 'Fretboard Knowledge', estimatedTime: '4-6 min', tags: ['caged', 'shapes', 'cycle'] },
  'caged-run': { name: 'CAGED Run', description: 'Run connecting CAGED positions across the neck', difficulty: 5, focus: 'Fretboard Knowledge', estimatedTime: '5-8 min', tags: ['caged', 'run', 'advanced'] },

  // ── Intervals ──
  'intervals-2nd': { name: '2nd Intervals', description: 'Focus on 2nd interval recognition and playing', difficulty: 2, focus: 'Ear Training', estimatedTime: '3-5 min', tags: ['ear', 'intervals', '2nd'] },
  'intervals-3rd': { name: '3rd Intervals', description: 'Focus on 3rd interval recognition and playing', difficulty: 2, focus: 'Ear Training', estimatedTime: '3-5 min', tags: ['ear', 'intervals', '3rd'] },
  'intervals-4th': { name: '4th Intervals', description: 'Focus on 4th interval recognition and playing', difficulty: 3, focus: 'Ear Training', estimatedTime: '3-5 min', tags: ['ear', 'intervals', '4th'] },
  'intervals-5th': { name: '5th Intervals', description: 'Focus on 5th interval recognition and playing', difficulty: 3, focus: 'Ear Training', estimatedTime: '3-5 min', tags: ['ear', 'intervals', '5th'] },
  'intervals-6th': { name: '6th Intervals', description: 'Focus on 6th interval recognition and playing', difficulty: 4, focus: 'Ear Training', estimatedTime: '3-5 min', tags: ['ear', 'intervals', '6th'] },
  'intervals-7th': { name: '7th Intervals', description: 'Focus on 7th interval recognition and playing', difficulty: 4, focus: 'Ear Training', estimatedTime: '3-5 min', tags: ['ear', 'intervals', '7th'] },

  // ── Arpeggios ──
  'arp-sweep': { name: 'Sweep Arpeggio', description: 'Sweep picking arpeggio pattern', difficulty: 4, focus: 'Sweep Picking', estimatedTime: '3-5 min', tags: ['sweep', 'arpeggio', 'technique'] },
  'arp-string-skip': { name: 'String-Skip Arpeggio', description: 'String-skipped arpeggio pattern', difficulty: 4, focus: 'String Skipping', estimatedTime: '3-5 min', tags: ['string-skip', 'arpeggio', 'technique'] },
  'arp-triad-up': { name: 'Triad Arp Ascending', description: 'Triad arpeggio ascending across strings', difficulty: 3, focus: 'Sweep Picking', estimatedTime: '3-5 min', tags: ['sweep', 'triad', 'ascending'] },
  'arp-seventh': { name: '7th Chord Arpeggio', description: 'Seventh chord arpeggio pattern', difficulty: 4, focus: 'Sweep Picking', estimatedTime: '4-6 min', tags: ['sweep', 'seventh', 'jazz'] },
  'arp-inverted': { name: 'Inverted Arpeggio', description: 'Inverted arpeggio shapes across the neck', difficulty: 4, focus: 'Sweep Picking', estimatedTime: '3-5 min', tags: ['sweep', 'inversion', 'arpeggio'] },
  'arp-connect': { name: 'Connected Arpeggios', description: 'Connect arpeggio shapes across the neck', difficulty: 5, focus: 'Fretboard Knowledge', estimatedTime: '5-8 min', tags: ['arpeggio', 'connection', 'advanced'] },

  // ── Warmups ──
  'chromatic-warmup': { name: 'Chromatic Warmup', description: '1-2-3-4 chromatic pattern across strings', difficulty: 1, focus: 'Warmup', estimatedTime: '2-3 min', tags: ['warmup', 'chromatic', 'basics'] },
  'spider-warmup': { name: 'Spider Warmup', description: 'Spider-style warmup for finger independence', difficulty: 1, focus: 'Warmup', estimatedTime: '2-3 min', tags: ['warmup', 'spider', 'independence'] },
  'finger-gym': { name: 'Finger Gym', description: 'Finger independence exercise', difficulty: 2, focus: 'Finger Independence', estimatedTime: '2-4 min', tags: ['independence', 'dexterity', 'fingers'] },
  'string-cross-warmup': { name: 'String Cross Warmup', description: 'String crossing warmup pattern', difficulty: 1, focus: 'Warmup', estimatedTime: '2-3 min', tags: ['warmup', 'string-cross', 'basics'] },

  // ── Rhythm ──
  'rhythm-subdivisions': { name: 'Subdivision Practice', description: 'Play scale notes switching between quarter, eighth, triplet, and sixteenth subdivisions', difficulty: 2, focus: 'Timing', estimatedTime: '3-5 min', tags: ['rhythm', 'subdivision', 'timing'] },
  'rhythm-syncopation': { name: 'Syncopation', description: 'Accent off-beat notes while maintaining steady rhythm', difficulty: 3, focus: 'Timing', estimatedTime: '3-5 min', tags: ['rhythm', 'syncopation', 'groove'] },
  'rhythm-rest': { name: 'Rest Placement', description: 'Practice playing with strategic rests — hear the silence between notes', difficulty: 3, focus: 'Timing', estimatedTime: '3-5 min', tags: ['rhythm', 'rests', 'control'] },
  'rhythm-accent': { name: 'Accent Patterns', description: 'Shift accents across different beats to build rhythmic awareness', difficulty: 2, focus: 'Timing', estimatedTime: '3-5 min', tags: ['rhythm', 'accents', 'control'] },
  'rhythm-swing': { name: 'Swing Feel', description: 'Play scale with swung eighth note feel for blues and jazz', difficulty: 3, focus: 'Feel', estimatedTime: '3-5 min', tags: ['rhythm', 'swing', 'blues'] },
  'rhythm-tied': { name: 'Tied Notes', description: 'Practice tied notes across bar lines to develop longer phrasing', difficulty: 3, focus: 'Timing', estimatedTime: '3-5 min', tags: ['rhythm', 'tied', 'phrasing'] },

  // ── Bending & Expression ──
  'bend-unison': { name: 'Unison Bends', description: 'Bend one string to match the pitch of the adjacent string', difficulty: 3, focus: 'Bending', estimatedTime: '3-5 min', tags: ['bending', 'expression', 'pitch'] },
  'bend-half': { name: 'Half-Step Bends', description: 'Practice precise half-step bends to target notes', difficulty: 3, focus: 'Bending', estimatedTime: '3-5 min', tags: ['bending', 'half-step', 'pitch'] },
  'bend-full': { name: 'Full-Step Bends', description: 'Practice precise whole-step bends to target notes', difficulty: 3, focus: 'Bending', estimatedTime: '3-5 min', tags: ['bending', 'full-step', 'pitch'] },
  'bend-pre': { name: 'Pre-Bends', description: 'Bend the string before striking, then release to pitch', difficulty: 4, focus: 'Bending', estimatedTime: '3-5 min', tags: ['bending', 'pre-bend', 'advanced'] },
  'vibrato-control': { name: 'Vibrato Control', description: 'Practice different vibrato speeds and widths on sustained notes', difficulty: 3, focus: 'Expression', estimatedTime: '3-5 min', tags: ['vibrato', 'expression', 'control'] },

  // ── Tapping ──
  'tap-basic': { name: 'Basic Tapping', description: 'Two-hand tapping pattern using right-hand index finger', difficulty: 3, focus: 'Tapping', estimatedTime: '3-5 min', tags: ['tapping', 'two-hand', 'technique'] },
  'tap-arpeggio': { name: 'Tapped Arpeggio', description: 'Arpeggio patterns using tapping technique across strings', difficulty: 4, focus: 'Tapping', estimatedTime: '4-6 min', tags: ['tapping', 'arpeggio', 'advanced'] },
  'tap-scale': { name: 'Tapped Scale Run', description: 'Full scale run using tapping with hammer-ons from nowhere', difficulty: 4, focus: 'Tapping', estimatedTime: '3-5 min', tags: ['tapping', 'scale', 'speed'] },
  'tap-harmonic': { name: 'Tap Harmonics', description: 'Produce harmonics by tapping directly on the fretwire', difficulty: 4, focus: 'Tapping', estimatedTime: '3-5 min', tags: ['tapping', 'harmonics', 'technique'] },

  // ── Harmonics ──
  'harmonics-natural': { name: 'Natural Harmonics', description: 'Play natural harmonics at 5th, 7th, and 12th frets', difficulty: 2, focus: 'Harmonics', estimatedTime: '2-3 min', tags: ['harmonics', 'natural', 'bell-tone'] },
  'harmonics-artificial': { name: 'Artificial Harmonics', description: 'Produce harmonics by touching string at specific interval above fretted note', difficulty: 4, focus: 'Harmonics', estimatedTime: '3-5 min', tags: ['harmonics', 'artificial', 'advanced'] },
  'harmonics-pinch': { name: 'Pinch Harmonics', description: 'Squeal harmonics using thumb attack on picked notes', difficulty: 4, focus: 'Harmonics', estimatedTime: '3-5 min', tags: ['harmonics', 'pinch', 'rock'] },

  // ── Extended Sequences ──
  'enclosure': { name: 'Enclosures', description: 'Approach target notes from above and below — chromatic and diatonic', difficulty: 4, focus: 'Ear Training', estimatedTime: '4-6 min', tags: ['enclosure', 'approach', 'jazz'] },
  'bebop-scale': { name: 'Bebop Scale Pattern', description: 'Practice bebop scale with passing tone on the downbeat', difficulty: 4, focus: 'Jazz Vocabulary', estimatedTime: '4-6 min', tags: ['bebop', 'jazz', 'chromatic'] },
  'cycle-of-4ths': { name: 'Cycle of 4ths', description: 'Play root movement through the cycle of fourths', difficulty: 4, focus: 'Fretboard Knowledge', estimatedTime: '4-6 min', tags: ['cycle', 'fourths', 'navigation'] },
  'cycle-of-5ths': { name: 'Cycle of 5ths', description: 'Play root movement through the cycle of fifths', difficulty: 4, focus: 'Fretboard Knowledge', estimatedTime: '4-6 min', tags: ['cycle', 'fifths', 'navigation'] },
  'chromatic-enclosure': { name: 'Chromatic Enclosure', description: 'Enclose target notes with chromatic approach from both sides', difficulty: 5, focus: 'Jazz Vocabulary', estimatedTime: '4-6 min', tags: ['chromatic', 'enclosure', 'jazz'] },

  // ── Extended Scale Runs ──
  'scale-3nps': { name: '3 Notes Per String', description: 'Scale played with 3 notes on each string — essential for speed picking', difficulty: 3, focus: 'Alternate Picking', estimatedTime: '3-5 min', tags: ['3nps', 'speed', 'picking'] },
  'scale-single-string': { name: 'Single String Scale', description: 'Play the entire scale on one string — learn the fretboard vertically', difficulty: 2, focus: 'Fretboard Knowledge', estimatedTime: '3-5 min', tags: ['single-string', 'vertical', 'navigation'] },
  'scale-zigzag': { name: 'Zigzag Pattern', description: 'Move up one string, down the next — zigzag across the fretboard', difficulty: 3, focus: 'String Crossing', estimatedTime: '3-5 min', tags: ['zigzag', 'crossing', 'control'] },
  'scale-wide-skip': { name: 'Wide Interval Skips', description: 'Jump across large intervals within the scale for ear training', difficulty: 4, focus: 'Ear Training', estimatedTime: '3-5 min', tags: ['wide-skip', 'interval', 'ear'] },
  'scale-chromatic-passing': { name: 'Chromatic Passing', description: 'Add chromatic passing tones between scale degrees', difficulty: 3, focus: 'Ear Training', estimatedTime: '3-5 min', tags: ['chromatic', 'passing', 'jazz'] },

  // ── Extended Technique ──
  'hybrid-picking': { name: 'Hybrid Picking', description: 'Combine flatpick with fingers for simultaneous string attack', difficulty: 3, focus: 'Hybrid Picking', estimatedTime: '3-5 min', tags: ['hybrid', 'picking', 'country'] },
  'chicken-pick': { name: 'Chicken Picking', description: 'Country-style hybrid picking with muted plucks and snaps', difficulty: 4, focus: 'Hybrid Picking', estimatedTime: '3-5 min', tags: ['chicken', 'country', 'snap'] },
  'banjo-roll': { name: 'Banjo Roll', description: 'Three-finger roll pattern across adjacent strings', difficulty: 3, focus: 'Fingerpicking', estimatedTime: '3-5 min', tags: ['banjo', 'roll', 'fingerpicking'] },
  'palm-mute': { name: 'Palm Mute Patterns', description: 'Alternate between palm-muted and open notes for dynamic control', difficulty: 2, focus: 'Rhythm', estimatedTime: '3-5 min', tags: ['palm-mute', 'rhythm', 'dynamic'] },
  'staccato': { name: 'Staccato Exercise', description: 'Play short detached notes for precision and muting control', difficulty: 2, focus: 'Control', estimatedTime: '3-5 min', tags: ['staccato', 'muting', 'control'] },
  'sweep-tap': { name: 'Sweep + Tap', description: 'Combine sweep picking with right-hand tapping for extended arpeggios', difficulty: 5, focus: 'Advanced', estimatedTime: '5-8 min', tags: ['sweep', 'tapping', 'advanced'] },

  // ── Extended Shapes ──
  'barre-shapes': { name: 'Barre Chord Shapes', description: 'Root-6 and root-5 barre chord shapes within the scale', difficulty: 2, focus: 'Chord Knowledge', estimatedTime: '3-5 min', tags: ['barre', 'chords', 'shapes'] },
  'drop2-voicings': { name: 'Drop-2 Voicings', description: 'Drop-2 chord voicings on the top 4 strings', difficulty: 4, focus: 'Chord Knowledge', estimatedTime: '4-6 min', tags: ['drop-2', 'jazz', 'voicings'] },
  'guide-tones': { name: 'Guide Tones', description: 'Root, 3rd, and 7th — the essential tones for chord outlining', difficulty: 3, focus: 'Chord Knowledge', estimatedTime: '3-5 min', tags: ['guide-tones', 'jazz', 'outline'] },
  'quartal-voicings': { name: 'Quartal Voicings', description: 'Chords built in fourths instead of thirds for modern sound', difficulty: 4, focus: 'Chord Knowledge', estimatedTime: '4-6 min', tags: ['quartal', 'modern', 'voicings'] },
  'stacked-fourths': { name: 'Stacked Fourths', description: 'Stack perfect fourth intervals across adjacent strings', difficulty: 4, focus: 'Ear Training', estimatedTime: '3-5 min', tags: ['fourths', 'stacked', 'modern'] },

  // ── Fretboard Navigation ──
  'note-finder': { name: 'Note Finder', description: 'Find a specific note on every string across the fretboard', difficulty: 2, focus: 'Fretboard Knowledge', estimatedTime: '3-5 min', tags: ['note-finder', 'navigation', 'memory'] },
  'octave-drill': { name: 'Octave Drill', description: 'Find all octave locations of the root note across the neck', difficulty: 2, focus: 'Fretboard Knowledge', estimatedTime: '2-4 min', tags: ['octaves', 'navigation', 'root'] },
  'unison-drill': { name: 'Unison Drill', description: 'Find the same pitch at different string/fret locations', difficulty: 3, focus: 'Fretboard Knowledge', estimatedTime: '3-5 min', tags: ['unison', 'navigation', 'positions'] },
  'interval-matrix': { name: 'Interval Matrix', description: 'Play every interval from the root across multiple strings', difficulty: 4, focus: 'Ear Training', estimatedTime: '4-6 min', tags: ['intervals', 'matrix', 'ear'] },

  // ── Extended Warmups ──
  'chromatic-1234': { name: 'Chromatic 1-2-3-4', description: 'Classic 1-2-3-4 chromatic pattern across all strings ascending', difficulty: 1, focus: 'Warmup', estimatedTime: '2-3 min', tags: ['warmup', 'chromatic', 'basics'] },
  'chromatic-4321': { name: 'Chromatic 4-3-2-1', description: 'Reverse chromatic pattern across all strings descending', difficulty: 1, focus: 'Warmup', estimatedTime: '2-3 min', tags: ['warmup', 'chromatic', 'reverse'] },
  'chromatic-1324': { name: 'Chromatic 1-3-2-4', description: 'Finger independence pattern 1-3-2-4 across strings', difficulty: 2, focus: 'Finger Independence', estimatedTime: '2-4 min', tags: ['warmup', 'chromatic', 'independence'] },
  'chromatic-1423': { name: 'Chromatic 1-4-2-3', description: 'Finger independence pattern 1-4-2-3 across strings', difficulty: 2, focus: 'Finger Independence', estimatedTime: '2-4 min', tags: ['warmup', 'chromatic', 'independence'] },
  'chromatic-2413': { name: 'Chromatic 2-4-1-3', description: 'Finger independence pattern 2-4-1-3 — advanced separation', difficulty: 2, focus: 'Finger Independence', estimatedTime: '2-4 min', tags: ['warmup', 'chromatic', 'independence'] },
  'finger-stretch': { name: 'Finger Stretch', description: 'Wide-fret spacing exercises to build finger span and flexibility', difficulty: 2, focus: 'Flexibility', estimatedTime: '2-3 min', tags: ['warmup', 'stretch', 'flexibility'] },
};

// ─── VARIATION SYSTEM ───

export interface ExerciseVariation {
  id: string;
  typeId: ExerciseType;
  variantName: string;
  suffix: string;
  modifier: 'standard' | 'extended' | 'inverted' | 'reverse' | 'compact';
}

export const EXERCISE_VARIATIONS: ExerciseVariation[] = buildVariations();

function buildVariations(): ExerciseVariation[] {
  const variations: ExerciseVariation[] = [];
  const seenIds = new Set<string>();
  const allTypes = Object.keys(EXERCISE_TYPES) as ExerciseType[];

  function addVariation(v: ExerciseVariation) {
    if (!seenIds.has(v.id)) {
      seenIds.add(v.id);
      variations.push(v);
    }
  }

  for (const typeId of allTypes) {
    // Every type gets standard
    addVariation({
      id: `${typeId}-standard`,
      typeId,
      variantName: 'Standard',
      suffix: 'Std',
      modifier: 'standard',
    });

    // Scale runs: extended + reverse
    if (typeId.startsWith('scale-') || typeId === 'reverse-pentatonic') {
      addVariation({ id: `${typeId}-extended`, typeId, variantName: 'Extended', suffix: 'Ext', modifier: 'extended' });
      addVariation({ id: `${typeId}-reverse`, typeId, variantName: 'Reverse', suffix: 'Rev', modifier: 'reverse' });
    }

    // Sequences: extended + compact
    if (['thirds', 'fourths', 'fifths', 'sixths', 'sevenths', 'sequence-3', 'sequence-4', 'sequence-5', 'sequence-6', 'sequence-7', 'pedal-tone', 'pedal-tone-inv', 'scale-fragment-3', 'scale-fragment-4', 'scale-skip-note'].includes(typeId)) {
      addVariation({ id: `${typeId}-extended`, typeId, variantName: 'Extended', suffix: 'Ext', modifier: 'extended' });
      addVariation({ id: `${typeId}-compact`, typeId, variantName: 'Compact', suffix: 'Cmp', modifier: 'compact' });
    }

    // Shapes: inverted + compact
    if (['triads', 'triads-inv1', 'triads-inv2', 'arpeggios', 'octave-shapes', 'double-stops', 'shell-voicings', 'dyads', 'chord-scale', 'power-shapes'].includes(typeId)) {
      addVariation({ id: `${typeId}-inverted`, typeId, variantName: 'Inverted', suffix: 'Inv', modifier: 'inverted' });
      addVariation({ id: `${typeId}-compact`, typeId, variantName: 'Compact', suffix: 'Cmp', modifier: 'compact' });
    }

    // Technique: extended + reverse
    if (['string-skip', 'lateral-run', 'diagonal', 'position-shift', 'pentatonic-run', 'economy-picking', 'spider-walk', 'interval-jump', 'hammer-pull', 'slide-exercise', 'cross-string', 'speed-burst'].includes(typeId)) {
      addVariation({ id: `${typeId}-extended`, typeId, variantName: 'Extended', suffix: 'Ext', modifier: 'extended' });
      addVariation({ id: `${typeId}-reverse`, typeId, variantName: 'Reverse', suffix: 'Rev', modifier: 'reverse' });
    }

    // Connections: extended
    if (['connecting', 'position-sweep', 'caged-cycle', 'caged-run'].includes(typeId)) {
      addVariation({ id: `${typeId}-extended`, typeId, variantName: 'Extended', suffix: 'Ext', modifier: 'extended' });
    }

    // Intervals: inverted + compact
    if (typeId.startsWith('intervals-')) {
      addVariation({ id: `${typeId}-inverted`, typeId, variantName: 'Inverted', suffix: 'Inv', modifier: 'inverted' });
      addVariation({ id: `${typeId}-compact`, typeId, variantName: 'Compact', suffix: 'Cmp', modifier: 'compact' });
    }

    // Arpeggios: extended + inverted
    if (['arp-sweep', 'arp-string-skip', 'arp-triad-up', 'arp-seventh', 'arp-inverted', 'arp-connect'].includes(typeId)) {
      addVariation({ id: `${typeId}-extended`, typeId, variantName: 'Extended', suffix: 'Ext', modifier: 'extended' });
      addVariation({ id: `${typeId}-inverted`, typeId, variantName: 'Inverted', suffix: 'Inv', modifier: 'inverted' });
    }

    // Warmups: extended + compact
    if (['chromatic-warmup', 'spider-warmup', 'finger-gym', 'string-cross-warmup'].includes(typeId)) {
      addVariation({ id: `${typeId}-extended`, typeId, variantName: 'Extended', suffix: 'Ext', modifier: 'extended' });
      addVariation({ id: `${typeId}-compact`, typeId, variantName: 'Compact', suffix: 'Cmp', modifier: 'compact' });
    }

    // Rhythm: extended + compact
    if (typeId.startsWith('rhythm-')) {
      addVariation({ id: `${typeId}-extended`, typeId, variantName: 'Extended', suffix: 'Ext', modifier: 'extended' });
      addVariation({ id: `${typeId}-compact`, typeId, variantName: 'Compact', suffix: 'Cmp', modifier: 'compact' });
    }

    // Bending: extended
    if (typeId.startsWith('bend-') || typeId === 'vibrato-control') {
      addVariation({ id: `${typeId}-extended`, typeId, variantName: 'Extended', suffix: 'Ext', modifier: 'extended' });
    }

    // Tapping: extended + reverse
    if (typeId.startsWith('tap-')) {
      addVariation({ id: `${typeId}-extended`, typeId, variantName: 'Extended', suffix: 'Ext', modifier: 'extended' });
      addVariation({ id: `${typeId}-reverse`, typeId, variantName: 'Reverse', suffix: 'Rev', modifier: 'reverse' });
    }

    // Harmonics: extended
    if (typeId.startsWith('harmonics-')) {
      addVariation({ id: `${typeId}-extended`, typeId, variantName: 'Extended', suffix: 'Ext', modifier: 'extended' });
    }

    // Extended sequences: extended + compact
    if (['enclosure', 'bebop-scale', 'cycle-of-4ths', 'cycle-of-5ths', 'chromatic-enclosure'].includes(typeId)) {
      addVariation({ id: `${typeId}-extended`, typeId, variantName: 'Extended', suffix: 'Ext', modifier: 'extended' });
      addVariation({ id: `${typeId}-compact`, typeId, variantName: 'Compact', suffix: 'Cmp', modifier: 'compact' });
    }

    // Extended scale runs: extended + reverse
    if (['scale-3nps', 'scale-single-string', 'scale-zigzag', 'scale-wide-skip', 'scale-chromatic-passing'].includes(typeId)) {
      addVariation({ id: `${typeId}-extended`, typeId, variantName: 'Extended', suffix: 'Ext', modifier: 'extended' });
      addVariation({ id: `${typeId}-reverse`, typeId, variantName: 'Reverse', suffix: 'Rev', modifier: 'reverse' });
    }

    // Extended technique: extended + reverse
    if (['hybrid-picking', 'chicken-pick', 'banjo-roll', 'palm-mute', 'staccato', 'sweep-tap'].includes(typeId)) {
      addVariation({ id: `${typeId}-extended`, typeId, variantName: 'Extended', suffix: 'Ext', modifier: 'extended' });
      addVariation({ id: `${typeId}-reverse`, typeId, variantName: 'Reverse', suffix: 'Rev', modifier: 'reverse' });
    }

    // Extended shapes: inverted + compact
    if (['barre-shapes', 'drop2-voicings', 'guide-tones', 'quartal-voicings', 'stacked-fourths'].includes(typeId)) {
      addVariation({ id: `${typeId}-inverted`, typeId, variantName: 'Inverted', suffix: 'Inv', modifier: 'inverted' });
      addVariation({ id: `${typeId}-compact`, typeId, variantName: 'Compact', suffix: 'Cmp', modifier: 'compact' });
    }

    // Fretboard navigation: extended + compact
    if (['note-finder', 'octave-drill', 'unison-drill', 'interval-matrix'].includes(typeId)) {
      addVariation({ id: `${typeId}-extended`, typeId, variantName: 'Extended', suffix: 'Ext', modifier: 'extended' });
      addVariation({ id: `${typeId}-compact`, typeId, variantName: 'Compact', suffix: 'Cmp', modifier: 'compact' });
    }

    // Extended warmups: extended + compact
    if (['chromatic-1234', 'chromatic-4321', 'chromatic-1324', 'chromatic-1423', 'chromatic-2413', 'finger-stretch'].includes(typeId)) {
      addVariation({ id: `${typeId}-extended`, typeId, variantName: 'Extended', suffix: 'Ext', modifier: 'extended' });
      addVariation({ id: `${typeId}-compact`, typeId, variantName: 'Compact', suffix: 'Cmp', modifier: 'compact' });
    }
  }

  return variations;
}

// ─── CATEGORY MAPPING ───

export const EXERCISE_CATEGORIES: Array<{
  id: string;
  label: string;
  section: string;
  types: ExerciseType[];
}> = [
  // PRACTICE section
  { id: 'scale-runs', label: 'Scale Runs', section: 'PRACTICE', types: ['scale-asc', 'scale-desc', 'scale-asc-desc', 'scale-desc-asc', 'reverse-pentatonic', 'scale-skip-note', 'scale-fragment-3', 'scale-fragment-4'] },
  { id: 'sequences', label: 'Sequences', section: 'PRACTICE', types: ['thirds', 'fourths', 'fifths', 'sixths', 'sevenths', 'sequence-3', 'sequence-4', 'sequence-5', 'sequence-6', 'sequence-7', 'pedal-tone', 'pedal-tone-inv'] },
  { id: 'shapes', label: 'Shapes', section: 'PRACTICE', types: ['triads', 'triads-inv1', 'triads-inv2', 'arpeggios', 'octave-shapes', 'double-stops', 'shell-voicings', 'dyads', 'chord-scale', 'power-shapes'] },
  { id: 'arpeggios', label: 'Arpeggios', section: 'PRACTICE', types: ['arp-sweep', 'arp-string-skip', 'arp-triad-up', 'arp-seventh', 'arp-inverted', 'arp-connect'] },
  // TECHNIQUE section
  { id: 'picking', label: 'Picking', section: 'TECHNIQUE', types: ['string-skip', 'economy-picking', 'cross-string', 'speed-burst'] },
  { id: 'legato', label: 'Legato', section: 'TECHNIQUE', types: ['hammer-pull', 'slide-exercise'] },
  { id: 'string-work', label: 'String Work', section: 'TECHNIQUE', types: ['lateral-run', 'diagonal', 'position-shift', 'pentatonic-run', 'spider-walk', 'interval-jump'] },
  // ADVANCED section
  { id: 'connections', label: 'Connections', section: 'ADVANCED', types: ['connecting', 'position-sweep', 'caged-cycle', 'caged-run'] },
  { id: 'intervals', label: 'Intervals', section: 'ADVANCED', types: ['intervals-2nd', 'intervals-3rd', 'intervals-4th', 'intervals-5th', 'intervals-6th', 'intervals-7th'] },
  // WARMUP section
  { id: 'warmups', label: 'Warmups', section: 'WARMUP', types: ['chromatic-warmup', 'spider-warmup', 'finger-gym', 'string-cross-warmup'] },
  { id: 'rhythm', label: 'Rhythm', section: 'PRACTICE', types: ['rhythm-subdivisions', 'rhythm-syncopation', 'rhythm-rest', 'rhythm-accent', 'rhythm-swing', 'rhythm-tied'] },
  { id: 'bending', label: 'Bending & Expression', section: 'TECHNIQUE', types: ['bend-unison', 'bend-half', 'bend-full', 'bend-pre', 'vibrato-control'] },
  { id: 'tapping', label: 'Tapping', section: 'TECHNIQUE', types: ['tap-basic', 'tap-arpeggio', 'tap-scale', 'tap-harmonic'] },
  { id: 'harmonics', label: 'Harmonics', section: 'TECHNIQUE', types: ['harmonics-natural', 'harmonics-artificial', 'harmonics-pinch'] },
  { id: 'ext-sequences', label: 'Adv. Sequences', section: 'ADVANCED', types: ['enclosure', 'bebop-scale', 'cycle-of-4ths', 'cycle-of-5ths', 'chromatic-enclosure'] },
  { id: 'ext-scales', label: 'Adv. Scale Runs', section: 'PRACTICE', types: ['scale-3nps', 'scale-single-string', 'scale-zigzag', 'scale-wide-skip', 'scale-chromatic-passing'] },
  { id: 'ext-technique', label: 'Adv. Technique', section: 'TECHNIQUE', types: ['hybrid-picking', 'chicken-pick', 'banjo-roll', 'palm-mute', 'staccato', 'sweep-tap'] },
  { id: 'ext-shapes', label: 'Adv. Shapes', section: 'ADVANCED', types: ['barre-shapes', 'drop2-voicings', 'guide-tones', 'quartal-voicings', 'stacked-fourths'] },
  { id: 'fretboard-nav', label: 'Fretboard Nav', section: 'ADVANCED', types: ['note-finder', 'octave-drill', 'unison-drill', 'interval-matrix'] },
  { id: 'ext-warmups', label: 'Chromatic Drills', section: 'WARMUP', types: ['chromatic-1234', 'chromatic-4321', 'chromatic-1324', 'chromatic-1423', 'chromatic-2413', 'finger-stretch'] },
];

// ─── HELPER FUNCTIONS ───

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

function dedupNotes(notes: FretboardNote[]): FretboardNote[] {
  const seen = new Set<string>();
  return notes.filter(n => {
    const k = `${n.string}-${n.fret}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function sortNotesAscending(notes: FretboardNote[]): FretboardNote[] {
  return [...notes].sort((a, b) => {
    const pitchA = (5 - a.string) * 5 + a.fret;
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

function addSequenceNumbers(notes: ExerciseNote[]): ExerciseNote[] {
  return notes.map((n, i) => ({ ...n, sequenceNumber: i + 1 }));
}

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

function makeExercise(type: ExerciseType, notes: FretboardNote[], fallbackNotes: FretboardNote[]): Exercise {
  const usedNotes = notes.length >= 3 ? notes : fallbackNotes;
  const exerciseNotes = addSequenceNumbers(usedNotes.map(fretboardToExerciseNote));
  return {
    name: EXERCISE_TYPES[type].name,
    description: EXERCISE_TYPES[type].description,
    type,
    notes: exerciseNotes,
    tabs: generateTabs(exerciseNotes),
  };
}

// ─── PARAMETERIZED GENERATORS ───

function generateSequenceN(key: NoteName, scaleId: string, startFret: number, endFret: number, n: number, type: ExerciseType): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const seqNotes: FretboardNote[] = [];
  for (let i = 0; i <= sorted.length - n; i++) {
    for (let j = 0; j < n && (i + j) < sorted.length; j++) {
      seqNotes.push(sorted[i + j]);
    }
  }
  const fallback = sortNotesAscending(dedupNotes(getScaleOnFretboard(key, scaleId, startFret, endFret)));
  return makeExercise(type, seqNotes, fallback);
}

function generateDiatonicN(key: NoteName, scaleId: string, startFret: number, endFret: number, skipN: number, type: ExerciseType): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const resultNotes: FretboardNote[] = [];
  for (let i = 0; i < sorted.length - skipN; i++) {
    resultNotes.push(sorted[i]);
    if (i + skipN < sorted.length) resultNotes.push(sorted[i + skipN]);
  }
  const fallback = sortNotesAscending(dedupNotes(getScaleOnFretboard(key, scaleId, startFret, endFret)));
  return makeExercise(type, resultNotes, fallback);
}

function generateIntervalN(key: NoteName, scaleId: string, startFret: number, endFret: number, intervalSize: number, type: ExerciseType): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const resultNotes: FretboardNote[] = [];
  for (const note of sorted) {
    // Find note at the given interval (in semitones) above
    const targetInterval = (note.interval + intervalSize) % 12;
    const match = sorted.find(n =>
      n.interval === targetInterval &&
      (5 - n.string) * 5 + n.fret > (5 - note.string) * 5 + note.fret
    );
    if (match) {
      resultNotes.push(note);
      resultNotes.push(match);
    }
  }
  const fallback = sortNotesAscending(dedupNotes(getScaleOnFretboard(key, scaleId, startFret, endFret)));
  return makeExercise(type, resultNotes, fallback);
}

// ─── SCALE RUN GENERATORS ───

function generateAscendingScale(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  return makeExercise('scale-asc', sorted, sorted);
}

function generateDescendingScale(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesDescending(dedupNotes(notes));
  return makeExercise('scale-desc', sorted, sorted);
}

function generateAscDescScale(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const ascSorted = sortNotesAscending(dedupNotes(notes));
  const descSorted = sortNotesDescending(dedupNotes(notes));
  const allNotes = [...ascSorted, ...descSorted.slice(1)];
  return makeExercise('scale-asc-desc', allNotes, ascSorted);
}

function generateDescAscScale(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const descSorted = sortNotesDescending(dedupNotes(notes));
  const ascSorted = sortNotesAscending(dedupNotes(notes));
  const allNotes = [...descSorted, ...ascSorted.slice(1)];
  return makeExercise('scale-desc-asc', allNotes, ascSorted);
}

function generateReversePentatonic(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const descSorted = sortNotesDescending(dedupNotes(notes));
  const ascSorted = sortNotesAscending(dedupNotes(notes));
  const allNotes = [...descSorted, ...ascSorted.slice(1)];
  return makeExercise('reverse-pentatonic', allNotes, ascSorted);
}

function generateScaleSkipNote(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const skipNotes: FretboardNote[] = [];
  for (let i = 0; i < sorted.length; i += 2) {
    skipNotes.push(sorted[i]);
  }
  return makeExercise('scale-skip-note', skipNotes, sorted);
}

function generateScaleFragmentN(key: NoteName, scaleId: string, startFret: number, endFret: number, n: number, type: ExerciseType): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const fragNotes: FretboardNote[] = [];
  for (let i = 0; i <= sorted.length - n; i++) {
    for (let j = 0; j < n; j++) {
      fragNotes.push(sorted[i + j]);
    }
  }
  return makeExercise(type, fragNotes, sorted);
}

// ─── PEDAL TONE GENERATORS ───

function generatePedalTone(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const roots = sorted.filter(n => n.isRoot);
  const primaryRoot = roots[0];
  if (!primaryRoot) {
    return makeExercise('pedal-tone', sorted, sorted);
  }
  const pedalNotes: FretboardNote[] = [];
  for (const note of sorted) {
    if (note === primaryRoot) continue;
    pedalNotes.push(primaryRoot);
    pedalNotes.push(note);
  }
  pedalNotes.push(primaryRoot);
  return makeExercise('pedal-tone', pedalNotes, sorted);
}

function generatePedalToneInv(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const fifths = sorted.filter(n => n.interval === 7);
  const primaryFifth = fifths[0];
  if (!primaryFifth) {
    return generatePedalTone(key, scaleId, startFret, endFret);
  }
  const pedalNotes: FretboardNote[] = [];
  for (const note of sorted) {
    if (note === primaryFifth) continue;
    pedalNotes.push(primaryFifth);
    pedalNotes.push(note);
  }
  pedalNotes.push(primaryFifth);
  return makeExercise('pedal-tone-inv', pedalNotes, sorted);
}

// ─── SHAPE GENERATORS ───

function generateTriads(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
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
  return makeExercise('triads', triadNotes, sorted);
}

function generateTriadsInv1(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const triadNotes: FretboardNote[] = [];
  for (let stringGroup = 0; stringGroup < 4; stringGroup++) {
    const groupNotes = sorted.filter(n => n.string >= stringGroup && n.string <= stringGroup + 2);
    const thirds = groupNotes.filter(n => n.interval === 3 || n.interval === 4);
    for (const third of thirds) {
      triadNotes.push(third); // 3rd in bass (1st inversion)
      const fifth = groupNotes.find(n => n.string >= third.string && n.string <= third.string + 2 && n.interval === 7 && n !== third);
      if (fifth) triadNotes.push(fifth);
      const root = groupNotes.find(n => n.string >= third.string && n.string <= third.string + 2 && n.isRoot && n !== third);
      if (root) triadNotes.push(root);
    }
  }
  return makeExercise('triads-inv1', triadNotes, sorted);
}

function generateTriadsInv2(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const triadNotes: FretboardNote[] = [];
  for (let stringGroup = 0; stringGroup < 4; stringGroup++) {
    const groupNotes = sorted.filter(n => n.string >= stringGroup && n.string <= stringGroup + 2);
    const fifths = groupNotes.filter(n => n.interval === 7);
    for (const fifth of fifths) {
      triadNotes.push(fifth); // 5th in bass (2nd inversion)
      const root = groupNotes.find(n => n.string >= fifth.string && n.string <= fifth.string + 2 && n.isRoot && n !== fifth);
      if (root) triadNotes.push(root);
      const third = groupNotes.find(n => n.string >= fifth.string && n.string <= fifth.string + 2 && (n.interval === 3 || n.interval === 4) && n !== fifth);
      if (third) triadNotes.push(third);
    }
  }
  return makeExercise('triads-inv2', triadNotes, sorted);
}

function generateArpeggios(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const arpNotes: FretboardNote[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < sorted.length; i++) {
    const root = sorted[i];
    const key = `${root.string}-${root.fret}`;
    if (seen.has(key)) continue;

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

    if (root.isRoot || i % 2 === 0) {
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

  return makeExercise('arpeggios', arpNotes, sorted);
}

function generateOctaveShapes(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const octaveNotes: FretboardNote[] = [];
  const seen = new Set<string>();
  const roots = sorted.filter(n => n.isRoot);

  for (const root of roots) {
    const rootKey = `${root.string}-${root.fret}`;
    if (seen.has(rootKey)) continue;
    seen.add(rootKey);
    octaveNotes.push(root);

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

  return makeExercise('octave-shapes', octaveNotes, sorted);
}

function generateDoubleStops(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const dsNotes: FretboardNote[] = [];
  const seen = new Set<string>();

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

  const sorted = sortNotesAscending(dedupNotes(notes));
  return makeExercise('double-stops', dsNotes, sorted);
}

function generateShellVoicings(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const shellNotes: FretboardNote[] = [];
  const seen = new Set<string>();

  // Shell voicings: Root + 3rd + 7th (or b7th)
  for (let i = 0; i < sorted.length; i++) {
    const root = sorted[i];
    if (!root.isRoot && i % 3 !== 0) continue;
    const rootKey = `${root.string}-${root.fret}`;
    if (seen.has(rootKey)) continue;

    // Find 3rd and 7th on nearby strings
    const third = sorted.find(n =>
      !seen.has(`${n.string}-${n.fret}`) &&
      n !== root &&
      (n.interval === 3 || n.interval === 4) &&
      Math.abs(n.string - root.string) <= 3 &&
      n.string > root.string
    );
    const seventh = sorted.find(n =>
      !seen.has(`${n.string}-${n.fret}`) &&
      n !== root &&
      n !== third &&
      (n.interval === 10 || n.interval === 11) &&
      Math.abs(n.string - root.string) <= 4 &&
      n.string > root.string
    );

    if (third || seventh) {
      seen.add(rootKey);
      shellNotes.push(root);
      if (third) {
        seen.add(`${third.string}-${third.fret}`);
        shellNotes.push(third);
      }
      if (seventh) {
        seen.add(`${seventh.string}-${seventh.fret}`);
        shellNotes.push(seventh);
      }
    }
  }

  return makeExercise('shell-voicings', shellNotes, sorted);
}

function generateDyads(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const dyadNotes: FretboardNote[] = [];
  const seen = new Set<string>();

  // Two-note combinations on adjacent strings
  for (let s = 0; s < 5; s++) {
    const lowerNotes = sorted.filter(n => n.string === s);
    const higherNotes = sorted.filter(n => n.string === s + 1);
    for (const ln of lowerNotes) {
      // Find closest note on next string
      const closest = higherNotes.reduce((best: FretboardNote | null, hn) => {
        if (seen.has(`${hn.string}-${hn.fret}`)) return best;
        const dist = Math.abs(hn.fret - ln.fret);
        if (!best || dist < Math.abs(best.fret - ln.fret)) return hn;
        return best;
      }, null);
      if (closest) {
        const lk = `${ln.string}-${ln.fret}`;
        const ck = `${closest.string}-${closest.fret}`;
        if (!seen.has(lk)) { seen.add(lk); dyadNotes.push(ln); }
        if (!seen.has(ck)) { seen.add(ck); dyadNotes.push(closest); }
      }
    }
  }

  return makeExercise('dyads', dyadNotes, sorted);
}

function generateChordScale(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const chordNotes: FretboardNote[] = [];
  const seen = new Set<string>();

  // Build triads from each scale degree
  const scale = SCALES[scaleId];
  if (!scale) return makeExercise('chord-scale', sorted, sorted);

  const intervals = scale.intervals;
  for (let deg = 0; deg < intervals.length; deg++) {
    const rootInterval = intervals[deg];
    const thirdInterval = intervals[(deg + 2) % intervals.length];
    const fifthInterval = intervals[(deg + 4) % intervals.length];

    const rootCandidates = sorted.filter(n => n.interval === rootInterval && !seen.has(`${n.string}-${n.fret}`));
    const thirdCandidates = sorted.filter(n => n.interval === thirdInterval && !seen.has(`${n.string}-${n.fret}`));
    const fifthCandidates = sorted.filter(n => n.interval === fifthInterval && !seen.has(`${n.string}-${n.fret}`));

    if (rootCandidates.length > 0) {
      const root = rootCandidates[0];
      seen.add(`${root.string}-${root.fret}`);
      chordNotes.push(root);

      const third = thirdCandidates.find(n => Math.abs(n.string - root.string) <= 2);
      if (third) {
        seen.add(`${third.string}-${third.fret}`);
        chordNotes.push(third);
      }
      const fifth = fifthCandidates.find(n => Math.abs(n.string - root.string) <= 3);
      if (fifth) {
        seen.add(`${fifth.string}-${fifth.fret}`);
        chordNotes.push(fifth);
      }
    }
  }

  return makeExercise('chord-scale', chordNotes, sorted);
}

function generatePowerShapes(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const powerNotes: FretboardNote[] = [];
  const seen = new Set<string>();

  // Root-5th power chord shapes
  const roots = sorted.filter(n => n.isRoot);
  for (const root of roots) {
    const rootKey = `${root.string}-${root.fret}`;
    if (seen.has(rootKey)) continue;

    // Find 5th on adjacent lower-pitch string (string-1)
    const fifth = sorted.find(n =>
      n.interval === 7 &&
      (n.string === root.string - 1 || n.string === root.string + 1) &&
      !seen.has(`${n.string}-${n.fret}`) &&
      Math.abs(n.fret - root.fret) <= 3
    );

    seen.add(rootKey);
    powerNotes.push(root);
    if (fifth) {
      seen.add(`${fifth.string}-${fifth.fret}`);
      powerNotes.push(fifth);
    }
  }

  return makeExercise('power-shapes', powerNotes, sorted);
}

// ─── TECHNIQUE GENERATORS ───

function generateStringSkip(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
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
  return makeExercise('string-skip', skipNotes, sorted);
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
  const sorted = sortNotesAscending(dedupNotes(notes));
  return makeExercise('lateral-run', lateralNotes, sorted);
}

function generateDiagonal(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
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
  return makeExercise('diagonal', diagNotes, sorted);
}

function generatePositionShift(key: NoteName, scaleId: string): Exercise {
  const positions = getCAGEDPositions(key, scaleId);
  const shiftNotes: FretboardNote[] = [];
  for (const pos of positions) {
    const posNotes = getScaleInPosition(key, scaleId, pos);
    shiftNotes.push(...sortNotesAscending(posNotes).slice(0, 4));
  }
  const allNotes = getScaleOnFretboard(key, scaleId, 0, FRET_COUNT);
  const sorted = sortNotesAscending(dedupNotes(allNotes));
  return makeExercise('position-shift', shiftNotes, sorted);
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
  const sorted = sortNotesAscending(dedupNotes(notes));
  return makeExercise('pentatonic-run', runNotes, sorted);
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
  const sorted = sortNotesAscending(dedupNotes(notes));
  return makeExercise('economy-picking', econNotes, sorted);
}

function generateSpiderWalk(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const byString: Map<number, FretboardNote[]> = new Map();
  for (const note of notes) {
    if (!byString.has(note.string)) byString.set(note.string, []);
    byString.get(note.string)!.push(note);
  }
  const spiderNotes: FretboardNote[] = [];

  for (let stringIdx = 5; stringIdx >= 0; stringIdx--) {
    const stringNotes = byString.get(stringIdx);
    if (stringNotes) {
      const sorted = [...stringNotes].sort((a, b) => a.fret - b.fret).slice(0, 4);
      spiderNotes.push(...sorted);
    }
  }
  for (let stringIdx = 0; stringIdx <= 5; stringIdx++) {
    const stringNotes = byString.get(stringIdx);
    if (stringNotes) {
      const sorted = [...stringNotes].sort((a, b) => b.fret - a.fret).slice(0, 4);
      spiderNotes.push(...sorted);
    }
  }

  const allSorted = sortNotesAscending(dedupNotes(notes));
  return makeExercise('spider-walk', spiderNotes, allSorted);
}

function generateIntervalJump(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  if (sorted.length < 4) {
    return makeExercise('interval-jump', sorted, sorted);
  }

  const mid = Math.floor(sorted.length / 2);
  const patterns = [
    0, sorted.length - 1,
    1, sorted.length - 2,
    mid, 0,
    mid + 1, sorted.length - 1,
    mid - 1, 1,
    sorted.length - 1, mid,
    0, mid + 1,
  ];

  const jumpNotes: FretboardNote[] = [];
  const seen = new Set<number>();
  for (const idx of patterns) {
    if (idx >= 0 && idx < sorted.length && !seen.has(idx)) {
      seen.add(idx);
      jumpNotes.push(sorted[idx]);
    }
  }
  for (let i = 0; i < sorted.length; i++) {
    if (!seen.has(i)) {
      seen.add(i);
      jumpNotes.push(sorted[i]);
    }
  }

  return makeExercise('interval-jump', jumpNotes, sorted);
}

function generateHammerPull(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const byString: Map<number, FretboardNote[]> = new Map();
  for (const note of notes) {
    if (!byString.has(note.string)) byString.set(note.string, []);
    byString.get(note.string)!.push(note);
  }

  const hpNotes: FretboardNote[] = [];
  for (let stringIdx = 5; stringIdx >= 0; stringIdx--) {
    const stringNotes = byString.get(stringIdx);
    if (stringNotes && stringNotes.length >= 2) {
      const sorted = [...stringNotes].sort((a, b) => a.fret - b.fret);
      // Hammer-on: low to high
      hpNotes.push(sorted[0]);
      hpNotes.push(sorted[1]);
      // Pull-off: high to low
      hpNotes.push(sorted[1]);
      hpNotes.push(sorted[0]);
    }
  }

  const allSorted = sortNotesAscending(dedupNotes(notes));
  return makeExercise('hammer-pull', hpNotes, allSorted);
}

function generateSlideExercise(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const byString: Map<number, FretboardNote[]> = new Map();
  for (const note of notes) {
    if (!byString.has(note.string)) byString.set(note.string, []);
    byString.get(note.string)!.push(note);
  }

  const slideNotes: FretboardNote[] = [];
  for (let stringIdx = 5; stringIdx >= 0; stringIdx--) {
    const stringNotes = byString.get(stringIdx);
    if (stringNotes && stringNotes.length >= 2) {
      const sorted = [...stringNotes].sort((a, b) => a.fret - b.fret);
      // Slide up from lowest to highest on this string
      slideNotes.push(sorted[0]);
      slideNotes.push(sorted[sorted.length - 1]);
      // Slide back down
      slideNotes.push(sorted[sorted.length - 1]);
      slideNotes.push(sorted[0]);
    }
  }

  const allSorted = sortNotesAscending(dedupNotes(notes));
  return makeExercise('slide-exercise', slideNotes, allSorted);
}

function generateCrossString(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const byString: Map<number, FretboardNote[]> = new Map();
  for (const note of notes) {
    if (!byString.has(note.string)) byString.set(note.string, []);
    byString.get(note.string)!.push(note);
  }

  const crossNotes: FretboardNote[] = [];
  // Alternate between adjacent strings: high E one note, B one note, etc.
  for (let stringIdx = 5; stringIdx >= 1; stringIdx--) {
    const currentStringNotes = byString.get(stringIdx);
    const nextStringNotes = byString.get(stringIdx - 1);
    if (currentStringNotes && nextStringNotes) {
      const cSorted = [...currentStringNotes].sort((a, b) => a.fret - b.fret);
      const nSorted = [...nextStringNotes].sort((a, b) => a.fret - b.fret);
      // Pick one note from each string alternately
      const maxLen = Math.min(cSorted.length, nSorted.length, 3);
      for (let i = 0; i < maxLen; i++) {
        crossNotes.push(cSorted[i]);
        if (i < nSorted.length) crossNotes.push(nSorted[i]);
      }
    }
  }

  const allSorted = sortNotesAscending(dedupNotes(notes));
  return makeExercise('cross-string', crossNotes, allSorted);
}

function generateSpeedBurst(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  if (sorted.length < 4) {
    return makeExercise('speed-burst', sorted, sorted);
  }

  const burstNotes: FretboardNote[] = [];
  // Repeat groups of 4 notes as bursts
  for (let i = 0; i <= sorted.length - 4; i += 2) {
    // Burst pattern: play 4 notes, repeat them
    for (let rep = 0; rep < 2; rep++) {
      for (let j = 0; j < 4 && (i + j) < sorted.length; j++) {
        burstNotes.push(sorted[i + j]);
      }
    }
  }

  return makeExercise('speed-burst', burstNotes, sorted);
}

// ─── CONNECTION GENERATORS ───

function generateConnecting(key: NoteName, scaleId: string): Exercise {
  const positions = getCAGEDPositions(key, scaleId);
  const connectNotes: FretboardNote[] = [];
  for (let i = 0; i < positions.length - 1; i++) {
    const pos1 = getScaleInPosition(key, scaleId, positions[i]);
    const overlapFret = positions[i].fretEnd;
    const transitionNotes = pos1.filter(n => n.fret >= overlapFret - 1);
    connectNotes.push(...sortNotesAscending(transitionNotes).slice(0, 4));
  }
  const allNotes = getScaleOnFretboard(key, scaleId, 0, FRET_COUNT);
  const sorted = sortNotesAscending(dedupNotes(allNotes));
  return makeExercise('connecting', connectNotes, sorted);
}

function generatePositionSweep(key: NoteName, scaleId: string): Exercise {
  const positions = getCAGEDPositions(key, scaleId);
  const sweepNotes: FretboardNote[] = [];

  // Sweep through all positions: play ascending in pos 1, transition to pos 2, etc.
  for (let i = 0; i < positions.length; i++) {
    const posNotes = getScaleInPosition(key, scaleId, positions[i]);
    const sorted = sortNotesAscending(posNotes);
    sweepNotes.push(...sorted.slice(0, 5));
  }

  const allNotes = getScaleOnFretboard(key, scaleId, 0, FRET_COUNT);
  const sorted = sortNotesAscending(dedupNotes(allNotes));
  return makeExercise('position-sweep', sweepNotes, sorted);
}

function generateCagedCycle(key: NoteName, scaleId: string): Exercise {
  const positions = getCAGEDPositions(key, scaleId);
  const cycleNotes: FretboardNote[] = [];

  // Play through each CAGED shape: find root note in each position, then play shape
  for (const pos of positions) {
    const posNotes = getScaleInPosition(key, scaleId, pos);
    const roots = posNotes.filter(n => n.isRoot);
    if (roots.length > 0) {
      // Play the full shape starting from root
      const shapeNotes = sortNotesAscending(posNotes);
      const rootIdx = shapeNotes.findIndex(n => n.string === roots[0].string && n.fret === roots[0].fret);
      // Play from root to the end, then beginning to root
      cycleNotes.push(...shapeNotes.slice(rootIdx));
      if (rootIdx > 0) {
        cycleNotes.push(...shapeNotes.slice(0, rootIdx));
      }
    }
  }

  const allNotes = getScaleOnFretboard(key, scaleId, 0, FRET_COUNT);
  const sorted = sortNotesAscending(dedupNotes(allNotes));
  return makeExercise('caged-cycle', cycleNotes, sorted);
}

function generateCagedRun(key: NoteName, scaleId: string): Exercise {
  const positions = getCAGEDPositions(key, scaleId);
  const runNotes: FretboardNote[] = [];

  // Connect positions: play top notes of one position, transition to bottom of next
  for (let i = 0; i < positions.length; i++) {
    const posNotes = getScaleInPosition(key, scaleId, positions[i]);
    const sorted = sortNotesAscending(posNotes);
    // Take a few notes from each position
    if (i === 0) {
      runNotes.push(...sorted);
    } else {
      // Skip notes that overlap with previous position
      const prevEndFret = positions[i - 1].fretEnd;
      const newNotes = sorted.filter(n => n.fret >= prevEndFret - 1);
      runNotes.push(...newNotes);
    }
  }

  const allNotes = getScaleOnFretboard(key, scaleId, 0, FRET_COUNT);
  const sorted = sortNotesAscending(dedupNotes(allNotes));
  return makeExercise('caged-run', runNotes, sorted);
}

// ─── INTERVAL GENERATORS ───

// These use the parameterized generateIntervalN above

// ─── ARPEGGIO GENERATORS ───

function generateArpSweep(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const sweepNotes: FretboardNote[] = [];
  const seen = new Set<string>();

  // Build sweep arpeggio: one note per string going down, then up
  const byString: Map<number, FretboardNote[]> = new Map();
  for (const note of sorted) {
    if (!byString.has(note.string)) byString.set(note.string, []);
    byString.get(note.string)!.push(note);
  }

  // Ascending sweep
  for (let stringIdx = 5; stringIdx >= 0; stringIdx--) {
    const stringNotes = byString.get(stringIdx);
    if (stringNotes) {
      const lowest = [...stringNotes].sort((a, b) => a.fret - b.fret)[0];
      const k = `${lowest.string}-${lowest.fret}`;
      if (!seen.has(k)) {
        seen.add(k);
        sweepNotes.push(lowest);
      }
    }
  }
  // Descending sweep
  for (let stringIdx = 0; stringIdx <= 5; stringIdx++) {
    const stringNotes = byString.get(stringIdx);
    if (stringNotes) {
      const lowest = [...stringNotes].sort((a, b) => a.fret - b.fret)[0];
      const k = `${lowest.string}-${lowest.fret}`;
      if (!seen.has(k)) {
        seen.add(k);
        sweepNotes.push(lowest);
      }
    }
  }

  return makeExercise('arp-sweep', sweepNotes, sorted);
}

function generateArpStringSkip(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const arpNotes: FretboardNote[] = [];

  // String-skipped arpeggio: play on strings 5, 3, 1 then 4, 2, 0
  const skipPattern = [[5, 3, 1], [4, 2, 0]];
  for (const group of skipPattern) {
    for (const stringIdx of group) {
      const stringNotes = sorted.filter(n => n.string === stringIdx);
      if (stringNotes.length > 0) {
        // Pick note closest to current position
        const lowest = [...stringNotes].sort((a, b) => a.fret - b.fret)[0];
        arpNotes.push(lowest);
      }
    }
  }

  return makeExercise('arp-string-skip', arpNotes, sorted);
}

function generateArpTriadUp(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const arpNotes: FretboardNote[] = [];

  // Triad arpeggio ascending through each scale degree
  const scale = SCALES[scaleId];
  if (!scale) return makeExercise('arp-triad-up', sorted, sorted);

  for (let deg = 0; deg < scale.intervals.length; deg++) {
    const rootInterval = scale.intervals[deg];
    const thirdInterval = scale.intervals[(deg + 2) % scale.intervals.length];
    const fifthInterval = scale.intervals[(deg + 4) % scale.intervals.length];

    const root = sorted.find(n => n.interval === rootInterval && !arpNotes.includes(n));
    const third = sorted.find(n => n.interval === thirdInterval && n !== root && !arpNotes.includes(n));
    const fifth = sorted.find(n => n.interval === fifthInterval && n !== root && n !== third && !arpNotes.includes(n));

    if (root) arpNotes.push(root);
    if (third) arpNotes.push(third);
    if (fifth) arpNotes.push(fifth);
  }

  return makeExercise('arp-triad-up', arpNotes, sorted);
}

function generateArpSeventh(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const arpNotes: FretboardNote[] = [];

  const scale = SCALES[scaleId];
  if (!scale) return makeExercise('arp-seventh', sorted, sorted);

  // 7th chord arpeggio: root, 3rd, 5th, 7th
  const rootInterval = scale.intervals[0];
  const thirdInterval = scale.intervals[2 % scale.intervals.length];
  const fifthInterval = scale.intervals[4 % scale.intervals.length];
  const seventhInterval = scale.intervals[6 % scale.intervals.length];

  const root = sorted.find(n => n.interval === rootInterval);
  const third = sorted.find(n => n.interval === thirdInterval && n !== root);
  const fifth = sorted.find(n => n.interval === fifthInterval && n !== root && n !== third);
  const seventh = sorted.find(n => n.interval === seventhInterval && n !== root && n !== third && n !== fifth);

  if (root) arpNotes.push(root);
  if (third) arpNotes.push(third);
  if (fifth) arpNotes.push(fifth);
  if (seventh) arpNotes.push(seventh);

  // Also find them an octave higher
  const rootOct = sorted.find(n => n.interval === rootInterval && n !== root && (5 - n.string) * 5 + n.fret > (5 - (root?.string ?? 0)) * 5 + (root?.fret ?? 0));
  if (rootOct) arpNotes.push(rootOct);

  return makeExercise('arp-seventh', arpNotes, sorted);
}

function generateArpInverted(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const arpNotes: FretboardNote[] = [];

  const scale = SCALES[scaleId];
  if (!scale) return makeExercise('arp-inverted', sorted, sorted);

  // Inverted arpeggio: 3rd, 5th, Root (1st inversion pattern)
  const rootInterval = scale.intervals[0];
  const thirdInterval = scale.intervals[2 % scale.intervals.length];
  const fifthInterval = scale.intervals[4 % scale.intervals.length];

  const third = sorted.find(n => n.interval === thirdInterval);
  const fifth = sorted.find(n => n.interval === fifthInterval && n !== third);
  const root = sorted.find(n => n.interval === rootInterval && (5 - n.string) * 5 + n.fret > (5 - (fifth?.string ?? 0)) * 5 + (fifth?.fret ?? 0));

  if (third) arpNotes.push(third);
  if (fifth) arpNotes.push(fifth);
  if (root) arpNotes.push(root);

  // 2nd inversion: 5th, Root, 3rd
  const root2 = sorted.find(n => n.interval === rootInterval);
  const third2 = sorted.find(n => n.interval === thirdInterval && n !== root2 && (5 - n.string) * 5 + n.fret > (5 - (root2?.string ?? 0)) * 5 + (root2?.fret ?? 0));
  const fifth2 = sorted.find(n => n.interval === fifthInterval && (5 - n.string) * 5 + n.fret > (5 - (third2?.string ?? 0)) * 5 + (third2?.fret ?? 0));

  if (root2) arpNotes.push(root2);
  if (fifth2) arpNotes.push(fifth2);
  if (third2) arpNotes.push(third2);

  return makeExercise('arp-inverted', arpNotes, sorted);
}

function generateArpConnect(key: NoteName, scaleId: string): Exercise {
  const positions = getCAGEDPositions(key, scaleId);
  const connectNotes: FretboardNote[] = [];

  // Connect arpeggio shapes: play root-triad in each position
  for (const pos of positions) {
    const posNotes = getScaleInPosition(key, scaleId, pos);
    const sorted = sortNotesAscending(posNotes);
    const root = sorted.find(n => n.isRoot);
    const third = sorted.find(n => (n.interval === 3 || n.interval === 4) && n !== root);
    const fifth = sorted.find(n => n.interval === 7 && n !== root && n !== third);

    if (root) connectNotes.push(root);
    if (third) connectNotes.push(third);
    if (fifth) connectNotes.push(fifth);
  }

  const allNotes = getScaleOnFretboard(key, scaleId, 0, FRET_COUNT);
  const sorted = sortNotesAscending(dedupNotes(allNotes));
  return makeExercise('arp-connect', connectNotes, sorted);
}

// ─── WARMUP GENERATORS ───

function generateChromaticWarmup(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const warmupNotes: FretboardNote[] = [];
  const rootIndex = NOTES.indexOf(key);

  // 1-2-3-4 chromatic pattern on each string
  for (let stringIdx = 5; stringIdx >= 0; stringIdx--) {
    const openNote = STRING_OPEN_NOTES[stringIdx];
    const openIdx = NOTES.indexOf(openNote);
    const startOnFret = Math.max(startFret, 1);
    for (let fret = startOnFret; fret <= Math.min(endFret - 3, startFret + 4); fret++) {
      for (let offset = 0; offset < 4; offset++) {
        const f = fret + offset;
        if (f > endFret) break;
        const noteIdx = (openIdx + f) % 12;
        const intervalFromRoot = (noteIdx - rootIndex + 12) % 12;
        warmupNotes.push({
          string: stringIdx,
          fret: f,
          note: NOTES[noteIdx],
          interval: intervalFromRoot,
          intervalLabel: intervalFromRoot === 0 ? 'R' : `${intervalFromRoot}`,
          isRoot: intervalFromRoot === 0,
        });
      }
    }
  }

  // Fallback if too few notes
  if (warmupNotes.length < 4) {
    const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
    return makeExercise('chromatic-warmup', sortNotesAscending(dedupNotes(notes)), sortNotesAscending(dedupNotes(notes)));
  }

  return makeExercise('chromatic-warmup', warmupNotes, warmupNotes);
}

function generateSpiderWarmup(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const rootIndex = NOTES.indexOf(key);
  const warmupNotes: FretboardNote[] = [];

  // Spider pattern: 1-2-1-3-1-4 on each string
  for (let stringIdx = 5; stringIdx >= 0; stringIdx--) {
    const openNote = STRING_OPEN_NOTES[stringIdx];
    const openIdx = NOTES.indexOf(openNote);
    const baseFret = Math.max(startFret, 1);

    for (let base = baseFret; base <= Math.min(endFret - 3, baseFret + 4); base += 4) {
      const offsets = [0, 1, 0, 2, 0, 3];
      for (const offset of offsets) {
        const f = base + offset;
        if (f > endFret) break;
        const noteIdx = (openIdx + f) % 12;
        const intervalFromRoot = (noteIdx - rootIndex + 12) % 12;
        warmupNotes.push({
          string: stringIdx,
          fret: f,
          note: NOTES[noteIdx],
          interval: intervalFromRoot,
          intervalLabel: intervalFromRoot === 0 ? 'R' : `${intervalFromRoot}`,
          isRoot: intervalFromRoot === 0,
        });
      }
    }
  }

  if (warmupNotes.length < 4) {
    const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
    return makeExercise('spider-warmup', sortNotesAscending(dedupNotes(notes)), sortNotesAscending(dedupNotes(notes)));
  }

  return makeExercise('spider-warmup', warmupNotes, warmupNotes);
}

function generateFingerGym(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const rootIndex = NOTES.indexOf(key);
  const gymNotes: FretboardNote[] = [];

  // Finger independence: different finger combinations on each string
  const patterns = [
    [1, 2, 3, 4],
    [1, 3, 2, 4],
    [4, 3, 2, 1],
    [1, 4, 2, 3],
  ];

  for (let stringIdx = 5; stringIdx >= 0; stringIdx--) {
    const openNote = STRING_OPEN_NOTES[stringIdx];
    const openIdx = NOTES.indexOf(openNote);
    const baseFret = Math.max(startFret, 1);

    for (const pattern of patterns) {
      for (const finger of pattern) {
        const f = baseFret + finger - 1;
        if (f > endFret) continue;
        const noteIdx = (openIdx + f) % 12;
        const intervalFromRoot = (noteIdx - rootIndex + 12) % 12;
        gymNotes.push({
          string: stringIdx,
          fret: f,
          note: NOTES[noteIdx],
          interval: intervalFromRoot,
          intervalLabel: intervalFromRoot === 0 ? 'R' : `${intervalFromRoot}`,
          isRoot: intervalFromRoot === 0,
        });
      }
    }
  }

  if (gymNotes.length < 4) {
    const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
    return makeExercise('finger-gym', sortNotesAscending(dedupNotes(notes)), sortNotesAscending(dedupNotes(notes)));
  }

  return makeExercise('finger-gym', gymNotes, gymNotes);
}

function generateStringCrossWarmup(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const rootIndex = NOTES.indexOf(key);
  const warmupNotes: FretboardNote[] = [];

  // String crossing: play same fret on adjacent strings
  const baseFret = Math.max(startFret, 1);

  for (let fret = baseFret; fret <= Math.min(endFret, baseFret + 5); fret++) {
    // Ascending strings
    for (let stringIdx = 5; stringIdx >= 1; stringIdx--) {
      const openNote = STRING_OPEN_NOTES[stringIdx];
      const openIdx = NOTES.indexOf(openNote);
      const noteIdx = (openIdx + fret) % 12;
      const intervalFromRoot = (noteIdx - rootIndex + 12) % 12;
      warmupNotes.push({
        string: stringIdx,
        fret,
        note: NOTES[noteIdx],
        interval: intervalFromRoot,
        intervalLabel: intervalFromRoot === 0 ? 'R' : `${intervalFromRoot}`,
        isRoot: intervalFromRoot === 0,
      });
    }
    // Descending strings
    for (let stringIdx = 0; stringIdx <= 5; stringIdx++) {
      const openNote = STRING_OPEN_NOTES[stringIdx];
      const openIdx = NOTES.indexOf(openNote);
      const noteIdx = (openIdx + fret) % 12;
      const intervalFromRoot = (noteIdx - rootIndex + 12) % 12;
      warmupNotes.push({
        string: stringIdx,
        fret,
        note: NOTES[noteIdx],
        interval: intervalFromRoot,
        intervalLabel: intervalFromRoot === 0 ? 'R' : `${intervalFromRoot}`,
        isRoot: intervalFromRoot === 0,
      });
    }
  }

  if (warmupNotes.length < 4) {
    const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
    return makeExercise('string-cross-warmup', sortNotesAscending(dedupNotes(notes)), sortNotesAscending(dedupNotes(notes)));
  }

  return makeExercise('string-cross-warmup', warmupNotes, warmupNotes);
}

// ─── RHYTHM GENERATORS ───

function generateRhythmSubdivisions(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const rhythmNotes: FretboardNote[] = [];
  for (const note of sorted) {
    rhythmNotes.push(note); // Quarter
    rhythmNotes.push(note); rhythmNotes.push(note); // Eighths
    rhythmNotes.push(note); rhythmNotes.push(note); rhythmNotes.push(note); rhythmNotes.push(note); // Sixteenths
  }
  return makeExercise('rhythm-subdivisions', rhythmNotes, sorted);
}

function generateRhythmSyncopation(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const syncNotes: FretboardNote[] = [];
  for (let i = 1; i < sorted.length; i += 2) {
    syncNotes.push(sorted[i]);
    if (i + 1 < sorted.length) syncNotes.push(sorted[i + 1]);
  }
  if (sorted.length > 0) syncNotes.unshift(sorted[0]);
  return makeExercise('rhythm-syncopation', syncNotes.length >= 3 ? syncNotes : sorted, sorted);
}

function generateRhythmRest(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const restNotes: FretboardNote[] = [];
  for (let i = 0; i < sorted.length; i += 2) {
    restNotes.push(sorted[i]);
  }
  return makeExercise('rhythm-rest', restNotes, sorted);
}

function generateRhythmAccent(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const accentNotes: FretboardNote[] = [];
  for (let i = 0; i < sorted.length; i++) {
    accentNotes.push(sorted[i]);
    if (i % 3 === 0) accentNotes.push(sorted[i]);
  }
  return makeExercise('rhythm-accent', accentNotes, sorted);
}

function generateRhythmSwing(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const swingNotes: FretboardNote[] = [];
  for (let i = 0; i < sorted.length - 1; i += 2) {
    swingNotes.push(sorted[i]);
    swingNotes.push(sorted[i]);
    swingNotes.push(sorted[i + 1]);
  }
  if (sorted.length % 2 === 1 && sorted.length > 0) swingNotes.push(sorted[sorted.length - 1]);
  return makeExercise('rhythm-swing', swingNotes, sorted);
}

function generateRhythmTied(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const tiedNotes: FretboardNote[] = [];
  for (let i = 0; i < sorted.length; i++) {
    tiedNotes.push(sorted[i]);
    if (i % 4 === 0) tiedNotes.push(sorted[i]);
  }
  return makeExercise('rhythm-tied', tiedNotes, sorted);
}

// ─── BENDING & EXPRESSION GENERATORS ───

function generateBendUnison(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const bendNotes: FretboardNote[] = [];
  for (let s = 0; s < 5; s++) {
    const lowerNotes = sorted.filter(n => n.string === s);
    const higherNotes = sorted.filter(n => n.string === s + 1);
    for (const ln of lowerNotes) {
      const target = higherNotes.find(hn => Math.abs(hn.fret - ln.fret) <= 2 && hn.fret > ln.fret);
      if (target) {
        bendNotes.push(ln);
        bendNotes.push(target);
      }
    }
  }
  return makeExercise('bend-unison', bendNotes, sorted);
}

function generateBendHalf(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const bendNotes: FretboardNote[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i + 1].fret - sorted[i].fret === 1 && sorted[i].string === sorted[i + 1].string) {
      bendNotes.push(sorted[i]);
      bendNotes.push(sorted[i + 1]);
    }
  }
  return makeExercise('bend-half', bendNotes.length >= 3 ? bendNotes : sorted, sorted);
}

function generateBendFull(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const bendNotes: FretboardNote[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const target = sorted.find(n => n.string === sorted[i].string && n.fret === sorted[i].fret + 2);
    if (target) {
      bendNotes.push(sorted[i]);
      bendNotes.push(target);
    }
  }
  return makeExercise('bend-full', bendNotes.length >= 3 ? bendNotes : sorted, sorted);
}

function generateBendPre(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const bendNotes: FretboardNote[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const lower = sorted.find(n => n.string === sorted[i].string && n.fret === sorted[i].fret - 2);
    if (lower) {
      bendNotes.push(sorted[i]);
      bendNotes.push(lower);
    }
  }
  return makeExercise('bend-pre', bendNotes.length >= 3 ? bendNotes : sorted, sorted);
}

function generateVibratoControl(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const vibNotes: FretboardNote[] = [];
  for (const note of sorted) {
    vibNotes.push(note);
    vibNotes.push(note);
    vibNotes.push(note);
  }
  return makeExercise('vibrato-control', vibNotes, sorted);
}

// ─── TAPPING GENERATORS ───

function generateTapBasic(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const tapNotes: FretboardNote[] = [];
  const byString: Map<number, FretboardNote[]> = new Map();
  for (const note of sorted) {
    if (!byString.has(note.string)) byString.set(note.string, []);
    byString.get(note.string)!.push(note);
  }
  for (let s = 5; s >= 0; s--) {
    const stringNotes = byString.get(s);
    if (stringNotes && stringNotes.length >= 3) {
      const sSorted = [...stringNotes].sort((a, b) => a.fret - b.fret);
      tapNotes.push(sSorted[sSorted.length - 1]);
      tapNotes.push(sSorted[1]);
      tapNotes.push(sSorted[0]);
    }
  }
  return makeExercise('tap-basic', tapNotes, sorted);
}

function generateTapArpeggio(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const tapNotes: FretboardNote[] = [];
  const byString: Map<number, FretboardNote> = new Map();
  for (const note of sorted) {
    if (!byString.has(note.string)) byString.set(note.string, note);
    else {
      if (note.isRoot || note.interval === 7 || note.interval === 3 || note.interval === 4) {
        byString.set(note.string, note);
      }
    }
  }
  for (let s = 5; s >= 0; s--) {
    const n = byString.get(s);
    if (n) tapNotes.push(n);
  }
  for (let s = 0; s <= 5; s++) {
    const n = byString.get(s);
    if (n) tapNotes.push(n);
  }
  return makeExercise('tap-arpeggio', tapNotes, sorted);
}

function generateTapScale(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const tapNotes: FretboardNote[] = [];
  const byString: Map<number, FretboardNote[]> = new Map();
  for (const note of sorted) {
    if (!byString.has(note.string)) byString.set(note.string, []);
    byString.get(note.string)!.push(note);
  }
  for (let s = 5; s >= 0; s--) {
    const stringNotes = byString.get(s);
    if (stringNotes) {
      const sSorted = [...stringNotes].sort((a, b) => b.fret - a.fret);
      tapNotes.push(...sSorted);
    }
  }
  return makeExercise('tap-scale', tapNotes, sorted);
}

function generateTapHarmonic(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const harmNotes: FretboardNote[] = [];
  for (const note of sorted) {
    if (note.fret + 12 <= endFret) {
      harmNotes.push(note);
      harmNotes.push({ ...note, fret: note.fret + 12, interval: (note.interval + 0) % 12, isRoot: note.isRoot });
    }
  }
  return makeExercise('tap-harmonic', harmNotes, sorted);
}

// ─── HARMONICS GENERATORS ───

function generateHarmonicsNatural(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const harmNotes: FretboardNote[] = [];
  const rootIndex = NOTES.indexOf(key);
  const harmonicFrets = [5, 7, 12];
  for (let s = 5; s >= 0; s--) {
    const openNote = STRING_OPEN_NOTES[s];
    const openIdx = NOTES.indexOf(openNote);
    for (const fret of harmonicFrets) {
      if (fret >= startFret && fret <= endFret) {
        let noteIdx: number;
        if (fret === 12) noteIdx = openIdx;
        else if (fret === 7) noteIdx = (openIdx + 7) % 12;
        else if (fret === 5) noteIdx = (openIdx + 7) % 12;
        else noteIdx = (openIdx + fret) % 12;
        const intervalFromRoot = (noteIdx - rootIndex + 12) % 12;
        harmNotes.push({
          string: s,
          fret,
          note: NOTES[noteIdx],
          interval: intervalFromRoot,
          intervalLabel: intervalFromRoot === 0 ? 'R' : `${intervalFromRoot}`,
          isRoot: intervalFromRoot === 0,
        });
      }
    }
  }
  const allNotes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(allNotes));
  return makeExercise('harmonics-natural', harmNotes.length >= 3 ? harmNotes : sorted, sorted);
}

function generateHarmonicsArtificial(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const harmNotes: FretboardNote[] = [];
  for (const note of sorted) {
    if (note.fret + 12 <= endFret) {
      harmNotes.push(note);
    }
  }
  return makeExercise('harmonics-artificial', harmNotes.length >= 3 ? harmNotes : sorted, sorted);
}

function generateHarmonicsPinch(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const pinchNotes = sorted.filter(n => n.isRoot || n.interval === 7 || n.interval === 3 || n.interval === 4);
  return makeExercise('harmonics-pinch', pinchNotes.length >= 3 ? pinchNotes : sorted, sorted);
}

// ─── EXTENDED SEQUENCE GENERATORS ───

function generateEnclosure(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const encNotes: FretboardNote[] = [];
  for (let i = 1; i < sorted.length - 1; i++) {
    encNotes.push(sorted[i + 1]);
    encNotes.push(sorted[i - 1]);
    encNotes.push(sorted[i]);
  }
  return makeExercise('enclosure', encNotes, sorted);
}

function generateBebopScale(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const bebopNotes: FretboardNote[] = [];
  const rootIndex = NOTES.indexOf(key);
  for (let i = 0; i < sorted.length; i++) {
    bebopNotes.push(sorted[i]);
    if (i < sorted.length - 1 && sorted[i + 1].fret - sorted[i].fret > 2 && sorted[i].string === sorted[i + 1].string) {
      const passingFret = sorted[i].fret + 1;
      const openNote = STRING_OPEN_NOTES[sorted[i].string];
      const openIdx = NOTES.indexOf(openNote);
      const noteIdx = (openIdx + passingFret) % 12;
      const intervalFromRoot = (noteIdx - rootIndex + 12) % 12;
      bebopNotes.push({
        string: sorted[i].string,
        fret: passingFret,
        note: NOTES[noteIdx],
        interval: intervalFromRoot,
        intervalLabel: 'P',
        isRoot: false,
      });
    }
  }
  return makeExercise('bebop-scale', bebopNotes, sorted);
}

function generateCycleOf4ths(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const cycleNotes: FretboardNote[] = [];
  const cycle = [0, 5, 10, 3, 8, 1, 6, 11, 4, 9, 2, 7];
  for (const interval of cycle) {
    const matching = sorted.filter(n => n.interval === interval);
    if (matching.length > 0) cycleNotes.push(matching[0]);
  }
  return makeExercise('cycle-of-4ths', cycleNotes, sorted);
}

function generateCycleOf5ths(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const cycleNotes: FretboardNote[] = [];
  const cycle = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];
  for (const interval of cycle) {
    const matching = sorted.filter(n => n.interval === interval);
    if (matching.length > 0) cycleNotes.push(matching[0]);
  }
  return makeExercise('cycle-of-5ths', cycleNotes, sorted);
}

function generateChromaticEnclosure(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const encNotes: FretboardNote[] = [];
  const rootIndex = NOTES.indexOf(key);
  for (const note of sorted) {
    const aboveFret = note.fret + 1;
    const aboveOpen = STRING_OPEN_NOTES[note.string];
    const aboveIdx = (NOTES.indexOf(aboveOpen) + aboveFret) % 12;
    const aboveInterval = (aboveIdx - rootIndex + 12) % 12;
    encNotes.push({
      string: note.string, fret: aboveFret, note: NOTES[aboveIdx],
      interval: aboveInterval, intervalLabel: 'ch', isRoot: false,
    });
    const belowFret = Math.max(0, note.fret - 1);
    const belowOpen = STRING_OPEN_NOTES[note.string];
    const belowIdx = (NOTES.indexOf(belowOpen) + belowFret) % 12;
    const belowInterval = (belowIdx - rootIndex + 12) % 12;
    encNotes.push({
      string: note.string, fret: belowFret, note: NOTES[belowIdx],
      interval: belowInterval, intervalLabel: 'cl', isRoot: false,
    });
    encNotes.push(note);
  }
  return makeExercise('chromatic-enclosure', encNotes, sorted);
}

// ─── EXTENDED SCALE RUN GENERATORS ───

function generateScale3NPS(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const byString: Map<number, FretboardNote[]> = new Map();
  for (const note of notes) {
    if (!byString.has(note.string)) byString.set(note.string, []);
    byString.get(note.string)!.push(note);
  }
  const npsNotes: FretboardNote[] = [];
  for (let s = 5; s >= 0; s--) {
    const stringNotes = byString.get(s);
    if (stringNotes) {
      const sSorted = [...stringNotes].sort((a, b) => a.fret - b.fret);
      npsNotes.push(...sSorted.slice(0, 3));
    }
  }
  const sorted = sortNotesAscending(dedupNotes(notes));
  return makeExercise('scale-3nps', npsNotes, sorted);
}

function generateScaleSingleString(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const stringCounts = new Map<number, number>();
  for (const n of sorted) stringCounts.set(n.string, (stringCounts.get(n.string) || 0) + 1);
  let bestString = 1;
  let maxCount = 0;
  stringCounts.forEach((count, str) => { if (count > maxCount) { maxCount = count; bestString = str; } });
  const singleStringNotes = sorted.filter(n => n.string === bestString);
  return makeExercise('scale-single-string', singleStringNotes, sorted);
}

function generateScaleZigzag(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const zigNotes: FretboardNote[] = [];
  let i = 0;
  const seen = new Set<number>();
  while (i < sorted.length) {
    if (i < sorted.length) { zigNotes.push(sorted[i]); seen.add(i); }
    if (i + 1 < sorted.length) { zigNotes.push(sorted[i + 1]); seen.add(i + 1); }
    if (i > 0 && !seen.has(i - 1)) { zigNotes.push(sorted[i - 1]); seen.add(i - 1); }
    i += 2;
  }
  return makeExercise('scale-zigzag', zigNotes, sorted);
}

function generateScaleWideSkip(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const skipNotes: FretboardNote[] = [];
  const mid = Math.floor(sorted.length / 2);
  for (let i = 0; i < mid; i++) {
    skipNotes.push(sorted[i]);
    if (i + mid < sorted.length) skipNotes.push(sorted[i + mid]);
  }
  return makeExercise('scale-wide-skip', skipNotes, sorted);
}

function generateScaleChromaticPassing(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const chromNotes: FretboardNote[] = [];
  const rootIndex = NOTES.indexOf(key);
  for (let i = 0; i < sorted.length; i++) {
    chromNotes.push(sorted[i]);
    if (i < sorted.length - 1 && sorted[i].string === sorted[i + 1].string && sorted[i + 1].fret - sorted[i].fret > 1) {
      for (let f = sorted[i].fret + 1; f < sorted[i + 1].fret; f++) {
        const openNote = STRING_OPEN_NOTES[sorted[i].string];
        const openIdx = NOTES.indexOf(openNote);
        const noteIdx = (openIdx + f) % 12;
        const intervalFromRoot = (noteIdx - rootIndex + 12) % 12;
        chromNotes.push({
          string: sorted[i].string, fret: f, note: NOTES[noteIdx],
          interval: intervalFromRoot, intervalLabel: 'P', isRoot: false,
        });
      }
    }
  }
  return makeExercise('scale-chromatic-passing', chromNotes, sorted);
}

// ─── EXTENDED TECHNIQUE GENERATORS ───

function generateHybridPicking(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const hybridNotes: FretboardNote[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    if (Math.abs(sorted[i].string - sorted[i + 1].string) === 1) {
      hybridNotes.push(sorted[i]);
      hybridNotes.push(sorted[i + 1]);
    }
  }
  return makeExercise('hybrid-picking', hybridNotes.length >= 3 ? hybridNotes : sorted, sorted);
}

function generateChickenPick(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const chickenNotes: FretboardNote[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    chickenNotes.push(sorted[i]);
    const snapString = sorted[i].string > 0 ? sorted[i].string - 1 : sorted[i].string + 1;
    const snapNote = sorted.find(n => n.string === snapString && Math.abs(n.fret - sorted[i].fret) <= 2);
    if (snapNote) chickenNotes.push(snapNote);
  }
  return makeExercise('chicken-pick', chickenNotes, sorted);
}

function generateBanjoRoll(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const rollNotes: FretboardNote[] = [];
  for (let s = 5; s >= 2; s--) {
    const group = sorted.filter(n => n.string >= s - 2 && n.string <= s);
    const byStr: Map<number, FretboardNote> = new Map();
    for (const n of group) {
      if (!byStr.has(n.string)) byStr.set(n.string, n);
    }
    for (let rep = 0; rep < 2; rep++) {
      for (let str = s; str >= s - 2; str--) {
        const n = byStr.get(str);
        if (n) rollNotes.push(n);
      }
    }
  }
  return makeExercise('banjo-roll', rollNotes, sorted);
}

function generatePalmMute(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const muteNotes: FretboardNote[] = [];
  for (let i = 0; i < sorted.length; i++) {
    muteNotes.push(sorted[i]);
    muteNotes.push(sorted[i]);
    if (i + 1 < sorted.length) muteNotes.push(sorted[i + 1]);
  }
  return makeExercise('palm-mute', muteNotes, sorted);
}

function generateStaccato(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const staccNotes = sorted.filter((_, i) => i % 2 === 0 || sorted[i].isRoot);
  return makeExercise('staccato', staccNotes.length >= 3 ? staccNotes : sorted, sorted);
}

function generateSweepTap(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const sweepTapNotes: FretboardNote[] = [];
  const byString: Map<number, FretboardNote[]> = new Map();
  for (const note of sorted) {
    if (!byString.has(note.string)) byString.set(note.string, []);
    byString.get(note.string)!.push(note);
  }
  for (let s = 5; s >= 0; s--) {
    const stringNotes = byString.get(s);
    if (stringNotes) {
      const lowest = [...stringNotes].sort((a, b) => a.fret - b.fret)[0];
      sweepTapNotes.push(lowest);
    }
  }
  const highStringNotes = byString.get(0);
  if (highStringNotes) {
    const highest = [...highStringNotes].sort((a, b) => b.fret - a.fret)[0];
    sweepTapNotes.push(highest);
  }
  for (let s = 0; s <= 5; s++) {
    const stringNotes = byString.get(s);
    if (stringNotes) {
      const lowest = [...stringNotes].sort((a, b) => a.fret - b.fret)[0];
      sweepTapNotes.push(lowest);
    }
  }
  return makeExercise('sweep-tap', sweepTapNotes, sorted);
}

// ─── EXTENDED SHAPE GENERATORS ───

function generateBarreShapes(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const barreNotes: FretboardNote[] = [];
  const roots = sorted.filter(n => n.isRoot);
  for (const root of roots) {
    barreNotes.push(root);
    const third = sorted.find(n => (n.interval === 3 || n.interval === 4) && n.string >= root.string - 2 && n.string < root.string && Math.abs(n.fret - root.fret) <= 4 && n !== root);
    const fifth = sorted.find(n => n.interval === 7 && n.string >= root.string - 3 && n.string < root.string && Math.abs(n.fret - root.fret) <= 5 && n !== root);
    if (third) barreNotes.push(third);
    if (fifth) barreNotes.push(fifth);
  }
  return makeExercise('barre-shapes', barreNotes, sorted);
}

function generateDrop2Voicings(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const drop2Notes: FretboardNote[] = [];
  const scale = SCALES[scaleId];
  if (!scale) return makeExercise('drop2-voicings', sorted, sorted);
  for (let deg = 0; deg < scale.intervals.length; deg++) {
    const rootI = scale.intervals[deg];
    const thirdI = scale.intervals[(deg + 2) % scale.intervals.length];
    const fifthI = scale.intervals[(deg + 4) % scale.intervals.length];
    const seventhI = scale.intervals[(deg + 6) % scale.intervals.length];
    const highStrings = sorted.filter(n => n.string <= 3);
    const root = highStrings.find(n => n.interval === rootI);
    const third = highStrings.find(n => n.interval === thirdI && n !== root);
    const fifth = highStrings.find(n => n.interval === fifthI && n !== root && n !== third);
    const seventh = highStrings.find(n => n.interval === seventhI && n !== root && n !== third && n !== fifth);
    if (root) drop2Notes.push(root);
    if (seventh) drop2Notes.push(seventh);
    if (third) drop2Notes.push(third);
    if (fifth) drop2Notes.push(fifth);
  }
  return makeExercise('drop2-voicings', drop2Notes, sorted);
}

function generateGuideTones(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const guideNotes: FretboardNote[] = [];
  const scale = SCALES[scaleId];
  if (!scale) return makeExercise('guide-tones', sorted, sorted);
  for (let deg = 0; deg < scale.intervals.length; deg++) {
    const thirdI = scale.intervals[(deg + 2) % scale.intervals.length];
    const seventhI = scale.intervals[(deg + 6) % scale.intervals.length];
    const third = sorted.find(n => n.interval === thirdI && !guideNotes.includes(n));
    const seventh = sorted.find(n => n.interval === seventhI && n !== third && !guideNotes.includes(n));
    if (third) guideNotes.push(third);
    if (seventh) guideNotes.push(seventh);
  }
  return makeExercise('guide-tones', guideNotes, sorted);
}

function generateQuartalVoicings(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const quartalNotes: FretboardNote[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const note = sorted[i];
    const fourth = sorted.find(n => n.interval === (note.interval + 5) % 12 && n.string < note.string && Math.abs(n.fret - note.fret) <= 5);
    const secondFourth = fourth ? sorted.find(n => n.interval === (fourth.interval + 5) % 12 && n.string < fourth.string && Math.abs(n.fret - fourth.fret) <= 5 && n !== note) : null;
    if (note.isRoot || i % 2 === 0) {
      quartalNotes.push(note);
      if (fourth) quartalNotes.push(fourth);
      if (secondFourth) quartalNotes.push(secondFourth);
    }
  }
  return makeExercise('quartal-voicings', quartalNotes, sorted);
}

function generateStackedFourths(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const stackNotes: FretboardNote[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const note = sorted[i];
    const fourthAbove = sorted.find(n =>
      n.interval === (note.interval + 5) % 12 &&
      n.string < note.string &&
      Math.abs(n.fret - note.fret) <= 5 &&
      n !== note
    );
    if (fourthAbove) {
      stackNotes.push(note);
      stackNotes.push(fourthAbove);
    }
  }
  return makeExercise('stacked-fourths', stackNotes.length >= 3 ? stackNotes : sorted, sorted);
}

// ─── FRETBOARD NAVIGATION GENERATORS ───

function generateNoteFinder(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const rootIndex = NOTES.indexOf(key);
  const finderNotes: FretboardNote[] = [];
  for (let s = 5; s >= 0; s--) {
    const openNote = STRING_OPEN_NOTES[s];
    const openIdx = NOTES.indexOf(openNote);
    for (let f = startFret; f <= endFret; f++) {
      const noteIdx = (openIdx + f) % 12;
      if (noteIdx === rootIndex) {
        finderNotes.push({
          string: s, fret: f, note: key,
          interval: 0, intervalLabel: 'R', isRoot: true,
        });
      }
    }
  }
  const allNotes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(allNotes));
  return makeExercise('note-finder', finderNotes.length >= 3 ? finderNotes : sorted, sorted);
}

function generateOctaveDrill(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const octNotes: FretboardNote[] = [];
  const roots = sorted.filter(n => n.isRoot);
  for (const root of roots) {
    octNotes.push(root);
  }
  return makeExercise('octave-drill', octNotes.length >= 3 ? octNotes : sorted, sorted);
}

function generateUnisonDrill(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const unisonNotes: FretboardNote[] = [];
  const byNoteName: Map<string, FretboardNote[]> = new Map();
  for (const n of sorted) {
    if (!byNoteName.has(n.note)) byNoteName.set(n.note, []);
    byNoteName.get(n.note)!.push(n);
  }
  byNoteName.forEach((noteList) => {
    if (noteList.length >= 2) {
      unisonNotes.push(...noteList.slice(0, 2));
    }
  });
  return makeExercise('unison-drill', unisonNotes.length >= 3 ? unisonNotes : sorted, sorted);
}

function generateIntervalMatrix(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const matrixNotes: FretboardNote[] = [];
  const roots = sorted.filter(n => n.isRoot);
  for (const root of roots.slice(0, 2)) {
    const intervals = [2, 3, 5, 7, 8, 10];
    for (const interval of intervals) {
      matrixNotes.push(root);
      const target = sorted.find(n => n.interval === interval && n !== root && (5 - n.string) * 5 + n.fret > (5 - root.string) * 5 + root.fret);
      if (target) matrixNotes.push(target);
    }
  }
  return makeExercise('interval-matrix', matrixNotes, sorted);
}

// ─── EXTENDED WARMUP GENERATORS ───

function generateChromaticPattern(key: NoteName, scaleId: string, startFret: number, endFret: number, pattern: number[], type: ExerciseType): Exercise {
  const rootIndex = NOTES.indexOf(key);
  const warmupNotes: FretboardNote[] = [];
  for (let stringIdx = 5; stringIdx >= 0; stringIdx--) {
    const openNote = STRING_OPEN_NOTES[stringIdx];
    const openIdx = NOTES.indexOf(openNote);
    const baseFret = Math.max(startFret, 1);
    for (const finger of pattern) {
      const f = baseFret + finger - 1;
      if (f > endFret) continue;
      const noteIdx = (openIdx + f) % 12;
      const intervalFromRoot = (noteIdx - rootIndex + 12) % 12;
      warmupNotes.push({
        string: stringIdx, fret: f, note: NOTES[noteIdx],
        interval: intervalFromRoot, intervalLabel: intervalFromRoot === 0 ? 'R' : `${intervalFromRoot}`,
        isRoot: intervalFromRoot === 0,
      });
    }
  }
  const allNotes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(allNotes));
  return makeExercise(type, warmupNotes.length >= 4 ? warmupNotes : sorted, sorted);
}

function generateFingerStretch(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const rootIndex = NOTES.indexOf(key);
  const stretchNotes: FretboardNote[] = [];
  const patterns = [[1, 4], [1, 2, 4], [1, 3, 4], [1, 2, 3, 4]];
  for (let stringIdx = 5; stringIdx >= 0; stringIdx--) {
    const openNote = STRING_OPEN_NOTES[stringIdx];
    const openIdx = NOTES.indexOf(openNote);
    const baseFret = Math.max(startFret, 1);
    for (const pattern of patterns) {
      for (const finger of pattern) {
        const f = baseFret + finger - 1;
        if (f > endFret) continue;
        const noteIdx = (openIdx + f) % 12;
        const intervalFromRoot = (noteIdx - rootIndex + 12) % 12;
        stretchNotes.push({
          string: stringIdx, fret: f, note: NOTES[noteIdx],
          interval: intervalFromRoot, intervalLabel: intervalFromRoot === 0 ? 'R' : `${intervalFromRoot}`,
          isRoot: intervalFromRoot === 0,
        });
      }
    }
  }
  const allNotes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(allNotes));
  return makeExercise('finger-stretch', stretchNotes.length >= 4 ? stretchNotes : sorted, sorted);
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
    // ── Scale Runs ──
    case 'scale-asc': return generateAscendingScale(key, scaleId, startFret, endFret);
    case 'scale-desc': return generateDescendingScale(key, scaleId, startFret, endFret);
    case 'scale-asc-desc': return generateAscDescScale(key, scaleId, startFret, endFret);
    case 'scale-desc-asc': return generateDescAscScale(key, scaleId, startFret, endFret);
    case 'reverse-pentatonic': return generateReversePentatonic(key, scaleId, startFret, endFret);
    case 'scale-skip-note': return generateScaleSkipNote(key, scaleId, startFret, endFret);
    case 'scale-fragment-3': return generateScaleFragmentN(key, scaleId, startFret, endFret, 3, 'scale-fragment-3');
    case 'scale-fragment-4': return generateScaleFragmentN(key, scaleId, startFret, endFret, 4, 'scale-fragment-4');

    // ── Sequences ──
    case 'thirds': return generateDiatonicN(key, scaleId, startFret, endFret, 2, 'thirds');
    case 'fourths': return generateDiatonicN(key, scaleId, startFret, endFret, 3, 'fourths');
    case 'fifths': return generateDiatonicN(key, scaleId, startFret, endFret, 4, 'fifths');
    case 'sixths': return generateDiatonicN(key, scaleId, startFret, endFret, 5, 'sixths');
    case 'sevenths': return generateDiatonicN(key, scaleId, startFret, endFret, 6, 'sevenths');
    case 'sequence-3': return generateSequenceN(key, scaleId, startFret, endFret, 3, 'sequence-3');
    case 'sequence-4': return generateSequenceN(key, scaleId, startFret, endFret, 4, 'sequence-4');
    case 'sequence-5': return generateSequenceN(key, scaleId, startFret, endFret, 5, 'sequence-5');
    case 'sequence-6': return generateSequenceN(key, scaleId, startFret, endFret, 6, 'sequence-6');
    case 'sequence-7': return generateSequenceN(key, scaleId, startFret, endFret, 7, 'sequence-7');
    case 'pedal-tone': return generatePedalTone(key, scaleId, startFret, endFret);
    case 'pedal-tone-inv': return generatePedalToneInv(key, scaleId, startFret, endFret);

    // ── Shapes ──
    case 'triads': return generateTriads(key, scaleId, startFret, endFret);
    case 'triads-inv1': return generateTriadsInv1(key, scaleId, startFret, endFret);
    case 'triads-inv2': return generateTriadsInv2(key, scaleId, startFret, endFret);
    case 'arpeggios': return generateArpeggios(key, scaleId, startFret, endFret);
    case 'octave-shapes': return generateOctaveShapes(key, scaleId, startFret, endFret);
    case 'double-stops': return generateDoubleStops(key, scaleId, startFret, endFret);
    case 'shell-voicings': return generateShellVoicings(key, scaleId, startFret, endFret);
    case 'dyads': return generateDyads(key, scaleId, startFret, endFret);
    case 'chord-scale': return generateChordScale(key, scaleId, startFret, endFret);
    case 'power-shapes': return generatePowerShapes(key, scaleId, startFret, endFret);

    // ── Technique ──
    case 'string-skip': return generateStringSkip(key, scaleId, startFret, endFret);
    case 'lateral-run': return generateLateralRun(key, scaleId, startFret, endFret);
    case 'diagonal': return generateDiagonal(key, scaleId, startFret, endFret);
    case 'position-shift': return generatePositionShift(key, scaleId);
    case 'pentatonic-run': return generatePentatonicRun(key, scaleId, startFret, endFret);
    case 'economy-picking': return generateEconomyPicking(key, scaleId, startFret, endFret);
    case 'spider-walk': return generateSpiderWalk(key, scaleId, startFret, endFret);
    case 'interval-jump': return generateIntervalJump(key, scaleId, startFret, endFret);
    case 'hammer-pull': return generateHammerPull(key, scaleId, startFret, endFret);
    case 'slide-exercise': return generateSlideExercise(key, scaleId, startFret, endFret);
    case 'cross-string': return generateCrossString(key, scaleId, startFret, endFret);
    case 'speed-burst': return generateSpeedBurst(key, scaleId, startFret, endFret);

    // ── Connections ──
    case 'connecting': return generateConnecting(key, scaleId);
    case 'position-sweep': return generatePositionSweep(key, scaleId);
    case 'caged-cycle': return generateCagedCycle(key, scaleId);
    case 'caged-run': return generateCagedRun(key, scaleId);

    // ── Intervals ──
    case 'intervals-2nd': return generateIntervalN(key, scaleId, startFret, endFret, 2, 'intervals-2nd');
    case 'intervals-3rd': return generateIntervalN(key, scaleId, startFret, endFret, 3, 'intervals-3rd');
    case 'intervals-4th': return generateIntervalN(key, scaleId, startFret, endFret, 5, 'intervals-4th');
    case 'intervals-5th': return generateIntervalN(key, scaleId, startFret, endFret, 7, 'intervals-5th');
    case 'intervals-6th': return generateIntervalN(key, scaleId, startFret, endFret, 9, 'intervals-6th');
    case 'intervals-7th': return generateIntervalN(key, scaleId, startFret, endFret, 11, 'intervals-7th');

    // ── Arpeggios ──
    case 'arp-sweep': return generateArpSweep(key, scaleId, startFret, endFret);
    case 'arp-string-skip': return generateArpStringSkip(key, scaleId, startFret, endFret);
    case 'arp-triad-up': return generateArpTriadUp(key, scaleId, startFret, endFret);
    case 'arp-seventh': return generateArpSeventh(key, scaleId, startFret, endFret);
    case 'arp-inverted': return generateArpInverted(key, scaleId, startFret, endFret);
    case 'arp-connect': return generateArpConnect(key, scaleId);

    // ── Warmups ──
    case 'chromatic-warmup': return generateChromaticWarmup(key, scaleId, startFret, endFret);
    case 'spider-warmup': return generateSpiderWarmup(key, scaleId, startFret, endFret);
    case 'finger-gym': return generateFingerGym(key, scaleId, startFret, endFret);
    case 'string-cross-warmup': return generateStringCrossWarmup(key, scaleId, startFret, endFret);

    // ── Rhythm ──
    case 'rhythm-subdivisions': return generateRhythmSubdivisions(key, scaleId, startFret, endFret);
    case 'rhythm-syncopation': return generateRhythmSyncopation(key, scaleId, startFret, endFret);
    case 'rhythm-rest': return generateRhythmRest(key, scaleId, startFret, endFret);
    case 'rhythm-accent': return generateRhythmAccent(key, scaleId, startFret, endFret);
    case 'rhythm-swing': return generateRhythmSwing(key, scaleId, startFret, endFret);
    case 'rhythm-tied': return generateRhythmTied(key, scaleId, startFret, endFret);

    // ── Bending & Expression ──
    case 'bend-unison': return generateBendUnison(key, scaleId, startFret, endFret);
    case 'bend-half': return generateBendHalf(key, scaleId, startFret, endFret);
    case 'bend-full': return generateBendFull(key, scaleId, startFret, endFret);
    case 'bend-pre': return generateBendPre(key, scaleId, startFret, endFret);
    case 'vibrato-control': return generateVibratoControl(key, scaleId, startFret, endFret);

    // ── Tapping ──
    case 'tap-basic': return generateTapBasic(key, scaleId, startFret, endFret);
    case 'tap-arpeggio': return generateTapArpeggio(key, scaleId, startFret, endFret);
    case 'tap-scale': return generateTapScale(key, scaleId, startFret, endFret);
    case 'tap-harmonic': return generateTapHarmonic(key, scaleId, startFret, endFret);

    // ── Harmonics ──
    case 'harmonics-natural': return generateHarmonicsNatural(key, scaleId, startFret, endFret);
    case 'harmonics-artificial': return generateHarmonicsArtificial(key, scaleId, startFret, endFret);
    case 'harmonics-pinch': return generateHarmonicsPinch(key, scaleId, startFret, endFret);

    // ── Extended Sequences ──
    case 'enclosure': return generateEnclosure(key, scaleId, startFret, endFret);
    case 'bebop-scale': return generateBebopScale(key, scaleId, startFret, endFret);
    case 'cycle-of-4ths': return generateCycleOf4ths(key, scaleId, startFret, endFret);
    case 'cycle-of-5ths': return generateCycleOf5ths(key, scaleId, startFret, endFret);
    case 'chromatic-enclosure': return generateChromaticEnclosure(key, scaleId, startFret, endFret);

    // ── Extended Scale Runs ──
    case 'scale-3nps': return generateScale3NPS(key, scaleId, startFret, endFret);
    case 'scale-single-string': return generateScaleSingleString(key, scaleId, startFret, endFret);
    case 'scale-zigzag': return generateScaleZigzag(key, scaleId, startFret, endFret);
    case 'scale-wide-skip': return generateScaleWideSkip(key, scaleId, startFret, endFret);
    case 'scale-chromatic-passing': return generateScaleChromaticPassing(key, scaleId, startFret, endFret);

    // ── Extended Technique ──
    case 'hybrid-picking': return generateHybridPicking(key, scaleId, startFret, endFret);
    case 'chicken-pick': return generateChickenPick(key, scaleId, startFret, endFret);
    case 'banjo-roll': return generateBanjoRoll(key, scaleId, startFret, endFret);
    case 'palm-mute': return generatePalmMute(key, scaleId, startFret, endFret);
    case 'staccato': return generateStaccato(key, scaleId, startFret, endFret);
    case 'sweep-tap': return generateSweepTap(key, scaleId, startFret, endFret);

    // ── Extended Shapes ──
    case 'barre-shapes': return generateBarreShapes(key, scaleId, startFret, endFret);
    case 'drop2-voicings': return generateDrop2Voicings(key, scaleId, startFret, endFret);
    case 'guide-tones': return generateGuideTones(key, scaleId, startFret, endFret);
    case 'quartal-voicings': return generateQuartalVoicings(key, scaleId, startFret, endFret);
    case 'stacked-fourths': return generateStackedFourths(key, scaleId, startFret, endFret);

    // ── Fretboard Navigation ──
    case 'note-finder': return generateNoteFinder(key, scaleId, startFret, endFret);
    case 'octave-drill': return generateOctaveDrill(key, scaleId, startFret, endFret);
    case 'unison-drill': return generateUnisonDrill(key, scaleId, startFret, endFret);
    case 'interval-matrix': return generateIntervalMatrix(key, scaleId, startFret, endFret);

    // ── Extended Warmups ──
    case 'chromatic-1234': return generateChromaticPattern(key, scaleId, startFret, endFret, [1, 2, 3, 4], 'chromatic-1234');
    case 'chromatic-4321': return generateChromaticPattern(key, scaleId, startFret, endFret, [4, 3, 2, 1], 'chromatic-4321');
    case 'chromatic-1324': return generateChromaticPattern(key, scaleId, startFret, endFret, [1, 3, 2, 4], 'chromatic-1324');
    case 'chromatic-1423': return generateChromaticPattern(key, scaleId, startFret, endFret, [1, 4, 2, 3], 'chromatic-1423');
    case 'chromatic-2413': return generateChromaticPattern(key, scaleId, startFret, endFret, [2, 4, 1, 3], 'chromatic-2413');
    case 'finger-stretch': return generateFingerStretch(key, scaleId, startFret, endFret);

    default: return generateAscendingScale(key, scaleId, startFret, endFret);
  }
}

// ─── VARIATION GENERATOR ───

export function generateExerciseWithVariation(
  type: ExerciseType,
  key: NoteName,
  scaleId: string,
  positionIndex: number,
  variation: string
): Exercise {
  const baseExercise = generateExercise(type, key, scaleId, positionIndex);

  switch (variation) {
    case 'standard':
      return baseExercise;

    case 'extended': {
      // Play the pattern twice or extend range
      const doubled = [...baseExercise.notes, ...baseExercise.notes.map(n => ({ ...n, sequenceNumber: (n.sequenceNumber ?? 0) + baseExercise.notes.length }))];
      return {
        ...baseExercise,
        name: baseExercise.name + ' (Extended)',
        description: baseExercise.description + ' — Extended range',
        notes: doubled,
        tabs: generateTabs(doubled),
      };
    }

    case 'inverted': {
      // Reverse the note order
      const inverted = [...baseExercise.notes].reverse().map((n, i) => ({ ...n, sequenceNumber: i + 1 }));
      return {
        ...baseExercise,
        name: baseExercise.name + ' (Inverted)',
        description: baseExercise.description + ' — Inverted direction',
        notes: inverted,
        tabs: generateTabs(inverted),
      };
    }

    case 'reverse': {
      // Reverse the note order (same as inverted but different label)
      const reversed = [...baseExercise.notes].reverse().map((n, i) => ({ ...n, sequenceNumber: i + 1 }));
      return {
        ...baseExercise,
        name: baseExercise.name + ' (Reverse)',
        description: baseExercise.description + ' — Reversed order',
        notes: reversed,
        tabs: generateTabs(reversed),
      };
    }

    case 'compact': {
      // Use fewer notes per group (take every other note or trim)
      const compact = baseExercise.notes.filter((_, i) => i % 2 === 0).map((n, i) => ({ ...n, sequenceNumber: i + 1 }));
      if (compact.length < 3) return baseExercise;
      return {
        ...baseExercise,
        name: baseExercise.name + ' (Compact)',
        description: baseExercise.description + ' — Compact version',
        notes: compact,
        tabs: generateTabs(compact),
      };
    }

    default:
      return baseExercise;
  }
}

// ─── GENERATE ALL EXERCISES ───

export function generateAllExercises(
  key: NoteName,
  scaleId: string,
  positionIndex: number = 0
): Exercise[] {
  return Object.keys(EXERCISE_TYPES).map(type =>
    generateExercise(type as ExerciseType, key, scaleId, positionIndex)
  );
}

// ─── GENERATE CAGED PATTERN EXERCISES ───

export function generatePatternExercises(
  key: NoteName,
  scaleId: string
): Array<{ position: number; fretStart: number; fretEnd: number; notes: ExerciseNote[] }> {
  const positions = getCAGEDPositions(key, scaleId);
  return positions.map((pos, idx) => {
    const notes = getScaleOnFretboard(key, scaleId, pos.fretStart, pos.fretEnd);
    const sorted = sortNotesAscending(dedupNotes(notes));
    const exerciseNotes = addSequenceNumbers(sorted.map(fretboardToExerciseNote));
    return { position: idx + 1, fretStart: pos.fretStart, fretEnd: pos.fretEnd, notes: exerciseNotes };
  });
}

// ─── GET ALL EXERCISE ENTRIES ───

export function getAllExerciseEntries(): Array<{
  variationId: string;
  typeId: ExerciseType;
  name: string;
  description: string;
  difficulty: number;
  focus: string;
  estimatedTime: string;
  tags: string[];
  category: string;
}> {
  const entries: Array<{
    variationId: string;
    typeId: ExerciseType;
    name: string;
    description: string;
    difficulty: number;
    focus: string;
    estimatedTime: string;
    tags: string[];
    category: string;
  }> = [];

  // Build a reverse mapping from type to category
  const typeToCategory: Record<string, string> = {};
  for (const cat of EXERCISE_CATEGORIES) {
    for (const t of cat.types) {
      typeToCategory[t] = cat.id;
    }
  }

  for (const variation of EXERCISE_VARIATIONS) {
    const meta = EXERCISE_TYPES[variation.typeId];
    entries.push({
      variationId: variation.id,
      typeId: variation.typeId,
      name: `${meta.name} (${variation.variantName})`,
      description: meta.description,
      difficulty: meta.difficulty,
      focus: meta.focus,
      estimatedTime: meta.estimatedTime,
      tags: [...meta.tags, variation.modifier],
      category: typeToCategory[variation.typeId] || 'unknown',
    });
  }

  return entries;
}

// ─── COMPUTE EXERCISE STATS ───

export function computeExerciseStats(exercise: Exercise): {
  totalNotes: number;
  fretRange: [number, number];
  stringCoverage: number;
  avgFretJump: number;
  maxFretJump: number;
  stringChanges: number;
  positionShifts: number;
  uniqueFrets: number;
  uniqueStrings: number;
  intervalDistribution: Record<string, number>;
  pickingDirection: string[];
  difficulty: number;
  estimatedDuration: string;
  focusAreas: string[];
  technique: string;
  patternType: string;
} {
  const notes = exercise.notes;
  const totalNotes = notes.length;

  // Fret range
  const frets = notes.map(n => n.fret);
  const fretRange: [number, number] = frets.length > 0 ? [Math.min(...frets), Math.max(...frets)] : [0, 0];

  // String coverage
  const strings = new Set(notes.map(n => n.string));
  const stringCoverage = strings.size;

  // Fret jumps
  const fretJumps: number[] = [];
  for (let i = 1; i < notes.length; i++) {
    fretJumps.push(Math.abs(notes[i].fret - notes[i - 1].fret));
  }
  const avgFretJump = fretJumps.length > 0 ? Math.round(fretJumps.reduce((a, b) => a + b, 0) / fretJumps.length * 10) / 10 : 0;
  const maxFretJump = fretJumps.length > 0 ? Math.max(...fretJumps) : 0;

  // String changes
  let stringChanges = 0;
  for (let i = 1; i < notes.length; i++) {
    if (notes[i].string !== notes[i - 1].string) stringChanges++;
  }

  // Position shifts (large fret jumps > 3)
  let positionShifts = 0;
  for (let i = 1; i < notes.length; i++) {
    if (Math.abs(notes[i].fret - notes[i - 1].fret) > 3) positionShifts++;
  }

  // Unique frets and strings
  const uniqueFrets = new Set(frets).size;
  const uniqueStrings = strings.size;

  // Interval distribution
  const intervalDistribution: Record<string, number> = {};
  for (const note of notes) {
    const label = note.intervalLabel;
    intervalDistribution[label] = (intervalDistribution[label] || 0) + 1;
  }

  // Picking direction
  const pickingDirection: string[] = [];
  for (let i = 0; i < notes.length; i++) {
    if (i === 0) {
      pickingDirection.push('D');
    } else if (notes[i].string !== notes[i - 1].string) {
      // String change - check direction
      if (notes[i].string < notes[i - 1].string) {
        pickingDirection.push('D'); // Moving to higher-pitch string = downstroke typically
      } else {
        pickingDirection.push('U');
      }
    } else {
      // Same string - alternate
      pickingDirection.push(pickingDirection[i - 1] === 'D' ? 'U' : 'D');
    }
  }

  // Compute difficulty from metadata
  const meta = EXERCISE_TYPES[exercise.type];
  const difficulty = meta.difficulty;
  const estimatedDuration = meta.estimatedTime;
  const focusAreas = meta.tags;
  const technique = meta.focus;

  // Pattern type based on exercise category
  let patternType = 'miscellaneous';
  for (const cat of EXERCISE_CATEGORIES) {
    if (cat.types.includes(exercise.type)) {
      patternType = cat.label;
      break;
    }
  }

  return {
    totalNotes,
    fretRange,
    stringCoverage,
    avgFretJump,
    maxFretJump,
    stringChanges,
    positionShifts,
    uniqueFrets,
    uniqueStrings,
    intervalDistribution,
    pickingDirection,
    difficulty,
    estimatedDuration,
    focusAreas,
    technique,
    patternType,
  };
}
