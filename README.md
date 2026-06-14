# FretDrill

> Interactive guitar fretboard practice tool with CAGED positions, scale patterns, tab notation, and exercise generation.

## Features

- **Fretboard Visualization** — SVG fretboard diagram with notes, intervals, fret markers, and string labels. Supports both full-fretboard and position-focused views.
- **CAGED System** — Auto-generated CAGED positions for any key and scale. Toggle between individual positions or view all at once.
- **Scale Engine** — 12+ scales including major, minor, pentatonic, blues, and modes. Each note is labeled with its interval (R, 2, ♭3, 4, etc.).
- **Exercise Generator** — 232+ exercise types across 43+ categories. Every exercise is generated procedurally based on your current key, scale, and position.
- **Tab Notation** — Text-based tablature view synced with the fretboard. Supports export as PNG/SVG.
- **Audio Playback** — Web Audio engine that plays exercises and scales with realistic guitar tones. Includes a metronome with multiple sound types.
- **Practice Timer & Stats** — Session timer, notes played counter, and detailed exercise analysis (fret range, string changes, position shifts).
- **Random Mode** — Randomize key, scale, and exercise in one click. Great for drilling unfamiliar patterns.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build for Production

```bash
npm run build
npm run start
```

The production build outputs to `.next/` using Next.js standalone output mode — all required files are bundled for deployment without `node_modules`.

## Project Structure

```
src/
├── app/
│   ├── api/route.ts          # API endpoint
│   ├── globals.css           # Global styles, sketch theme, scrollbars
│   ├── layout.tsx            # Root layout with metadata, fonts
│   └── page.tsx              # Main single-page app (2659 lines)
├── components/
│   ├── guitar/
│   │   ├── FretboardDiagram.tsx   # SVG fretboard rendering
│   │   ├── PatternDiagram.tsx     # CAGED position card diagrams
│   │   └── TabNotation.tsx        # Tablature rendering with export
│   └── ui/                        # Minimal UI primitives (shadcn/ui)
│       ├── collapsible.tsx
│       ├── select.tsx
│       ├── slider.tsx
│       ├── switch.tsx
│       ├── tabs.tsx
│       ├── toast.tsx
│       ├── toaster.tsx
│       └── tooltip.tsx
├── hooks/
│   └── use-toast.ts
└── lib/
    ├── exercise-generator.ts   # 5370 lines — exercise logic
    ├── music-theory.ts         # Scales, CAGED positions, fretboard math
    └── utils.ts                # Tailwind class merging
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4 |
| Rendering | Inline SVG (fretboard, patterns, tabs) |
| Audio | Web Audio API (oscillators, gain nodes) |
| Icons | lucide-react |
| Export | html-to-image (PNG/SVG download) |

## Usage

1. **Select a Key and Scale** from the top bar dropdowns.
2. **Choose a Position** (P1–P6) to focus on a specific CAGED shape, or click "All" to see the full fretboard.
3. **Pick an Exercise** from the left sidebar. Exercises are organized by category (Ascending/Descending, Intervals, Sequences, Arpeggios, etc.).
4. **Play** using the inline controls — play the exercise or the raw scale. The active note highlights on both the fretboard and tab.
5. **Switch Views** between Fretboard, Tab, Hybrid (both), and Analysis (stats).
6. **Use the Metronome** for timing practice. Multiple sound types available.
7. **Hit Random** to get a random key, scale, and exercise — great for drilling.

## License

MIT
