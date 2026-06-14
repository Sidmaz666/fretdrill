---
Task ID: 1
Agent: main
Task: Upgrade audio engine, fix playback visualizations, add BPM controls

Work Log:
- Read current page.tsx audio engine (3-oscillator synth, simple sine metronome)
- Identified issues: basic guitar sound, simple metronome click, limited BPM presets, scale vs exercise playback visualization differences
- Rewrote guitar sound engine with 6-layer professional synthesis:
  1. Fundamental (triangle wave with pitch envelope for string stretch transient)
  2. 2nd harmonic (sine, octave above)
  3. 3rd harmonic (sine)
  4. Body resonance (low-pass filtered sub-harmonic)
  5. Brightness (sawtooth → lowpass filter that decays quickly, simulating pick attack)
  6. Pluck noise burst (bandpass filtered noise, string-dependent frequency)
  - Added singleton DynamicsCompressor for overall dynamics
  - Proper standard tuning frequencies: E2=82.41, A2=110.00, D3=146.83, G3=196.00, B3=246.94, E4=329.63
- Rewrote metronome with professional wood block sound:
  1. Tone component (sine burst at G6/C6 for accent/normal)
  2. Click noise burst (highpass filtered, simulates wood block "clack")
  3. Resonance body (low sine for woody tone)
- Added BPM controls: +1/-1 increment buttons, 15 presets (40-220 in steps of 10), finer slider
- Fixed scale vs exercise playback visualization:
  - Fretboard: Now always shows exercise highlight notes AND exercise path during both exercise and scale playback (removed the isPlaying conditional that was hiding them)
  - Tabs: Added `activePlayingNote` prop for position-based matching during scale playback
  - Exercise mode: highlights tab note by index (playingIdx === gi)
  - Scale mode: highlights tab note by string+fret position (scaleHighlightIdx)
  - Both modes now properly highlight the active note on BOTH fretboard and tabs
- Build passes successfully

Stage Summary:
- Professional guitar sound: 6-oscillator synthesis with pick noise, body resonance, harmonic overtones, and dynamics compressor
- Professional metronome: wood block sound with tone + click noise + resonance body
- BPM: 15 presets (40-220), +1/-1 buttons, tap tempo
- Scale playback now properly visualizes on both fretboard and tabs
- Exercise playback shows exercise highlights + active note simultaneously
- Single highlight on fretboard (playbackActiveNote) + exercise context (highlightNotes + exercisePath) visible together
