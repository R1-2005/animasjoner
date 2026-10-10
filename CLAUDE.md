# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose and audience

The owner is an IT architect. These animations explain what happens "under the hood" in the applications they work on, for people who are not deeply technical: colleagues, management and the IT department. They are shown on big screens during presentations. Almost every animation here has this purpose, so optimise for clarity at a distance (large text, high contrast, one idea at a time) over technical completeness. Adjust depth to the audience named in the request; management gets the least detail.

The main product being explained is called **Gremlin**. Humor is welcome and deliberate: deadpan annotations, and later a Gremlin character reacting to what happens.

## Working agreements

- The owner writes in Norwegian. Answer in English, which they read fluently and which is often more precise. Text *inside* animations is in Norwegian unless told otherwise.
- Git: commit and push only when explicitly asked, and don't ask whether to. The owner works iteratively: try things, push when satisfied, roll back when the direction feels wrong. Keep commits small and self-contained so a rollback is easy.
- The owner gives context with their requests. Record lasting context (domain knowledge about Gremlin, audiences, recurring jokes, style decisions, what worked or was rejected) in this file, under "Project context" below, so understanding builds up over time.
- Verify visuals before reporting: render a few key frames with `npx remotion still` and look at them. A clean typecheck does not prove an animation looks right.

## Project context

- 2026-10-10: Established the house style with `TestAnimasjon` ("Hva skjer egentlig når du trykker «Lagre»?"). The owner said it is exactly what they had in mind, so it is the reference for tone, pacing (about 15 s) and humor level.
- 2026-10-10: An otter SVG was tried as a stand-in mascot (code-drawn eyes and mouth on top of the artwork), then removed. The owner now supplies hand-drawn Gremlin heads as bitmaps, black line art on transparent background, one per expression. A first set (detailed line art) proved the approach but was too detailed. The second set (bold even lines, white fill, ten expressions) matches the house style and is in use in `TestAnimasjon`: small in the top right, reacting to the story, ending «trøtt» at the punchline. Kept from the otter test: the mascot sits small in the top right so it does not steal focus, and its reactions follow the scene's timeline.

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
- Props are typed with a `zod` schema so they can be edited in Studio. Remotion requires the exact `zod` version it pins (currently 4.5.4; the CLI prints a "Version mismatch" warning otherwise).
- House style: a light "technical drawing" look for big-screen presentations to non-technical audiences, with high contrast, smooth motion and deadpan humor in annotations. Colors, fonts (Inter + JetBrains Mono via `@remotion/google-fonts`) and stroke widths live in `src/style/theme.ts`; never hard-code colors in scenes. `src/style/anim.ts` has `ramp` (clamped, eased 0→1) and `typewriter`.
- `src/components/` holds reusable SVG building blocks, all drawn in a 1920×1080 SVG coordinate space: `Paper` (grid background, frame and title block), `Box` (component that draws itself on), `Connector` (arrow), `Packet` (data moving between points), `Gear`, `Database` (cylinder with fill level), `Annotation` (leader line and typewriter text), `Cursor`, `Gremlin` (mascot, see below). Components take a `start` frame; the scene keeps its timeline in a single `T` object (see `src/TestAnimasjon.tsx`) so pacing can be tuned in one place.
- `Gremlin` shows the mascot head as one transparent PNG per expression (`public/Gremlin_<expression>.png`: nøytral, glad, overrasket, spørrende, bekymret, oppgitt, frustrert, top_irritert, triumferende, trøtt). The PNGs are cropped differently, so `IMAGES` in the component holds a measured scale and offset per expression that lays the face exactly over "nøytral" (found by maximising overlap of the face, ears excluded, in headless Chrome via a throwaway Remotion composition). Everything is drawn in the neutral image's 555×310 space and scaled to `width`. A scene drives it with `GremlinKey[]` (`at`, `expression`, optional `transition`: crossfade, blink, pop, shake, flip, wipe). `spørrende` is drawn with a tilted head on purpose, so it aligns less well. A new or re-exported PNG must be re-measured and checked with a semi-transparent overlay on "nøytral".
- `remotion.config.ts` holds CLI render settings. Output goes in `out/` (gitignored); static assets go in `public/` and are loaded with `staticFile()`.
- Remotion packages must all share the same exact version; upgrade them together with `npm run upgrade`.
