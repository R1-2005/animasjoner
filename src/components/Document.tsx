import { theme } from "../style/theme";

type Props = {
  x: number;
  y: number;
  w?: number;
  h?: number;
  title: string;
  // Antall tekstlinjer i dokumentet.
  lines?: number;
  accent?: string;
  // Tynn, grå kant: for ark som ligger under i en bunke.
  muted?: boolean;
};

// Et dokument med brettet hjørne: faktura, vedlegg, vedtak.
export const Document: React.FC<Props> = ({ x, y, w = 110, h = 140, title, lines = 4, accent = theme.colors.accent, muted = false }) => {
  const { colors, fonts, stroke } = theme;
  const fold = 22;
  if (muted) {
    return (
      <path d={`M ${x} ${y} H ${x + w - fold} L ${x + w} ${y + fold} V ${y + h} H ${x} Z`} fill="white" stroke={colors.inkSoft}
        strokeWidth={1.2} strokeLinejoin="round" />
    );
  }
  return (
    <g>
      <path d={`M ${x} ${y} H ${x + w - fold} L ${x + w} ${y + fold} V ${y + h} H ${x} Z`} fill="white" stroke={colors.ink}
        strokeWidth={stroke.normal} strokeLinejoin="round" />
      <path d={`M ${x + w - fold} ${y} V ${y + fold} H ${x + w}`} fill="none" stroke={colors.ink} strokeWidth={stroke.thin} />
      <text x={x + 12} y={y + 34} fontFamily={fonts.mono} fontSize={14} fontWeight={600} fill={accent}>
        {title}
      </text>
      {Array.from({ length: lines }, (_, i) => (
        <line key={i} x1={x + 12} x2={x + w - 14 - (i % 2) * 22} y1={y + 56 + i * 18} y2={y + 56 + i * 18}
          stroke={colors.inkSoft} strokeWidth={2} />
      ))}
    </g>
  );
};
