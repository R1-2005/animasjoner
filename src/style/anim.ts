import { Easing, interpolate } from "remotion";

// 0 -> 1 fra frame `start` over `duration` frames, myk inn og ut.
export const ramp = (
  frame: number,
  start: number,
  duration: number,
  easing: (t: number) => number = Easing.inOut(Easing.cubic),
) =>
  interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

// Skriver ut tekst tegn for tegn ("skrivemaskin").
export const typewriter = (text: string, progress: number) =>
  text.slice(0, Math.round(progress * text.length));
