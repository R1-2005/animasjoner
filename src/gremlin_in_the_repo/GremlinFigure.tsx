import { random } from "remotion";
import { night } from "./look";
import { ShadowGremlin } from "./ShadowGremlin";

// Hele Gremlin som skygge: hodet fra ShadowGremlin på en kodetegnet, lodden kropp med armer
// og klør. Kroppen tegnes i hodebildets koordinater (546×310; haka ligger rundt y = 300).
const IMG = { w: 546, h: 310 };
const OUTLINE = "#2A3754";
const SHOULDER = { l: [192, 330], r: [354, 330] } as const;

type Point = readonly [number, number];
export type Arms = { l: Point; r: Point };

// Håndposisjoner i hodekoordinater.
export const POSES = {
  hang: { l: [150, 470], r: [396, 470] },
  reachLeft: { l: [-70, 330], r: [396, 470] },
  // Klørne over kanten på en skjerm han titter fram bak.
  grip: { l: [60, 215], r: [486, 215] },
  rub: { l: [262, 420], r: [284, 420] },
  belly: { l: [205, 440], r: [341, 440] },
} satisfies Record<string, Arms>;

const mix = (a: Point, b: Point, k: number): Point => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
export const mixArms = (a: Arms, b: Arms, k: number): Arms => ({ l: mix(a.l, b.l, k), r: mix(a.r, b.r, k) });

// Lodden kropp: en ellipse med takkete kant (fast mønster, ikke tilfeldig per frame).
const FUR = (() => {
  const n = 72;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const r = i % 2 ? 1.03 + random(`fur${i}`) * 0.04 : 0.97;
    // Pæreformet: bredere nederst.
    const wide = 1 + 0.12 * Math.max(0, Math.sin(a));
    return `${273 + Math.cos(a) * 128 * r * wide},${392 + Math.sin(a) * 122 * r}`;
  });
  return `M ${pts.join(" L ")} Z`;
})();

const Arm: React.FC<{ from: Point; to: Point; side: -1 | 1 }> = ({ from, to, side }) => {
  const [x0, y0] = from;
  const [x1, y1] = to;
  const len = Math.hypot(x1 - x0, y1 - y0) || 1;
  const [dx, dy] = [(x1 - x0) / len, (y1 - y0) / len];
  // Albuen bøyer seg utover.
  const ex = (x0 + x1) / 2 - dy * 28 * side;
  const ey = (y0 + y1) / 2 + dx * 28 * side;
  const claw = (deg: number) => {
    const a = (deg * Math.PI) / 180;
    const cx = dx * Math.cos(a) - dy * Math.sin(a);
    const cy = dx * Math.sin(a) + dy * Math.cos(a);
    return `M ${x1} ${y1} l ${cx * 26} ${cy * 26}`;
  };
  return (
    <g fill="none" strokeLinecap="round">
      {/* Svak kontur, så armene synes mot den svarte kroppen. */}
      <path d={`M ${x0} ${y0} Q ${ex} ${ey} ${x1} ${y1}`} stroke={OUTLINE} strokeWidth={38} />
      <path d={[-35, 0, 35].map(claw).join(" ")} stroke={OUTLINE} strokeWidth={15} />
      <path d={`M ${x0} ${y0} Q ${ex} ${ey} ${x1} ${y1}`} stroke={night.black} strokeWidth={30} />
      <path d={[-35, 0, 35].map(claw).join(" ")} stroke={night.black} strokeWidth={9} />
    </g>
  );
};

type Props = {
  // Midten av hodet og bredden på hodet, i skjermpiksler.
  x: number;
  y: number;
  width: number;
  arms?: Arms;
  // Gangfase (radianer); beina svinger med sin(walk).
  walk?: number;
  opacity?: number;
  eyes?: number;
  look?: number;
  grin?: number;
  open?: number;
  tilt?: number;
};

export const GremlinFigure: React.FC<Props> = ({
  x,
  y,
  width,
  arms = POSES.hang,
  walk = 0,
  opacity = 1,
  tilt = 0,
  ...face
}) => {
  const scale = width / IMG.w;
  const h = IMG.h * scale;
  const swing = Math.sin(walk) * 22;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity,
        transform: `rotate(${tilt}deg)`,
        transformOrigin: `${x}px ${y + h}px`,
      }}
    >
      <svg
        viewBox={`0 0 ${IMG.w} ${IMG.h}`}
        style={{
          position: "absolute",
          left: x - width / 2,
          top: y - h / 2,
          width,
          height: h,
          overflow: "visible",
          filter: `drop-shadow(0 0 ${8 * scale}px ${night.eyes}55)`,
        }}
      >
        {[
          { x: 236, deg: swing },
          { x: 310, deg: -swing },
        ].map((leg) => (
          <g key={leg.x} transform={`rotate(${leg.deg} ${leg.x} 500)`}>
            <path d={`M ${leg.x} 500 L ${leg.x} 600`} stroke={night.black} strokeWidth={40} strokeLinecap="round" />
            <ellipse cx={leg.x + 8} cy={608} rx={36} ry={15} fill={night.black} />
          </g>
        ))}
        <path d={FUR} fill={night.black} />
        <Arm from={SHOULDER.l} to={arms.l} side={-1} />
        <Arm from={SHOULDER.r} to={arms.r} side={1} />
      </svg>
      <ShadowGremlin x={x} y={y} width={width} {...face} />
    </div>
  );
};
