import { interpolate, useCurrentFrame } from "remotion";
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
};

// Mange små datapakker etter hverandre — viser volum, ikke enkeltmeldinger.
export const Stream: React.FC<Props> = ({ from, to, start, duration, count = 24, travel = 24, color = theme.colors.accent }) => {
  const frame = useCurrentFrame();
  const spacing = Math.max(1, duration - travel) / count;
  return (
    <g>
      {Array.from({ length: count }, (_, i) => {
        const t = (frame - start - i * spacing) / travel;
        if (t < 0 || t > 1) {
          return null;
        }
        const x = interpolate(t, [0, 1], [from.x, to.x]);
        const y = interpolate(t, [0, 1], [from.y, to.y]);
        const opacity = interpolate(t, [0, 0.15, 0.85, 1], [0, 1, 1, 0]);
        return <rect key={i} x={x - 6} y={y - 6} width={12} height={12} rx={2} fill={color} opacity={opacity} />;
      })}
    </g>
  );
};
