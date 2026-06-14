// Exercise Generator for Guitar
// Generates various practice exercises from scale patterns
// Expanded: 174 base exercise types, 400+ variations, rich metadata

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

// ─── EXERCISE TYPE UNION (174 types) ───

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
  | 'finger-stretch'
  // New Chromatic Drills (6)
  | 'chromatic-2341'
  | 'chromatic-3142'
  | 'chromatic-4132'
  | 'chromatic-3241'
  | 'chromatic-desc-warmup'
  | 'chromatic-all-strings'
  // Spider Exercises (5)
  | 'chromatic-spider-walk'
  | 'spider-cross-1'
  | 'spider-cross-2'
  | 'spider-inward'
  | 'spider-outward'
  // String Crossing (4)
  | 'string-cross-asc'
  | 'string-cross-desc'
  | 'string-cross-skip'
  | 'string-cross-alternate'
  // Sweep Picking (4)
  | 'sweep-3string'
  | 'sweep-5string'
  | 'sweep-minor'
  | 'sweep-major'
  // Legato (5)
  | 'legato-hammer-asc'
  | 'legato-hammer-desc'
  | 'legato-pull-asc'
  | 'legato-pull-desc'
  | 'legato-trill'
  // Position Shifting (3)
  | 'pos-shift-1-fret'
  | 'pos-shift-2-fret'
  | 'pos-shift-3-fret'
  // Scale Patterns (5)
  | 'scale-2nps'
  | 'scale-4nps'
  | 'scale-offset-run'
  | 'scale-spiral'
  | 'scale-box-run'
  // Interval Studies (4)
  | 'intervals-octave'
  | 'intervals-tritone'
  | 'intervals-compound'
  | 'intervals-chromatic'
  // Arpeggio Studies (6)
  | 'arp-diminished'
  | 'arp-augmented'
  | 'arp-minor7'
  | 'arp-dom7'
  | 'arp-maj7'
  | 'arp-min9'
  // Rhythm & Timing (3)
  | 'rhythm-gallop'
  | 'rhythm-triplet'
  | 'rhythm-dotted'
  // Bending & Expression (3)
  | 'bend-release'
  | 'bend-1step'
  | 'bend-1half'
  // Harmonics (2)
  | 'harmonics-tap'
  | 'harmonics-pinch-scale'
  // Tapping (3)
  | 'tap-8finger'
  | 'tap-sweep'
  | 'tap-tap-pull'
  // Blues (3)
  | 'blues-lick-1'
  | 'blues-lick-2'
  | 'blues-turnaround'
  // Fretboard Knowledge (4)
  | 'caged-shapes'
  | 'note-triplets'
  | 'relative-note'
  | 'fretboard-map'
  // Speed & Agility (3)
  | 'speed-ladder'
  | 'speed-burst-16th'
  | 'speed-triplet-run'
  // Complete Chromatic Permutations (14 remaining of 24)
  | 'chromatic-1243'
  | 'chromatic-1342'
  | 'chromatic-1432'
  | 'chromatic-2134'
  | 'chromatic-2143'
  | 'chromatic-2314'
  | 'chromatic-2431'
  | 'chromatic-3124'
  | 'chromatic-3214'
  | 'chromatic-3412'
  | 'chromatic-3421'
  | 'chromatic-4123'
  | 'chromatic-4213'
  | 'chromatic-4231'
  // Finger Independence Drills (6)
  | 'finger-1-2-1-3'
  | 'finger-1-2-1-4'
  | 'finger-1-3-1-4'
  | 'finger-2-1-2-3'
  | 'finger-2-1-2-4'
  | 'finger-3-1-3-2'
  // Open String Exercises (4)
  | 'open-string-alternate'
  | 'open-string-fret-combo'
  | 'open-string-bass-run'
  | 'open-string-arpeggio'
  // Chord Exercises (5)
  | 'chord-triad-asc'
  | 'chord-triad-desc'
  | 'chord-power-5th'
  | 'chord-shell-comping'
  | 'chord-barre-drill'
  // Sliding Exercises (3)
  | 'slide-up-1fret'
  | 'slide-up-2fret'
  | 'slide-down-1fret'
  // String Skip Advanced (4)
  | 'string-skip-3rd'
  | 'string-skip-4th'
  | 'string-skip-octave'
  | 'string-skip-scale'
  // Modal Exercises (4)
  | 'modal-dorian-run'
  | 'modal-mixolydian-run'
  | 'modal-lydian-run'
  | 'modal-phrygian-run'
  // Blues Extended (4)
  | 'blues-shuffle'
  | 'blues-bend-lick'
  | 'blues-rake'
  | 'blues-grace-note'
  // Picking Drills (4)
  | 'alt-pick-1string'
  | 'alt-pick-2string'
  | 'sweep-pick-drill'
  | 'cross-pick-drill'
  // Tremolo & Trill (3)
  | 'tremolo-single'
  | 'tremolo-chord'
  | 'trill-speed-drill'
  // Stretch Exercises (3)
  | 'stretch-1-4-1fret'
  | 'stretch-1-4-2fret'
  | 'stretch-wide-1-4'
  // Odd Groupings (4)
  | 'grouping-5'
  | 'grouping-7'
  | 'grouping-9'
  | 'rhythmic-displacement';

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

  // ── New Chromatic Drills ──
  'chromatic-2341': { name: 'Chromatic 2-3-4-1', description: 'Chromatic permutation pattern 2-3-4-1 for finger independence', difficulty: 2, focus: 'Finger Independence', estimatedTime: '2-4 min', tags: ['warmup', 'chromatic', 'permutation'] },
  'chromatic-3142': { name: 'Chromatic 3-1-4-2', description: 'Chromatic permutation pattern 3-1-4-2 for finger independence', difficulty: 2, focus: 'Finger Independence', estimatedTime: '2-4 min', tags: ['warmup', 'chromatic', 'permutation'] },
  'chromatic-4132': { name: 'Chromatic 4-1-3-2', description: 'Chromatic permutation pattern 4-1-3-2 for finger independence', difficulty: 3, focus: 'Finger Independence', estimatedTime: '2-4 min', tags: ['warmup', 'chromatic', 'permutation'] },
  'chromatic-3241': { name: 'Chromatic 3-2-4-1', description: 'Chromatic permutation pattern 3-2-4-1 for finger independence', difficulty: 3, focus: 'Finger Independence', estimatedTime: '2-4 min', tags: ['warmup', 'chromatic', 'permutation'] },
  'chromatic-desc-warmup': { name: 'Descending Chromatic Warmup', description: 'Descending chromatic 4-3-2-1 pattern per string for warmup', difficulty: 1, focus: 'Warmup', estimatedTime: '2-3 min', tags: ['warmup', 'chromatic', 'descending'] },
  'chromatic-all-strings': { name: 'Full Chromatic Run', description: 'Chromatic run across all strings ascending then descending', difficulty: 2, focus: 'Alternate Picking', estimatedTime: '3-5 min', tags: ['chromatic', 'full-run', 'picking'] },

  // ── Spider Exercises ──
  'chromatic-spider-walk': { name: 'Spider Walk', description: 'Classic spider walk: one finger per string then cross back', difficulty: 2, focus: 'Finger Independence', estimatedTime: '3-5 min', tags: ['spider', 'independence', 'warmup'] },
  'spider-cross-1': { name: 'Spider Cross Ascending', description: 'Spider exercise crossing strings 1-2-3-4 ascending', difficulty: 3, focus: 'String Crossing', estimatedTime: '3-5 min', tags: ['spider', 'crossing', 'dexterity'] },
  'spider-cross-2': { name: 'Spider Cross Descending', description: 'Spider exercise crossing strings 4-3-2-1 descending', difficulty: 3, focus: 'String Crossing', estimatedTime: '3-5 min', tags: ['spider', 'crossing', 'dexterity'] },
  'spider-inward': { name: 'Spider Inward', description: 'Spider walking inward from outside strings toward center', difficulty: 3, focus: 'String Crossing', estimatedTime: '3-5 min', tags: ['spider', 'inward', 'dexterity'] },
  'spider-outward': { name: 'Spider Outward', description: 'Spider walking outward from middle strings toward edges', difficulty: 3, focus: 'String Crossing', estimatedTime: '3-5 min', tags: ['spider', 'outward', 'dexterity'] },

  // ── String Crossing ──
  'string-cross-asc': { name: 'Ascending String Cross', description: 'Ascending string crossing pattern for smooth transitions', difficulty: 2, focus: 'String Crossing', estimatedTime: '3-5 min', tags: ['crossing', 'ascending', 'picking'] },
  'string-cross-desc': { name: 'Descending String Cross', description: 'Descending string crossing pattern for smooth transitions', difficulty: 2, focus: 'String Crossing', estimatedTime: '3-5 min', tags: ['crossing', 'descending', 'picking'] },
  'string-cross-skip': { name: 'String Cross Skip', description: 'String crossing while skipping strings for accuracy', difficulty: 3, focus: 'String Crossing', estimatedTime: '3-5 min', tags: ['crossing', 'skip', 'accuracy'] },
  'string-cross-alternate': { name: 'Alternate String Cross', description: 'Alternating string crossing direction for versatility', difficulty: 3, focus: 'String Crossing', estimatedTime: '3-5 min', tags: ['crossing', 'alternate', 'versatility'] },

  // ── Sweep Picking ──
  'sweep-3string': { name: '3-String Sweep', description: '3-string sweep arpeggio for fundamental sweep technique', difficulty: 3, focus: 'Sweep Picking', estimatedTime: '3-5 min', tags: ['sweep', 'arpeggio', '3-string'] },
  'sweep-5string': { name: '5-String Sweep', description: '5-string sweep arpeggio for extended sweep technique', difficulty: 4, focus: 'Sweep Picking', estimatedTime: '4-6 min', tags: ['sweep', 'arpeggio', '5-string'] },
  'sweep-minor': { name: 'Minor Sweep Shape', description: 'Minor triad sweep arpeggio shape across strings', difficulty: 3, focus: 'Sweep Picking', estimatedTime: '3-5 min', tags: ['sweep', 'minor', 'arpeggio'] },
  'sweep-major': { name: 'Major Sweep Shape', description: 'Major triad sweep arpeggio shape across strings', difficulty: 3, focus: 'Sweep Picking', estimatedTime: '3-5 min', tags: ['sweep', 'major', 'arpeggio'] },

  // ── Legato ──
  'legato-hammer-asc': { name: 'Hammer-On Ascending', description: 'Ascending hammer-on exercise for legato strength', difficulty: 2, focus: 'Legato', estimatedTime: '3-5 min', tags: ['legato', 'hammer-on', 'ascending'] },
  'legato-hammer-desc': { name: 'Hammer-On Descending', description: 'Descending hammer-on exercise for legato control', difficulty: 2, focus: 'Legato', estimatedTime: '3-5 min', tags: ['legato', 'hammer-on', 'descending'] },
  'legato-pull-asc': { name: 'Pull-Off Ascending', description: 'Ascending pull-off exercise for legato fluidity', difficulty: 2, focus: 'Legato', estimatedTime: '3-5 min', tags: ['legato', 'pull-off', 'ascending'] },
  'legato-pull-desc': { name: 'Pull-Off Descending', description: 'Descending pull-off exercise for legato fluidity', difficulty: 3, focus: 'Legato', estimatedTime: '3-5 min', tags: ['legato', 'pull-off', 'descending'] },
  'legato-trill': { name: 'Trill Exercise', description: 'Rapid hammer-pull on same note pair for finger endurance', difficulty: 2, focus: 'Legato', estimatedTime: '2-4 min', tags: ['legato', 'trill', 'endurance'] },

  // ── Position Shifting ──
  'pos-shift-1-fret': { name: '1-Fret Position Shift', description: 'Smooth position shifts moving 1 fret up and down the neck', difficulty: 2, focus: 'Position Playing', estimatedTime: '3-5 min', tags: ['position', 'shift', '1-fret'] },
  'pos-shift-2-fret': { name: '2-Fret Position Shift', description: 'Position shifts moving 2 frets for wider transitions', difficulty: 3, focus: 'Position Playing', estimatedTime: '3-5 min', tags: ['position', 'shift', '2-fret'] },
  'pos-shift-3-fret': { name: '3-Fret Position Shift', description: 'Position shifts moving 3 frets for extended transitions', difficulty: 3, focus: 'Position Playing', estimatedTime: '3-5 min', tags: ['position', 'shift', '3-fret'] },

  // ── Scale Patterns ──
  'scale-2nps': { name: '2 Notes Per String', description: 'Scale pattern with 2 notes per string for pentatonic style', difficulty: 2, focus: 'Alternate Picking', estimatedTime: '3-5 min', tags: ['2nps', 'pentatonic', 'picking'] },
  'scale-4nps': { name: '4 Notes Per String', description: 'Scale pattern with 4 notes per string for advanced picking', difficulty: 4, focus: 'Alternate Picking', estimatedTime: '4-6 min', tags: ['4nps', 'speed', 'picking'] },
  'scale-offset-run': { name: 'Offset Scale Run', description: 'Run starting from different scale degrees for versatility', difficulty: 3, focus: 'Fretboard Knowledge', estimatedTime: '3-5 min', tags: ['offset', 'degrees', 'versatility'] },
  'scale-spiral': { name: 'Spiral Pattern', description: 'Spiral pattern ascending across strings and positions', difficulty: 4, focus: 'Fretboard Knowledge', estimatedTime: '4-6 min', tags: ['spiral', 'navigation', 'positions'] },
  'scale-box-run': { name: 'Box Pattern Run', description: 'Box pattern runs connecting adjacent CAGED positions', difficulty: 3, focus: 'Position Playing', estimatedTime: '3-5 min', tags: ['box', 'caged', 'positions'] },

  // ── Interval Studies ──
  'intervals-octave': { name: 'Octave Intervals', description: 'Play octave interval shapes across the fretboard', difficulty: 2, focus: 'Ear Training', estimatedTime: '3-5 min', tags: ['intervals', 'octave', 'ear'] },
  'intervals-tritone': { name: 'Tritone Intervals', description: 'Tritone (augmented 4th / diminished 5th) interval drill', difficulty: 3, focus: 'Ear Training', estimatedTime: '3-5 min', tags: ['intervals', 'tritone', 'ear'] },
  'intervals-compound': { name: 'Compound Intervals', description: 'Intervals beyond the octave for advanced ear training', difficulty: 4, focus: 'Ear Training', estimatedTime: '4-6 min', tags: ['intervals', 'compound', 'advanced'] },
  'intervals-chromatic': { name: 'Chromatic Intervals', description: 'Chromatic interval walking through all semitones', difficulty: 3, focus: 'Ear Training', estimatedTime: '3-5 min', tags: ['intervals', 'chromatic', 'ear'] },

  // ── Arpeggio Studies ──
  'arp-diminished': { name: 'Diminished Arpeggio', description: 'Diminished triad arpeggio (R, b3, b5) for tension and release', difficulty: 4, focus: 'Arpeggio Knowledge', estimatedTime: '3-5 min', tags: ['arpeggio', 'diminished', 'tension'] },
  'arp-augmented': { name: 'Augmented Arpeggio', description: 'Augmented triad arpeggio (R, 3, #5) for symmetrical sound', difficulty: 4, focus: 'Arpeggio Knowledge', estimatedTime: '3-5 min', tags: ['arpeggio', 'augmented', 'symmetrical'] },
  'arp-minor7': { name: 'Minor 7th Arpeggio', description: 'Minor 7th arpeggio (R, b3, 5, b7) for jazz and funk', difficulty: 3, focus: 'Arpeggio Knowledge', estimatedTime: '3-5 min', tags: ['arpeggio', 'minor7', 'jazz'] },
  'arp-dom7': { name: 'Dominant 7th Arpeggio', description: 'Dominant 7th arpeggio (R, 3, 5, b7) for blues and jazz', difficulty: 3, focus: 'Arpeggio Knowledge', estimatedTime: '3-5 min', tags: ['arpeggio', 'dom7', 'blues'] },
  'arp-maj7': { name: 'Major 7th Arpeggio', description: 'Major 7th arpeggio (R, 3, 5, 7) for jazz and melody', difficulty: 3, focus: 'Arpeggio Knowledge', estimatedTime: '3-5 min', tags: ['arpeggio', 'maj7', 'jazz'] },
  'arp-min9': { name: 'Minor 9th Arpeggio', description: 'Minor 9th arpeggio (R, b3, 5, b7, 9) for advanced harmony', difficulty: 5, focus: 'Arpeggio Knowledge', estimatedTime: '4-6 min', tags: ['arpeggio', 'min9', 'advanced'] },

  // ── Rhythm & Timing ──
  'rhythm-gallop': { name: 'Gallop Rhythm', description: 'Gallop rhythm pattern (long-short-short) for metal and rock', difficulty: 3, focus: 'Rhythm', estimatedTime: '3-5 min', tags: ['rhythm', 'gallop', 'metal'] },
  'rhythm-triplet': { name: 'Triplet Feel', description: 'Triplet feel exercise for swing and blues timing', difficulty: 2, focus: 'Rhythm', estimatedTime: '3-5 min', tags: ['rhythm', 'triplet', 'swing'] },
  'rhythm-dotted': { name: 'Dotted Rhythm', description: 'Dotted rhythm exercise for precise timing control', difficulty: 3, focus: 'Rhythm', estimatedTime: '3-5 min', tags: ['rhythm', 'dotted', 'timing'] },

  // ── Bending & Expression ──
  'bend-release': { name: 'Bend & Release', description: 'Bend up to target pitch then release back down', difficulty: 3, focus: 'Bending', estimatedTime: '3-5 min', tags: ['bend', 'release', 'expression'] },
  'bend-1step': { name: '1-Step Bend', description: 'Full step (2 fret) bend exercise for pitch accuracy', difficulty: 3, focus: 'Bending', estimatedTime: '3-5 min', tags: ['bend', '1-step', 'pitch'] },
  'bend-1half': { name: '1.5-Step Bend', description: 'One and a half step (3 fret) bend for advanced control', difficulty: 4, focus: 'Bending', estimatedTime: '3-5 min', tags: ['bend', '1.5-step', 'advanced'] },

  // ── Harmonics ──
  'harmonics-tap': { name: 'Tapped Harmonics', description: 'Tapped harmonics exercise — tap fret 12 above each note', difficulty: 4, focus: 'Harmonics', estimatedTime: '3-5 min', tags: ['harmonics', 'tapped', 'advanced'] },
  'harmonics-pinch-scale': { name: 'Pinch Harmonic Scale', description: 'Pinch harmonics played along a scale for consistent squeals', difficulty: 4, focus: 'Harmonics', estimatedTime: '3-5 min', tags: ['harmonics', 'pinch', 'scale'] },

  // ── Tapping ──
  'tap-8finger': { name: '8-Finger Tapping', description: 'Eight-finger tapping exercise using both hands on fretboard', difficulty: 5, focus: 'Tapping', estimatedTime: '5-8 min', tags: ['tapping', '8-finger', 'advanced'] },
  'tap-sweep': { name: 'Sweep Tapping', description: 'Sweep picking combined with tapping for extended arpeggios', difficulty: 5, focus: 'Tapping', estimatedTime: '4-6 min', tags: ['tapping', 'sweep', 'combination'] },
  'tap-tap-pull': { name: 'Tap-Pull Combination', description: 'Tap then pull-off combination pattern for fluid tapping', difficulty: 4, focus: 'Tapping', estimatedTime: '3-5 min', tags: ['tapping', 'pull-off', 'combination'] },

  // ── Blues ──
  'blues-lick-1': { name: 'Blues Lick 1', description: 'Classic blues lick pattern using bends and slides', difficulty: 3, focus: 'Blues Vocabulary', estimatedTime: '3-5 min', tags: ['blues', 'lick', 'vocabulary'] },
  'blues-lick-2': { name: 'Blues Lick 2', description: 'Blues lick with triplet feel and double stops', difficulty: 3, focus: 'Blues Vocabulary', estimatedTime: '3-5 min', tags: ['blues', 'lick', 'double-stops'] },
  'blues-turnaround': { name: 'Blues Turnaround', description: 'Classic blues turnaround at the end of a 12-bar progression', difficulty: 3, focus: 'Blues Vocabulary', estimatedTime: '3-5 min', tags: ['blues', 'turnaround', 'progression'] },

  // ── Fretboard Knowledge ──
  'caged-shapes': { name: 'CAGED Shapes', description: 'All CAGED chord shapes exercise for fretboard mastery', difficulty: 3, focus: 'Fretboard Knowledge', estimatedTime: '4-6 min', tags: ['caged', 'shapes', 'fretboard'] },
  'note-triplets': { name: 'Note Triplets', description: 'Find the same note on 3 different strings across the fretboard', difficulty: 3, focus: 'Fretboard Knowledge', estimatedTime: '3-5 min', tags: ['notes', 'triplets', 'navigation'] },
  'relative-note': { name: 'Relative Note Finder', description: 'Find relative major/minor across the fretboard', difficulty: 3, focus: 'Fretboard Knowledge', estimatedTime: '3-5 min', tags: ['relative', 'major-minor', 'theory'] },
  'fretboard-map': { name: 'Fretboard Map', description: 'Full fretboard note mapping drill for complete memorization', difficulty: 2, focus: 'Fretboard Knowledge', estimatedTime: '5-8 min', tags: ['fretboard', 'map', 'memorization'] },

  // ── Speed & Agility ──
  'speed-ladder': { name: 'Speed Ladder', description: 'Progressive tempo exercise building speed incrementally', difficulty: 3, focus: 'Speed', estimatedTime: '5-8 min', tags: ['speed', 'ladder', 'progressive'] },
  'speed-burst-16th': { name: '16th Note Speed Burst', description: '16th note speed bursts for maximum picking velocity', difficulty: 4, focus: 'Speed', estimatedTime: '3-5 min', tags: ['speed', '16th', 'burst'] },
  'speed-triplet-run': { name: 'Triplet Speed Run', description: 'Triplet speed runs for fluid 3-note-per-string patterns', difficulty: 4, focus: 'Speed', estimatedTime: '3-5 min', tags: ['speed', 'triplet', '3nps'] },

  // ── Complete Chromatic Permutations (remaining 14 of 24) ──
  'chromatic-1243': { name: 'Chromatic 1-2-4-3', description: 'Chromatic permutation 1-2-4-3 for finger independence', difficulty: 2, focus: 'Finger Independence', estimatedTime: '2-4 min', tags: ['warmup', 'chromatic', 'permutation'] },
  'chromatic-1342': { name: 'Chromatic 1-3-4-2', description: 'Chromatic permutation 1-3-4-2 for finger independence', difficulty: 2, focus: 'Finger Independence', estimatedTime: '2-4 min', tags: ['warmup', 'chromatic', 'permutation'] },
  'chromatic-1432': { name: 'Chromatic 1-4-3-2', description: 'Chromatic permutation 1-4-3-2 for finger independence', difficulty: 2, focus: 'Finger Independence', estimatedTime: '2-4 min', tags: ['warmup', 'chromatic', 'permutation'] },
  'chromatic-2134': { name: 'Chromatic 2-1-3-4', description: 'Chromatic permutation 2-1-3-4 for finger independence', difficulty: 2, focus: 'Finger Independence', estimatedTime: '2-4 min', tags: ['warmup', 'chromatic', 'permutation'] },
  'chromatic-2143': { name: 'Chromatic 2-1-4-3', description: 'Chromatic permutation 2-1-4-3 for finger independence', difficulty: 3, focus: 'Finger Independence', estimatedTime: '2-4 min', tags: ['warmup', 'chromatic', 'permutation'] },
  'chromatic-2314': { name: 'Chromatic 2-3-1-4', description: 'Chromatic permutation 2-3-1-4 for finger independence', difficulty: 3, focus: 'Finger Independence', estimatedTime: '2-4 min', tags: ['warmup', 'chromatic', 'permutation'] },
  'chromatic-2431': { name: 'Chromatic 2-4-3-1', description: 'Chromatic permutation 2-4-3-1 for finger independence', difficulty: 3, focus: 'Finger Independence', estimatedTime: '2-4 min', tags: ['warmup', 'chromatic', 'permutation'] },
  'chromatic-3124': { name: 'Chromatic 3-1-2-4', description: 'Chromatic permutation 3-1-2-4 for finger independence', difficulty: 3, focus: 'Finger Independence', estimatedTime: '2-4 min', tags: ['warmup', 'chromatic', 'permutation'] },
  'chromatic-3214': { name: 'Chromatic 3-2-1-4', description: 'Chromatic permutation 3-2-1-4 for finger independence', difficulty: 3, focus: 'Finger Independence', estimatedTime: '2-4 min', tags: ['warmup', 'chromatic', 'permutation'] },
  'chromatic-3412': { name: 'Chromatic 3-4-1-2', description: 'Chromatic permutation 3-4-1-2 for finger independence', difficulty: 3, focus: 'Finger Independence', estimatedTime: '2-4 min', tags: ['warmup', 'chromatic', 'permutation'] },
  'chromatic-3421': { name: 'Chromatic 3-4-2-1', description: 'Chromatic permutation 3-4-2-1 for finger independence', difficulty: 3, focus: 'Finger Independence', estimatedTime: '2-4 min', tags: ['warmup', 'chromatic', 'permutation'] },
  'chromatic-4123': { name: 'Chromatic 4-1-2-3', description: 'Chromatic permutation 4-1-2-3 for finger independence', difficulty: 3, focus: 'Finger Independence', estimatedTime: '2-4 min', tags: ['warmup', 'chromatic', 'permutation'] },
  'chromatic-4213': { name: 'Chromatic 4-2-1-3', description: 'Chromatic permutation 4-2-1-3 for finger independence', difficulty: 3, focus: 'Finger Independence', estimatedTime: '2-4 min', tags: ['warmup', 'chromatic', 'permutation'] },
  'chromatic-4231': { name: 'Chromatic 4-2-3-1', description: 'Chromatic permutation 4-2-3-1 for finger independence', difficulty: 3, focus: 'Finger Independence', estimatedTime: '2-4 min', tags: ['warmup', 'chromatic', 'permutation'] },

  // ── Finger Independence Drills ──
  'finger-1-2-1-3': { name: 'Finger 1-2-1-3 Drill', description: 'Alternating finger pairs for independence between index-middle and index-ring', difficulty: 2, focus: 'Finger Independence', estimatedTime: '2-3 min', tags: ['finger', 'independence', 'drill'] },
  'finger-1-2-1-4': { name: 'Finger 1-2-1-4 Drill', description: 'Alternating finger pairs for independence between index-middle and index-pinky', difficulty: 2, focus: 'Finger Independence', estimatedTime: '2-3 min', tags: ['finger', 'independence', 'drill'] },
  'finger-1-3-1-4': { name: 'Finger 1-3-1-4 Drill', description: 'Alternating finger pairs for independence between index-ring and index-pinky', difficulty: 3, focus: 'Finger Independence', estimatedTime: '2-3 min', tags: ['finger', 'independence', 'drill'] },
  'finger-2-1-2-3': { name: 'Finger 2-1-2-3 Drill', description: 'Alternating middle-index and middle-ring for finger control', difficulty: 2, focus: 'Finger Independence', estimatedTime: '2-3 min', tags: ['finger', 'independence', 'drill'] },
  'finger-2-1-2-4': { name: 'Finger 2-1-2-4 Drill', description: 'Alternating middle-index and middle-pinky for finger control', difficulty: 3, focus: 'Finger Independence', estimatedTime: '2-3 min', tags: ['finger', 'independence', 'drill'] },
  'finger-3-1-3-2': { name: 'Finger 3-1-3-2 Drill', description: 'Alternating ring-index and ring-middle for dexterity', difficulty: 3, focus: 'Finger Independence', estimatedTime: '2-3 min', tags: ['finger', 'independence', 'drill'] },

  // ── Open String Exercises ──
  'open-string-alternate': { name: 'Open String Alternate Picking', description: 'Alternate pick across open strings for picking hand coordination', difficulty: 1, focus: 'Picking Hand', estimatedTime: '2-3 min', tags: ['open-string', 'picking', 'basics'] },
  'open-string-fret-combo': { name: 'Open + Fret Combo', description: 'Combine open strings with fretted notes for coordination', difficulty: 2, focus: 'Coordination', estimatedTime: '2-4 min', tags: ['open-string', 'fretted', 'coordination'] },
  'open-string-bass-run': { name: 'Open String Bass Run', description: 'Bass-style runs using open strings on low E and A', difficulty: 2, focus: 'Bass Lines', estimatedTime: '2-3 min', tags: ['open-string', 'bass', 'rhythm'] },
  'open-string-arpeggio': { name: 'Open String Arpeggio', description: 'Arpeggiated patterns using open strings as pedal tones', difficulty: 2, focus: 'Arpeggiation', estimatedTime: '2-4 min', tags: ['open-string', 'arpeggio', 'fingerstyle'] },

  // ── Chord Exercises ──
  'chord-triad-asc': { name: 'Triad Chords Ascending', description: 'Play triad chord shapes ascending through scale degrees', difficulty: 3, focus: 'Chord Vocabulary', estimatedTime: '3-5 min', tags: ['chord', 'triad', 'harmony'] },
  'chord-triad-desc': { name: 'Triad Chords Descending', description: 'Play triad chord shapes descending through scale degrees', difficulty: 3, focus: 'Chord Vocabulary', estimatedTime: '3-5 min', tags: ['chord', 'triad', 'harmony'] },
  'chord-power-5th': { name: 'Power Fifth Shapes', description: 'Power chord (root-fifth) shapes across the fretboard', difficulty: 1, focus: 'Chord Shapes', estimatedTime: '2-3 min', tags: ['chord', 'power', 'rock'] },
  'chord-shell-comping': { name: 'Shell Voicing Comping', description: 'Shell voicings (root-3rd-7th) for jazz comping style', difficulty: 4, focus: 'Jazz Comping', estimatedTime: '3-5 min', tags: ['chord', 'shell', 'jazz'] },
  'chord-barre-drill': { name: 'Barre Chord Drill', description: 'Move barre chord shapes up and down the neck for strength', difficulty: 2, focus: 'Hand Strength', estimatedTime: '3-5 min', tags: ['chord', 'barre', 'strength'] },

  // ── Sliding Exercises ──
  'slide-up-1fret': { name: 'Slide Up 1 Fret', description: 'Slide up one fret between scale notes for legato connection', difficulty: 2, focus: 'Sliding', estimatedTime: '2-3 min', tags: ['slide', 'legato', 'technique'] },
  'slide-up-2fret': { name: 'Slide Up 2 Frets', description: 'Slide up two frets between scale notes for wider slides', difficulty: 2, focus: 'Sliding', estimatedTime: '2-3 min', tags: ['slide', 'legato', 'technique'] },
  'slide-down-1fret': { name: 'Slide Down 1 Fret', description: 'Slide down one fret between scale notes for descending legato', difficulty: 2, focus: 'Sliding', estimatedTime: '2-3 min', tags: ['slide', 'legato', 'technique'] },

  // ── String Skip Advanced ──
  'string-skip-3rd': { name: 'Skip 3rd String', description: 'Play patterns skipping the 3rd string for wide string leaps', difficulty: 3, focus: 'String Skipping', estimatedTime: '3-5 min', tags: ['string-skip', 'advanced', 'dexterity'] },
  'string-skip-4th': { name: 'Skip 4th String', description: 'Play patterns skipping the 4th string for coordination', difficulty: 3, focus: 'String Skipping', estimatedTime: '3-5 min', tags: ['string-skip', 'advanced', 'dexterity'] },
  'string-skip-octave': { name: 'Octave String Skip', description: 'Jump between octave notes on different strings', difficulty: 3, focus: 'String Skipping', estimatedTime: '3-5 min', tags: ['string-skip', 'octave', 'intervals'] },
  'string-skip-scale': { name: 'Scale String Skip', description: 'Play scale with alternating string skips for fretboard freedom', difficulty: 4, focus: 'String Skipping', estimatedTime: '3-5 min', tags: ['string-skip', 'scale', 'freedom'] },

  // ── Modal Exercises ──
  'modal-dorian-run': { name: 'Dorian Modal Run', description: 'Characteristic Dorian run emphasizing the natural 6th', difficulty: 3, focus: 'Modal Playing', estimatedTime: '3-5 min', tags: ['modal', 'dorian', 'jazz'] },
  'modal-mixolydian-run': { name: 'Mixolydian Modal Run', description: 'Characteristic Mixolydian run emphasizing the flat 7th', difficulty: 3, focus: 'Modal Playing', estimatedTime: '3-5 min', tags: ['modal', 'mixolydian', 'dominant'] },
  'modal-lydian-run': { name: 'Lydian Modal Run', description: 'Characteristic Lydian run emphasizing the sharp 4th', difficulty: 3, focus: 'Modal Playing', estimatedTime: '3-5 min', tags: ['modal', 'lydian', 'dreamy'] },
  'modal-phrygian-run': { name: 'Phrygian Modal Run', description: 'Characteristic Phrygian run emphasizing the flat 2nd', difficulty: 3, focus: 'Modal Playing', estimatedTime: '3-5 min', tags: ['modal', 'phrygian', 'flamenco'] },

  // ── Blues Extended ──
  'blues-shuffle': { name: 'Blues Shuffle Pattern', description: 'Classic blues shuffle rhythm pattern with swing feel', difficulty: 2, focus: 'Blues Rhythm', estimatedTime: '3-5 min', tags: ['blues', 'shuffle', 'rhythm'] },
  'blues-bend-lick': { name: 'Blues Bend Lick', description: 'Essential blues bending lick with quarter-step bends', difficulty: 3, focus: 'Blues Expression', estimatedTime: '3-5 min', tags: ['blues', 'bend', 'expression'] },
  'blues-rake': { name: 'Blues Rake', description: 'Muted string rake into target note for percussive attack', difficulty: 3, focus: 'Blues Technique', estimatedTime: '2-3 min', tags: ['blues', 'rake', 'percussive'] },
  'blues-grace-note': { name: 'Blues Grace Notes', description: 'Quick hammer-on/pull-off grace notes before main notes', difficulty: 3, focus: 'Blues Vocabulary', estimatedTime: '2-3 min', tags: ['blues', 'grace', 'ornament'] },

  // ── Picking Drills ──
  'alt-pick-1string': { name: 'Alt Pick 1 String', description: 'Alternate picking drill on a single string for precision', difficulty: 2, focus: 'Alternate Picking', estimatedTime: '2-3 min', tags: ['picking', 'alternate', 'precision'] },
  'alt-pick-2string': { name: 'Alt Pick 2 Strings', description: 'Alternate picking across two adjacent strings', difficulty: 2, focus: 'Alternate Picking', estimatedTime: '2-3 min', tags: ['picking', 'alternate', 'crossing'] },
  'sweep-pick-drill': { name: 'Sweep Pick Drill', description: 'Basic sweep picking motion across multiple strings', difficulty: 3, focus: 'Sweep Picking', estimatedTime: '3-5 min', tags: ['picking', 'sweep', 'arpeggio'] },
  'cross-pick-drill': { name: 'Cross Picking Drill', description: 'Cross-picking pattern across three strings for bluegrass style', difficulty: 3, focus: 'Cross Picking', estimatedTime: '3-5 min', tags: ['picking', 'cross', 'bluegrass'] },

  // ── Tremolo & Trill ──
  'tremolo-single': { name: 'Single String Tremolo', description: 'Rapid repeated picking on a single note for tremolo control', difficulty: 3, focus: 'Tremolo', estimatedTime: '2-3 min', tags: ['tremolo', 'speed', 'control'] },
  'tremolo-chord': { name: 'Chord Tremolo', description: 'Tremolo across a chord shape for fingerstyle technique', difficulty: 4, focus: 'Tremolo', estimatedTime: '2-4 min', tags: ['tremolo', 'chord', 'fingerstyle'] },
  'trill-speed-drill': { name: 'Trill Speed Drill', description: 'Fast hammer-pull trills between adjacent fingers for speed', difficulty: 3, focus: 'Trill Speed', estimatedTime: '2-3 min', tags: ['trill', 'speed', 'legato'] },

  // ── Stretch Exercises ──
  'stretch-1-4-1fret': { name: '1-4 Stretch (1 Fret)', description: 'Index to pinky stretch with 1-fret gap between', difficulty: 2, focus: 'Stretching', estimatedTime: '2-3 min', tags: ['stretch', 'reach', 'warmup'] },
  'stretch-1-4-2fret': { name: '1-4 Stretch (2 Fret)', description: 'Index to pinky stretch with 2-fret gap between', difficulty: 3, focus: 'Stretching', estimatedTime: '2-3 min', tags: ['stretch', 'reach', 'warmup'] },
  'stretch-wide-1-4': { name: 'Wide 1-4 Stretch', description: 'Maximum index-to-pinky stretch across 4+ frets', difficulty: 4, focus: 'Stretching', estimatedTime: '2-3 min', tags: ['stretch', 'wide', 'advanced'] },

  // ── Odd Groupings ──
  'grouping-5': { name: '5-Note Groupings', description: 'Play scale in groups of 5 for rhythmic independence', difficulty: 4, focus: 'Rhythmic Freedom', estimatedTime: '3-5 min', tags: ['grouping', 'rhythm', 'advanced'] },
  'grouping-7': { name: '7-Note Groupings', description: 'Play scale in groups of 7 for advanced rhythmic control', difficulty: 5, focus: 'Rhythmic Freedom', estimatedTime: '3-5 min', tags: ['grouping', 'rhythm', 'advanced'] },
  'grouping-9': { name: '9-Note Groupings', description: 'Extended grouping of 9 for ultimate rhythmic mastery', difficulty: 5, focus: 'Rhythmic Freedom', estimatedTime: '4-6 min', tags: ['grouping', 'rhythm', 'mastery'] },
  'rhythmic-displacement': { name: 'Rhythmic Displacement', description: 'Play the same phrase starting on different beats', difficulty: 4, focus: 'Timing', estimatedTime: '3-5 min', tags: ['rhythm', 'displacement', 'phrasing'] },
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
    if (['chromatic-1234', 'chromatic-4321', 'chromatic-1324', 'chromatic-1423', 'chromatic-2413', 'finger-stretch', 'chromatic-2341', 'chromatic-3142', 'chromatic-4132', 'chromatic-3241', 'chromatic-desc-warmup', 'chromatic-all-strings'].includes(typeId)) {
      addVariation({ id: `${typeId}-extended`, typeId, variantName: 'Extended', suffix: 'Ext', modifier: 'extended' });
      addVariation({ id: `${typeId}-compact`, typeId, variantName: 'Compact', suffix: 'Cmp', modifier: 'compact' });
    }

    // Spider exercises: extended + reverse
    if (['chromatic-spider-walk', 'spider-cross-1', 'spider-cross-2', 'spider-inward', 'spider-outward'].includes(typeId)) {
      addVariation({ id: `${typeId}-extended`, typeId, variantName: 'Extended', suffix: 'Ext', modifier: 'extended' });
      addVariation({ id: `${typeId}-reverse`, typeId, variantName: 'Reverse', suffix: 'Rev', modifier: 'reverse' });
    }

    // String crossing: extended + reverse
    if (['string-cross-asc', 'string-cross-desc', 'string-cross-skip', 'string-cross-alternate'].includes(typeId)) {
      addVariation({ id: `${typeId}-extended`, typeId, variantName: 'Extended', suffix: 'Ext', modifier: 'extended' });
      addVariation({ id: `${typeId}-reverse`, typeId, variantName: 'Reverse', suffix: 'Rev', modifier: 'reverse' });
    }

    // Sweep picking: extended + inverted
    if (['sweep-3string', 'sweep-5string', 'sweep-minor', 'sweep-major'].includes(typeId)) {
      addVariation({ id: `${typeId}-extended`, typeId, variantName: 'Extended', suffix: 'Ext', modifier: 'extended' });
      addVariation({ id: `${typeId}-inverted`, typeId, variantName: 'Inverted', suffix: 'Inv', modifier: 'inverted' });
    }

    // Legato: extended + reverse
    if (['legato-hammer-asc', 'legato-hammer-desc', 'legato-pull-asc', 'legato-pull-desc', 'legato-trill'].includes(typeId)) {
      addVariation({ id: `${typeId}-extended`, typeId, variantName: 'Extended', suffix: 'Ext', modifier: 'extended' });
      addVariation({ id: `${typeId}-reverse`, typeId, variantName: 'Reverse', suffix: 'Rev', modifier: 'reverse' });
    }

    // Position shifting: extended
    if (['pos-shift-1-fret', 'pos-shift-2-fret', 'pos-shift-3-fret'].includes(typeId)) {
      addVariation({ id: `${typeId}-extended`, typeId, variantName: 'Extended', suffix: 'Ext', modifier: 'extended' });
    }

    // New scale patterns: extended + reverse
    if (['scale-2nps', 'scale-4nps', 'scale-offset-run', 'scale-spiral', 'scale-box-run'].includes(typeId)) {
      addVariation({ id: `${typeId}-extended`, typeId, variantName: 'Extended', suffix: 'Ext', modifier: 'extended' });
      addVariation({ id: `${typeId}-reverse`, typeId, variantName: 'Reverse', suffix: 'Rev', modifier: 'reverse' });
    }

    // New interval studies: inverted + compact
    if (['intervals-octave', 'intervals-tritone', 'intervals-compound', 'intervals-chromatic'].includes(typeId)) {
      addVariation({ id: `${typeId}-inverted`, typeId, variantName: 'Inverted', suffix: 'Inv', modifier: 'inverted' });
      addVariation({ id: `${typeId}-compact`, typeId, variantName: 'Compact', suffix: 'Cmp', modifier: 'compact' });
    }

    // New arpeggio studies: extended + inverted
    if (['arp-diminished', 'arp-augmented', 'arp-minor7', 'arp-dom7', 'arp-maj7', 'arp-min9'].includes(typeId)) {
      addVariation({ id: `${typeId}-extended`, typeId, variantName: 'Extended', suffix: 'Ext', modifier: 'extended' });
      addVariation({ id: `${typeId}-inverted`, typeId, variantName: 'Inverted', suffix: 'Inv', modifier: 'inverted' });
    }

    // New rhythm: extended + compact
    if (['rhythm-gallop', 'rhythm-triplet', 'rhythm-dotted'].includes(typeId)) {
      addVariation({ id: `${typeId}-extended`, typeId, variantName: 'Extended', suffix: 'Ext', modifier: 'extended' });
      addVariation({ id: `${typeId}-compact`, typeId, variantName: 'Compact', suffix: 'Cmp', modifier: 'compact' });
    }

    // New bending: extended
    if (['bend-release', 'bend-1step', 'bend-1half'].includes(typeId)) {
      addVariation({ id: `${typeId}-extended`, typeId, variantName: 'Extended', suffix: 'Ext', modifier: 'extended' });
    }

    // New harmonics: extended
    if (['harmonics-tap', 'harmonics-pinch-scale'].includes(typeId)) {
      addVariation({ id: `${typeId}-extended`, typeId, variantName: 'Extended', suffix: 'Ext', modifier: 'extended' });
    }

    // New tapping: extended + reverse
    if (['tap-8finger', 'tap-sweep', 'tap-tap-pull'].includes(typeId)) {
      addVariation({ id: `${typeId}-extended`, typeId, variantName: 'Extended', suffix: 'Ext', modifier: 'extended' });
      addVariation({ id: `${typeId}-reverse`, typeId, variantName: 'Reverse', suffix: 'Rev', modifier: 'reverse' });
    }

    // Blues: extended + reverse
    if (['blues-lick-1', 'blues-lick-2', 'blues-turnaround'].includes(typeId)) {
      addVariation({ id: `${typeId}-extended`, typeId, variantName: 'Extended', suffix: 'Ext', modifier: 'extended' });
      addVariation({ id: `${typeId}-reverse`, typeId, variantName: 'Reverse', suffix: 'Rev', modifier: 'reverse' });
    }

    // Fretboard knowledge: extended + compact
    if (['caged-shapes', 'note-triplets', 'relative-note', 'fretboard-map'].includes(typeId)) {
      addVariation({ id: `${typeId}-extended`, typeId, variantName: 'Extended', suffix: 'Ext', modifier: 'extended' });
      addVariation({ id: `${typeId}-compact`, typeId, variantName: 'Compact', suffix: 'Cmp', modifier: 'compact' });
    }

    // Speed & agility: extended + reverse
    if (['speed-ladder', 'speed-burst-16th', 'speed-triplet-run'].includes(typeId)) {
      addVariation({ id: `${typeId}-extended`, typeId, variantName: 'Extended', suffix: 'Ext', modifier: 'extended' });
      addVariation({ id: `${typeId}-reverse`, typeId, variantName: 'Reverse', suffix: 'Rev', modifier: 'reverse' });
    }

    // New chromatic permutations: extended + compact
    if (typeId.startsWith('chromatic-1') || typeId.startsWith('chromatic-2') || typeId.startsWith('chromatic-3') || typeId.startsWith('chromatic-4')) {
      if (!['chromatic-warmup', 'chromatic-enclosure', 'scale-chromatic-passing', 'chromatic-desc-warmup', 'chromatic-all-strings', 'chromatic-spider-walk'].includes(typeId)) {
        addVariation({ id: `${typeId}-extended`, typeId, variantName: 'Extended', suffix: 'Ext', modifier: 'extended' });
        addVariation({ id: `${typeId}-compact`, typeId, variantName: 'Compact', suffix: 'Cmp', modifier: 'compact' });
      }
    }

    // Finger independence drills: extended + reverse
    if (typeId.startsWith('finger-')) {
      addVariation({ id: `${typeId}-extended`, typeId, variantName: 'Extended', suffix: 'Ext', modifier: 'extended' });
      addVariation({ id: `${typeId}-reverse`, typeId, variantName: 'Reverse', suffix: 'Rev', modifier: 'reverse' });
    }

    // Open string exercises: extended
    if (typeId.startsWith('open-string-')) {
      addVariation({ id: `${typeId}-extended`, typeId, variantName: 'Extended', suffix: 'Ext', modifier: 'extended' });
    }

    // Chord exercises: inverted + compact
    if (typeId.startsWith('chord-')) {
      addVariation({ id: `${typeId}-inverted`, typeId, variantName: 'Inverted', suffix: 'Inv', modifier: 'inverted' });
      addVariation({ id: `${typeId}-compact`, typeId, variantName: 'Compact', suffix: 'Cmp', modifier: 'compact' });
    }

    // Slide exercises: extended + reverse
    if (typeId.startsWith('slide-')) {
      addVariation({ id: `${typeId}-extended`, typeId, variantName: 'Extended', suffix: 'Ext', modifier: 'extended' });
      addVariation({ id: `${typeId}-reverse`, typeId, variantName: 'Reverse', suffix: 'Rev', modifier: 'reverse' });
    }

    // Advanced string skipping: extended + reverse
    if (typeId.startsWith('string-skip-') && !['string-skip'].includes(typeId)) {
      addVariation({ id: `${typeId}-extended`, typeId, variantName: 'Extended', suffix: 'Ext', modifier: 'extended' });
      addVariation({ id: `${typeId}-reverse`, typeId, variantName: 'Reverse', suffix: 'Rev', modifier: 'reverse' });
    }

    // Modal runs: extended + reverse
    if (typeId.startsWith('modal-')) {
      addVariation({ id: `${typeId}-extended`, typeId, variantName: 'Extended', suffix: 'Ext', modifier: 'extended' });
      addVariation({ id: `${typeId}-reverse`, typeId, variantName: 'Reverse', suffix: 'Rev', modifier: 'reverse' });
    }

    // Blues extended: extended + reverse
    if (['blues-shuffle', 'blues-bend-lick', 'blues-rake', 'blues-grace-note'].includes(typeId)) {
      addVariation({ id: `${typeId}-extended`, typeId, variantName: 'Extended', suffix: 'Ext', modifier: 'extended' });
      addVariation({ id: `${typeId}-reverse`, typeId, variantName: 'Reverse', suffix: 'Rev', modifier: 'reverse' });
    }

    // Picking drills: extended + reverse
    if (['alt-pick-1string', 'alt-pick-2string', 'sweep-pick-drill', 'cross-pick-drill'].includes(typeId)) {
      addVariation({ id: `${typeId}-extended`, typeId, variantName: 'Extended', suffix: 'Ext', modifier: 'extended' });
      addVariation({ id: `${typeId}-reverse`, typeId, variantName: 'Reverse', suffix: 'Rev', modifier: 'reverse' });
    }

    // Tremolo & trill: extended + reverse
    if (['tremolo-single', 'tremolo-chord', 'trill-speed-drill'].includes(typeId)) {
      addVariation({ id: `${typeId}-extended`, typeId, variantName: 'Extended', suffix: 'Ext', modifier: 'extended' });
      addVariation({ id: `${typeId}-reverse`, typeId, variantName: 'Reverse', suffix: 'Rev', modifier: 'reverse' });
    }

    // Stretch exercises: extended + compact
    if (typeId.startsWith('stretch-')) {
      addVariation({ id: `${typeId}-extended`, typeId, variantName: 'Extended', suffix: 'Ext', modifier: 'extended' });
      addVariation({ id: `${typeId}-compact`, typeId, variantName: 'Compact', suffix: 'Cmp', modifier: 'compact' });
    }

    // Odd groupings: extended + reverse
    if (['grouping-5', 'grouping-7', 'grouping-9', 'rhythmic-displacement'].includes(typeId)) {
      addVariation({ id: `${typeId}-extended`, typeId, variantName: 'Extended', suffix: 'Ext', modifier: 'extended' });
      addVariation({ id: `${typeId}-reverse`, typeId, variantName: 'Reverse', suffix: 'Rev', modifier: 'reverse' });
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
  { id: 'ext-warmups', label: 'Chromatic Drills', section: 'WARMUP', types: ['chromatic-1234', 'chromatic-4321', 'chromatic-1324', 'chromatic-1423', 'chromatic-2413', 'finger-stretch', 'chromatic-2341', 'chromatic-3142', 'chromatic-4132', 'chromatic-3241', 'chromatic-desc-warmup', 'chromatic-all-strings'] },
  { id: 'spider-exercises', label: 'Spider Exercises', section: 'TECHNIQUE', types: ['chromatic-spider-walk', 'spider-cross-1', 'spider-cross-2', 'spider-inward', 'spider-outward'] },
  { id: 'string-crossing', label: 'String Crossing', section: 'TECHNIQUE', types: ['string-cross-asc', 'string-cross-desc', 'string-cross-skip', 'string-cross-alternate'] },
  { id: 'sweep-picking', label: 'Sweep Picking', section: 'TECHNIQUE', types: ['sweep-3string', 'sweep-5string', 'sweep-minor', 'sweep-major'] },
  { id: 'legato', label: 'Legato', section: 'TECHNIQUE', types: ['legato-hammer-asc', 'legato-hammer-desc', 'legato-pull-asc', 'legato-pull-desc', 'legato-trill'] },
  { id: 'position-shifting', label: 'Position Shifting', section: 'TECHNIQUE', types: ['pos-shift-1-fret', 'pos-shift-2-fret', 'pos-shift-3-fret'] },
  { id: 'scale-patterns', label: 'Scale Patterns', section: 'PRACTICE', types: ['scale-2nps', 'scale-4nps', 'scale-offset-run', 'scale-spiral', 'scale-box-run'] },
  { id: 'interval-studies', label: 'Interval Studies', section: 'ADVANCED', types: ['intervals-octave', 'intervals-tritone', 'intervals-compound', 'intervals-chromatic'] },
  { id: 'arp-studies', label: 'Arpeggio Studies', section: 'ADVANCED', types: ['arp-diminished', 'arp-augmented', 'arp-minor7', 'arp-dom7', 'arp-maj7', 'arp-min9'] },
  { id: 'rhythm-timing', label: 'Rhythm & Timing', section: 'PRACTICE', types: ['rhythm-gallop', 'rhythm-triplet', 'rhythm-dotted'] },
  { id: 'bend-expression', label: 'Bending & Expression', section: 'TECHNIQUE', types: ['bend-release', 'bend-1step', 'bend-1half'] },
  { id: 'harmonics-ext', label: 'Adv. Harmonics', section: 'TECHNIQUE', types: ['harmonics-tap', 'harmonics-pinch-scale'] },
  { id: 'tapping-ext', label: 'Adv. Tapping', section: 'TECHNIQUE', types: ['tap-8finger', 'tap-sweep', 'tap-tap-pull'] },
  { id: 'blues', label: 'Blues', section: 'PRACTICE', types: ['blues-lick-1', 'blues-lick-2', 'blues-turnaround'] },
  { id: 'fretboard-knowledge', label: 'Fretboard Knowledge', section: 'ADVANCED', types: ['caged-shapes', 'note-triplets', 'relative-note', 'fretboard-map'] },
  { id: 'speed-agility', label: 'Speed & Agility', section: 'TECHNIQUE', types: ['speed-ladder', 'speed-burst-16th', 'speed-triplet-run'] },
  { id: 'chromatic-perms', label: 'Chromatic Permutations', section: 'WARMUP', types: ['chromatic-1243', 'chromatic-1342', 'chromatic-1432', 'chromatic-2134', 'chromatic-2143', 'chromatic-2314', 'chromatic-2431', 'chromatic-3124', 'chromatic-3214', 'chromatic-3412', 'chromatic-3421', 'chromatic-4123', 'chromatic-4213', 'chromatic-4231'] },
  { id: 'finger-independence', label: 'Finger Independence', section: 'TECHNIQUE', types: ['finger-1-2-1-3', 'finger-1-2-1-4', 'finger-1-3-1-4', 'finger-2-1-2-3', 'finger-2-1-2-4', 'finger-3-1-3-2'] },
  { id: 'open-strings', label: 'Open String Exercises', section: 'PRACTICE', types: ['open-string-alternate', 'open-string-fret-combo', 'open-string-bass-run', 'open-string-arpeggio'] },
  { id: 'chord-exercises', label: 'Chord Exercises', section: 'PRACTICE', types: ['chord-triad-asc', 'chord-triad-desc', 'chord-power-5th', 'chord-shell-comping', 'chord-barre-drill'] },
  { id: 'slide-exercises', label: 'Slide Exercises', section: 'TECHNIQUE', types: ['slide-up-1fret', 'slide-up-2fret', 'slide-down-1fret'] },
  { id: 'string-skip-adv', label: 'Adv. String Skipping', section: 'ADVANCED', types: ['string-skip-3rd', 'string-skip-4th', 'string-skip-octave', 'string-skip-scale'] },
  { id: 'modal-exercises', label: 'Modal Exercises', section: 'ADVANCED', types: ['modal-dorian-run', 'modal-mixolydian-run', 'modal-lydian-run', 'modal-phrygian-run'] },
  { id: 'blues-extended', label: 'Blues Extended', section: 'PRACTICE', types: ['blues-shuffle', 'blues-bend-lick', 'blues-rake', 'blues-grace-note'] },
  { id: 'picking-drills', label: 'Picking Drills', section: 'TECHNIQUE', types: ['alt-pick-1string', 'alt-pick-2string', 'sweep-pick-drill', 'cross-pick-drill'] },
  { id: 'tremolo-trill', label: 'Tremolo & Trill', section: 'TECHNIQUE', types: ['tremolo-single', 'tremolo-chord', 'trill-speed-drill'] },
  { id: 'stretch-exercises', label: 'Stretch Exercises', section: 'WARMUP', types: ['stretch-1-4-1fret', 'stretch-1-4-2fret', 'stretch-wide-1-4'] },
  { id: 'odd-groupings', label: 'Odd Groupings', section: 'ADVANCED', types: ['grouping-5', 'grouping-7', 'grouping-9', 'rhythmic-displacement'] },
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

// ─── NEW CHROMATIC DRILL GENERATORS ───

function generateChromaticDescWarmup(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const rootIndex = NOTES.indexOf(key);
  const warmupNotes: FretboardNote[] = [];
  for (let stringIdx = 5; stringIdx >= 0; stringIdx--) {
    const openNote = STRING_OPEN_NOTES[stringIdx];
    const openIdx = NOTES.indexOf(openNote);
    const baseFret = Math.max(startFret, 4);
    for (let base = baseFret; base <= Math.min(endFret, startFret + 7); base += 4) {
      for (let offset = 3; offset >= 0; offset--) {
        const f = base + offset - 3;
        if (f < startFret || f > endFret) continue;
        const noteIdx = (openIdx + f) % 12;
        const intervalFromRoot = (noteIdx - rootIndex + 12) % 12;
        warmupNotes.push({
          string: stringIdx, fret: f, note: NOTES[noteIdx],
          interval: intervalFromRoot, intervalLabel: intervalFromRoot === 0 ? 'R' : `${intervalFromRoot}`,
          isRoot: intervalFromRoot === 0,
        });
      }
    }
  }
  const allNotes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(allNotes));
  return makeExercise('chromatic-desc-warmup', warmupNotes.length >= 4 ? warmupNotes : sorted, sorted);
}

