import { useCurrentFrame } from "remotion";
import { theme } from "../style/theme";

type Props = {
  points: { x: number; y: number; size?: number }[];
  start: number;
  // Lengre periode = roligere glimt.
  period?: number;
};

// Firtakkede glimt som blinker etter tur. Brukes på «gullet».
export const Sparkles: React.FC<Props> = ({ points, start, period = 48 }) => {
  const frame = useCurrentFrame();
  const { colors } = theme;
  if (frame < start) {
    return null;
  }
  return (
    <g>
      {points.map((p, i) => {
        const phase = ((frame - start + (i * period) / points.length) % period) / period;
        const s = Math.max(0, Math.sin(phase * Math.PI * 2)) ** 2;
        if (s < 0.02) {
          return null;
        }
        const r = (p.size ?? 14) * s;
        const d = `M 0 ${-r} Q 0 0 ${r} 0 Q 0 0 0 ${r} Q 0 0 ${-r} 0 Q 0 0 0 ${-r} Z`;
        return (
          <path key={i} d={d} transform={`translate(${p.x} ${p.y}) rotate(${phase * 40})`} fill="white" stroke={colors.gold}
            strokeWidth={1.5} />
        );
      })}
    </g>
  );
};
