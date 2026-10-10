import { interpolate, useCurrentFrame } from "remotion";
import { useLiveTime } from "./Holds";
import { theme } from "../style/theme";

type Point = { x: number; y: number };

type Props = {
  from: Point;
  to: Point;
  start: number;
  // Hvor lenge strømmen pågår (fra første prikk drar til siste ankommer).
  duration: number;
  count?: number;
  // Hvor lang tid én prikk bruker på turen.
  travel?: number;
  color?: string;
  // "person" tegner små menneskefigurer i stedet for prikker.
  shape?: "dot" | "person";
  // Fortsett å strømme gjennom pauser (scenens levende tid i stedet for frosset tid).
  live?: boolean;
};

// Mange små datapakker etter hverandre — viser volum, ikke enkeltmeldinger.
export const Stream: React.FC<Props> = ({
  from, to, start, duration, count = 24, travel = 24, color = theme.colors.accent, shape = "dot", live = false,
}) => {
  const frame = useCurrentFrame();
  const { live: liveFrame, toWall } = useLiveTime();
  const spacing = Math.max(1, duration - travel) / count;
  // I levende tid varer strømmen også gjennom pausene, med samme tetthet.
  const now = live ? liveFrame - toWall(start) : frame - start;
  const total = live ? toWall(start + duration) - toWall(start) : duration;
  const last = Math.floor((total - travel) / spacing);
  const first = Math.max(0, Math.ceil((now - travel) / spacing));
  const newest = Math.min(last, Math.floor(now / spacing));
  return (
    <g>
      {Array.from({ length: Math.max(0, newest - first + 1) }, (_, k) => {
        const i = first + k;
        const t = (now - i * spacing) / travel;
        if (t < 0 || t > 1) {
          return null;
        }
        const x = interpolate(t, [0, 1], [from.x, to.x]);
        const y = interpolate(t, [0, 1], [from.y, to.y]);
        const opacity = interpolate(t, [0, 0.15, 0.85, 1], [0, 1, 1, 0]);
        if (shape === "person") {
          return (
            <g key={i} transform={`translate(${x} ${y})`} opacity={opacity} fill={color}>
              <circle cx={0} cy={-9} r={5} />
              <path d="M -8 9 Q -8 -2 0 -2 Q 8 -2 8 9 Z" />
            </g>
          );
        }
        return <rect key={i} x={x - 6} y={y - 6} width={12} height={12} rx={2} fill={color} opacity={opacity} />;
      })}
    </g>
  );
};
