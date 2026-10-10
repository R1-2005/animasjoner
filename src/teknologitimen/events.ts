import type { Pose, V } from "./physics";
import {
  clamp01,
  ease,
  easeOut,
  fallDistance,
  fallTime,
  hangAngle,
  lerp,
  lerpV,
  phase,
  poseAt,
  screwDrop,
  screwFly,
  swing,
  toWorld,
  tremble,
} from "./physics";
import { FLOOR, SCREW_FLOOR, TILES } from "./sign";

export type ScrewState =
  | { loose: false; spin: number; scale: number }
  | { loose: true; x: number; y: number; rot: number; scale: number };

export type TileState = { pose: Pose; screws: ScrewState[] };

export type RescuerKind = "hand" | "arm" | "crane" | "drone" | "claw" | "magnet" | "lift";

export type Rescuer = {
  kind: RescuerKind;
  // Punktet redningsmannen holder i (verdenskoordinater).
  hold: V;
  // 0 = åpen, 1 = har grepet.
  grip: number;
  // Hånd: et punkt langt utenfor bildet som armen kommer fra. Robotarm: sokkelen.
  from?: V;
  // Ekstra bevegelse: hånden som trekker på skuldrene, dronen som krenger.
  wiggle?: number;
};

export type Moment = { tile: number; state: TileState; rescuer?: Rescuer };

export type SignEvent = { tile: number; duration: number; at: (t: number) => Moment };

const ATTACHED: ScrewState = { loose: false, spin: 0, scale: 1 };

const UNSCREW = 16; // skruen snurrer ut
const FLY = 28; // skruen flyr tilbake
const SPIN_IN = 22; // og skrus inn igjen

// Skruer som løsner på `popAt` og kommer tilbake på `flyAt` (undefined = blir sittende).
const screwState = (
  t: number,
  tile: number,
  i: number,
  popAt: number | undefined,
  flyAt: number | undefined,
  poseAtTime: (t: number) => Pose,
): ScrewState => {
  if (popAt === undefined || t < popAt) return ATTACHED;
  const { at } = TILES[tile].screws[i];
  if (t < popAt + UNSCREW) {
    const s = ease((t - popAt) / UNSCREW);
    return { loose: false, spin: 720 * s, scale: 1 + 0.25 * s };
  }
  const detach = popAt + UNSCREW;
  const from = toWorld(poseAtTime(detach), at);
  // Skruene triller litt hver sin vei.
  const vx = (i % 2 === 0 ? -1 : 1) * (0.9 + 0.4 * i);
  const drop = (time: number) => screwDrop(time - detach, from, vx, SCREW_FLOOR);
  if (flyAt === undefined || t < flyAt) return { loose: true, ...drop(t), scale: 1.25 };
  const hole = toWorld(TILES[tile].home, at);
  if (t < flyAt + FLY) {
    const s = (t - flyAt) / FLY;
    const lying = drop(flyAt);
    return { loose: true, ...screwFly(s, lying, hole), rot: lying.rot + 540 * ease(s), scale: 1.25 };
  }
  if (t < flyAt + FLY + SPIN_IN) {
    const s = ease((t - flyAt - FLY) / SPIN_IN);
    return { loose: false, spin: -720 * (1 - s), scale: 1 + 0.25 * (1 - s) };
  }
  return ATTACHED;
};

// Retningen armen til en hånd kommer fra: langt ut forbi inngangspunktet.
const farBehind = (entry: V, target: V): V => {
  const dx = entry.x - target.x;
  const dy = entry.y - target.y;
  const d = Math.hypot(dx, dy) || 1;
  return { x: entry.x + (dx / d) * 3000, y: entry.y + (dy / d) * 3000 };
};

const nearestAngle = (target: number, around: number) => {
  let a = target;
  while (a - around > 180) a -= 360;
  while (a - around < -180) a += 360;
  return a;
};

// ---------------------------------------------------------------------------------------------
// «Skjev»: en skrue løsner, flisen svinger rundt den som er igjen, og en redningsmann retter den opp.
type StraightenOpts = {
  tile: number;
  lose: number[];
  pivot: number;
  rescuer: "hand" | "arm";
  entry: V;
  // Hvor på flisen redningsmannen tar tak (lokale koordinater).
  hold: V;
  // Hvor langt mot hengevinkelen flisen faller (1 = helt).
  rest?: number;
  omega?: number;
  damping?: number;
  base?: V;
};

