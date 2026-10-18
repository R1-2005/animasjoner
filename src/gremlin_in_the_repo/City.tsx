import { AbsoluteFill, interpolate, random } from "remotion";
import { fonts, night } from "./look";

// Byen om natta i fugleperspektiv (isometrisk), til introen. Alt tegnes i «verdens»-koordinater
// og vises gjennom et kamera (fokuspunkt + zoom), så introen kan dykke inn i ett vindu.

const U = 64; // piksler per enhet (én kvartalsrute)
const ORIGIN = { x: 960, y: 190 };
const N = 20; // rutenett N×N; hver femte rad/kolonne er gate

export const iso = (x: number, y: number, z: number) => ({
  x: ORIGIN.x + (x - y) * U * 0.866,
  y: ORIGIN.y + (x + y) * U * 0.5 - z * U,
});
const pts = (...p: { x: number; y: number }[]) => p.map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(" ");

type Box = { i: number; j: number; w: number; d: number; h: number; key: number };

// Bygget der utvikleren sitter: høyest i byen, nesten midt i bildet.
export const TOWER: Box = { i: 11.08, j: 7.08, w: 1.84, d: 1.84, h: 9, key: 11 + 1 + 7 + 1 };

const BOXES: Box[] = (() => {
  const out: Box[] = [TOWER];
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      if (i % 5 === 0 || j % 5 === 0) continue;
      if (i >= 11 && i <= 12 && j >= 7 && j <= 8) continue;
      if (random(`park${i}-${j}`) < 0.1) continue;
      const r = random(`h${i}-${j}`);
      const h = 1 + Math.floor(r * r * 6);
      out.push({ i: i + 0.08, j: j + 0.08, w: 0.84, d: 0.84, h, key: i + j + 1 });
    }
  }
  return out;
})();

type Win = { points: string; color: string; opacity: number };

// Vinduene på de to synlige fasadene: to etasjer per enhet, 2,5 vinduer per enhet bredde.
const windows = (b: Box, isTower: boolean): Win[] => {
  const out: Win[] = [];
  const floors = b.h * 2;
  const faces = [
    { len: b.w, at: (a: number, z: number) => iso(b.i + a, b.j + b.d, z), name: "l" },
    { len: b.d, at: (a: number, z: number) => iso(b.i + b.w, b.j + a, z), name: "r" },
  ];
  for (const f of faces) {
    const n = Math.max(1, Math.round(f.len * 2.5));
    for (let fl = 0; fl < floors; fl++) {
      const z0 = fl * 0.5 + 0.15;
      const z1 = z0 + 0.22;
      for (let c = 0; c < n; c++) {
        const a0 = (c / n) * f.len + 0.08;
        const a1 = a0 + f.len / n - 0.16;
        const r = random(`w${b.i}-${b.j}-${f.name}-${fl}-${c}`);
        const top = isTower && fl === floors - 1;
        const color = top || r > 0.95 ? night.glow : r > 0.62 ? "#FFD27A" : "#0E1626";
        const opacity = top ? 1 : r > 0.62 ? 0.35 + 0.5 * random(`o${b.i}-${b.j}-${fl}-${c}`) : 1;
        out.push({ points: pts(f.at(a0, z0), f.at(a1, z0), f.at(a1, z1), f.at(a0, z1)), color, opacity });
      }
    }
  }
  return out;
};

// Vinduet kameraet dykker inn i: midt på toppetasjen, på fasaden mot høyre.
const towerTop = TOWER.h * 2 - 1;
export const TARGET = iso(TOWER.i + TOWER.w, TOWER.j + TOWER.d / 2, towerTop * 0.5 + 0.26);

type Shape = {
  key: number;
  // Midten av bygget i rutenettet (for strømbruddet som sprer seg fra tårnet).
  ci: number;
  cj: number;
  isTower: boolean;
  roof: string;
  left: string;
  right: string;
  windows: Win[];
};

const SHAPES: Shape[] = BOXES.map((b) => {
  const { i, j, w, d, h } = b;
  return {
    key: b.key,
    ci: i + w / 2,
    cj: j + d / 2,
    isTower: b === TOWER,
    roof: pts(iso(i, j, h), iso(i + w, j, h), iso(i + w, j + d, h), iso(i, j + d, h)),
    left: pts(iso(i, j + d, 0), iso(i + w, j + d, 0), iso(i + w, j + d, h), iso(i, j + d, h)),
    right: pts(iso(i + w, j, 0), iso(i + w, j + d, 0), iso(i + w, j + d, h), iso(i + w, j, h)),
    windows: windows(b, b === TOWER),
  };
});

