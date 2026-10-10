import { useCurrentFrame } from "remotion";
import { ramp } from "../style/anim";
import { theme } from "../style/theme";

type Props = {
  cx: number;
  top: number;
  w: number;
  h: number;
  start: number;
  // Fyllingsgrad 0-1, styres av scenen.
  level: number;
  children?: React.ReactNode;
};

// Klassisk database-sylinder med "væske" som viser hvor mye som er lagret.
export const Database: React.FC<Props> = ({ cx, top, w, h, start, level, children }) => {
  const frame = useCurrentFrame();
  const appear = ramp(frame, start, 30);
  const rx = w / 2;
  const ry = w * 0.12;
  const left = cx - rx;
  const bottom = top + h;
  const body = `M ${left} ${top} V ${bottom} A ${rx} ${ry} 0 0 0 ${cx + rx} ${bottom} V ${top}`;
  const fillTop = bottom - level * h;
  const { colors, stroke } = theme;

  return (
    <g opacity={appear} transform={`translate(0 ${(1 - appear) * 20})`}>
      <defs>
        <clipPath id={`db-clip-${cx}-${top}`}>
          <path d={`${body} A ${rx} ${ry} 0 0 0 ${left} ${top} Z`} />
        </clipPath>
      </defs>
      <path d={`${body} A ${rx} ${ry} 0 0 0 ${left} ${top} Z`} fill={colors.paper} />
      <g clipPath={`url(#db-clip-${cx}-${top})`}>
        <rect x={left} y={fillTop} width={w} height={bottom + ry - fillTop} fill={colors.accent} opacity={0.18} />
        <ellipse cx={cx} cy={fillTop} rx={rx} ry={ry} fill={colors.accent} opacity={0.25} />
      </g>
      <path d={body} fill="none" stroke={colors.ink} strokeWidth={stroke.normal} />
      <ellipse cx={cx} cy={top} rx={rx} ry={ry} fill={colors.paper} stroke={colors.ink} strokeWidth={stroke.normal} />
      {children}
    </g>
  );
};
