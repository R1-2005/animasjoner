import type { V } from "./physics";
import { clamp01, ease, lerp, lerpV, phase } from "./physics";
import { afp } from "./sign";

// Rettelsen: designet staver «Tekologitimen». En hånd tegner inn en rød «N» med pil ned mellom k og o,
// og helt på slutten kommer den samme hånden og visker den ut igjen (misforstått rydding).

const INK = afp.ink;
const MARKER = 16;
// Like stor som hendene i Rescuers.tsx.
const HAND_SCALE = 1.25;

// Gjør rette streker litt ujevne, som ekte tusj på vegg.
const wobbly = (pts: V[], amp: number, seed: number): V[] =>
  pts.flatMap((a, i) => {
    if (i === pts.length - 1) return [a];
    const b = pts[i + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const n = { x: -(b.y - a.y) / len, y: (b.x - a.x) / len };
    const steps = 8;
    return Array.from({ length: steps }, (_, k) => {
      const s = k / steps;
      const off = k === 0 ? 0 : amp * Math.sin(k * 1.7 + seed + i * 2.3) * Math.sin(s * Math.PI);
      return { x: lerp(a.x, b.x, s) + n.x * off, y: lerp(a.y, b.y, s) + n.y * off };
    });
  });

const lengthOf = (pts: V[]) => pts.reduce((sum, p, i) => (i ? sum + Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y) : 0), 0);

// Første andel `s` av en polylinje, og punktet der pennen er.
const partial = (pts: V[], s: number): { pts: V[]; tip: V } => {
  let left = lengthOf(pts) * clamp01(s);
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const d = Math.hypot(b.x - a.x, b.y - a.y);
    if (left <= d) {
      const tip = lerpV(a, b, d ? left / d : 0);
      out.push(tip);
      return { pts: out, tip };
    }
    out.push(b);
    left -= d;
  }
  return { pts: out, tip: pts[pts.length - 1] };
};

const svgPts = (pts: V[]) => pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

// Mellomrommet mellom k (høyre kant x≈737) og o (venstre kant x≈759) i øverste rad.
const GAP_X = 748;
const STROKES: V[][] = [
  wobbly(
    [
      { x: 692, y: 206 },
      { x: 690, y: 74 },
      { x: 794, y: 204 },
      { x: 800, y: 70 },
    ],
    2.2,
    1,
  ),
  wobbly(
    [
      { x: GAP_X - 1, y: 224 },
      { x: GAP_X + 1, y: 276 },
    ],
    1.2,
    4,
  ),
  wobbly(
    [
      { x: GAP_X - 21, y: 254 },
      { x: GAP_X + 1, y: 279 },
      { x: GAP_X + 22, y: 252 },
    ],
    1.2,
    7,
  ),
];

// Tidslinje for tegningen (relativt til DRAW_AT) og viskingen (relativt til starten på viskingen).
export const DRAW_AT = 450; // 15 s ut i loopen
const D = { enter: 30, strokes: [[30, 92], [104, 120], [130, 150]] as [number, number][], leave: [176, 212] as [number, number] };
export const DRAW_END = DRAW_AT + D.leave[1];
const E = { enter: 35, scrub: 135, leave: 170 };
export const ERASE_FRAMES = E.leave;

const HAND_HOME: V = { x: 1250, y: -260 };

// Viskeløret går i sikksakk over hele rettelsen.
const SCRUB: V[] = (() => {
  const rows: V[] = [];
  for (let k = 0; k <= 9; k++) {
    const y = 58 + k * 26;
    rows.push({ x: k % 2 === 0 ? 660 : 840, y }, { x: k % 2 === 0 ? 840 : 660, y: y + 13 });
  }
  return rows;
})();

// Hanske som holder en tusj. Tusjspissen ligger på `tip`.
const MarkerHand: React.FC<{ tip: V }> = ({ tip }) => {
  const pen = -55;
  const arm = -28;
  const rad = (pen * Math.PI) / 180;
  const fist = { x: tip.x + Math.cos(rad) * 96, y: tip.y + Math.sin(rad) * 96 };
  return (
    <g transform={`translate(${tip.x} ${tip.y}) scale(${HAND_SCALE}) translate(${-tip.x} ${-tip.y})`}>
      <g transform={`translate(${fist.x} ${fist.y}) rotate(${arm})`}>
        <rect x={40} y={-36} width={3200} height={72} fill={afp.purple} stroke={INK} strokeWidth={4} />
        <rect x={28} y={-44} width={26} height={88} rx={9} fill={afp.white} stroke={INK} strokeWidth={4} />
      </g>
      <g transform={`translate(${tip.x} ${tip.y}) rotate(${pen})`}>
        <path d="M 0 0 L 26 -10 L 26 10 Z" fill={afp.marker} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
        <rect x={24} y={-15} width={150} height={30} rx={6} fill={afp.white} stroke={INK} strokeWidth={4} />
        <rect x={150} y={-15} width={30} height={30} rx={6} fill={afp.marker} stroke={INK} strokeWidth={4} />
      </g>
      <g transform={`translate(${fist.x} ${fist.y}) rotate(${arm})`}>
        <ellipse cx={0} cy={0} rx={42} ry={36} fill={afp.white} stroke={INK} strokeWidth={4} />
        {[-14, 0, 14].map((y) => (
          <path key={y} d={`M -36 ${y} q 12 -4 22 0`} fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
        ))}
        <ellipse cx={-6} cy={-30} rx={22} ry={12} fill={afp.white} stroke={INK} strokeWidth={4} transform="rotate(-20 -6 -30)" />
      </g>
    </g>
  );
};

