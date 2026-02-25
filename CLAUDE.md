# CLAUDE.md

## Project Overview

Personal portfolio website (earthtojake.com) — a Next.js app with interactive whiteboard animations, scroll-based reveal effects, and a hand-drawn visual style. Deployed on Vercel.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack) + React 19 + TypeScript (strict mode)
- **Styling:** Tailwind CSS 4 (via `@tailwindcss/postcss`, imported in `src/styles.css`)
- **Routing:** Next.js file-based routing (`src/app/`)
- **Package Manager:** npm

## Commands

```bash
npm run dev          # Start Next.js dev server (Turbopack)
npm run build        # Next.js production build
npm run start        # Serve production build
npm run typecheck    # Dead code detection (knip) + TypeScript check
npm run deadcode     # Knip dead code detection only
```

## Checks to Run Before Pushing

The pre-push hook runs `npm run typecheck`, which does two things in sequence:

1. **Knip** — flags unused exports and files (`npm run deadcode`)
2. **tsc** — full TypeScript type check (`tsc -b`)

Always run `npm run typecheck` before committing/pushing.

## Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── layout.tsx            # Root layout (metadata, fonts, global CSS)
│   ├── ClientShell.tsx       # Client component: viewport lock + title wave animation
│   ├── page.tsx              # / route (home)
│   ├── notes/page.tsx        # /notes route
│   └── fun-facts/page.tsx    # /fun-facts route
├── views/
│   ├── HomePage.tsx          # Main landing page component
│   └── NotesPage.tsx         # Secondary page component
├── styles.css                # Global CSS: Tailwind import, CSS variables, whiteboard styles, animations
├── colors.ts                 # Shared color constants
├── viewportLock.ts           # Viewport dimension utilities
├── components/
│   ├── Whiteboard.tsx        # Interactive drawing canvas (largest component)
│   ├── WhiteboardMarkerTray.tsx  # Marker/eraser tool selector
│   ├── BouncingFunFacts.tsx  # DVD-style bouncing "fun facts" link in hero whiteboard
│   ├── HeroSlide.tsx   # Hero section with name animation
│   ├── HeroContactBar.tsx    # Contact links bar
│   ├── ContentSlides.tsx  # Content slide sections
│   ├── Polaroids.tsx         # Photo gallery with Photoswipe
│   ├── ResponsiveViewportContainer.tsx  # Responsive wrapper
│   ├── ViewportContainer.tsx # Viewport wrapper
│   ├── HelloRecorder.tsx     # Dev-only drawing recorder tool
│   ├── helloDrawing.ts       # Drawing data helper
│   └── drawings/             # ~42 JSON preset files (generated, do not hand-edit)
└── reveal/
    ├── RevealItem.tsx        # Scroll-triggered reveal animation wrapper
    ├── Slide.tsx       # Scroll-based slide animation controller
    ├── easing.ts             # Easing functions
    ├── math.ts               # Math utilities
    ├── notationPresets.ts    # Rough-notation annotation presets
    ├── notationTypes.ts      # Notation type definitions
    └── types.ts              # Shared types for reveal system
```

## Key Conventions

- **All visible text is lowercase** — enforced globally via `text-transform: lowercase` in CSS. Do not fight this with uppercase text.
- **Client components** — most components use browser APIs (DOM, IntersectionObserver, canvas) and need `"use client"`. The App Router page files in `src/app/` use `"use client"` to wrap these.
- **`src/views/` not `src/pages/`** — page-level components live in `src/views/` because Next.js reserves `pages/` for the Pages Router.
- **CSS variables** — whiteboard frame sizes, hero layout values, and slide dimensions are all controlled via CSS custom properties in `:root` (see `src/styles.css`).
- **Drawing presets are generated** — the JSON files in `src/components/drawings/` are produced by Node scripts in `scripts/`. Edit the scripts or source SVGs, not the JSON directly.
- **No test framework** — correctness is validated via TypeScript strict mode and Knip dead code detection. There are no unit/integration tests.
- **Knip ignore list** — `HelloRecorder.tsx` and `helloDrawing.ts` are intentionally excluded from dead code detection (they are dev-only tools). See `knip.json`.

## Important Libraries

| Library | Purpose |
|---------|---------|
| `next` | Framework (App Router, SSR/SSG, file-based routing) |
| `perfect-freehand` | Generates smooth freehand stroke paths for the whiteboard |
| `rough-notation` | Hand-drawn annotation effects (underlines, boxes, circles) |
| `photoswipe` + `react-photo-album` | Lightbox photo gallery |
| `lucide-react` | Icon set |
