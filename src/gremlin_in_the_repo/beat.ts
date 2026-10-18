import { createContext, useContext } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { TIMING } from "./timing";

// Låttid i sekunder. Et klipp av låten (f.eks. en stiltest) setter SongOffset til der klippet
// starter, så kan alle komponenter regne i låttid og bruke tidene fra TIMING.md direkte.
export const SongOffset = createContext(0);

export const useSongTime = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps + useContext(SongOffset);
};

export const inDrop = (t: number) => TIMING.drops.some(([a, b]) => t >= a && t < b);

// Posisjon i slag siden takt 1 slag 1 (desimal).
export const beatPos = (t: number) => (t - TIMING.firstDownbeat) / TIMING.beat;

// Tid for takt.slag, f.eks. bar(20, 3) = takt 20 slag 3 (T20.3 i TIMING.md).
export const bar = (n: number, beat = 1) => TIMING.firstDownbeat + ((n - 1) * 4 + beat - 1) * TIMING.beat;

// Støt som slår til på slaget og dør ut (1 → 0). Stopper når trommene stopper.
const hit = (t: number, onBeat: (i: number) => boolean, decay: number) => {
  const p = beatPos(t);
  const i = Math.floor(p);
  if (i < 0 || !onBeat(i) || inDrop(t)) return 0;
  return Math.exp(-(p - i) * decay);
};

// Boom-bap: kick på 1 og 3, skarptromme på 2 og 4.
export const kick = (t: number) => hit(t, (i) => i % 2 === 0, 7);
export const snare = (t: number) => hit(t, (i) => i % 2 === 1, 9);

// Starttid for ordet `index` (0-basert, ad-libs medregnet) i linja `ref`, f.eks. word("C1.3", 0).
export const word = (ref: string, index: number) => {
  for (const section of TIMING.sections) {
    const line = section.lines.find((l) => l.ref === ref);
    if (line) return line.words[index].s;
  }
  throw new Error(`Ukjent linje ${ref}`);
};
