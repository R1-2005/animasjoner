import type { V } from "./physics";
import { ease, fallDistance, fallTime, lerp, rotV, screwFly } from "./physics";
import { SCREW_FLOOR, TILES } from "./sign";

// Overkill-patchen: når o-en er heist på plass, skrus den fast med seks ekstra skruer.
// Utover i loopen løsner de sakte én og én, detter ned og triller ut av bildet,
// så bare de to originale er igjen når loopen starter på nytt.

const TILE = 3;
// Ekstra skruer i % av flisen, i tillegg til de to originale (15,88) og (85,12).
const EXTRA: [number, number, number][] = [
  [15, 12, 35],
  [85, 88, -60],
  [50, 7, 80],
  [50, 93, 10],
  [8, 50, -25],
  [92, 50, 120],
];
// Rekkefølgen de løsner i.
const DROP_ORDER = [3, 0, 5, 1, 4, 2];

const STAGGER = 9;
const FLY = 28;
const SPIN_IN = 22;
const UNSCREW = 40; // sakte men sikkert
const ROLL = 5; // px per frame bortover gulvet

export type OverkillScrew = { x: number; y: number; rot: number; slot: number; scale: number };

export const OVERKILL_INSTALL_FRAMES = (EXTRA.length - 1) * STAGGER + FLY + SPIN_IN;

// Den siste skruen er ute av bildet senest så mange frames etter at den begynner å løsne.
export const OVERKILL_DROP_FRAMES = UNSCREW + 30 + Math.ceil(1000 / ROLL);

export const overkillScrews = (frame: number, installAt: number, dropFrom: number, dropTo: number): OverkillScrew[] => {
  if (frame < installAt) return [];
  const tile = TILES[TILE];
  const { home } = tile;
  return EXTRA.flatMap(([px, py, slot], j): OverkillScrew[] => {
    const local = { x: (px / 100 - 0.5) * tile.w, y: (py / 100 - 0.5) * tile.h };
    const r = rotV(local, home.rot);
    const hole: V = { x: home.x + r.x, y: home.y + r.y };

    // Inn: flyr opp nedenfra i bue og skrus inn, én etter én i rask rekkefølge.
    const t = frame - installAt - j * STAGGER;
    if (t < 0) return [];
    if (t < FLY) {
      const from = { x: hole.x + (j - 2.5) * 140, y: 1140 };
      return [{ ...screwFly(t / FLY, from, hole, 240), rot: 540 * ease(t / FLY), slot, scale: 1.25 }];
    }
    const dropAt = lerp(dropFrom, dropTo, DROP_ORDER.indexOf(j) / (EXTRA.length - 1));
    const d = frame - dropAt;
    if (d < 0) {
      const s = ease((t - FLY) / SPIN_IN);
      return [{ ...hole, rot: home.rot, slot: slot - 720 * (1 - s), scale: 1 + 0.25 * (1 - s) }];
    }
    // Ut: skrur seg sakte løs (tre runder), detter, spretter og triller til venstre ut av bildet.
    if (d < UNSCREW) {
      const s = ease(d / UNSCREW);
      return [{ ...hole, rot: home.rot, slot: slot + 1080 * s, scale: 1 + 0.25 * s }];
    }
    const f = d - UNSCREW;
    const drop = SCREW_FLOOR - hole.y;
    const landed = fallTime(drop, 1.3) + 12;
    const rolled = Math.max(0, f - landed) * ROLL;
    const x = hole.x - 0.6 * Math.min(f, landed) - rolled;
    if (x < -40) return [];
    return [
      {
        x,
        y: hole.y + fallDistance(f, drop, 1.3, 0.4),
        rot: home.rot - 6 * Math.min(f, 25) - (rolled / 13) * (180 / Math.PI),
        slot,
        scale: 1.25,
      },
    ];
  });
};
