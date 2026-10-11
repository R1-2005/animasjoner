import type { Pose, V } from "./physics";
import { clamp01, easeOut, lerp, phase, toWorld } from "./physics";
import type { Moment, SignEvent } from "./events";
import { FLY, screwState, SPIN_IN, UNSCREW } from "./events";
import { afp, FLOOR, TILES } from "./sign";

// Lynet: en liten tordensky, et nedslag i bokstaven, og flisen brenner opp ovenfra.
// Etterpå kommer magnetkranen inn fra sidelinjen med en ny, identisk bokstav.

const T = {
  cloudIn: [0, 50],
  strike: 55,
  scorch: [58, 110],
  burn: [95, 215],
  cloudOut: [150, 200],
  enter: 270,
  over: 375,
  arrive: 425,
} as const;

// Takkete lyn fra skyen ned til toppen av flisen.
const BOLT_X = [0, 26, -18, 30, -22, 16, -8, 0];

export const lightning = (tileIndex: number, entry: V): SignEvent => {
  const tile = TILES[tileIndex];
  const { home } = tile;
  const top = toWorld(home, { x: 0, y: -tile.h / 2 });
  const cloud = { x: top.x, y: 95 };

  const gone = (t: number) => phase(t, T.burn[0], T.burn[1]);
  const edgeY = (t: number) => home.y - tile.h / 2 + gone(t) * tile.h;

  // Skruene slipper når brannen når dem.
  const popAt = tile.screws.map(({ at }) => {
    const frac = (at.y + tile.h / 2) / tile.h;
    let t = T.burn[0];
    while (t < T.burn[1] && gone(t) < frac - 0.04) t++;
    return t - UNSCREW;
  });
  const flyAt = tile.screws.map((_, k) => T.arrive + 10 + k * 14);
  const done = flyAt[flyAt.length - 1] + FLY + SPIN_IN;
  const letGo = done + 8;
  const end = letGo + 60;

  const struck = (t: number): Pose => {
    const a = t - T.strike;
    const shake = a > 0 && a < 40 ? 6 * Math.sin(a * 2.7) * Math.exp(-a * 0.08) : 0;
    return { ...home, x: home.x + shake };
  };

  // Den nye bokstaven henger i magneten og svinger litt etter turen inn.
  const q = { x: 0, y: -tile.h / 2 };
  const Hh = toWorld(home, q);
  const carriedHold = (t: number): V => {
    if (t < T.over) return { x: lerp(entry.x, Hh.x, phase(t, T.enter, T.over)), y: Hh.y - 150 };
    return { x: Hh.x, y: lerp(Hh.y - 150, Hh.y, phase(t, T.over, T.arrive)) };
  };
  const carriedRot = (t: number) => {
    if (t < T.over) return home.rot - 7 * Math.sin(Math.PI * phase(t, T.enter, T.over));
    return home.rot + 5 * Math.sin((t - T.over) * 0.2) * Math.exp(-(t - T.over) * 0.06);
  };
  const pose = (t: number): Pose => {
    if (t < T.enter) return struck(t);
    if (t >= T.arrive) return home;
    const hold = carriedHold(t);
    const rot = carriedRot(t);
    const r = toWorld({ x: 0, y: 0, rot }, q);
    return { x: hold.x - r.x, y: hold.y - r.y, rot };
  };

  return {
    tile: tileIndex,
    duration: end + 5,
    at: (t): Moment => {
      const fresh = t >= T.enter;
      const state = {
        pose: pose(t),
        screws: tile.screws.map((_, i) => screwState(t, tileIndex, i, popAt[i], flyAt[i], pose)),
        burn: fresh ? 0 : 0.6 * phase(t, T.scorch[0], T.scorch[1]),
        gone: fresh ? 0 : gone(t),
      };

      const a = t - T.strike;
      const flash =
        (a >= 0 && a < 20 ? 0.8 * Math.exp(-a * 0.35) : 0) + (a >= 6 && a < 20 ? 0.45 * Math.exp(-(a - 6) * 0.5) : 0);

      let rescuer: Moment["rescuer"];
      if (t >= T.enter && t < end) {
        const hold = t < letGo ? toWorld(pose(t), q) : { x: Hh.x, y: lerp(Hh.y, -320, phase(t, letGo, end)) };
        rescuer = { kind: "magnet", hold, grip: 1 - phase(t, letGo - 4, letGo + 8) };
      }

      return {
        tile: tileIndex,
        state,
        rescuer,
        flash,
        overlay: t < T.enter ? <Storm t={t} cloud={cloud} top={top} pose={struck(t)} w={tile.w} h={tile.h} edgeY={edgeY} gone={gone} /> : null,
      };
    },
  };
};

