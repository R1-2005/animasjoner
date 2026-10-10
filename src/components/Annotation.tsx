import { evolvePath } from "@remotion/paths";
import { useCurrentFrame } from "remotion";
import { ramp, typewriter } from "../style/anim";
import { theme } from "../style/theme";

type Point = { x: number; y: number };

type Props = {
  // Punktet det pekes på.
  target: Point;
  // Der teksten starter (venstre kant, grunnlinje).
  at: Point;
  text: string;
  start: number;
  color?: string;
  // Vis hele teksten med en gang i stedet for å skrive den ut tegn for tegn.
  instant?: boolean;
};

// Påskrift med henvisningslinje, som på en teknisk tegning. Teksten skrives ut tegn for tegn.
export const Annotation: React.FC<Props> = ({ target, at, text, start, color = theme.colors.highlight, instant = false }) => {
  const frame = useCurrentFrame();
  const line = ramp(frame, start, 25);
  const typing = ramp(frame, start + 12, Math.max(15, text.length * 1.2), (t) => t);
  // Henvisningslinjen går til nærmeste ende av en strek under teksten.
  const fontSize = 26;
  const textWidth = text.length * fontSize * 0.6;
  const shoulderY = at.y + 12;
  // Streken stikker litt ut forbi teksten, så linjen aldri krysser bokstavene.
  const left = at.x - 20;
  const right = at.x + textWidth + 20;
  const nearX = Math.abs(target.x - left) < Math.abs(target.x - right) ? left : right;
  const farX = nearX === left ? right : left;
  const d = `M ${target.x} ${target.y} L ${nearX} ${shoulderY} L ${farX} ${shoulderY}`;
  const { strokeDasharray, strokeDashoffset } = evolvePath(line, d);
  const { fonts, stroke } = theme;

  if (frame < start) {
    return null;
  }

  return (
    <g>
      <circle cx={target.x} cy={target.y} r={6} fill={color} />
      <path d={d} stroke={color} strokeWidth={stroke.thin * 1.5} fill="none"
        strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} />
      <text x={at.x} y={at.y} fontFamily={fonts.mono} fontSize={fontSize} fontWeight={600} fill={color}>
        {instant ? text : typewriter(text, typing)}
      </text>
    </g>
  );
};