function generateChromaticAllStrings(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const rootIndex = NOTES.indexOf(key);
  const runNotes: FretboardNote[] = [];
  const maxFret = Math.min(endFret, startFret + 4);
  const minFret = Math.max(startFret, 1);
  // Ascending across all strings
  for (let stringIdx = 5; stringIdx >= 0; stringIdx--) {
    const openNote = STRING_OPEN_NOTES[stringIdx];
    const openIdx = NOTES.indexOf(openNote);
    for (let f = minFret; f <= maxFret; f++) {
      const noteIdx = (openIdx + f) % 12;
      const intervalFromRoot = (noteIdx - rootIndex + 12) % 12;
      runNotes.push({
        string: stringIdx, fret: f, note: NOTES[noteIdx],
        interval: intervalFromRoot, intervalLabel: intervalFromRoot === 0 ? 'R' : `${intervalFromRoot}`,
        isRoot: intervalFromRoot === 0,
      });
    }
  }
  // Descending across all strings
  for (let stringIdx = 0; stringIdx <= 5; stringIdx++) {
    const openNote = STRING_OPEN_NOTES[stringIdx];
    const openIdx = NOTES.indexOf(openNote);
    for (let f = maxFret; f >= minFret; f--) {
      const noteIdx = (openIdx + f) % 12;
      const intervalFromRoot = (noteIdx - rootIndex + 12) % 12;
      runNotes.push({
        string: stringIdx, fret: f, note: NOTES[noteIdx],
        interval: intervalFromRoot, intervalLabel: intervalFromRoot === 0 ? 'R' : `${intervalFromRoot}`,
        isRoot: intervalFromRoot === 0,
      });
    }
  }
  const allNotes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(allNotes));
  return makeExercise('chromatic-all-strings', runNotes.length >= 4 ? runNotes : sorted, sorted);
}

