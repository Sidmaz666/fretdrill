---
Task ID: 1
Agent: main
Task: Fix guitar exercise website - full fretboard, patterns, exercises, UI/UX

Work Log:
- Analyzed uploaded reference image showing CAGED pattern diagrams with colored notes, connecting lines, and numbered sequences
- Rewrote FretboardDiagram component to always show full fretboard (0-15 frets) with `fullFretboard` prop
- Added position highlight rectangle showing selected CAGED position on the full fretboard
- Notes outside current position are dimmed (0.35 opacity) while keeping exercise notes prominent
- Exercise path lines now include arrow heads showing direction of note sequence
- Sequence numbers displayed on exercise notes with small red numbered circles
- Created new PatternDiagram component for CAGED position thumbnail diagrams
  - Shows individual CAGED positions with shape lines connecting notes
  - Exercise sequence numbers overlaid on notes
  - Root note double rings and crosshatch patterns
  - Custom label support for connection diagrams
- Enhanced exercise-generator.ts with 6 new exercise types:
  - string-skip, lateral-run, diagonal, position-shift, pentatonic-run, economy-picking
  - Added sequenceNumber to ExerciseNote interface
  - Added generatePatternExercises() function for CAGED pattern generation
- Rewrote page.tsx with improved layout:
  - Control bar at top with Key (6x2 grid), Scale (dropdown), Position (1-5 + All), Intervals
  - Scale notes shown in header with interval labels and colors
  - Exercise selector grouped by categories: Scale Runs, Sequences, Shapes, Technique, Connections
  - CAGED Patterns section showing 5 position thumbnails with clickable selection
  - Position Connections section showing bridge diagrams between adjacent positions
  - Full fretboard always shown (0-15 frets) with exercise overlays
- All builds successful with Next.js 16.1.3

Stage Summary:
- Full fretboard (0-15) always visible with position highlighting
- 14 exercise types available (up from 8)
- CAGED pattern diagrams with numbered sequences
- Position connection diagrams showing bridges between positions
- Exercise notes properly highlighted on full fretboard with sequence numbers and arrows
- Improved UI layout with categorized exercise buttons