export const straighten = (o: StraightenOpts): SignEvent => {
  const tile = TILES[o.tile];
  const { home } = tile;
  const p = tile.screws[o.pivot].at;
  const pivotW = toWorld(home, p);
  const popAt = 30;
  const loosen = o.lose.length ? popAt + UNSCREW : popAt;
  const eq = nearestAngle(hangAngle(p), home.rot);
  const restRot = lerp(home.rot, eq, o.rest ?? 0.55);
  const T = { enter: 175, grab: 230, pushEnd: 290 };
  const flyAt = T.pushEnd + 4;
  const release = flyAt + (o.lose.length ? FLY + SPIN_IN + 10 : 20);
  const gone = release + 60;

  const hanging = (t: number) => swing(t - loosen, home.rot, restRot, o.omega, o.damping);
  const rot = (t: number) => {
    if (t < loosen) return home.rot + tremble(t, 0, loosen);
    if (t < T.grab) return hanging(t);
    return lerp(hanging(T.grab), home.rot, phase(t, T.grab, T.pushEnd));
  };
  const pose = (t: number) => poseAt(pivotW, p, rot(t));

  const grabPoint = toWorld(pose(T.grab), o.hold);
  const homePoint = toWorld(home, o.hold);
  const from = o.rescuer === "hand" ? farBehind(o.entry, grabPoint) : o.base;

  return {
    tile: o.tile,
    duration: gone + 5,
    at: (t) => {
      const state: TileState = {
        pose: pose(t),
        screws: tile.screws.map((_, i) =>
          screwState(t, o.tile, i, o.lose.includes(i) ? popAt : undefined, flyAt, pose),
        ),
      };
      let rescuer: Rescuer | undefined;
      if (t >= T.enter && t < gone) {
        const hold =
          t < T.grab
            ? lerpV(o.entry, grabPoint, phase(t, T.enter, T.grab))
            : t < release
              ? toWorld(pose(t), o.hold)
              : lerpV(homePoint, o.entry, phase(t, release + 4, gone));
        const grip = phase(t, T.grab - 8, T.grab + 4) - phase(t, release - 6, release + 6);
        rescuer = { kind: o.rescuer, hold, grip, from };
      }
      return { tile: o.tile, state, rescuer };
    },
  };
};

// ---------------------------------------------------------------------------------------------
// «g»-en: henger allerede skjevt i designet. En hånd retter den opp, slipper, og den svinger tilbake.
export const gJoke = (tileIndex: number, entry: V, holdAt: V): SignEvent => {
  const tile = TILES[tileIndex];
  const { home } = tile;
  const p = tile.screws[0].at;
  const pivotW = toWorld(home, p);
  const T = { enter: 0, grab: 55, pushEnd: 115, release: 185, backOff: 205, shrug: 225, shrugEnd: 275, gone: 335 };
  const rot = (t: number) => {
    if (t < T.grab) return home.rot;
    if (t < T.release) return lerp(home.rot, 0, phase(t, T.grab, T.pushEnd));
    // Den falske skruen ser riktig ut, men holder ingenting.
    return swing(t - T.release, 0, home.rot, 0.16, 0.05);
  };
  const pose = (t: number) => poseAt(pivotW, p, rot(t));
  const grabPoint = toWorld(home, holdAt);
  const straightPoint = toWorld(pose(T.pushEnd), holdAt);
  const from = farBehind(entry, grabPoint);
  const backed = { x: straightPoint.x + 70, y: straightPoint.y - 10 };

  return {
    tile: tileIndex,
    duration: T.gone + 5,
    at: (t) => {
      const state: TileState = { pose: pose(t), screws: tile.screws.map(() => ATTACHED) };
      let rescuer: Rescuer | undefined;
      if (t < T.gone) {
        const hold =
          t < T.grab
            ? lerpV(entry, grabPoint, phase(t, T.enter, T.grab))
            : t < T.release
              ? toWorld(pose(t), holdAt)
              : t < T.shrugEnd
                ? lerpV(straightPoint, backed, phase(t, T.release, T.backOff))
                : lerpV(backed, entry, phase(t, T.shrugEnd, T.gone));
        const grip = phase(t, T.grab - 8, T.grab + 4) - phase(t, T.release - 4, T.release + 6);
        // Skuldertrekk: hånden vipper fram og tilbake et par ganger.
        const s = clamp01((t - T.shrug) / (T.shrugEnd - T.shrug));
        const wiggle = t > T.shrug && t < T.shrugEnd ? Math.sin(s * Math.PI * 4) * 14 * Math.sin(s * Math.PI) : 0;
        rescuer = { kind: "hand", hold, grip, from, wiggle };
      }
      return { tile: tileIndex, state, rescuer };
    },
  };
};

// ---------------------------------------------------------------------------------------------
// «Fall»: skruene ryker én etter én, flisen detter i gulvet, og en redningsmann henter den opp igjen.
type FallOpts = {
  tile: number;
  rescuer: Exclude<RescuerKind, "hand">;
  // Rekkefølgen skruene ryker i (standard: slik de står i designet).
  order?: number[];
  land: { dx: number; rot: number };
  // Hvor redningsmannen kommer fra (standard for kran, klo og magnet: rett ovenfra).
  entry?: V;
  exit?: V;
  base?: V;
  // Sekunder flisen blir liggende før noen kommer.
  wait?: number;
};

const TOP_HOLD: RescuerKind[] = ["arm", "crane", "drone", "claw", "magnet"];

