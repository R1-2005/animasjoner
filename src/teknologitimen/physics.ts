import { Easing } from "remotion";

// Ren funksjonell «fysikk»: alt er en funksjon av tid, så hver frame kan rendres for seg.
export type V = { x: number; y: number };
export type Pose = { x: number; y: number; rot: number };

const RAD = Math.PI / 180;

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const lerp = (a: number, b: number, s: number) => a + (b - a) * s;
export const lerpV = (a: V, b: V, s: number): V => ({ x: lerp(a.x, b.x, s), y: lerp(a.y, b.y, s) });
export const ease = (s: number) => Easing.inOut(Easing.cubic)(clamp01(s));
export const easeOut = (s: number) => Easing.out(Easing.cubic)(clamp01(s));
// 0 -> 1 mellom to tidspunkt, myk.
export const phase = (t: number, from: number, to: number) => ease((t - from) / (to - from));

export const rotV = (v: V, deg: number): V => {
  const c = Math.cos(deg * RAD);
  const s = Math.sin(deg * RAD);
  return { x: v.x * c - v.y * s, y: v.x * s + v.y * c };
};

export const toWorld = (p: Pose, local: V): V => {
  const r = rotV(local, p.rot);
  return { x: p.x + r.x, y: p.y + r.y };
};

// Plasserer flisen slik at det lokale punktet `local` ligger på `world` med vinkelen `rot`.
export const poseAt = (world: V, local: V, rot: number): Pose => {
  const r = rotV(local, rot);
  return { x: world.x - r.x, y: world.y - r.y, rot };
};

// Vinkelen flisen henger i når den bare holdes av én skrue (tyngdepunktet rett under).
export const hangAngle = (pivot: V) => Math.atan2(-pivot.x, -pivot.y) / RAD;

// Dempet pendel fra `from` mot `to`. Starter med null fart, som en flis som akkurat slipper.
export const swing = (t: number, from: number, to: number, omega = 0.17, damping = 0.055) =>
  t <= 0 ? from : to + (from - to) * Math.exp(-damping * t) * Math.cos(omega * t);

// Hvor langt noe har falt etter t frames når det slippes fra `drop` piksler over gulvet,
// med sprett som mister energi (`bounce`).
export const fallDistance = (t: number, drop: number, g = 1.5, bounce = 0.32) => {
  if (t <= 0) return 0;
  const t1 = Math.sqrt((2 * drop) / g);
  if (t < t1) return 0.5 * g * t * t;
  let rest = t - t1;
  let v = g * t1 * bounce;
  while (v > 0.6) {
    const tb = (2 * v) / g;
    if (rest < tb) return drop - (v * rest - 0.5 * g * rest * rest);
    rest -= tb;
    v *= bounce;
  }
  return drop;
};

export const fallTime = (drop: number, g = 1.5) => Math.sqrt((2 * drop) / g);

// En skrue som detter ned på gulvet, spretter og triller litt.
export const screwDrop = (t: number, from: V, vx: number, floor: number) => {
  const y = from.y + fallDistance(t, Math.max(0, floor - from.y), 1.3, 0.4);
  const k = 0.045;
  const x = from.x + (vx * (1 - Math.exp(-k * Math.max(0, t)))) / k;
  return { x, y, rot: ((x - from.x) / 13) * (180 / Math.PI) + 6 * Math.min(Math.max(0, t), 25) };
};

// En skrue som flyr i bue fra gulvet tilbake til hullet sitt.
export const screwFly = (s: number, from: V, to: V, arc = 180): V => {
  const e = ease(s);
  return { x: lerp(from.x, to.x, e), y: lerp(from.y, to.y, e) - arc * 4 * e * (1 - e) };
};

// Litt skjelving før noe løsner.
export const tremble = (t: number, from: number, to: number) => {
  const a = clamp01((t - from) / (to - from)) * (t < to ? 1 : 0);
  return a * 1.1 * Math.sin(t * 2.1);
};
