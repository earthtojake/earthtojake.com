# AGENTS.md

See [CLAUDE.md](./CLAUDE.md) for full project context, tech stack, and structure.

## Quick Reference for Agents

- **Build:** `npm run build` (Next.js production build)
- **Typecheck:** `npm run typecheck` (knip + tsc — run before pushing)
- **Dev:** `npm run dev` (Next.js dev server with Turbopack)

## Routing

This project uses the **Next.js App Router** (`src/app/`). Routes:

| Route | File | Description |
|-------|------|-------------|
| `/` | `src/app/page.tsx` | Home — interactive whiteboard portfolio |
| `/notes` | `src/app/notes/page.tsx` | Simple text page |
| `/fun-facts` | `src/app/fun-facts/page.tsx` | Fun facts list |

To add a new route, create `src/app/<route>/page.tsx`.

## Key Gotchas

- **Do not use `src/pages/`** — Next.js reserves that directory for Pages Router. Page-level components live in `src/views/`.
- **Most components need `"use client"`** — they use hooks, browser APIs, and DOM manipulation. App Router page files that render these must include the directive.
- **No webpack config** — Next.js 16 uses Turbopack by default. The `next.config.js` should stay minimal.
- **Tailwind via PostCSS** — configured in `postcss.config.mjs` using `@tailwindcss/postcss`, not a Vite plugin.
- **All text is lowercase** — global `text-transform: lowercase` in CSS. Don't use uppercase.
- **Drawing JSON presets are generated** — don't hand-edit files in `src/components/drawings/`.
- **Deployment** — Vercel, configured via `vercel.json`.
