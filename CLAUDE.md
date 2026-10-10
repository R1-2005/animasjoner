# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose and audience

The owner is an IT architect. These animations explain what happens "under the hood" in the applications they work on, for people who are not deeply technical: colleagues, management and the IT department. They are shown on big screens during presentations. Almost every animation here has this purpose, so optimise for clarity at a distance (large text, high contrast, one idea at a time) over technical completeness. Adjust depth to the audience named in the request; management gets the least detail.

The main product being explained is called **Gremlin**. Humor is welcome and deliberate: deadpan annotations, and later a Gremlin character reacting to what happens.

## Domain: what Gremlin does

Gremlin is a line-of-business system (fagsystem) for the AFP scheme (avtalefestet pensjon). Norwegian domain terms are kept as-is, since they also appear in the animations.

**Tilslutningsregisteret** is Gremlin's own register of member companies, maintained internally. It is the foundation that every other process starts from. Internally it is called **«gullet»** (the gold): this is where the organisation builds its value. In the animations it is first introduced as an ordinary blue database («Tilslutningsregisteret»), then transforms into gold rising from the bottom and is named «Gullet» (end of scene 1); from then on it is drawn as a gold-filled database with sparkles in every scene (`Database gold={0..1}`, colors `gold`/`goldFill`/`goldLight` in the theme). It is a strict tree, always with exactly one Foretak at the root:
- **Foretak**: the legal entity from Enhetsregisteret (overordnet enhet, juridisk enhet, konsern).
- **Fakturagruppe (FG)**: receives one invoice per quarter. A Foretak has one or more FGs.
- **Virksomhet**: a sub-unit from Enhetsregisteret (avdeling, underenhet). An FG has one or more.
- The smallest "bedrift" is 1 Foretak → 1 FG → 1 Virksomhet. A typical one has a few FGs, each with a few Virksomheter. Internally the whole tree is loosely called a "bedrift".

Everything else comes from external integrations: **Nav** (arbeidsforhold, ytelser, AFP-søknader), **Skatteetaten** (inntekter) and **Folkeregisteret** (navn, adresse), plus regnskap.