const STARS = Array.from({ length: 90 }, (_, k) => ({
  x: random(`sx${k}`) * 1920,
  y: random(`sy${k}`) * 420,
  r: 0.8 + random(`sr${k}`) * 1.6,
  tw: random(`st${k}`) * 6,
}));

// Biler langs gatene: gule frontlys én vei, røde baklys den andre.
const CARS = Array.from({ length: 36 }, (_, k) => ({
  street: 5 * (1 + Math.floor(random(`cs${k}`) * 3)) + 0.5,
  alongX: random(`cd${k}`) < 0.5,
  offset: random(`co${k}`) * N,
  speed: (0.6 + random(`cv${k}`) * 0.8) * (random(`cr${k}`) < 0.5 ? 1 : -1),
}));

type Props = {
  t: number;
  // Kameraet: punktet midt i bildet (verdenskoordinater) og zoom.
  focus: { x: number; y: number };
  zoom: number;
  // 0..1: neonskiltet på taket tennes, toppetasjen lyser opp, øynene i vinduet.
  sign: number;
  topFloor: number;
  eyes: number;
  // 0..1: strømbruddet sprer seg fra tårnet til hele kvartalet er mørkt.
  dark?: number;
  // 0..1: et stearinlys i vinduet på toppetasjen.
  candle?: number;
};

const TOWER_CENTER = { i: TOWER.i + TOWER.w / 2, j: TOWER.j + TOWER.d / 2 };