// ─── SPIDER EXERCISE GENERATORS ───

function generateSpiderWalkClassic(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const rootIndex = NOTES.indexOf(key);
  const spiderNotes: FretboardNote[] = [];
  const baseFret = Math.max(startFret, 1);
  // Finger 1 on string 5, finger 2 on string 4, finger 3 on string 3, finger 4 on string 2
  for (let finger = 0; finger < 4; finger++) {
    const stringIdx = 5 - finger;
    const f = baseFret + finger;
    if (f > endFret || stringIdx < 0) continue;
    const openNote = STRING_OPEN_NOTES[stringIdx];
    const openIdx = NOTES.indexOf(openNote);
    const noteIdx = (openIdx + f) % 12;
    const intervalFromRoot = (noteIdx - rootIndex + 12) % 12;
    spiderNotes.push({
      string: stringIdx, fret: f, note: NOTES[noteIdx],
      interval: intervalFromRoot, intervalLabel: intervalFromRoot === 0 ? 'R' : `${intervalFromRoot}`,
      isRoot: intervalFromRoot === 0,
    });
  }
  // Cross back: finger 4 on string 2, finger 3 on string 3, etc.
  for (let finger = 3; finger >= 0; finger--) {
    const stringIdx = 5 - finger;
    const f = baseFret + finger;
    if (f > endFret || stringIdx < 0) continue;
    const openNote = STRING_OPEN_NOTES[stringIdx];
    const openIdx = NOTES.indexOf(openNote);
    const noteIdx = (openIdx + f) % 12;
    const intervalFromRoot = (noteIdx - rootIndex + 12) % 12;
    spiderNotes.push({
      string: stringIdx, fret: f, note: NOTES[noteIdx],
      interval: intervalFromRoot, intervalLabel: intervalFromRoot === 0 ? 'R' : `${intervalFromRoot}`,
      isRoot: intervalFromRoot === 0,
    });
  }
  const allNotes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(allNotes));
  return makeExercise('chromatic-spider-walk', spiderNotes.length >= 4 ? spiderNotes : sorted, sorted);
}