**Kvartalsfakturering** (premie). Start in Tilslutningsregisteret → collect the Virksomheter in the invoice basis → fetch each Foretak's employees from Nav (arbeidsforhold) → order each person's income for the current year from Skatteetaten → calculate premie per Virksomhet, summed per FG = one invoice → fetch names from Folkeregisteret for the invoice appendix (each person's contribution to the premie). Scale per quarter: about 17 000 Virksomheter and over 1 million persons. Over 10 billion NOK invoiced per year.

**AFP-søknad** (the term is **søknadsbehandling**, never «saksbehandling»: Gremlin does not make the final decision, Nav does). People usually apply together with alderspensjon (Nav's DinPensjon), so applications come from Nav. Order:
1. Gremlin asks Nav's API for new applications.
2. Fetches updated personal data (navn, adresse, etc.) from Folkeregisteret.
3. Asks Nav whether the person has received AFP from the public sector (offentlig AFP).
4. Fetches arbeidsforhold from Nav.
5. **Fase 1**: has the person received offentlig AFP (→ avslag)? Is the person employed in a member company (Virksomhet in a member FG, checked against Tilslutningsregisteret)?
6. If no offentlig AFP and employed in a member company → **Fase 2** (vilkårsprøving): fetch inntekter from Skatteetaten.
7. Fetch arbeidsforhold again for the whole ansiennitet period, plus ytelser from Nav (sickness, disability, AAP, etc.).
8. Behovsprøving/vilkårsprøving → avslag or innvilget.
9. Send vedtak to Nav, which makes the final decision together with alderspensjon. If granted: monthly payment.

**Syntetisk database** (development, testing, training; required for privacy). It lives in its own system and exposes **Mock APIs** that emulate the real Nav, Skatteetaten, Folkeregisteret and regnskap APIs, so Gremlin runs identically in the synthetic environment and in production.
- Its Tilslutningsregister is built from real Foretak and Virksomheter (recognisable), with all personal data removed: contact info, daglig leder, enkeltpersonforetak.
- Nav and Skatteetaten have their own synthetic datasets, **Tenor** and **Dolly**, but they lack the volume and the coherence Gremlin needs: over 1 million persons with names and addresses, realistic arbeidsforhold in member Virksomheter, realistic income, and Folkeregister data and events.
- The persons are simple but coherent: work history, income changing over time, feriepenger and ytelser (sykepenger, pensjon). **Life courses are simulated**: people start working, change jobs, get raises, move, change name, fnr or gender, and die.

## Working agreements

- The owner writes in Norwegian. Answer in English, which they read fluently and which is often more precise. Text *inside* animations is in Norwegian unless told otherwise.
- Git: commit and push only when explicitly asked, and don't ask whether to. The owner works iteratively: try things, push when satisfied, roll back when the direction feels wrong. Keep commits small and self-contained so a rollback is easy.
- The owner gives context with their requests. Record lasting context (domain knowledge about Gremlin, audiences, recurring jokes, style decisions, what worked or was rejected) in this file, under "Project context" below, so understanding builds up over time.
- Verify visuals before reporting: render a few key frames with `npx remotion still` and look at them. A clean typecheck does not prove an animation looks right.

## Project context

- 2026-10-10: Established the house style with `TestAnimasjon` ("Hva skjer egentlig når du trykker «Lagre»?"). The owner said it is exactly what they had in mind, so it is the reference for tone, pacing (about 15 s) and humor level.
- 2026-10-10: An otter SVG was tried as a stand-in mascot (code-drawn eyes and mouth on top of the artwork), then removed. The owner now supplies hand-drawn Gremlin heads as bitmaps, black line art on transparent background, one per expression. A first set (detailed line art) proved the approach but was too detailed. The second set (bold even lines, white fill, ten expressions) matches the house style and is in use in `TestAnimasjon`: small in the top right, reacting to the story, ending «trøtt» at the punchline. Kept from the otter test: the mascot sits small in the top right so it does not steal focus, and its reactions follow the scene's timeline.
- 2026-10-10: Started the first real animation, `SyntetiskeData` (`src/syntetiske-data/`): why and how Gremlin uses a synthetic database. Decisions: mixed audience (concepts and flow, no API-level detail), include volume counters and a «Livsløp» scene, skip the Tenor/Dolly beat, build and review one scene at a time. Storyboard: 0 Tittel · 1 Fundamentet (Tilslutningsregisteret as a tree, zoom out to thousands) · 2 Fakturering · 3 AFP-søknad · 4 Problemet (every packet is a real person) · 5 Byttet (unplug Nav/Skatteetaten/Folkeregisteret, plug in the synthetic database with identical Mock API plugs) · 6 Samme prosesser («Gremlin merker ingen forskjell») · 7 Livsløp · 8 Punchline. External sources are shown as plain text labels, never logos. Example companies are fictional («Eksempelbedriften AS»).

- 2026-10-10: The owner narrates live while the animation plays, so animations need **holds** at natural talking points. For `SyntetiskeData` scene 0/1: 5 s on the title, 6 s on the finished tree with annotations (first 20 s, then shortened), 5 s on the forest with the counter. Scene 1 was called "VAKKERT!" — the tree build → zoom-out-to-forest → gather-into-register sequence is a pattern worth reusing.

- 2026-10-10: Scene 2 «Fakturering» layout, meant to be reused by scene 3 (AFP) and scene 6 (same processes on synthetic data): Tilslutningsregisteret left (where scene 1 ends), Gremlin box in the middle, external sources Nav / Skatteetaten / Folkeregisteret stacked on the right with a request line above and a response line below each. Numbered steps ①–⑥ support live narration. Counters bottom-left (17 000 virksomheter, 1 000 000+ personer, > 10 mrd kr per år).

- 2026-10-10: Scene 3 «AFP-søknad» follows one fictional person (Kari Nordmann, 62, Eksempelbedriften AS · Bergen, the company from scene 1) through the same layout, now in `src/syntetiske-data/layout.ts`. Single packets instead of streams («Én person. Samme kilder som for en million.»), Fase 1 (offentlig AFP? member company? checked against Tilslutningsregisteret) and Fase 2 (vilkårsprøving) checklists, ending in an «INNVILGET» stamp. The applicant card fills in as data arrives. Steps are listed bottom-left so the presenter can talk through them.

- 2026-10-10: Scene 4 «Problemet»: the production picture again; one Nav packet is magnified into a person card (Ola Nordmann, fødselsnummer, adresse, lønn, sykepenger) with a «PERSONOPPLYSNINGER» stamp; every response dot turns into a person figure («Hver prikk er et ekte menneske»); Utvikling/Test/Opplæring are blocked by a PERSONVERN barrier («Ikke engang «bare litt».»); bridge line «Vi trenger data som oppfører seg som ekte — uten å være ekte.» Every scene from 3 on ends with a `Wipe` leaving only «gullet», followed by a `Kapittel` card.

- 2026-10-10: Scene 5 «Byttet»: Gremlin box tagged TESTMILJØ; personal data (kontaktpersoner, daglig leder, enkeltpersonforetak) lifts out of «gullet» and is struck through («Bedriftene er ekte. Personene er fjernet.»); the real sources are blocked, unplugged («plopp») and slide away; a dashed purple «[SYNTETISK DATABASE]» with Nav/Skatteetaten/Folkeregisteret «mock API · syntetisk» slides into exactly the same slots; flows resume with purple person figures («Samme grensesnitt. Nye data.»); Gremlin reports «dataene ser ekte ut ✓» and an annotation says «Vi lurer Gremlin til å tro at dataene er ekte.» The final picture holds 11 s: it is the essence of the film. Theme color `synthetic` (purple) = synthetic people/data, the counterpart to red `person`.

- 2026-10-10: Renamed parts: DEL 3 «Søknadsbehandling» (not «AFP-søknad»), DEL 5 «Erstatningen» (code key still `byttet`), the environment tag in Problemet is «[FORMÅL]». Persons never receive invoices (companies do), so person jokes must not mention invoices. The film now ends with DEL 6 «Oppsummering»: trygt miljø for utvikling/test/opplæring, applikasjonene identiske mot syntetiske og reelle data («Gremlin merker ingen forskjell»), simulerer edge-cases (død, fødselsnummerskifte, navneendring, flytting), kan integreres mot andre syntetiske miljøer (Dolly, Tenor) for ende-til-ende-test. 2 s pause between points. Original storyboard scene «Samme prosesser» is not built.

- 2026-10-10: New DEL 6 «Et levende testmiljø» (`scenes/Livslop.tsx`, key `livslop`) between Erstatningen and Oppsummering (now DEL 7). Message: our synthetic database emulates the three big sources of personal data (Nav, Skatteetaten, Folkeregisteret); Gremlin's own database starts empty except the person-free «gullet» («Dag 1: Helt tomt.»); a [LIVSLØPSSIMULERING] box («Hver natt») changes lives every night: purple event chips pop on the sources (ny i arbeidslivet, søker AFP, flytting, navneendring, kjønnsskifte, † død, lønnsøkning …); a «DAG n» counter time-lapses while an [ARKIV · SYNTETISK] with AFP-saker, fakturaer and brev fills up and Gremlin shows «kvartal n fakturert ✓». The time-lapse runs in live time, so it keeps going through the final hold. Closing annotation «Fiktive folk. Ekte saksbunker.»

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
- House style: a light "technical drawing" look for big-screen presentations to non-technical audiences, with high contrast, smooth motion and deadpan humor in annotations. Colors, fonts (Inter + JetBrains Mono via `@remotion/google-fonts`) and stroke widths live in `src/style/theme.ts`; never hard-code colors in scenes. Color meanings: blue `accent` = data returned/information, orange `highlight` = data on the move and annotations, green `success` = OK/granted, gold = «gullet», red `person` = real people and personal data (never use orange for people). `src/style/anim.ts` has `ramp` (clamped, eased 0→1) and `typewriter`.
- `src/components/` holds reusable SVG building blocks, all drawn in a 1920×1080 SVG coordinate space: `Paper` (grid background, frame and title block), `Box` (component that draws itself on), `Connector` (arrow), `Packet` (data moving between points), `Gear`, `Database` (cylinder with fill level), `Annotation` (leader line and typewriter text), `Cursor`, `Path` (any SVG path drawn on), `Header` (scene heading in a fixed position), `Stream` (many small dots along a line, for volume), `Step` (numbered step marker, highlighted while active), `Document` (invoice/appendix/decision page), `Sparkles` (twinkling stars on «gullet»), `Transmutation` (alchemy circle + flash; render `layer="back"` behind and `layer="front"` in front of the object), `Wipe` (scan line that clears the sheet right-to-left; content to keep is drawn outside it), `Gremlin` (mascot, see below). Components take a `start` frame; the scene keeps its timeline in a single `T` object (see `src/TestAnimasjon.tsx`) so pacing can be tuned in one place.
- `Gremlin` shows the mascot head as one transparent PNG per expression (`public/Gremlin_<expression>.png`: nøytral, glad, overrasket, spørrende, bekymret, oppgitt, frustrert, top_irritert, triumferende, trøtt). The PNGs are cropped differently, so `IMAGES` in the component holds a measured scale and offset per expression that lays the face exactly over "nøytral" (found by maximising overlap of the face, ears excluded, in headless Chrome via a throwaway Remotion composition). Everything is drawn in the neutral image's 555×310 space and scaled to `width`. A scene drives it with `GremlinKey[]` (`at`, `expression`, optional `transition`: crossfade, blink, pop, shake, flip, wipe). `spørrende` is drawn with a tilted head on purpose, so it aligns less well. A new or re-exported PNG must be re-measured and checked with a semi-transparent overlay on "nøytral".
- Multi-scene animations live in their own folder (e.g. `src/syntetiske-data/`): one component per scene in `scenes/`, each exporting its length (`*_FRAMES`) and keeping its own local `T` timeline. The main component puts them in a `<Series>` on a shared `Paper` (so the background never re-fades), shows the current scene in the title block, and drives one `Gremlin` across the whole film with keyframes relative to each scene's start (`START[i] + n`). Render a single scene quickly by picking frames in its range. Scenes can declare **holds** (`Hold[]`, `src/components/Holds.tsx`): the scene freezes at local frame `at` for `frames` while the presenter talks, then continues; `WithHolds` remaps time with `<Freeze>`, and `at(i, local)` converts a scene-local frame to film time (holds included) for Gremlin keyframes. Place a hold after all typing/animation in that beat has finished. Continuous motion that should keep going while the picture is held (data streams, gears) uses **live time**: `<Stream live />`, or `useLiveTime().live` instead of `useCurrentFrame()`. The owner wants data flows to never stop during holds. Scenes are addressed by `key` (`at("fakturering", 345)`). **Chapter transitions**: the previous scene ends on a clean sheet (scene 1 naturally, later scenes via `<Wipe>`), a `Kapittel` card («DEL n», big title, subtitle) plays as its own short sequence, and its title glides into the exact `Header` position; the next scene then renders its `Header` with `start={-20}` so it is already in place.
- `remotion.config.ts` holds CLI render settings. Output goes in `out/` (gitignored); static assets go in `public/` and are loaded with `staticFile()`.
- Remotion packages must all share the same exact version; upgrade them together with `npm run upgrade`.
