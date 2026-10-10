import { useCurrentFrame } from "remotion";
import { ramp } from "../style/anim";
import { theme } from "../style/theme";

type Props = {
  n: number;
  x: number;
  y: number;
  label: string;
  start: number;
  // Frame der steget er "aktivt" (uthevet) til, ellers bare synlig.
  activeUntil?: number;
};

// Nummerert steg (①, ②, …) med kort tekst. Uthevet mens steget pågår.
export const Step: React.FC<Props> = ({ n, x, y, label, start, activeUntil }) => {
  const frame = useCurrentFrame();
  const appear = ramp(frame, start, 12);
  const active = frame >= start && (activeUntil === undefined || frame < activeUntil);
  const { colors, fonts } = theme;
  return (
    <g opacity={appear} transform={`translate(${x} ${y}) scale(${0.6 + 0.4 * appear})`}>
      <circle r={15} fill={active ? colors.highlight : colors.inkSoft} />
      <text textAnchor="middle" y={6} fontFamily={fonts.mono} fontSize={17} fontWeight={600} fill="white">
        {n}
      </text>
      <text x={24} y={6} fontFamily={fonts.mono} fontSize={19} fontWeight={active ? 600 : 400} fill={active ? colors.ink : colors.inkSoft}>
        {label}
      </text>
    </g>
  );
};
