# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

Remotion 4 (React 19 + TypeScript) for programmatic video. Node 24. Remotion bundles its own ffmpeg and downloads a headless Chrome on first render, so no system ffmpeg/Chrome is needed.

## Commands

- `npm install` — install dependencies
- `npm run dev` — open Remotion Studio (live preview, prop editing) at http://localhost:3000
- `npx remotion render <CompositionId> out/<name>.mp4` — render a video (e.g. `npx remotion render TestAnimasjon out/test.mp4`)
- `npx remotion still <CompositionId> out/<name>.png --frame=<n>` — render a single frame (fast way to check a visual)
- `npm run lint` — typecheck (`tsc --noEmit`); there are no tests

## Architecture

- `src/index.ts` is the Remotion entry point (`registerRoot`).
- `src/Root.tsx` registers every `<Composition>` (id, size, fps, duration, default props, zod schema). New animations are added here.
- Each animation is a React component that derives everything from `useCurrentFrame()` / `useVideoConfig()` using `interpolate` and `spring`. Never use CSS transitions, `setTimeout`, or other wall-clock animation; rendering must be deterministic per frame.
- Props are typed with a `zod` schema so they can be edited in Studio. Remotion requires the exact `zod` version it pins (currently 3.22.3).
- `remotion.config.ts` holds CLI render settings. Output goes in `out/` (gitignored); static assets go in `public/` and are loaded with `staticFile()`.
- Remotion packages must all share the same exact version; upgrade them together with `npm run upgrade`.