function generateSpiderCross(key: NoteName, scaleId: string, startFret: number, endFret: number, direction: 'asc' | 'desc'): Exercise {
  const rootIndex = NOTES.indexOf(key);
  const spiderNotes: FretboardNote[] = [];
  const baseFret = Math.max(startFret, 1);
  const stringOrder = direction === 'asc' ? [5, 4, 3, 2] : [2, 3, 4, 5];
  // Multiple positions
  for (let pos = 0; pos < 3; pos++) {
    for (let i = 0; i < stringOrder.length; i++) {
      const stringIdx = stringOrder[i];
      const f = baseFret + i + pos * 2;
      if (f > endFret) continue;
      const openNote = STRING_OPEN_NOTES[stringIdx];
      const openIdx = NOTES.indexOf(openNote);
      const noteIdx = (openIdx + f) % 12;
      const intervalFromRoot = (noteIdx - rootIndex + 12) % 12;
      spiderNotes.push({
        string: stringIdx, fret: f, note: NOTES[noteIdx],
        interval: intervalFromRoot, intervalLabel: intervalFromRoot === 0 ? 'R' : `${intervalFromRoot}`,
        isRoot: intervalFromRoot === 0,
      });
    }
  }
  const allNotes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(allNotes));
  return makeExercise(direction === 'asc' ? 'spider-cross-1' : 'spider-cross-2', spiderNotes.length >= 4 ? spiderNotes : sorted, sorted);
}

function generateSpiderInward(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const rootIndex = NOTES.indexOf(key);
  const spiderNotes: FretboardNote[] = [];
  const baseFret = Math.max(startFret, 1);
  // Walk inward from outside strings: (5,0), (4,1), (3,2)
  const pairs = [[5, 0], [4, 1], [3, 2]];
  for (const [high, low] of pairs) {
    for (let pos = 0; pos < 2; pos++) {
      const f1 = baseFret + pos * 2;
      const f2 = baseFret + 1 + pos * 2;
      if (f1 > endFret || f2 > endFret) continue;
      const open1 = STRING_OPEN_NOTES[high];
      const idx1 = (NOTES.indexOf(open1) + f1) % 12;
      const iv1 = (idx1 - rootIndex + 12) % 12;
      spiderNotes.push({ string: high, fret: f1, note: NOTES[idx1], interval: iv1, intervalLabel: iv1 === 0 ? 'R' : `${iv1}`, isRoot: iv1 === 0 });
      const open2 = STRING_OPEN_NOTES[low];
      const idx2 = (NOTES.indexOf(open2) + f2) % 12;
      const iv2 = (idx2 - rootIndex + 12) % 12;
      spiderNotes.push({ string: low, fret: f2, note: NOTES[idx2], interval: iv2, intervalLabel: iv2 === 0 ? 'R' : `${iv2}`, isRoot: iv2 === 0 });
    }
  }
  const allNotes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(allNotes));
  return makeExercise('spider-inward', spiderNotes.length >= 4 ? spiderNotes : sorted, sorted);
}

function generateSpiderOutward(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const rootIndex = NOTES.indexOf(key);
  const spiderNotes: FretboardNote[] = [];
  const baseFret = Math.max(startFret, 1);
  // Walk outward from middle strings: (3,2), (4,1), (5,0)
  const pairs = [[3, 2], [4, 1], [5, 0]];
  for (const [high, low] of pairs) {
    for (let pos = 0; pos < 2; pos++) {
      const f1 = baseFret + pos * 2;
      const f2 = baseFret + 1 + pos * 2;
      if (f1 > endFret || f2 > endFret) continue;
      const open1 = STRING_OPEN_NOTES[high];
      const idx1 = (NOTES.indexOf(open1) + f1) % 12;
      const iv1 = (idx1 - rootIndex + 12) % 12;
      spiderNotes.push({ string: high, fret: f1, note: NOTES[idx1], interval: iv1, intervalLabel: iv1 === 0 ? 'R' : `${iv1}`, isRoot: iv1 === 0 });
      const open2 = STRING_OPEN_NOTES[low];
      const idx2 = (NOTES.indexOf(open2) + f2) % 12;
      const iv2 = (idx2 - rootIndex + 12) % 12;
      spiderNotes.push({ string: low, fret: f2, note: NOTES[idx2], interval: iv2, intervalLabel: iv2 === 0 ? 'R' : `${iv2}`, isRoot: iv2 === 0 });
    }
  }
  const allNotes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(allNotes));
  return makeExercise('spider-outward', spiderNotes.length >= 4 ? spiderNotes : sorted, sorted);
}

// ─── STRING CROSSING GENERATORS ───

function generateStringCrossAsc(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const byString: Map<number, FretboardNote[]> = new Map();
  for (const note of notes) {
    if (!byString.has(note.string)) byString.set(note.string, []);
    byString.get(note.string)!.push(note);
  }
  const crossNotes: FretboardNote[] = [];
  // Pick one note from each string ascending (low to high pitch)
  for (let stringIdx = 5; stringIdx >= 1; stringIdx--) {
    const currentNotes = byString.get(stringIdx);
    const nextNotes = byString.get(stringIdx - 1);
    if (currentNotes && nextNotes) {
      const cSorted = [...currentNotes].sort((a, b) => a.fret - b.fret);
      const nSorted = [...nextNotes].sort((a, b) => a.fret - b.fret);
      if (cSorted.length > 0) crossNotes.push(cSorted[0]);
      if (nSorted.length > 0) crossNotes.push(nSorted[0]);
    }
  }
  const sorted = sortNotesAscending(dedupNotes(notes));
  return makeExercise('string-cross-asc', crossNotes.length >= 3 ? crossNotes : sorted, sorted);
}

function generateStringCrossDesc(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const byString: Map<number, FretboardNote[]> = new Map();
  for (const note of notes) {
    if (!byString.has(note.string)) byString.set(note.string, []);
    byString.get(note.string)!.push(note);
  }
  const crossNotes: FretboardNote[] = [];
  // Pick one note from each string descending (high to low pitch)
  for (let stringIdx = 0; stringIdx <= 4; stringIdx++) {
    const currentNotes = byString.get(stringIdx);
    const nextNotes = byString.get(stringIdx + 1);
    if (currentNotes && nextNotes) {
      const cSorted = [...currentNotes].sort((a, b) => b.fret - a.fret);
      const nSorted = [...nextNotes].sort((a, b) => b.fret - a.fret);
      if (cSorted.length > 0) crossNotes.push(cSorted[0]);
      if (nSorted.length > 0) crossNotes.push(nSorted[0]);
    }
  }
  const sorted = sortNotesAscending(dedupNotes(notes));
  return makeExercise('string-cross-desc', crossNotes.length >= 3 ? crossNotes : sorted, sorted);
}

function generateStringCrossSkip(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const crossNotes: FretboardNote[] = [];
  // Skip strings: play on string 5, then 3, then 1, then 4, then 2, then 0
  const skipPattern = [5, 3, 1, 4, 2, 0];
  for (const stringIdx of skipPattern) {
    const stringNotes = sorted.filter(n => n.string === stringIdx);
    if (stringNotes.length > 0) {
      crossNotes.push(stringNotes[0]);
    }
  }
  return makeExercise('string-cross-skip', crossNotes.length >= 3 ? crossNotes : sorted, sorted);
}

function generateStringCrossAlternate(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const byString: Map<number, FretboardNote[]> = new Map();
  for (const note of notes) {
    if (!byString.has(note.string)) byString.set(note.string, []);
    byString.get(note.string)!.push(note);
  }
  const crossNotes: FretboardNote[] = [];
  // Alternate: go up one string, down the next
  let goingUp = true;
  for (let pair = 0; pair < 5; pair++) {
    const stringIdx1 = goingUp ? 5 - pair : pair;
    const stringIdx2 = goingUp ? 4 - pair : pair + 1;
    const notes1 = byString.get(stringIdx1);
    const notes2 = byString.get(stringIdx2);
    if (notes1) {
      const s1 = [...notes1].sort((a, b) => a.fret - b.fret);
      crossNotes.push(s1[0]);
    }
    if (notes2) {
      const s2 = [...notes2].sort((a, b) => a.fret - b.fret);
      crossNotes.push(s2[0]);
    }
    goingUp = !goingUp;
  }
  const sorted = sortNotesAscending(dedupNotes(notes));
  return makeExercise('string-cross-alternate', crossNotes.length >= 3 ? crossNotes : sorted, sorted);
}

// ─── SWEEP PICKING GENERATORS ───

function generateSweepNString(key: NoteName, scaleId: string, startFret: number, endFret: number, stringCount: number, type: ExerciseType): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const sweepNotes: FretboardNote[] = [];
  const byString: Map<number, FretboardNote[]> = new Map();
  for (const note of sorted) {
    if (!byString.has(note.string)) byString.set(note.string, []);
    byString.get(note.string)!.push(note);
  }
  // Sweep across specified number of strings
  const startString = 5;
  const endString = Math.max(0, 5 - stringCount + 1);
  // Downward sweep (low to high pitch)
  for (let s = startString; s >= endString; s--) {
    const stringNotes = byString.get(s);
    if (stringNotes) {
      const sSorted = [...stringNotes].sort((a, b) => a.fret - b.fret);
      sweepNotes.push(sSorted[0]);
    }
  }
  // Upward sweep (high to low pitch)
  for (let s = endString; s <= startString; s++) {
    const stringNotes = byString.get(s);
    if (stringNotes) {
      const sSorted = [...stringNotes].sort((a, b) => a.fret - b.fret);
      const highest = sSorted[sSorted.length - 1];
      if (!sweepNotes.find(n => n.string === s && n.fret === highest.fret)) {
        sweepNotes.push(highest);
      }
    }
  }
  return makeExercise(type, sweepNotes, sorted);
}

function generateSweepMinor(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const sweepNotes: FretboardNote[] = [];
  // Minor triad: R, b3, 5 — one note per string
  const roots = sorted.filter(n => n.isRoot);
  const minorThirds = sorted.filter(n => n.interval === 3);
  const fifths = sorted.filter(n => n.interval === 7);
  // Build sweep from root on low string
  for (const root of roots.slice(0, 2)) {
    sweepNotes.push(root);
    const third = minorThirds.find(n => n.string < root.string && Math.abs(n.fret - root.fret) <= 5);
    if (third) sweepNotes.push(third);
    const fifth = fifths.find(n => n.string < (third?.string ?? root.string) && Math.abs(n.fret - root.fret) <= 7);
    if (fifth) sweepNotes.push(fifth);
    // Octave
    const octave = sorted.find(n => n.isRoot && n !== root && n.string < (fifth?.string ?? root.string));
    if (octave) sweepNotes.push(octave);
  }
  return makeExercise('sweep-minor', sweepNotes.length >= 3 ? sweepNotes : sorted, sorted);
}