// Den samme hansken med et tavleviskelær.
const EraserHand: React.FC<{ at: V; tilt: number }> = ({ at, tilt }) => (
  <g transform={`translate(${at.x} ${at.y}) scale(${HAND_SCALE}) translate(${-at.x} ${-at.y})`}>
    <g transform={`translate(${at.x + 18} ${at.y - 46}) rotate(-28)`}>
      <rect x={40} y={-36} width={3200} height={72} fill={afp.purple} stroke={INK} strokeWidth={4} />
      <rect x={28} y={-44} width={26} height={88} rx={9} fill={afp.white} stroke={INK} strokeWidth={4} />
    </g>
    <g transform={`translate(${at.x} ${at.y}) rotate(${tilt})`}>
      <rect x={-64} y={-34} width={128} height={44} rx={10} fill={afp.purple400} stroke={INK} strokeWidth={4} />
      <rect x={-64} y={6} width={128} height={20} rx={4} fill={afp.slot} stroke={INK} strokeWidth={4} />
    </g>
    <g transform={`translate(${at.x + 18} ${at.y - 46}) rotate(-28)`}>
      <ellipse cx={0} cy={0} rx={42} ry={36} fill={afp.white} stroke={INK} strokeWidth={4} />
      {[-14, 0, 14].map((y) => (
        <path key={y} d={`M -36 ${y} q 12 -4 22 0`} fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
      ))}
    </g>
  </g>
);

// Rettelsen på veggen (tegnes over skiltet, under redningsmennene).
export const Correction: React.FC<{ frame: number; eraseAt: number }> = ({ frame, eraseAt }) => {
  if (frame < DRAW_AT + D.enter) return frame >= DRAW_AT ? <Hand frame={frame} /> : null;
  const t = frame - DRAW_AT;
  const drawn = STROKES.map((pts, i) => partial(pts, (t - D.strokes[i][0]) / (D.strokes[i][1] - D.strokes[i][0])));
  const e = frame - eraseAt;
  const scrubbed = e > E.enter ? partial(SCRUB, ease((e - E.enter) / (E.scrub - E.enter))).pts : [];
  return (
    <g>
      <defs>
        <mask id="visket" maskUnits="userSpaceOnUse" x={0} y={0} width={1920} height={1080}>
          <rect width={1920} height={1080} fill="white" />
          {scrubbed.length > 1 && (
            <polyline points={svgPts(scrubbed)} fill="none" stroke="black" strokeWidth={84} strokeLinecap="round" strokeLinejoin="round" />
          )}
        </mask>
      </defs>
      <g mask="url(#visket)">
        {drawn.map((d, i) =>
          d.pts.length > 1 && (t - D.strokes[i][0]) > 0 ? (
            <polyline
              key={i}
              points={svgPts(d.pts)}
              fill="none"
              stroke={afp.marker}
              strokeWidth={MARKER}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.94}
            />
          ) : null,
        )}
      </g>
      <Hand frame={frame} eraseAt={eraseAt} />
    </g>
  );
};

const Hand: React.FC<{ frame: number; eraseAt?: number }> = ({ frame, eraseAt }) => {
  const t = frame - DRAW_AT;
  if (t >= 0 && t < D.leave[1]) {
    const [s0] = D.strokes[0];
    let tip: V;
    if (t < s0) tip = lerpV(HAND_HOME, STROKES[0][0], phase(t, 0, s0));
    else if (t >= D.leave[0]) tip = lerpV(STROKES[2][STROKES[2].length - 1], HAND_HOME, phase(t, D.leave[0], D.leave[1]));
    else {
      tip = STROKES[2][STROKES[2].length - 1];
      for (let i = 0; i < STROKES.length; i++) {
        const [a, b] = D.strokes[i];
        if (t < a) {
          // Pennen løftes og flyttes til neste strek.
          const prev = STROKES[i - 1][STROKES[i - 1].length - 1];
          const next = STROKES[i][0];
          const pa = D.strokes[i - 1][1];
          const s = phase(t, pa, a);
          tip = { ...lerpV(prev, next, s), y: lerp(prev.y, next.y, s) - 18 * Math.sin(s * Math.PI) };
          break;
        }
        if (t < b) {
          tip = partial(STROKES[i], (t - a) / (b - a)).tip;
          break;
        }
      }
    }
    return <MarkerHand tip={tip} />;
  }
  if (eraseAt === undefined) return null;
  const e = frame - eraseAt;
  if (e < 0 || e >= E.leave) return null;
  const start = SCRUB[0];
  const end = SCRUB[SCRUB.length - 1];
  const at =
    e < E.enter
      ? lerpV(HAND_HOME, start, phase(e, 0, E.enter))
      : e < E.scrub
        ? partial(SCRUB, ease((e - E.enter) / (E.scrub - E.enter))).tip
        : lerpV(end, HAND_HOME, phase(e, E.scrub, E.leave));
  const tilt = e >= E.enter && e < E.scrub ? 6 * Math.sin(e * 0.9) : 0;
  return <EraserHand at={at} tilt={tilt} />;
};
