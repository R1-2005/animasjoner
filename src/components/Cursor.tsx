import { theme } from "../style/theme";

type Props = { x: number; y: number; pressed?: boolean };

// Musepeker. Spissen er i (x, y).
export const Cursor: React.FC<Props> = ({ x, y, pressed = false }) => (
  <g transform={`translate(${x} ${y}) scale(${pressed ? 0.85 : 1})`}>
    <path d="M 0 0 L 0 38 L 10 28 L 17 44 L 24 41 L 17 25 L 30 25 Z" fill="white"
      stroke={theme.colors.ink} strokeWidth={2.5} strokeLinejoin="round" />
  </g>
);