function generateSweepMajor(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const sweepNotes: FretboardNote[] = [];
  // Major triad: R, 3, 5 — one note per string
  const roots = sorted.filter(n => n.isRoot);
  const majorThirds = sorted.filter(n => n.interval === 4);
  const fifths = sorted.filter(n => n.interval === 7);
  for (const root of roots.slice(0, 2)) {
    sweepNotes.push(root);
    const third = majorThirds.find(n => n.string < root.string && Math.abs(n.fret - root.fret) <= 5);
    if (third) sweepNotes.push(third);
    const fifth = fifths.find(n => n.string < (third?.string ?? root.string) && Math.abs(n.fret - root.fret) <= 7);
    if (fifth) sweepNotes.push(fifth);
    const octave = sorted.find(n => n.isRoot && n !== root && n.string < (fifth?.string ?? root.string));
    if (octave) sweepNotes.push(octave);
  }
  return makeExercise('sweep-major', sweepNotes.length >= 3 ? sweepNotes : sorted, sorted);
}

// ─── LEGATO GENERATORS ───

function generateLegatoHammerAsc(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const byString: Map<number, FretboardNote[]> = new Map();
  for (const note of notes) {
    if (!byString.has(note.string)) byString.set(note.string, []);
    byString.get(note.string)!.push(note);
  }
  const legatoNotes: FretboardNote[] = [];
  for (let s = 5; s >= 0; s--) {
    const stringNotes = byString.get(s);
    if (stringNotes && stringNotes.length >= 2) {
      const sSorted = [...stringNotes].sort((a, b) => a.fret - b.fret);
      // Hammer-on: pick lowest, hammer to each higher note
      for (let i = 0; i < sSorted.length - 1; i++) {
        legatoNotes.push(sSorted[i]);
        legatoNotes.push(sSorted[i + 1]);
      }
    }
  }
  const sorted = sortNotesAscending(dedupNotes(notes));
  return makeExercise('legato-hammer-asc', legatoNotes.length >= 3 ? legatoNotes : sorted, sorted);
}

function generateLegatoHammerDesc(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const byString: Map<number, FretboardNote[]> = new Map();
  for (const note of notes) {
    if (!byString.has(note.string)) byString.set(note.string, []);
    byString.get(note.string)!.push(note);
  }
  const legatoNotes: FretboardNote[] = [];
  for (let s = 0; s <= 5; s++) {
    const stringNotes = byString.get(s);
    if (stringNotes && stringNotes.length >= 2) {
      const sSorted = [...stringNotes].sort((a, b) => b.fret - a.fret);
      for (let i = 0; i < sSorted.length - 1; i++) {
        legatoNotes.push(sSorted[i]);
        legatoNotes.push(sSorted[i + 1]);
      }
    }
  }
  const sorted = sortNotesAscending(dedupNotes(notes));
  return makeExercise('legato-hammer-desc', legatoNotes.length >= 3 ? legatoNotes : sorted, sorted);
}

function generateLegatoPullAsc(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const byString: Map<number, FretboardNote[]> = new Map();
  for (const note of notes) {
    if (!byString.has(note.string)) byString.set(note.string, []);
    byString.get(note.string)!.push(note);
  }
  const legatoNotes: FretboardNote[] = [];
  for (let s = 5; s >= 0; s--) {
    const stringNotes = byString.get(s);
    if (stringNotes && stringNotes.length >= 2) {
      const sSorted = [...stringNotes].sort((a, b) => a.fret - b.fret);
      // Pull-off: pick highest, pull to each lower note
      for (let i = sSorted.length - 1; i > 0; i--) {
        legatoNotes.push(sSorted[i]);
        legatoNotes.push(sSorted[i - 1]);
      }
    }
  }
  const sorted = sortNotesAscending(dedupNotes(notes));
  return makeExercise('legato-pull-asc', legatoNotes.length >= 3 ? legatoNotes : sorted, sorted);
}

function generateLegatoPullDesc(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const byString: Map<number, FretboardNote[]> = new Map();
  for (const note of notes) {
    if (!byString.has(note.string)) byString.set(note.string, []);
    byString.get(note.string)!.push(note);
  }
  const legatoNotes: FretboardNote[] = [];
  for (let s = 0; s <= 5; s++) {
    const stringNotes = byString.get(s);
    if (stringNotes && stringNotes.length >= 2) {
      const sSorted = [...stringNotes].sort((a, b) => b.fret - a.fret);
      for (let i = sSorted.length - 1; i > 0; i--) {
        legatoNotes.push(sSorted[i]);
        legatoNotes.push(sSorted[i - 1]);
      }
    }
  }
  const sorted = sortNotesAscending(dedupNotes(notes));
  return makeExercise('legato-pull-desc', legatoNotes.length >= 3 ? legatoNotes : sorted, sorted);
}

function generateLegatoTrill(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const byString: Map<number, FretboardNote[]> = new Map();
  for (const note of notes) {
    if (!byString.has(note.string)) byString.set(note.string, []);
    byString.get(note.string)!.push(note);
  }
  const trillNotes: FretboardNote[] = [];
  for (let s = 5; s >= 0; s--) {
    const stringNotes = byString.get(s);
    if (stringNotes && stringNotes.length >= 2) {
      const sSorted = [...stringNotes].sort((a, b) => a.fret - b.fret);
      // Trill between adjacent notes: hammer-pull-hammer-pull
      const low = sSorted[0];
      const high = sSorted[1];
      for (let rep = 0; rep < 3; rep++) {
        trillNotes.push(low);
        trillNotes.push(high);
        trillNotes.push(high);
        trillNotes.push(low);
      }
    }
  }
  const sorted = sortNotesAscending(dedupNotes(notes));
  return makeExercise('legato-trill', trillNotes.length >= 3 ? trillNotes : sorted, sorted);
}

// ─── POSITION SHIFTING GENERATORS ───

function generatePositionShiftN(key: NoteName, scaleId: string, shiftAmount: number, type: ExerciseType): Exercise {
  const positions = getCAGEDPositions(key, scaleId);
  const shiftNotes: FretboardNote[] = [];
  for (let i = 0; i < positions.length; i++) {
    const posNotes = getScaleInPosition(key, scaleId, positions[i]);
    const sorted = sortNotesAscending(posNotes);
    shiftNotes.push(...sorted.slice(0, 3));
    // Add shift note from next position
    if (i + 1 < positions.length) {
      const nextPosNotes = getScaleInPosition(key, scaleId, positions[i + 1]);
      const nextSorted = sortNotesAscending(nextPosNotes);
      // Find a note that is shiftAmount frets away
      const shiftTarget = nextSorted.find(n => Math.abs(n.fret - sorted[0]?.fret) <= shiftAmount + 1);
      if (shiftTarget) shiftNotes.push(shiftTarget);
    }
  }
  const allNotes = getScaleOnFretboard(key, scaleId, 0, FRET_COUNT);
  const sorted = sortNotesAscending(dedupNotes(allNotes));
  return makeExercise(type, shiftNotes, sorted);
}

// ─── SCALE PATTERN GENERATORS ───

function generateScale2NPS(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
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
      npsNotes.push(...sSorted.slice(0, 2));
    }
  }
  const sorted = sortNotesAscending(dedupNotes(notes));
  return makeExercise('scale-2nps', npsNotes, sorted);
}

function generateScale4NPS(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
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
      npsNotes.push(...sSorted.slice(0, 4));
    }
  }
  const sorted = sortNotesAscending(dedupNotes(notes));
  return makeExercise('scale-4nps', npsNotes, sorted);
}

function generateScaleOffsetRun(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const offsetNotes: FretboardNote[] = [];
  const scale = SCALES[scaleId];
  if (!scale) return makeExercise('scale-offset-run', sorted, sorted);
  // Start run from each scale degree
  const intervalCount = scale.intervals.length;
  for (let offset = 0; offset < intervalCount; offset++) {
    const startInterval = scale.intervals[offset];
    const startNote = sorted.find(n => n.interval === startInterval);
    if (startNote) {
      const startIdx = sorted.indexOf(startNote);
      // Play a few notes from this starting point
      for (let j = 0; j < 3 && startIdx + j < sorted.length; j++) {
        offsetNotes.push(sorted[startIdx + j]);
      }
    }
  }
  return makeExercise('scale-offset-run', offsetNotes, sorted);
}

function generateScaleSpiral(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const spiralNotes: FretboardNote[] = [];
  // Spiral: go up one string, move to next string, go up again
  const byString: Map<number, FretboardNote[]> = new Map();
  for (const note of sorted) {
    if (!byString.has(note.string)) byString.set(note.string, []);
    byString.get(note.string)!.push(note);
  }
  let fretOffset = 0;
  for (let s = 5; s >= 0; s--) {
    const stringNotes = byString.get(s);
    if (stringNotes) {
      const sSorted = [...stringNotes].sort((a, b) => a.fret - b.fret);
      // Pick notes with ascending fret positions
      const targetFret = startFret + fretOffset;
      const closest = sSorted.reduce((best, n) => {
        if (!best) return n;
        return Math.abs(n.fret - targetFret) < Math.abs(best.fret - targetFret) ? n : best;
      }, null as FretboardNote | null);
      if (closest) spiralNotes.push(closest);
      fretOffset += 2;
    }
  }
  return makeExercise('scale-spiral', spiralNotes.length >= 3 ? spiralNotes : sorted, sorted);
}

function generateScaleBoxRun(key: NoteName, scaleId: string): Exercise {
  const positions = getCAGEDPositions(key, scaleId);
  const boxNotes: FretboardNote[] = [];
  for (let i = 0; i < positions.length - 1; i++) {
    const pos1Notes = getScaleInPosition(key, scaleId, positions[i]);
    const pos2Notes = getScaleInPosition(key, scaleId, positions[i + 1]);
    const sorted1 = sortNotesAscending(pos1Notes);
    const sorted2 = sortNotesAscending(pos2Notes);
    // Last few notes of position 1
    boxNotes.push(...sorted1.slice(-3));
    // First few notes of position 2
    boxNotes.push(...sorted2.slice(0, 3));
  }
  const allNotes = getScaleOnFretboard(key, scaleId, 0, FRET_COUNT);
  const sorted = sortNotesAscending(dedupNotes(allNotes));
  return makeExercise('scale-box-run', boxNotes, sorted);
}

// ─── INTERVAL STUDY GENERATORS ───

function generateIntervalsOctave(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const octaveNotes: FretboardNote[] = [];
  // Find all octave pairs (same note name, different string/fret)
  const byNoteName: Map<string, FretboardNote[]> = new Map();
  for (const n of sorted) {
    if (!byNoteName.has(n.note)) byNoteName.set(n.note, []);
    byNoteName.get(n.note)!.push(n);
  }
  byNoteName.forEach((noteList) => {
    if (noteList.length >= 2) {
      // Find pairs that are approximately an octave apart (fret diff ~12 or string diff ~2)
      for (let i = 0; i < noteList.length - 1; i++) {
        for (let j = i + 1; j < noteList.length; j++) {
          const fretDiff = Math.abs(noteList[j].fret - noteList[i].fret);
          const stringDiff = Math.abs(noteList[j].string - noteList[i].string);
          if ((fretDiff >= 10 && fretDiff <= 14) || (stringDiff >= 2 && stringDiff <= 3 && fretDiff <= 3)) {
            octaveNotes.push(noteList[i]);
            octaveNotes.push(noteList[j]);
          }
        }
      }
    }
  });
  return makeExercise('intervals-octave', octaveNotes.length >= 3 ? octaveNotes : sorted, sorted);
}

function generateIntervalsTritone(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  return generateIntervalN(key, scaleId, startFret, endFret, 6, 'intervals-tritone');
}

function generateIntervalsCompound(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const compoundNotes: FretboardNote[] = [];
  // Compound intervals: 9th, 11th, 13th (octave + 2nd, 4th, 6th)
  const compoundIntervals = [2, 5, 9]; // semitone values for 9th, 11th, 13th relative to root
  const roots = sorted.filter(n => n.isRoot);
  for (const root of roots.slice(0, 2)) {
    for (const ci of compoundIntervals) {
      compoundNotes.push(root);
      const target = sorted.find(n =>
        n.interval === ci &&
        n !== root &&
        (5 - n.string) * 5 + n.fret > (5 - root.string) * 5 + root.fret + 10 // Must be beyond octave
      );
      if (target) compoundNotes.push(target);
    }
  }
  return makeExercise('intervals-compound', compoundNotes.length >= 3 ? compoundNotes : sorted, sorted);
}

function generateIntervalsChromatic(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const rootIndex = NOTES.indexOf(key);
  const chromNotes: FretboardNote[] = [];
  // Walk through all 12 chromatic intervals from the root
  for (let semitone = 1; semitone <= 11; semitone++) {
    const targetNoteIdx = (rootIndex + semitone) % 12;
    const targetNote = NOTES[targetNoteIdx];
    // Find this note on the fretboard near startFret
    let found = false;
    for (let s = 5; s >= 0 && !found; s--) {
      const openNote = STRING_OPEN_NOTES[s];
      const openIdx = NOTES.indexOf(openNote);
      for (let f = startFret; f <= endFret; f++) {
        const noteIdx = (openIdx + f) % 12;
        if (noteIdx === targetNoteIdx) {
          const intervalFromRoot = (noteIdx - rootIndex + 12) % 12;
          chromNotes.push({
            string: s, fret: f, note: NOTES[noteIdx],
            interval: intervalFromRoot, intervalLabel: intervalFromRoot === 0 ? 'R' : `${intervalFromRoot}`,
            isRoot: intervalFromRoot === 0,
          });
          found = true;
          break;
        }
      }
    }
  }
  const allNotes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(allNotes));
  return makeExercise('intervals-chromatic', chromNotes.length >= 3 ? chromNotes : sorted, sorted);
}

// ─── ARPEGGIO STUDY GENERATORS ───

function generateArpByIntervals(key: NoteName, scaleId: string, startFret: number, endFret: number, intervals: number[], type: ExerciseType): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const arpNotes: FretboardNote[] = [];
  const rootIndex = NOTES.indexOf(key);
  // Find root note
  const roots = sorted.filter(n => n.isRoot);
  for (const root of roots.slice(0, 2)) {
    for (const interval of intervals) {
      const targetInterval = (root.interval + interval) % 12;
      const match = sorted.find(n =>
        n.interval === targetInterval &&
        (5 - n.string) * 5 + n.fret >= (5 - root.string) * 5 + root.fret - 2 &&
        Math.abs(n.string - root.string) <= 4
      );
      if (match) arpNotes.push(match);
    }
  }
  // If too few notes, also search by building from chromatic
  if (arpNotes.length < 3) {
    arpNotes.length = 0;
    for (const root of roots.slice(0, 1)) {
      for (const interval of intervals) {
        const targetFret = root.fret + interval;
        for (let s = root.string; s >= Math.max(0, root.string - 4); s--) {
          const openNote = STRING_OPEN_NOTES[s];
          const openIdx = NOTES.indexOf(openNote);
          const rootOpenIdx = NOTES.indexOf(STRING_OPEN_NOTES[root.string]);
          const fretOnString = targetFret - (rootOpenIdx - openIdx);
          if (fretOnString >= startFret && fretOnString <= endFret && fretOnString >= 0) {
            const noteIdx = (openIdx + fretOnString) % 12;
            const intervalFromRoot = (noteIdx - rootIndex + 12) % 12;
            arpNotes.push({
              string: s, fret: fretOnString, note: NOTES[noteIdx],
              interval: intervalFromRoot, intervalLabel: intervalFromRoot === 0 ? 'R' : `${intervalFromRoot}`,
              isRoot: intervalFromRoot === 0,
            });
            break;
          }
        }
      }
    }
  }
  return makeExercise(type, arpNotes.length >= 3 ? arpNotes : sorted, sorted);
}

// ─── RHYTHM GENERATORS ───

function generateRhythmGallop(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const gallopNotes: FretboardNote[] = [];
  // Gallop: long-short-short pattern (8th-16th-16th)
  for (let i = 0; i < sorted.length; i++) {
    gallopNotes.push(sorted[i]); // Long
    if (i + 1 < sorted.length) {
      gallopNotes.push(sorted[i + 1]); // Short
      gallopNotes.push(sorted[i + 1]); // Short (repeat for rhythm feel)
    }
  }
  return makeExercise('rhythm-gallop', gallopNotes, sorted);
}

function generateRhythmTriplet(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const tripletNotes: FretboardNote[] = [];
  // Triplet feel: group notes in threes
  for (let i = 0; i < sorted.length; i += 3) {
    if (i < sorted.length) tripletNotes.push(sorted[i]);
    if (i + 1 < sorted.length) tripletNotes.push(sorted[i + 1]);
    if (i + 2 < sorted.length) tripletNotes.push(sorted[i + 2]);
    // Repeat the last note for emphasis
    if (i + 2 < sorted.length) tripletNotes.push(sorted[i + 2]);
  }
  return makeExercise('rhythm-triplet', tripletNotes, sorted);
}

function generateRhythmDotted(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const dottedNotes: FretboardNote[] = [];
  // Dotted rhythm: long-short (dotted quarter + eighth)
  for (let i = 0; i < sorted.length; i += 2) {
    dottedNotes.push(sorted[i]);
    dottedNotes.push(sorted[i]); // Hold (repeat for long note)
    if (i + 1 < sorted.length) dottedNotes.push(sorted[i + 1]); // Short
  }
  return makeExercise('rhythm-dotted', dottedNotes, sorted);
}

// ─── BENDING & EXPRESSION GENERATORS ───

function generateBendRelease(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const bendNotes: FretboardNote[] = [];
  for (let i = 0; i < sorted.length - 2; i++) {
    // Find notes where bending up 2 frets reaches another scale note
    const target = sorted.find(n => n.string === sorted[i].string && n.fret === sorted[i].fret + 2);
    if (target) {
      bendNotes.push(sorted[i]);   // Start note
      bendNotes.push(target);       // Bend target
      bendNotes.push(sorted[i]);    // Release back
    }
  }
  return makeExercise('bend-release', bendNotes.length >= 3 ? bendNotes : sorted, sorted);
}