const Storm: React.FC<{
  t: number;
  cloud: V;
  top: V;
  pose: Pose;
  w: number;
  h: number;
  edgeY: (t: number) => number;
  gone: (t: number) => number;
}> = ({ t, cloud, top, pose, w, h, edgeY, gone }) => {
  // Skyen blåser inn fra venstre og bremser opp over bokstaven, og stiger bort etterpå.
  const cy = cloud.y - 260 * phase(t, T.cloudOut[0], T.cloudOut[1]);
  const cx = lerp(-220, cloud.x, easeOut((t - T.cloudIn[0]) / (T.cloudIn[1] - T.cloudIn[0]))) + 6 * Math.sin(t * 0.05);
  const a = t - T.strike;
  const boltOn = (a >= 0 && a < 4) || (a >= 6 && a < 10) || (a >= 12 && a < 14);
  const y0 = cy + 40;
  const bolt = BOLT_X.map((dx, i) => ({ x: top.x + dx, y: lerp(y0, top.y + 4, i / (BOLT_X.length - 1)) }));
  const branch = [bolt[3], { x: bolt[3].x + 44, y: bolt[3].y + 40 }, { x: bolt[3].x + 70, y: bolt[3].y + 96 }];
  const pts = (p: V[]) => p.map((v) => `${v.x},${v.y}`).join(" ");

  const fire = phase(t, T.scorch[0], T.scorch[0] + 15) * (1 - phase(t, T.burn[1] - 15, T.burn[1] + 8));
  const edge = -h / 2 + gone(t) * h;

  return (
    <g>
      {/* Røyk */}
      {Array.from({ length: 16 }, (_, i) => {
        const born = 65 + i * 9;
        const age = t - born;
        if (age < 0 || age >= 80) return null;
        return (
          <circle
            key={`s${i}`}
            cx={pose.x + 90 * Math.sin(i * 2.3) + age * 0.3 * Math.sin(i)}
            cy={edgeY(born) - 20 - age * 1.6}
            r={16 + age * 0.5}
            fill={afp.smoke}
            opacity={0.35 * (1 - age / 80)}
          />
        );
      })}
      {/* Flammer langs brannkanten */}
      {fire > 0.01 && (
        <g transform={`translate(${pose.x} ${pose.y}) rotate(${pose.rot})`}>
          {Array.from({ length: 7 }, (_, k) => {
            const x = -w / 2 + ((k + 0.5) * w) / 7;
            const hf = fire * (46 + 22 * Math.sin(t * 0.6 + k * 1.9));
            const flame = (s: number, fill: string) => (
              <path
                d={`M ${x - 17 * s} ${edge} Q ${x - 20 * s} ${edge - hf * s * 0.55} ${x} ${edge - hf * s} Q ${x + 20 * s} ${edge - hf * s * 0.55} ${x + 17 * s} ${edge} Z`}
                fill={fill}
              />
            );
            return (
              <g key={k}>
                {flame(1, afp.flame)}
                {flame(0.55, afp.yellow)}
              </g>
            );
          })}
        </g>
      )}
      {/* Aske som drysser ned */}
      {Array.from({ length: 28 }, (_, i) => {
        const born = 100 + i * 4;
        const age = t - born;
        if (age < 0) return null;
        const y = Math.min(FLOOR - 4, edgeY(born) + age * 1.1 + 0.015 * age * age);
        const landed = y >= FLOOR - 4 ? age : Infinity;
        const fade = clamp01(1 - (age - Math.min(landed, age)) / 40) * (1 - phase(t, T.enter - 30, T.enter));
        return (
          <rect
            key={`a${i}`}
            x={pose.x - 110 + ((i * 37) % 220) + 8 * Math.sin(age * 0.2 + i)}
            y={y}
            width={7}
            height={4}
            fill={afp.soot}
            opacity={fade}
            transform={`rotate(${age * 7 + i * 40} ${pose.x - 110 + ((i * 37) % 220)} ${y})`}
          />
        );
      })}
      {/* Lynet */}
      {boltOn && (
        <g strokeLinejoin="round" strokeLinecap="round" fill="none">
          {[bolt, branch].map((p, k) => {
            const w = k === 0 ? 1 : 0.6;
            return (
              <g key={k}>
                <polyline points={pts(p)} stroke={afp.yellow} strokeWidth={46 * w} opacity={0.35} />
                <polyline points={pts(p)} stroke={afp.ink} strokeWidth={20 * w} />
                <polyline points={pts(p)} stroke={afp.yellow} strokeWidth={13 * w} />
                <polyline points={pts(p)} stroke={afp.white} strokeWidth={4 * w} />
              </g>
            );
          })}
        </g>
      )}
      {/* Tordenskyen */}
      <g transform={`translate(${cx} ${cy})`}>
        {[
          [-92, 14, 44],
          [-34, -14, 60],
          [38, -4, 54],
          [96, 16, 40],
        ].map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill={afp.cloud} />
        ))}
        <rect x={-130} y={8} width={262} height={48} rx={24} fill={afp.cloudDark} />
        <rect x={-122} y={4} width={246} height={36} rx={18} fill={afp.cloud} />
      </g>
    </g>
  );
};
