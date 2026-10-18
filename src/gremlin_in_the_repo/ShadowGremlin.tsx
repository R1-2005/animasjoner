import { Img, staticFile } from "remotion";
import { night } from "./look";

// Gremlin som skygge i mørket: tegningen (public/Gremlin_glad.png) gjort helt svart, med
// selvlysende øyne og tenner tegnet oppå i bildets egne koordinater (546×310).
const IMG = { w: 546, h: 310 };
const EYES = [
  { x: 222, y: 143 },
  { x: 327, y: 143 },
];
const MOUTH = { x: 275, y: 192, w: 128 };

type Props = {
  // Midten av hodet og bredden, i skjermpiksler.
  x: number;
  y: number;
  width: number;
  // 0 = lukket, 1 = vidt åpne.
  eyes?: number;
  // Hvor pupillene ser, -1..1.
  look?: number;
  // 0 = ingen tenner, 1 = fullt glis.
  grin?: number;
  // 0 = lukket kjeft, 1 = gapende (latter).
  open?: number;
  // Hodet på skrå, grader.
  tilt?: number;
  // Debug: vis linjetegningen i stedet for silhuetten, for å sjekke plasseringen.
  debug?: boolean;
};

export const ShadowGremlin: React.FC<Props> = ({
  x,
  y,
  width,
  eyes = 1,
  look = 0,
  grin = 0,
  open = 0,
  tilt = 0,
  debug = false,
}) => {
  const scale = width / IMG.w;
  const gap = open * 26;
  const teeth = (row: "upper" | "lower") => {
    const n = 9;
    const half = MOUTH.w / 2;
    const dir = row === "upper" ? 1 : -1;
    const base = MOUTH.y + (row === "upper" ? 0 : gap + 6);
    // Gliset bøyer seg: kantene høyere enn midten.
    const yAt = (u: number) => base + (1 - u * u) * 10 * grin;
    let d = "";
    for (let i = 0; i < n; i++) {
      const u0 = -1 + (2 * i) / n;
      const u1 = -1 + (2 * (i + 1)) / n;
      const um = (u0 + u1) / 2;
      const len = (i === 1 || i === n - 2 ? 16 : 9) * grin;
      d += `M ${MOUTH.x + u0 * half} ${yAt(u0)} L ${MOUTH.x + um * half} ${yAt(um) + dir * len} L ${MOUTH.x + u1 * half} ${yAt(u1)} Z `;
    }
    return d;
  };

  return (
    <div
      style={{
        position: "absolute",
        left: x - width / 2,
        top: y - (IMG.h * scale) / 2,
        width,
        height: IMG.h * scale,
        transform: `rotate(${tilt}deg)`,
      }}
    >
      <Img
        src={staticFile("Gremlin_glad.png")}
        style={{
          width: "100%",
          height: "100%",
          filter: debug
            ? "none"
            : `brightness(0) drop-shadow(0 0 ${8 * scale}px ${night.eyes}55)`,
        }}
      />
      <svg viewBox={`0 0 ${IMG.w} ${IMG.h}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <defs>
          <filter id="gremlin-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g filter="url(#gremlin-glow)" opacity={debug ? 0.6 : 1}>
          {EYES.map((e, i) => (
            <g key={i} transform={`translate(${e.x} ${e.y}) rotate(${i === 0 ? 12 : -12})`}>
              <ellipse rx={24} ry={Math.max(15 * eyes, 0.5)} fill={night.eyes} />
              <ellipse cx={look * 9} rx={4} ry={Math.max(12 * eyes, 0.3)} fill={night.black} />
            </g>
          ))}
          {grin > 0 && <path d={teeth("upper")} fill={night.teeth} />}
          {grin > 0 && open > 0.05 && <path d={teeth("lower")} fill={night.teeth} />}
        </g>
      </svg>
    </div>
  );
};