function generateBend1Step(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const bendNotes: FretboardNote[] = [];
  for (let i = 0; i < sorted.length; i++) {
    // 1 step = 2 frets: find note 2 frets higher on same string
    const target = sorted.find(n => n.string === sorted[i].string && n.fret === sorted[i].fret + 2);
    if (target) {
      bendNotes.push(sorted[i]);
      bendNotes.push(target);
    }
  }
  return makeExercise('bend-1step', bendNotes.length >= 3 ? bendNotes : sorted, sorted);
}

function generateBend1Half(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const bendNotes: FretboardNote[] = [];
  const rootIndex = NOTES.indexOf(key);
  for (let i = 0; i < sorted.length; i++) {
    // 1.5 steps = 3 frets
    const targetFret = sorted[i].fret + 3;
    if (targetFret <= endFret) {
      const openNote = STRING_OPEN_NOTES[sorted[i].string];
      const openIdx = NOTES.indexOf(openNote);
      const noteIdx = (openIdx + targetFret) % 12;
      const intervalFromRoot = (noteIdx - rootIndex + 12) % 12;
      bendNotes.push(sorted[i]);
      bendNotes.push({
        string: sorted[i].string, fret: targetFret, note: NOTES[noteIdx],
        interval: intervalFromRoot, intervalLabel: intervalFromRoot === 0 ? 'R' : `${intervalFromRoot}`,
        isRoot: intervalFromRoot === 0,
      });
    }
  }
  return makeExercise('bend-1half', bendNotes.length >= 3 ? bendNotes : sorted, sorted);
}

// ─── HARMONICS GENERATORS ───

function generateHarmonicsTap(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const tapNotes: FretboardNote[] = [];
  const rootIndex = NOTES.indexOf(key);
  for (const note of sorted) {
    // Tapped harmonic: tap 12 frets above the fretted note
    const tapFret = note.fret + 12;
    if (tapFret <= endFret && tapFret <= FRET_COUNT) {
      tapNotes.push(note); // Fretted note
      const openNote = STRING_OPEN_NOTES[note.string];
      const openIdx = NOTES.indexOf(openNote);
      const noteIdx = (openIdx + tapFret) % 12;
      const intervalFromRoot = (noteIdx - rootIndex + 12) % 12;
      tapNotes.push({
        string: note.string, fret: tapFret, note: NOTES[noteIdx],
        interval: intervalFromRoot, intervalLabel: intervalFromRoot === 0 ? 'R' : `${intervalFromRoot}`,
        isRoot: intervalFromRoot === 0,
      });
    }
  }
  return makeExercise('harmonics-tap', tapNotes.length >= 3 ? tapNotes : sorted, sorted);
}

function generateHarmonicsPinchScale(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  // Pinch harmonics along the scale — emphasize root, 3rd, 5th positions
  const pinchNotes = sorted.filter(n => n.isRoot || n.interval === 3 || n.interval === 4 || n.interval === 7);
  // Double each pinch note for emphasis
  const doubled: FretboardNote[] = [];
  for (const n of pinchNotes) {
    doubled.push(n);
    doubled.push(n);
  }
  return makeExercise('harmonics-pinch-scale', doubled.length >= 3 ? doubled : sorted, sorted);
}

// ─── TAPPING GENERATORS ───

function generateTap8Finger(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const byString: Map<number, FretboardNote[]> = new Map();
  for (const note of sorted) {
    if (!byString.has(note.string)) byString.set(note.string, []);
    byString.get(note.string)!.push(note);
  }
  const tapNotes: FretboardNote[] = [];
  // 8-finger tapping: 4 left hand notes + 4 right hand tap notes
  for (let s = 5; s >= 2; s -= 2) {
    const lowStringNotes = byString.get(s);
    const highStringNotes = byString.get(s - 1);
    if (lowStringNotes && highStringNotes) {
      const lowSorted = [...lowStringNotes].sort((a, b) => a.fret - b.fret);
      const highSorted = [...highStringNotes].sort((a, b) => a.fret - b.fret);
      // Left hand: first 2 notes on each string
      if (lowSorted.length >= 2) { tapNotes.push(lowSorted[0]); tapNotes.push(lowSorted[1]); }
      // Right hand tap: highest notes
      if (highSorted.length >= 2) { tapNotes.push(highSorted[highSorted.length - 1]); tapNotes.push(highSorted[highSorted.length - 2]); }
    }
  }
  return makeExercise('tap-8finger', tapNotes.length >= 3 ? tapNotes : sorted, sorted);
}

function generateTapSweep(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const byString: Map<number, FretboardNote[]> = new Map();
  for (const note of sorted) {
    if (!byString.has(note.string)) byString.set(note.string, []);
    byString.get(note.string)!.push(note);
  }
  const tapNotes: FretboardNote[] = [];
  // Sweep down with left hand
  for (let s = 5; s >= 0; s--) {
    const stringNotes = byString.get(s);
    if (stringNotes) {
      const sSorted = [...stringNotes].sort((a, b) => a.fret - b.fret);
      tapNotes.push(sSorted[0]); // Lowest note per string (sweep)
    }
  }
  // Tap on highest string
  const highStringNotes = byString.get(0);
  if (highStringNotes) {
    const hSorted = [...highStringNotes].sort((a, b) => b.fret - a.fret);
    if (hSorted.length > 1) tapNotes.push(hSorted[0]); // Tap note
  }
  // Sweep back up
  for (let s = 0; s <= 5; s++) {
    const stringNotes = byString.get(s);
    if (stringNotes) {
      const sSorted = [...stringNotes].sort((a, b) => a.fret - b.fret);
      tapNotes.push(sSorted[0]);
    }
  }
  return makeExercise('tap-sweep', tapNotes, sorted);
}

function generateTapTapPull(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const byString: Map<number, FretboardNote[]> = new Map();
  for (const note of sorted) {
    if (!byString.has(note.string)) byString.set(note.string, []);
    byString.get(note.string)!.push(note);
  }
  const tapNotes: FretboardNote[] = [];
  for (let s = 5; s >= 0; s--) {
    const stringNotes = byString.get(s);
    if (stringNotes && stringNotes.length >= 3) {
      const sSorted = [...stringNotes].sort((a, b) => a.fret - b.fret);
      // Tap highest, pull to middle, pull to lowest
      tapNotes.push(sSorted[sSorted.length - 1]); // Tap
      tapNotes.push(sSorted[1]); // Pull-off
      tapNotes.push(sSorted[0]); // Pull-off
    }
  }
  return makeExercise('tap-tap-pull', tapNotes.length >= 3 ? tapNotes : sorted, sorted);
}

// ─── BLUES GENERATORS ───

function generateBluesLick1(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const lickNotes: FretboardNote[] = [];
  // Classic blues lick: root, b3rd bend to 3rd, root, 5th, b7th
  const roots = sorted.filter(n => n.isRoot);
  const minorThirds = sorted.filter(n => n.interval === 3);
  const majorThirds = sorted.filter(n => n.interval === 4);
  const fifths = sorted.filter(n => n.interval === 7);
  const minorSevenths = sorted.filter(n => n.interval === 10);
  for (const root of roots.slice(0, 2)) {
    lickNotes.push(root);
    const b3 = minorThirds.find(n => n.string === root.string && n.fret > root.fret);
    if (b3) lickNotes.push(b3);
    const m3 = majorThirds.find(n => n.string === root.string && n.fret > root.fret);
    if (m3) lickNotes.push(m3);
    lickNotes.push(root);
    const fifth = fifths.find(n => Math.abs(n.string - root.string) <= 2 && n.fret >= root.fret);
    if (fifth) lickNotes.push(fifth);
    const b7 = minorSevenths.find(n => Math.abs(n.string - root.string) <= 3 && n.fret >= root.fret);
    if (b7) lickNotes.push(b7);
  }
  return makeExercise('blues-lick-1', lickNotes.length >= 3 ? lickNotes : sorted, sorted);
}

function generateBluesLick2(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const lickNotes: FretboardNote[] = [];
  // Blues lick with double stops: play adjacent string pairs
  for (let s = 5; s >= 1; s--) {
    const lowerNotes = sorted.filter(n => n.string === s);
    const higherNotes = sorted.filter(n => n.string === s - 1);
    for (const ln of lowerNotes.slice(0, 2)) {
      const closest = higherNotes.reduce((best: FretboardNote | null, hn) => {
        if (Math.abs(hn.fret - ln.fret) <= 2) {
          if (!best || Math.abs(hn.fret - ln.fret) < Math.abs(best.fret - ln.fret)) return hn;
        }
        return best;
      }, null);
      if (closest) {
        lickNotes.push(ln);
        lickNotes.push(closest);
        // Then slide up
        const slideUp = lowerNotes.find(n => n.fret > ln.fret);
        if (slideUp) lickNotes.push(slideUp);
      }
    }
  }
  return makeExercise('blues-lick-2', lickNotes.length >= 3 ? lickNotes : sorted, sorted);
}

function generateBluesTurnaround(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const turnaroundNotes: FretboardNote[] = [];
  // Classic turnaround: walk down from root through b7, 5, b3, root on high strings
  const roots = sorted.filter(n => n.isRoot);
  const minorSevenths = sorted.filter(n => n.interval === 10);
  const fifths = sorted.filter(n => n.interval === 7);
  const minorThirds = sorted.filter(n => n.interval === 3);
  // Descending pattern
  const highRoots = roots.filter(n => n.string <= 2);
  if (highRoots.length > 0) {
    const root = highRoots[0];
    turnaroundNotes.push(root);
    const b7 = minorSevenths.find(n => (5 - n.string) * 5 + n.fret < (5 - root.string) * 5 + root.fret);
    if (b7) turnaroundNotes.push(b7);
    const fifth = fifths.find(n => (5 - n.string) * 5 + n.fret < (5 - (b7?.string ?? root.string)) * 5 + (b7?.fret ?? root.fret));
    if (fifth) turnaroundNotes.push(fifth);
    const b3 = minorThirds.find(n => (5 - n.string) * 5 + n.fret < (5 - (fifth?.string ?? root.string)) * 5 + (fifth?.fret ?? root.fret));
    if (b3) turnaroundNotes.push(b3);
    // End on root
    const endRoot = roots.find(n => (5 - n.string) * 5 + n.fret < (5 - (b3?.string ?? root.string)) * 5 + (b3?.fret ?? root.fret));
    if (endRoot) turnaroundNotes.push(endRoot);
  }
  return makeExercise('blues-turnaround', turnaroundNotes.length >= 3 ? turnaroundNotes : sorted, sorted);
}

// ─── FRETBOARD KNOWLEDGE GENERATORS ───

function generateCagedShapes(key: NoteName, scaleId: string): Exercise {
  const positions = getCAGEDPositions(key, scaleId);
  const shapeNotes: FretboardNote[] = [];
  for (const pos of positions) {
    const posNotes = getScaleInPosition(key, scaleId, pos);
    const sorted = sortNotesAscending(posNotes);
    // Find chord tones (root, 3rd, 5th) in this position
    const chordTones = sorted.filter(n => n.isRoot || n.interval === 3 || n.interval === 4 || n.interval === 7);
    shapeNotes.push(...chordTones.slice(0, 5));
  }
  const allNotes = getScaleOnFretboard(key, scaleId, 0, FRET_COUNT);
  const sorted = sortNotesAscending(dedupNotes(allNotes));
  return makeExercise('caged-shapes', shapeNotes, sorted);
}

function generateNoteTriplets(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const rootIndex = NOTES.indexOf(key);
  const tripletNotes: FretboardNote[] = [];
  // Find each scale note on 3 different strings
  const scale = SCALES[scaleId];
  if (!scale) {
    const allNotes = getScaleOnFretboard(key, scaleId, startFret, endFret);
    return makeExercise('note-triplets', sortNotesAscending(dedupNotes(allNotes)), sortNotesAscending(dedupNotes(allNotes)));
  }
  for (const interval of scale.intervals) {
    const targetNoteIdx = (rootIndex + interval) % 12;
    const targetNote = NOTES[targetNoteIdx];
    const locations: FretboardNote[] = [];
    for (let s = 5; s >= 0 && locations.length < 3; s--) {
      const openNote = STRING_OPEN_NOTES[s];
      const openIdx = NOTES.indexOf(openNote);
      for (let f = startFret; f <= endFret && locations.length < 3; f++) {
        const noteIdx = (openIdx + f) % 12;
        if (noteIdx === targetNoteIdx) {
          const intervalFromRoot = (noteIdx - rootIndex + 12) % 12;
          locations.push({
            string: s, fret: f, note: targetNote,
            interval: intervalFromRoot, intervalLabel: intervalFromRoot === 0 ? 'R' : `${intervalFromRoot}`,
            isRoot: intervalFromRoot === 0,
          });
        }
      }
    }
    tripletNotes.push(...locations.slice(0, 3));
  }
  const allNotes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(allNotes));
  return makeExercise('note-triplets', tripletNotes.length >= 3 ? tripletNotes : sorted, sorted);
}

function generateRelativeNote(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const rootIndex = NOTES.indexOf(key);
  const relNotes: FretboardNote[] = [];
  // Find the relative minor (3 semitones down) or relative major (3 semitones up)
  const relativeIdx = (rootIndex + 3) % 12;
  const relativeNote = NOTES[relativeIdx];
  // Find root note locations
  for (let s = 5; s >= 0; s--) {
    const openNote = STRING_OPEN_NOTES[s];
    const openIdx = NOTES.indexOf(openNote);
    for (let f = startFret; f <= endFret; f++) {
      const noteIdx = (openIdx + f) % 12;
      if (noteIdx === rootIndex) {
        relNotes.push({
          string: s, fret: f, note: key,
          interval: 0, intervalLabel: 'R', isRoot: true,
        });
      }
      if (noteIdx === relativeIdx) {
        const intervalFromRoot = (noteIdx - rootIndex + 12) % 12;
        relNotes.push({
          string: s, fret: f, note: relativeNote,
          interval: intervalFromRoot, intervalLabel: 'Rel', isRoot: false,
        });
      }
    }
  }
  const allNotes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(allNotes));
  return makeExercise('relative-note', relNotes.length >= 3 ? relNotes : sorted, sorted);
}

function generateFretboardMap(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const rootIndex = NOTES.indexOf(key);
  const mapNotes: FretboardNote[] = [];
  // Map all natural notes in the scale across the entire fretboard range
  for (let s = 5; s >= 0; s--) {
    const openNote = STRING_OPEN_NOTES[s];
    const openIdx = NOTES.indexOf(openNote);
    for (let f = startFret; f <= endFret; f++) {
      const noteIdx = (openIdx + f) % 12;
      const intervalFromRoot = (noteIdx - rootIndex + 12) % 12;
      mapNotes.push({
        string: s, fret: f, note: NOTES[noteIdx],
        interval: intervalFromRoot, intervalLabel: intervalFromRoot === 0 ? 'R' : `${intervalFromRoot}`,
        isRoot: intervalFromRoot === 0,
      });
    }
  }
  const allNotes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(allNotes));
  return makeExercise('fretboard-map', mapNotes.length >= 3 ? mapNotes : sorted, sorted);
}

// ─── SPEED & AGILITY GENERATORS ───

function generateSpeedLadder(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const ladderNotes: FretboardNote[] = [];
  // Progressive speed: play 2 notes, then 3, then 4, then 5 etc.
  for (let groupSize = 2; groupSize <= 5; groupSize++) {
    for (let i = 0; i <= sorted.length - groupSize; i += groupSize) {
      for (let j = 0; j < groupSize && i + j < sorted.length; j++) {
        ladderNotes.push(sorted[i + j]);
      }
    }
  }
  return makeExercise('speed-ladder', ladderNotes.length >= 3 ? ladderNotes : sorted, sorted);
}

function generateSpeedBurst16th(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const burstNotes: FretboardNote[] = [];
  // 16th note bursts: groups of 4 rapid notes
  for (let i = 0; i <= sorted.length - 4; i++) {
    for (let j = 0; j < 4; j++) {
      burstNotes.push(sorted[i + j]);
    }
    // Repeat the burst for emphasis
    for (let j = 0; j < 4 && i + j < sorted.length; j++) {
      burstNotes.push(sorted[i + j]);
    }
  }
  return makeExercise('speed-burst-16th', burstNotes.length >= 3 ? burstNotes : sorted, sorted);
}

function generateSpeedTripletRun(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const tripletNotes: FretboardNote[] = [];
  // Triplet runs: 3-note groups shifting by one note
  for (let i = 0; i <= sorted.length - 3; i++) {
    tripletNotes.push(sorted[i]);
    tripletNotes.push(sorted[i + 1]);
    tripletNotes.push(sorted[i + 2]);
  }
  return makeExercise('speed-triplet-run', tripletNotes.length >= 3 ? tripletNotes : sorted, sorted);
}

// ─── FINGER DRILL GENERATOR ───
// Generates alternating finger patterns (e.g., 1-2-1-3) on consecutive frets across strings

function generateFingerDrill(key: NoteName, scaleId: string, startFret: number, endFret: number, pattern: number[], typeId: ExerciseType): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const drillNotes: FretboardNote[] = [];
  // Apply finger pattern on consecutive strings, moving up the fretboard
  for (let s = 0; s < 5; s++) {
    for (const finger of pattern) {
      const fret = startFret + finger - 1;
      const noteIdx = (NOTES.indexOf(STRING_OPEN_NOTES[s]) + fret) % 12;
      drillNotes.push({
        string: s,
        fret,
        note: NOTES[noteIdx],
        interval: (noteIdx - NOTES.indexOf(key) + 12) % 12,
        intervalLabel: String(finger),
        isRoot: false,
      });
    }
  }
  return makeExercise(typeId, drillNotes.length >= 4 ? drillNotes : sorted, sorted);
}

// ─── OPEN STRING EXERCISES ───

