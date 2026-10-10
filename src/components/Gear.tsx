import { theme } from "../style/theme";

type Props = {
  cx: number;
  cy: number;
  r: number;
  teeth: number;
  // Rotasjon i grader. Regnes ut av scenen, så hastigheten kan variere.
  angle: number;
  color?: string;
};

const gearPath = (r: number, teeth: number) => {
  const inner = r * 0.82;
  const step = (Math.PI * 2) / teeth;
  const points: string[] = [];
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    for (const [offset, radius] of [[0, inner], [0.15, r], [0.45, r], [0.6, inner]] as const) {
      const angle = a + step * offset;
      points.push(`${(Math.cos(angle) * radius).toFixed(2)} ${(Math.sin(angle) * radius).toFixed(2)}`);
    }
  }
  return `M ${points.join(" L ")} Z`;
};

export const Gear: React.FC<Props> = ({ cx, cy, r, teeth, angle, color = theme.colors.paper }) => {
  const { colors, stroke } = theme;
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${angle})`}>
      <path d={gearPath(r, teeth)} fill={color} stroke={colors.ink} strokeWidth={stroke.normal} strokeLinejoin="round" />
      <circle r={r * 0.32} fill="none" stroke={colors.ink} strokeWidth={stroke.thin} />
      <circle r={r * 0.1} fill={colors.ink} />
      <line x1={0} y1={-r * 0.32} x2={0} y2={-r * 0.7} stroke={colors.ink} strokeWidth={stroke.thin} />
    </g>
  );
};
