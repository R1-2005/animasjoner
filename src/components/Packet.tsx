import { interpolate, useCurrentFrame } from "remotion";
import { ramp } from "../style/anim";
import { theme } from "../style/theme";

type Point = { x: number; y: number };

type Props = {
  from: Point;
  to: Point;
  start: number;
  duration: number;
  label: string;
  color?: string;
};

// En datapakke som reiser fra `from` til `to`. Usynlig før og etter turen.
export const Packet: React.FC<Props> = ({ from, to, start, duration, label, color = theme.colors.highlight }) => {
  const frame = useCurrentFrame();
  if (frame < start || frame > start + duration) {
    return null;
  }
  const t = ramp(frame, start, duration);
  const x = interpolate(t, [0, 1], [from.x, to.x]);
  const y = interpolate(t, [0, 1], [from.y, to.y]);
  // Litt inn- og uttoning i endene så pakken ikke "popper".
  const opacity = interpolate(t, [0, 0.1, 0.9, 1], [0, 1, 1, 0]);
  const width = label.length * 13 + 32;
  const { colors, fonts } = theme;

  return (
    <g transform={`translate(${x} ${y})`} opacity={opacity}>
      <rect x={-width / 2} y={-20} width={width} height={40} rx={8} fill={color} stroke={colors.ink} strokeWidth={2} />
      <text textAnchor="middle" y={7} fontFamily={fonts.mono} fontSize={20} fontWeight={600} fill="white">
        {label}
      </text>
    </g>
  );
};