function generateOpenStringAlternate(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const openNotes: FretboardNote[] = [];
  // Alternate pick across open strings: E A D G B E B G D A E
  const stringOrder = [0, 1, 2, 3, 4, 5, 4, 3, 2, 1, 0];
  for (const s of stringOrder) {
    const noteIdx = NOTES.indexOf(STRING_OPEN_NOTES[s]);
    openNotes.push({
      string: s,
      fret: 0,
      note: STRING_OPEN_NOTES[s],
      interval: (noteIdx - NOTES.indexOf(key) + 12) % 12,
      intervalLabel: STRING_OPEN_NOTES[s],
      isRoot: STRING_OPEN_NOTES[s] === key,
    });
  }
  return makeExercise('open-string-alternate', openNotes, sorted);
}

function generateOpenStringFretCombo(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const comboNotes: FretboardNote[] = [];
  // Alternate open string with 2nd fret note on each string
  for (let s = 0; s < 6; s++) {
    // Open string
    const openNoteIdx = NOTES.indexOf(STRING_OPEN_NOTES[s]);
    comboNotes.push({
      string: s, fret: 0, note: STRING_OPEN_NOTES[s],
      interval: (openNoteIdx - NOTES.indexOf(key) + 12) % 12,
      intervalLabel: STRING_OPEN_NOTES[s], isRoot: STRING_OPEN_NOTES[s] === key,
    });
    // 2nd fret
    const fret2NoteIdx = (openNoteIdx + 2) % 12;
    comboNotes.push({
      string: s, fret: 2, note: NOTES[fret2NoteIdx],
      interval: (fret2NoteIdx - NOTES.indexOf(key) + 12) % 12,
      intervalLabel: String(2), isRoot: false,
    });
  }
  return makeExercise('open-string-fret-combo', comboNotes, sorted);
}

function generateOpenStringBassRun(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const bassNotes: FretboardNote[] = [];
  // Bass run on low E and A strings
  for (let fret = startFret; fret <= Math.min(endFret, startFret + 7); fret++) {
    for (const s of [0, 1]) {
      const noteIdx = (NOTES.indexOf(STRING_OPEN_NOTES[s]) + fret) % 12;
      bassNotes.push({
        string: s, fret, note: NOTES[noteIdx],
        interval: (noteIdx - NOTES.indexOf(key) + 12) % 12,
        intervalLabel: String(fret), isRoot: noteIdx === NOTES.indexOf(key),
      });
    }
  }
  return makeExercise('open-string-bass-run', bassNotes.length >= 4 ? bassNotes : sorted, sorted);
}

function generateOpenStringArpeggio(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const arpNotes: FretboardNote[] = [];
  // Arpeggio using open strings as pedal: open low E, then fretted notes ascending
  const rootIdx = NOTES.indexOf(key);
  const arpIntervals = [0, 4, 7, 12]; // Major triad + octave
  for (const interval of arpIntervals) {
    const targetNoteIdx = (rootIdx + interval) % 12;
    // Find on each string
    for (let s = 5; s >= 0; s--) {
      const fret = (targetNoteIdx - NOTES.indexOf(STRING_OPEN_NOTES[s]) + 12) % 12;
      if (fret <= endFret && fret >= startFret) {
        arpNotes.push({
          string: s, fret, note: NOTES[targetNoteIdx],
          interval: interval % 12, intervalLabel: interval === 0 ? 'R' : String(interval),
          isRoot: interval === 0,
        });
        break;
      }
    }
  }
  return makeExercise('open-string-arpeggio', arpNotes.length >= 3 ? arpNotes : sorted, sorted);
}

// ─── CHORD EXERCISES ───

function generateChordTriadAsc(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const chordNotes: FretboardNote[] = [];
  // Build triads from each scale degree ascending
  const scale = SCALES[scaleId];
  if (!scale) return makeExercise('chord-triad-asc', sorted, sorted);
  for (let i = 0; i < scale.intervals.length; i++) {
    const root = scale.intervals[i];
    const third = scale.intervals[(i + 2) % scale.intervals.length];
    const fifth = scale.intervals[(i + 4) % scale.intervals.length];
    for (const interval of [root, third, fifth]) {
      const targetIdx = (NOTES.indexOf(key) + interval) % 12;
      const found = sorted.find(n => NOTES.indexOf(n.note) === targetIdx);
      if (found) chordNotes.push(found);
    }
  }
  return makeExercise('chord-triad-asc', chordNotes.length >= 3 ? chordNotes : sorted, sorted);
}

function generateChordTriadDesc(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const asc = generateChordTriadAsc(key, scaleId, startFret, endFret);
  const reversed = [...asc.notes].reverse().map((n, i) => ({ ...n, sequenceNumber: i + 1 }));
  return { ...asc, name: 'Triad Chords Descending', notes: reversed, tabs: generateTabs(reversed) };
}

function generateChordPower5th(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const powerNotes: FretboardNote[] = [];
  const scale = SCALES[scaleId];
  if (!scale) return makeExercise('chord-power-5th', sorted, sorted);
  // Root + fifth for each scale degree
  for (const interval of scale.intervals) {
    const fifthInterval = (interval + 7) % 12;
    for (let s = 0; s < 4; s++) {
      const rootFret = (NOTES.indexOf(key) + interval - NOTES.indexOf(STRING_OPEN_NOTES[s]) + 12) % 12;
      const fifthFret = (NOTES.indexOf(key) + fifthInterval - NOTES.indexOf(STRING_OPEN_NOTES[s + 1]) + 12) % 12;
      if (rootFret >= startFret && rootFret <= endFret && Math.abs(rootFret - fifthFret) <= 3) {
        const rootNoteIdx = (NOTES.indexOf(key) + interval) % 12;
        const fifthNoteIdx = (NOTES.indexOf(key) + fifthInterval) % 12;
        powerNotes.push({
          string: s, fret: rootFret, note: NOTES[rootNoteIdx],
          interval: interval, intervalLabel: 'R', isRoot: interval === 0,
        });
        powerNotes.push({
          string: s + 1, fret: fifthFret, note: NOTES[fifthNoteIdx],
          interval: fifthInterval, intervalLabel: '5', isRoot: false,
        });
      }
    }
  }
  return makeExercise('chord-power-5th', powerNotes.length >= 4 ? powerNotes : sorted, sorted);
}

function generateChordShellComping(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const shellNotes: FretboardNote[] = [];
  const scale = SCALES[scaleId];
  if (!scale) return makeExercise('chord-shell-comping', sorted, sorted);
  // Shell voicings: root, 3rd, 7th for each degree
  for (let i = 0; i < scale.intervals.length; i++) {
    const intervals = [scale.intervals[i], scale.intervals[(i + 2) % scale.intervals.length], scale.intervals[(i + 6) % scale.intervals.length]];
    for (const interval of intervals) {
      const targetIdx = (NOTES.indexOf(key) + interval) % 12;
      const found = sorted.find(n => NOTES.indexOf(n.note) === targetIdx);
      if (found) shellNotes.push(found);
    }
  }
  return makeExercise('chord-shell-comping', shellNotes.length >= 3 ? shellNotes : sorted, sorted);
}

function generateChordBarreDrill(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const barreNotes: FretboardNote[] = [];
  // Move barre shape up fret by fret
  for (let fret = Math.max(startFret, 1); fret <= Math.min(endFret, startFret + 5); fret++) {
    // E-shape barre: fret all strings at this fret
    for (let s = 0; s < 6; s++) {
      const noteIdx = (NOTES.indexOf(STRING_OPEN_NOTES[s]) + fret) % 12;
      barreNotes.push({
        string: s, fret, note: NOTES[noteIdx],
        interval: (noteIdx - NOTES.indexOf(key) + 12) % 12,
        intervalLabel: String(fret), isRoot: noteIdx === NOTES.indexOf(key),
      });
    }
  }
  return makeExercise('chord-barre-drill', barreNotes.length >= 6 ? barreNotes : sorted, sorted);
}

// ─── SLIDE EXERCISES ───

function generateSlideNFret(key: NoteName, scaleId: string, startFret: number, endFret: number, slideFrets: number, direction: 'up' | 'down', typeId: ExerciseType): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const slideNotes: FretboardNote[] = [];
  for (let i = 0; i < sorted.length; i++) {
    slideNotes.push(sorted[i]);
    // Add the slide target note
    if (i < sorted.length - 1) {
      const slideFret = direction === 'up' ? sorted[i].fret + slideFrets : sorted[i].fret - slideFrets;
      if (slideFret >= 0 && slideFret <= FRET_COUNT) {
        const noteIdx = (NOTES.indexOf(STRING_OPEN_NOTES[sorted[i].string]) + slideFret) % 12;
        slideNotes.push({
          string: sorted[i].string, fret: slideFret, note: NOTES[noteIdx],
          interval: (noteIdx - NOTES.indexOf(key) + 12) % 12,
          intervalLabel: 'sl', isRoot: false,
        });
      }
    }
  }
  return makeExercise(typeId, slideNotes.length >= 4 ? slideNotes : sorted, sorted);
}

// ─── STRING SKIP ADVANCED ───

function generateStringSkipN(key: NoteName, scaleId: string, startFret: number, endFret: number, skipStrings: number, typeId: ExerciseType): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const skipNotes: FretboardNote[] = [];
  // Play scale notes but jump every N strings
  for (let i = 0; i < sorted.length; i++) {
    skipNotes.push(sorted[i]);
    // Find a note skipStrings away
    const targetString = sorted[i].string + skipStrings;
    const match = sorted.find(n => n.string === targetString && n.fret >= startFret && n.fret <= endFret);
    if (match) skipNotes.push(match);
  }
  return makeExercise(typeId, skipNotes.length >= 4 ? skipNotes : sorted, sorted);
}

function generateStringSkipOctave(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const octaveNotes: FretboardNote[] = [];
  // Play note then jump to its octave
  for (const n of sorted) {
    octaveNotes.push(n);
    // Find octave (same note name, 12 frets higher or on different string)
    const octaveMatch = sorted.find(s => s.note === n.note && (s.string !== n.string || s.fret === n.fret + 12));
    if (octaveMatch) octaveNotes.push(octaveMatch);
  }
  return makeExercise('string-skip-octave', octaveNotes.length >= 4 ? octaveNotes : sorted, sorted);
}

function generateStringSkipScale(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const skipNotes: FretboardNote[] = [];
  // Alternate between low strings and high strings
  const low = sorted.filter(n => n.string <= 2);
  const high = sorted.filter(n => n.string >= 3);
  const maxLen = Math.max(low.length, high.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < low.length) skipNotes.push(low[i]);
    if (i < high.length) skipNotes.push(high[i]);
  }
  return makeExercise('string-skip-scale', skipNotes.length >= 4 ? skipNotes : sorted, sorted);
}

// ─── MODAL RUNS ───

function generateModalRun(key: NoteName, scaleId: string, startFret: number, endFret: number, mode: string, typeId: ExerciseType): Exercise {
  const modeScaleId = mode === 'dorian' ? 'dorian' : mode === 'mixolydian' ? 'mixolydian' : mode === 'lydian' ? 'lydian' : 'phrygian';
  const notes = getScaleOnFretboard(key, modeScaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  // Run emphasizing the characteristic note of each mode
  const charIntervalMap: Record<string, number> = { dorian: 9, mixolydian: 10, lydian: 6, phrygian: 1 };
  const charInterval = charIntervalMap[mode] || 0;
  const runNotes: FretboardNote[] = [];
  // Ascending with emphasis on characteristic note
  for (const n of sorted) {
    runNotes.push(n);
    if (n.interval === charInterval) {
      runNotes.push(n); // Play the characteristic note twice for emphasis
    }
  }
  return makeExercise(typeId, runNotes.length >= 4 ? runNotes : sorted, sorted);
}

// ─── BLUES EXTENDED ───

function generateBluesShuffle(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, 'blues', startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const shuffleNotes: FretboardNote[] = [];
  // Shuffle pattern: root, 5th, root, 5th with swung rhythm feel
  for (let i = 0; i < sorted.length; i++) {
    shuffleNotes.push(sorted[i]);
    if (sorted[i].isRoot && i + 2 < sorted.length) {
      shuffleNotes.push(sorted[i + 2]); // Jump to 5th
      shuffleNotes.push(sorted[i]); // Back to root
    }
  }
  return makeExercise('blues-shuffle', shuffleNotes.length >= 4 ? shuffleNotes : sorted, sorted);
}

function generateBluesBendLick(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, 'blues', startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const bendNotes: FretboardNote[] = [];
  // Classic bend lick: b3 bend to 3, then down to root
  for (let i = 0; i < sorted.length - 2; i++) {
    if (sorted[i].interval === 3) { // flat 3
      bendNotes.push(sorted[i]);
      if (i + 1 < sorted.length) bendNotes.push(sorted[i + 1]); // Target note
      bendNotes.push(sorted[i]); // Back
      if (i > 0) bendNotes.push(sorted[i - 1]); // Down to previous
    }
  }
  return makeExercise('blues-bend-lick', bendNotes.length >= 4 ? bendNotes : sorted, sorted);
}

function generateBluesRake(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, 'blues', startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const rakeNotes: FretboardNote[] = [];
  // Rake: quickly drag pick across muted strings then hit target
  // Simulate with quick descending notes
  for (let i = Math.min(sorted.length - 1, 3); i >= 0; i--) {
    rakeNotes.push(sorted[i]);
  }
  // Then the target note (root on high E)
  const root = sorted.find(n => n.isRoot && n.string >= 4);
  if (root) rakeNotes.push(root);
  return makeExercise('blues-rake', rakeNotes.length >= 3 ? rakeNotes : sorted, sorted);
}

function generateBluesGraceNote(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, 'blues', startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const graceNotes: FretboardNote[] = [];
  // Grace note: quick fret below then target
  for (let i = 1; i < sorted.length; i++) {
    // Add a "grace" note one fret below
    const graceFret = sorted[i].fret - 1;
    if (graceFret >= startFret) {
      const noteIdx = (NOTES.indexOf(STRING_OPEN_NOTES[sorted[i].string]) + graceFret) % 12;
      graceNotes.push({
        string: sorted[i].string, fret: graceFret, note: NOTES[noteIdx],
        interval: (noteIdx - NOTES.indexOf(key) + 12) % 12,
        intervalLabel: 'gr', isRoot: false,
      });
    }
    graceNotes.push(sorted[i]);
  }
  return makeExercise('blues-grace-note', graceNotes.length >= 4 ? graceNotes : sorted, sorted);
}

// ─── PICKING DRILLS ───

function generateAltPick1String(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const pickNotes: FretboardNote[] = [];
  // Pick all scale notes on the B string (string 4)
  const bString = sorted.filter(n => n.string === 4);
  if (bString.length < 3) {
    // Fall back to any string with the most notes
    const stringCounts: Record<number, number> = {};
    for (const n of sorted) stringCounts[n.string] = (stringCounts[n.string] || 0) + 1;
    const bestString = Object.entries(stringCounts).sort(([,a],[,b]) => b - a)[0]?.[0];
    if (bestString) pickNotes.push(...sorted.filter(n => n.string === Number(bestString)));
  } else {
    pickNotes.push(...bString);
  }
  return makeExercise('alt-pick-1string', pickNotes.length >= 3 ? pickNotes : sorted, sorted);
}

function generateAltPick2String(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const pickNotes: FretboardNote[] = [];
  // Alternate between G and B strings
  const gString = sorted.filter(n => n.string === 3);
  const bString = sorted.filter(n => n.string === 4);
  const maxLen = Math.max(gString.length, bString.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < gString.length) pickNotes.push(gString[i]);
    if (i < bString.length) pickNotes.push(bString[i]);
  }
  return makeExercise('alt-pick-2string', pickNotes.length >= 4 ? pickNotes : sorted, sorted);
}

function generateSweepPickDrill(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const sweepNotes: FretboardNote[] = [];
  // One note per string, ascending across strings
  for (let s = 0; s < 6; s++) {
    const stringNote = sorted.find(n => n.string === s);
    if (stringNote) sweepNotes.push(stringNote);
  }
  // Then reverse
  for (let s = 5; s >= 0; s--) {
    const stringNote = sorted.find(n => n.string === s);
    if (stringNote) sweepNotes.push(stringNote);
  }
  return makeExercise('sweep-pick-drill', sweepNotes.length >= 4 ? sweepNotes : sorted, sorted);
}

function generateCrossPickDrill(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const crossNotes: FretboardNote[] = [];
  // Cross-picking: 3-string pattern (e.g., D-G-B)
  const strings = [2, 3, 4];
  const pattern = [0, 1, 2, 1]; // D-G-B-G
  for (let rep = 0; rep < 3; rep++) {
    for (const p of pattern) {
      const s = strings[p];
      const stringNotes = sorted.filter(n => n.string === s);
      if (stringNotes.length > 0) {
        crossNotes.push(stringNotes[rep % stringNotes.length]);
      }
    }
  }
  return makeExercise('cross-pick-drill', crossNotes.length >= 4 ? crossNotes : sorted, sorted);
}

// ─── TREMOLO & TRILL ───

function generateTremoloSingle(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const tremNotes: FretboardNote[] = [];
  // Rapid repeated notes: pick the root 8 times
  const root = sorted.find(n => n.isRoot);
  if (root) {
    for (let i = 0; i < 8; i++) tremNotes.push({ ...root });
  }
  // Then each scale note 4 times
  for (const n of sorted.slice(0, 5)) {
    for (let i = 0; i < 4; i++) tremNotes.push({ ...n });
  }
  return makeExercise('tremolo-single', tremNotes.length >= 4 ? tremNotes : sorted, sorted);
}

function generateTremoloChord(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const tremNotes: FretboardNote[] = [];
  // Tremolo across chord tones (root, 3rd, 5th)
  const scale = SCALES[scaleId];
  if (!scale) return makeExercise('tremolo-chord', sorted, sorted);
  const chordTones = [0, 2, 4].map(i => scale.intervals[i % scale.intervals.length]);
  for (let rep = 0; rep < 4; rep++) {
    for (const interval of chordTones) {
      const noteIdx = (NOTES.indexOf(key) + interval) % 12;
      const found = sorted.find(n => NOTES.indexOf(n.note) === noteIdx);
      if (found) tremNotes.push(found);
    }
  }
  return makeExercise('tremolo-chord', tremNotes.length >= 4 ? tremNotes : sorted, sorted);
}

