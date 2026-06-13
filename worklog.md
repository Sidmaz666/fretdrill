---
Task ID: 1
Agent: main
Task: Complete FretBoard Forge overhaul - add exercises, metronome, BPM, playback, reorganize layout

Work Log:
- Read all current source files (page.tsx, exercise-generator.ts, FretboardDiagram.tsx, TabNotation.tsx, music-theory.ts, globals.css)
- Added 8 new exercise types to exercise-generator.ts: reverse-pentatonic, sequence-5, pedal-tone, arpeggios, octave-shapes, double-stops, spider-walk, interval-jump (total now 22 exercises)
- Exported sortNotesAscending from exercise-generator.ts for scale playback use
- Completely rewrote page.tsx with:
  - Reorganized layout: Key → Scale (full width) → Position + Intervals stacked after
  - Removed Position Connections section (was non-functional)
  - Added comprehensive BPM control with slider (40-220), presets (60/80/100/120/140/160/180), and tap tempo
  - Added full metronome with time signature selector (3/4, 4/4, 5/4, 6/8), visual beat indicators, and audio click (accent on beat 1)
  - Added playback controls: Play Exercise, Play Scale, Pause, Stop
  - Integrated BPM with exercise/scale playback timing
  - Enhanced audio engine with sub-harmonic for warmer guitar sound
  - Added metronome click sound (accent/non-accent)
  - Updated exercise categories to include new types
  - Footer now shows exercise count (22 exercises)
- Enhanced TabNotation component:
  - Added activePlayingNote prop for real-time playing info display
  - Better visual highlighting during playback (scale-110 animation)
  - Shows currently playing note info (note name, interval, string, fret)
- Enhanced FretboardDiagram:
  - Stronger active note glow (dual ring glow) during playback
  - Brighter fill and thicker stroke for active notes

Stage Summary:
- 22 total exercise types (was 14, added 8 new)
- Comprehensive metronome with BPM, time signature, visual beats, tap tempo
- Full playback engine for exercises and scales with play/pause/stop
- Position Connections section removed (was non-functional)
- Layout reorganized with Scale full width, Position/Intervals stacked after
- All builds pass successfully
- Dev server running on port 3000