export const City: React.FC<Props> = ({ t, focus, zoom, sign, topFloor, eyes, dark = 0, candle = 0 }) => {
  const cars = CARS.map((c) => {
    const u = (((c.offset + t * c.speed) % N) + N) % N;
    const p = c.alongX ? iso(u, c.street, 0) : iso(c.street, u, 0);
    const key = c.alongX ? u + c.street : c.street + u;
    return { ...p, key, color: c.speed > 0 ? "#FFE9A8" : night.bug };
  });
  const signFlicker = sign > 0 && sign < 1 ? (random(`flick${Math.floor(t * 30)}`) > 0.4 ? 1 : 0.2) : sign;
  const signBase = iso(TOWER.i + 0.18, TOWER.j + TOWER.d, TOWER.h + 0.12);
  const antenna = iso(TOWER.i + TOWER.w / 2, TOWER.j + TOWER.d / 2, TOWER.h);
  const eyePos = iso(TOWER.i + 0.55, TOWER.j + TOWER.d, 7.4);

  return (
    <AbsoluteFill style={{ background: night.black }}>
      <svg width={1920} height={1080}>
        <defs>
          <linearGradient id="city-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#03050A" />
            <stop offset="1" stopColor="#101A30" />
          </linearGradient>
          <linearGradient id="city-fog" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#101A30" stopOpacity={1} />
            <stop offset="1" stopColor="#101A30" stopOpacity={0} />
          </linearGradient>
          <filter id="city-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={4} result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect width={1920} height={1080} fill="url(#city-sky)" />
        {STARS.map((s, k) => (
          <circle key={k} cx={s.x} cy={s.y} r={s.r} fill={night.text} opacity={0.3 + 0.4 * Math.abs(Math.sin(t * 1.5 + s.tw))} />
        ))}
        <circle cx={1650} cy={130} r={46} fill="#E8EEF8" opacity={0.85} />
        <circle cx={1668} cy={118} r={44} fill="url(#city-sky)" />
        <g transform={`translate(960 540) scale(${zoom}) translate(${-focus.x} ${-focus.y})`}>
          <polygon points={pts(iso(0, 0, 0), iso(N, 0, 0), iso(N, N, 0), iso(0, N, 0))} fill="#070A12" />
          {[5, 10, 15].map((s) => (
            <g key={s} fill="#0D1322">
              <polygon points={pts(iso(s, 0, 0), iso(s + 1, 0, 0), iso(s + 1, N, 0), iso(s, N, 0))} />
              <polygon points={pts(iso(0, s, 0), iso(N, s, 0), iso(N, s + 1, 0), iso(0, s + 1, 0))} />
            </g>
          ))}
          {[...SHAPES.map((s) => ({ kind: "b" as const, key: s.key, s })), ...cars.map((c) => ({ kind: "c" as const, key: c.key, c }))]
            .sort((a, b) => a.key - b.key)
            .map((item, k) =>
              item.kind === "c" ? (
                <circle key={`c${k}`} cx={item.c.x} cy={item.c.y} r={2.6} fill={item.c.color} />
              ) : (
                <g key={`b${k}`}>
                  <polygon points={item.s.left} fill="#141D31" />
                  <polygon points={item.s.right} fill="#0C1322" />
                  <polygon points={item.s.roof} fill="#1B2642" stroke="#2A3858" strokeWidth={1} vectorEffect="non-scaling-stroke" />
                  {item.s.windows.map((w, n) => {
                    const off = dark > 0 && Math.hypot(item.s.ci - TOWER_CENTER.i, item.s.cj - TOWER_CENTER.j) < dark * 9;
                    if (off) return <polygon key={n} points={w.points} fill="#0B1220" />;
                    const lit = item.s.isTower && w.color === night.glow ? 0.35 + 0.65 * topFloor : w.opacity;
                    return <polygon key={n} points={w.points} fill={w.color} opacity={lit} />;
                  })}
                </g>
              ),
            )}
          {/* Antenne med rødt blinklys, og neonskiltet på taket. */}
          <line x1={antenna.x} y1={antenna.y} x2={antenna.x} y2={antenna.y - 70} stroke="#2A3858" strokeWidth={3} />
          <circle cx={antenna.x} cy={antenna.y - 72} r={4} fill={night.bug} opacity={Math.floor(t * 1.2) % 2 ? 1 : 0.2} />
          <g transform={`matrix(0.866 0.5 0 1 ${signBase.x} ${signBase.y})`}>
            <rect x={-6} y={-40} width={108} height={46} fill="#05070C" />
            <text
              x={0}
              y={0}
              fontFamily={fonts.display}
              fontSize={38}
              fill={night.eyes}
              opacity={0.15 + 0.85 * signFlicker}
              filter={signFlicker > 0.5 ? "url(#city-glow)" : undefined}
            >
              GREMLIN
            </text>
          </g>
          {candle > 0 && (
            <g opacity={candle * (0.75 + 0.25 * Math.sin(t * 23) * Math.sin(t * 7))}>
              <circle cx={TARGET.x} cy={TARGET.y} r={14} fill="#FFB347" opacity={0.35} filter="url(#city-glow)" />
              <circle cx={TARGET.x} cy={TARGET.y + 1} r={2.4} fill="#FFE27A" />
            </g>
          )}
          {eyes > 0 && (
            <g filter="url(#city-glow)" opacity={eyes}>
              <ellipse cx={eyePos.x - 6} cy={eyePos.y - 2} rx={4.5} ry={3 * eyes} fill={night.eyes} />
              <ellipse cx={eyePos.x + 7} cy={eyePos.y + 4} rx={4.5} ry={3 * eyes} fill={night.eyes} />
            </g>
          )}
          <rect x={-2000} y={-400} width={6000} height={700} fill="url(#city-fog)" />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// Kameraet som funksjon av hvor langt inn det har dykket: 0 = byen fra luften, 1 = inne i vinduet.
export const cityView = (p: number) => {
  const start = { x: 960, y: 560 };
  const eased = p * p * p;
  const drift = 1.06;
  const zoom = drift * Math.pow(110 / drift, eased);
  const k = Math.min(1, eased * 2.2 + 0.12);
  return { zoom, focus: { x: start.x + (TARGET.x - start.x) * k, y: start.y + (TARGET.y - start.y) * k } };
};

// Kameraet for introen: rolig drift, så et dykk som akselererer inn i TARGET-vinduet.
export const cityCamera = (t: number, diveFrom: number, diveTo: number) => {
  const start = { x: 960, y: 560 };
  const p = interpolate(t, [diveFrom, diveTo], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const eased = p * p * p;
  const drift = 1 + 0.06 * Math.min(1, t / diveFrom);
  const zoom = drift * Math.pow(110 / drift, eased);
  // Fokuset glir mot vinduet litt foran zoomen, så vinduet blir liggende midt i bildet.
  const k = Math.min(1, eased * 2.2 + 0.12 * Math.min(1, t / diveFrom));
  return {
    zoom,
    focus: { x: start.x + (TARGET.x - start.x) * k, y: start.y + (TARGET.y - start.y) * k },
  };
};