function generateTrillSpeedDrill(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const trillNotes: FretboardNote[] = [];
  // Fast trills between adjacent scale notes
  for (let i = 0; i < sorted.length - 1; i++) {
    for (let rep = 0; rep < 4; rep++) {
      trillNotes.push(sorted[i]);
      trillNotes.push(sorted[i + 1]);
    }
  }
  return makeExercise('trill-speed-drill', trillNotes.length >= 4 ? trillNotes : sorted, sorted);
}

// ─── STRETCH EXERCISES ───

function generateStretch14(key: NoteName, scaleId: string, startFret: number, endFret: number, gap: number, typeId: ExerciseType): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const stretchNotes: FretboardNote[] = [];
  // Index on fret N, pinky on fret N+gap+1 alternating
  for (let s = 0; s < 6; s++) {
    const baseFret = Math.max(startFret, 1);
    // Index finger note
    const idx1 = (NOTES.indexOf(STRING_OPEN_NOTES[s]) + baseFret) % 12;
    stretchNotes.push({
      string: s, fret: baseFret, note: NOTES[idx1],
      interval: (idx1 - NOTES.indexOf(key) + 12) % 12,
      intervalLabel: '1', isRoot: false,
    });
    // Pinky stretch note
    const stretchFret = baseFret + gap + 1;
    if (stretchFret <= endFret) {
      const idx2 = (NOTES.indexOf(STRING_OPEN_NOTES[s]) + stretchFret) % 12;
      stretchNotes.push({
        string: s, fret: stretchFret, note: NOTES[idx2],
        interval: (idx2 - NOTES.indexOf(key) + 12) % 12,
        intervalLabel: '4', isRoot: false,
      });
    }
  }
  return makeExercise(typeId, stretchNotes.length >= 4 ? stretchNotes : sorted, sorted);
}

// ─── ODD GROUPINGS ───

function generateGroupingN(key: NoteName, scaleId: string, startFret: number, endFret: number, groupSize: number, typeId: ExerciseType): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const groupNotes: FretboardNote[] = [];
  // Play scale in overlapping groups of N
  for (let i = 0; i <= sorted.length - groupSize; i += 1) {
    for (let j = 0; j < groupSize && i + j < sorted.length; j++) {
      groupNotes.push(sorted[i + j]);
    }
  }
  return makeExercise(typeId, groupNotes.length >= groupSize ? groupNotes : sorted, sorted);
}

function generateRhythmicDisplacement(key: NoteName, scaleId: string, startFret: number, endFret: number): Exercise {
  const notes = getScaleOnFretboard(key, scaleId, startFret, endFret);
  const sorted = sortNotesAscending(dedupNotes(notes));
  const dispNotes: FretboardNote[] = [];
  // Play 4-note phrase starting from each successive scale degree
  for (let i = 0; i < sorted.length - 3; i++) {
    const phrase = sorted.slice(i, i + 4);
    for (const n of phrase) dispNotes.push(n);
  }
  return makeExercise('rhythmic-displacement', dispNotes.length >= 4 ? dispNotes : sorted, sorted);
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

    // ── New Chromatic Drills ──
    case 'chromatic-2341': return generateChromaticPattern(key, scaleId, startFret, endFret, [2, 3, 4, 1], 'chromatic-2341');
    case 'chromatic-3142': return generateChromaticPattern(key, scaleId, startFret, endFret, [3, 1, 4, 2], 'chromatic-3142');
    case 'chromatic-4132': return generateChromaticPattern(key, scaleId, startFret, endFret, [4, 1, 3, 2], 'chromatic-4132');
    case 'chromatic-3241': return generateChromaticPattern(key, scaleId, startFret, endFret, [3, 2, 4, 1], 'chromatic-3241');
    case 'chromatic-desc-warmup': return generateChromaticDescWarmup(key, scaleId, startFret, endFret);
    case 'chromatic-all-strings': return generateChromaticAllStrings(key, scaleId, startFret, endFret);

    // ── Spider Exercises ──
    case 'chromatic-spider-walk': return generateSpiderWalkClassic(key, scaleId, startFret, endFret);
    case 'spider-cross-1': return generateSpiderCross(key, scaleId, startFret, endFret, 'asc');
    case 'spider-cross-2': return generateSpiderCross(key, scaleId, startFret, endFret, 'desc');
    case 'spider-inward': return generateSpiderInward(key, scaleId, startFret, endFret);
    case 'spider-outward': return generateSpiderOutward(key, scaleId, startFret, endFret);

    // ── String Crossing ──
    case 'string-cross-asc': return generateStringCrossAsc(key, scaleId, startFret, endFret);
    case 'string-cross-desc': return generateStringCrossDesc(key, scaleId, startFret, endFret);
    case 'string-cross-skip': return generateStringCrossSkip(key, scaleId, startFret, endFret);
    case 'string-cross-alternate': return generateStringCrossAlternate(key, scaleId, startFret, endFret);

    // ── Sweep Picking ──
    case 'sweep-3string': return generateSweepNString(key, scaleId, startFret, endFret, 3, 'sweep-3string');
    case 'sweep-5string': return generateSweepNString(key, scaleId, startFret, endFret, 5, 'sweep-5string');
    case 'sweep-minor': return generateSweepMinor(key, scaleId, startFret, endFret);
    case 'sweep-major': return generateSweepMajor(key, scaleId, startFret, endFret);

    // ── Legato ──
    case 'legato-hammer-asc': return generateLegatoHammerAsc(key, scaleId, startFret, endFret);
    case 'legato-hammer-desc': return generateLegatoHammerDesc(key, scaleId, startFret, endFret);
    case 'legato-pull-asc': return generateLegatoPullAsc(key, scaleId, startFret, endFret);
    case 'legato-pull-desc': return generateLegatoPullDesc(key, scaleId, startFret, endFret);
    case 'legato-trill': return generateLegatoTrill(key, scaleId, startFret, endFret);

    // ── Position Shifting ──
    case 'pos-shift-1-fret': return generatePositionShiftN(key, scaleId, 1, 'pos-shift-1-fret');
    case 'pos-shift-2-fret': return generatePositionShiftN(key, scaleId, 2, 'pos-shift-2-fret');
    case 'pos-shift-3-fret': return generatePositionShiftN(key, scaleId, 3, 'pos-shift-3-fret');

    // ── Scale Patterns ──
    case 'scale-2nps': return generateScale2NPS(key, scaleId, startFret, endFret);
    case 'scale-4nps': return generateScale4NPS(key, scaleId, startFret, endFret);
    case 'scale-offset-run': return generateScaleOffsetRun(key, scaleId, startFret, endFret);
    case 'scale-spiral': return generateScaleSpiral(key, scaleId, startFret, endFret);
    case 'scale-box-run': return generateScaleBoxRun(key, scaleId);

    // ── Interval Studies ──
    case 'intervals-octave': return generateIntervalsOctave(key, scaleId, startFret, endFret);
    case 'intervals-tritone': return generateIntervalsTritone(key, scaleId, startFret, endFret);
    case 'intervals-compound': return generateIntervalsCompound(key, scaleId, startFret, endFret);
    case 'intervals-chromatic': return generateIntervalsChromatic(key, scaleId, startFret, endFret);

    // ── Arpeggio Studies ──
    case 'arp-diminished': return generateArpByIntervals(key, scaleId, startFret, endFret, [0, 3, 6], 'arp-diminished');
    case 'arp-augmented': return generateArpByIntervals(key, scaleId, startFret, endFret, [0, 4, 8], 'arp-augmented');
    case 'arp-minor7': return generateArpByIntervals(key, scaleId, startFret, endFret, [0, 3, 7, 10], 'arp-minor7');
    case 'arp-dom7': return generateArpByIntervals(key, scaleId, startFret, endFret, [0, 4, 7, 10], 'arp-dom7');
    case 'arp-maj7': return generateArpByIntervals(key, scaleId, startFret, endFret, [0, 4, 7, 11], 'arp-maj7');
    case 'arp-min9': return generateArpByIntervals(key, scaleId, startFret, endFret, [0, 3, 7, 10, 14], 'arp-min9');

    // ── Rhythm & Timing ──
    case 'rhythm-gallop': return generateRhythmGallop(key, scaleId, startFret, endFret);
    case 'rhythm-triplet': return generateRhythmTriplet(key, scaleId, startFret, endFret);
    case 'rhythm-dotted': return generateRhythmDotted(key, scaleId, startFret, endFret);

    // ── Bending & Expression ──
    case 'bend-release': return generateBendRelease(key, scaleId, startFret, endFret);
    case 'bend-1step': return generateBend1Step(key, scaleId, startFret, endFret);
    case 'bend-1half': return generateBend1Half(key, scaleId, startFret, endFret);

    // ── Harmonics ──
    case 'harmonics-tap': return generateHarmonicsTap(key, scaleId, startFret, endFret);
    case 'harmonics-pinch-scale': return generateHarmonicsPinchScale(key, scaleId, startFret, endFret);

    // ── Tapping ──
    case 'tap-8finger': return generateTap8Finger(key, scaleId, startFret, endFret);
    case 'tap-sweep': return generateTapSweep(key, scaleId, startFret, endFret);
    case 'tap-tap-pull': return generateTapTapPull(key, scaleId, startFret, endFret);

    // ── Blues ──
    case 'blues-lick-1': return generateBluesLick1(key, scaleId, startFret, endFret);
    case 'blues-lick-2': return generateBluesLick2(key, scaleId, startFret, endFret);
    case 'blues-turnaround': return generateBluesTurnaround(key, scaleId, startFret, endFret);

    // ── Fretboard Knowledge ──
    case 'caged-shapes': return generateCagedShapes(key, scaleId);
    case 'note-triplets': return generateNoteTriplets(key, scaleId, startFret, endFret);
    case 'relative-note': return generateRelativeNote(key, scaleId, startFret, endFret);
    case 'fretboard-map': return generateFretboardMap(key, scaleId, startFret, endFret);

    // ── Speed & Agility ──
    case 'speed-ladder': return generateSpeedLadder(key, scaleId, startFret, endFret);
    case 'speed-burst-16th': return generateSpeedBurst16th(key, scaleId, startFret, endFret);
    case 'speed-triplet-run': return generateSpeedTripletRun(key, scaleId, startFret, endFret);

    // ── Complete Chromatic Permutations ──
    case 'chromatic-1243': return generateChromaticPattern(key, scaleId, startFret, endFret, [1, 2, 4, 3], 'chromatic-1243');
    case 'chromatic-1342': return generateChromaticPattern(key, scaleId, startFret, endFret, [1, 3, 4, 2], 'chromatic-1342');
    case 'chromatic-1432': return generateChromaticPattern(key, scaleId, startFret, endFret, [1, 4, 3, 2], 'chromatic-1432');
    case 'chromatic-2134': return generateChromaticPattern(key, scaleId, startFret, endFret, [2, 1, 3, 4], 'chromatic-2134');
    case 'chromatic-2143': return generateChromaticPattern(key, scaleId, startFret, endFret, [2, 1, 4, 3], 'chromatic-2143');
    case 'chromatic-2314': return generateChromaticPattern(key, scaleId, startFret, endFret, [2, 3, 1, 4], 'chromatic-2314');
    case 'chromatic-2431': return generateChromaticPattern(key, scaleId, startFret, endFret, [2, 4, 3, 1], 'chromatic-2431');
    case 'chromatic-3124': return generateChromaticPattern(key, scaleId, startFret, endFret, [3, 1, 2, 4], 'chromatic-3124');
    case 'chromatic-3214': return generateChromaticPattern(key, scaleId, startFret, endFret, [3, 2, 1, 4], 'chromatic-3214');
    case 'chromatic-3412': return generateChromaticPattern(key, scaleId, startFret, endFret, [3, 4, 1, 2], 'chromatic-3412');
    case 'chromatic-3421': return generateChromaticPattern(key, scaleId, startFret, endFret, [3, 4, 2, 1], 'chromatic-3421');
    case 'chromatic-4123': return generateChromaticPattern(key, scaleId, startFret, endFret, [4, 1, 2, 3], 'chromatic-4123');
    case 'chromatic-4213': return generateChromaticPattern(key, scaleId, startFret, endFret, [4, 2, 1, 3], 'chromatic-4213');
    case 'chromatic-4231': return generateChromaticPattern(key, scaleId, startFret, endFret, [4, 2, 3, 1], 'chromatic-4231');

    // ── Finger Independence Drills ──
    case 'finger-1-2-1-3': return generateFingerDrill(key, scaleId, startFret, endFret, [1, 2, 1, 3], 'finger-1-2-1-3');
    case 'finger-1-2-1-4': return generateFingerDrill(key, scaleId, startFret, endFret, [1, 2, 1, 4], 'finger-1-2-1-4');
    case 'finger-1-3-1-4': return generateFingerDrill(key, scaleId, startFret, endFret, [1, 3, 1, 4], 'finger-1-3-1-4');
    case 'finger-2-1-2-3': return generateFingerDrill(key, scaleId, startFret, endFret, [2, 1, 2, 3], 'finger-2-1-2-3');
    case 'finger-2-1-2-4': return generateFingerDrill(key, scaleId, startFret, endFret, [2, 1, 2, 4], 'finger-2-1-2-4');
    case 'finger-3-1-3-2': return generateFingerDrill(key, scaleId, startFret, endFret, [3, 1, 3, 2], 'finger-3-1-3-2');

    // ── Open String Exercises ──
    case 'open-string-alternate': return generateOpenStringAlternate(key, scaleId, startFret, endFret);
    case 'open-string-fret-combo': return generateOpenStringFretCombo(key, scaleId, startFret, endFret);
    case 'open-string-bass-run': return generateOpenStringBassRun(key, scaleId, startFret, endFret);
    case 'open-string-arpeggio': return generateOpenStringArpeggio(key, scaleId, startFret, endFret);

    // ── Chord Exercises ──
    case 'chord-triad-asc': return generateChordTriadAsc(key, scaleId, startFret, endFret);
    case 'chord-triad-desc': return generateChordTriadDesc(key, scaleId, startFret, endFret);
    case 'chord-power-5th': return generateChordPower5th(key, scaleId, startFret, endFret);
    case 'chord-shell-comping': return generateChordShellComping(key, scaleId, startFret, endFret);
    case 'chord-barre-drill': return generateChordBarreDrill(key, scaleId, startFret, endFret);

    // ── Sliding Exercises ──
    case 'slide-up-1fret': return generateSlideNFret(key, scaleId, startFret, endFret, 1, 'up', 'slide-up-1fret');
    case 'slide-up-2fret': return generateSlideNFret(key, scaleId, startFret, endFret, 2, 'up', 'slide-up-2fret');
    case 'slide-down-1fret': return generateSlideNFret(key, scaleId, startFret, endFret, 1, 'down', 'slide-down-1fret');

    // ── String Skip Advanced ──
    case 'string-skip-3rd': return generateStringSkipN(key, scaleId, startFret, endFret, 2, 'string-skip-3rd');
    case 'string-skip-4th': return generateStringSkipN(key, scaleId, startFret, endFret, 3, 'string-skip-4th');
    case 'string-skip-octave': return generateStringSkipOctave(key, scaleId, startFret, endFret);
    case 'string-skip-scale': return generateStringSkipScale(key, scaleId, startFret, endFret);

    // ── Modal Exercises ──
    case 'modal-dorian-run': return generateModalRun(key, scaleId, startFret, endFret, 'dorian', 'modal-dorian-run');
    case 'modal-mixolydian-run': return generateModalRun(key, scaleId, startFret, endFret, 'mixolydian', 'modal-mixolydian-run');
    case 'modal-lydian-run': return generateModalRun(key, scaleId, startFret, endFret, 'lydian', 'modal-lydian-run');
    case 'modal-phrygian-run': return generateModalRun(key, scaleId, startFret, endFret, 'phrygian', 'modal-phrygian-run');

    // ── Blues Extended ──
    case 'blues-shuffle': return generateBluesShuffle(key, scaleId, startFret, endFret);
    case 'blues-bend-lick': return generateBluesBendLick(key, scaleId, startFret, endFret);
    case 'blues-rake': return generateBluesRake(key, scaleId, startFret, endFret);
    case 'blues-grace-note': return generateBluesGraceNote(key, scaleId, startFret, endFret);

    // ── Picking Drills ──
    case 'alt-pick-1string': return generateAltPick1String(key, scaleId, startFret, endFret);
    case 'alt-pick-2string': return generateAltPick2String(key, scaleId, startFret, endFret);
    case 'sweep-pick-drill': return generateSweepPickDrill(key, scaleId, startFret, endFret);
    case 'cross-pick-drill': return generateCrossPickDrill(key, scaleId, startFret, endFret);

    // ── Tremolo & Trill ──
    case 'tremolo-single': return generateTremoloSingle(key, scaleId, startFret, endFret);
    case 'tremolo-chord': return generateTremoloChord(key, scaleId, startFret, endFret);
    case 'trill-speed-drill': return generateTrillSpeedDrill(key, scaleId, startFret, endFret);

    // ── Stretch Exercises ──
    case 'stretch-1-4-1fret': return generateStretch14(key, scaleId, startFret, endFret, 1, 'stretch-1-4-1fret');
    case 'stretch-1-4-2fret': return generateStretch14(key, scaleId, startFret, endFret, 2, 'stretch-1-4-2fret');
    case 'stretch-wide-1-4': return generateStretch14(key, scaleId, startFret, endFret, 3, 'stretch-wide-1-4');

    // ── Odd Groupings ──
    case 'grouping-5': return generateGroupingN(key, scaleId, startFret, endFret, 5, 'grouping-5');
    case 'grouping-7': return generateGroupingN(key, scaleId, startFret, endFret, 7, 'grouping-7');
    case 'grouping-9': return generateGroupingN(key, scaleId, startFret, endFret, 9, 'grouping-9');
    case 'rhythmic-displacement': return generateRhythmicDisplacement(key, scaleId, startFret, endFret);

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