export const fall = (o: FallOpts): SignEvent => {
  const tile = TILES[o.tile];
  const { home } = tile;
  const order = o.order ?? tile.screws.map((_, i) => i);
  const popAt = order.map((_, k) => 24 + k * 42);
  const popOf = (i: number) => popAt[order.indexOf(i)];
  const release = popAt[order.length - 1] + UNSCREW;

  // Mens bare én skrue holder igjen, henger flisen og svinger litt rundt den.
  const lastIdx = order[order.length - 1];
  const swingFrom = order.length >= 2 ? popAt[order.length - 2] + UNSCREW : Infinity;
  const pivot = tile.screws[lastIdx].at;
  const pivotW = toWorld(home, pivot);
  const swingTo = lerp(home.rot, nearestAngle(hangAngle(pivot), home.rot), 0.35);

  const before = (t: number): Pose =>
    t < swingFrom
      ? { ...home, rot: home.rot + tremble(t, 0, 24) }
      : poseAt(pivotW, pivot, swing(t - swingFrom, home.rot, swingTo, 0.2, 0.07));

  const p0 = before(release);
  const floorY = FLOOR - tile.h / 2;
  const drop = floorY - p0.y;
  const tf = fallTime(drop);
  const fallen = (t: number): Pose => {
    const ft = t - release;
    const landed = clamp01((ft - tf) / 1);
    const wobble = ft > tf ? 4 * Math.exp(-(ft - tf) * 0.12) * Math.sin((ft - tf) * 0.5) : 0;
    return {
      x: p0.x + o.land.dx * easeOut(ft / (tf + 12)),
      y: p0.y + fallDistance(ft, drop),
      rot: lerp(p0.rot, o.land.rot, easeOut(ft / tf)) + wobble * landed,
    };
  };

  const enter = Math.round(release + tf + (o.wait ?? 3) * 30);
  const grab = enter + 60;
  const lift = grab + 14;
  const arrive = lift + 100;
  const flyAt = order.map((_, k) => arrive + 10 + k * 14);
  const done = flyAt[flyAt.length - 1] + FLY + SPIN_IN;
  const letGo = done + 8;
  const gone = letGo + 60;

  const q = TOP_HOLD.includes(o.rescuer) ? { x: 0, y: -tile.h / 2 } : { x: 0, y: tile.h / 2 };
  const onFloor = fallen(grab);
  const G = toWorld(onFloor, q);
  const Hh = toWorld(home, q);
  const hanging = o.rescuer !== "lift";
  const entry = o.entry ?? { x: G.x, y: -320 };

  const carried = (t: number): Pose => {
    const u = clamp01((t - lift) / (arrive - lift));
    const hold = {
      x: lerp(G.x, Hh.x, ease((u - 0.2) / 0.8)),
      y: lerp(G.y, Hh.y, ease(u / 0.85)),
    };
    const sway = hanging ? 6 * Math.sin(u * Math.PI * 3) * Math.sin(u * Math.PI) : 0;
    return poseAt(hold, q, lerp(onFloor.rot, home.rot, ease(u)) + sway);
  };

  const pose = (t: number): Pose => (t < release ? before(t) : t < lift ? fallen(t) : t < arrive ? carried(t) : home);

  const exit = o.exit ?? (["crane", "claw", "magnet"].includes(o.rescuer) ? { x: Hh.x, y: -320 } : entry);
  const approach = (s: number): V => {
    if (o.rescuer === "drone") return { x: lerp(entry.x, G.x, s), y: lerp(entry.y, G.y, s) - 160 * Math.sin(s * Math.PI) };
    return lerpV(entry, G, s);
  };
  const leave = (s: number): V => {
    if (o.rescuer === "lift") return { x: lerp(Hh.x, exit.x, ease((s - 0.45) / 0.55)), y: lerp(Hh.y, FLOOR, ease(s / 0.55)) };
    return lerpV(Hh, exit, ease(s));
  };

  return {
    tile: o.tile,
    duration: gone + 5,
    at: (t) => {
      const state: TileState = {
        pose: pose(t),
        screws: tile.screws.map((_, i) => screwState(t, o.tile, i, popOf(i), flyAt[order.indexOf(i)], pose)),
      };
      let rescuer: Rescuer | undefined;
      if (t >= enter && t < gone) {
        const hold =
          t < grab
            ? approach(phase(t, enter, grab))
            : t < letGo
              ? toWorld(pose(t), q)
              : leave(clamp01((t - letGo) / (gone - letGo)));
        const grip = phase(t, grab - 6, grab + 8) - phase(t, letGo - 4, letGo + 8);
        // Dronen krenger i fartsretningen.
        const wiggle =
          o.rescuer === "drone"
            ? t < grab
              ? 12 * Math.sin(phase(t, enter, grab) * Math.PI) * Math.sign(G.x - entry.x)
              : t >= letGo
                ? 12 * Math.sin(clamp01((t - letGo) / (gone - letGo)) * Math.PI) * Math.sign(exit.x - Hh.x)
                : 0
            : 0;
        rescuer = { kind: o.rescuer, hold, grip, from: o.base, wiggle };
      }
      return { tile: o.tile, state, rescuer };
    },
  };
};
