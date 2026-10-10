import { evolvePath } from "@remotion/paths";
import { useCurrentFrame } from "remotion";
import { ramp } from "../style/anim";
import { theme } from "../style/theme";

type Props = {
  x: number;
  y: number;
  w: number;
  h: number;
  // Frame der rammen begynner å tegnes.
  start: number;
  // Liten referansetekst over boksen, f.eks. "[A] KLIENT".
  tag?: string;
  children?: React.ReactNode;
};

// En komponent i arkitekturen: rammen tegnes opp, deretter tones innholdet inn.
export const Box: React.FC<Props> = ({ x, y, w, h, start, tag, children }) => {
  const frame = useCurrentFrame();
  const draw = ramp(frame, start, 30);
  const content = ramp(frame, start + 20, 15);
  const d = `M ${x} ${y} h ${w} v ${h} h ${-w} Z`;
  const { strokeDasharray, strokeDashoffset } = evolvePath(draw, d);
  const { colors, fonts, stroke } = theme;

  return (
    <g>
      <path d={d} fill={colors.paper} fillOpacity={draw} stroke={colors.ink} strokeWidth={stroke.normal}
        strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} />
      {tag ? (
        <text x={x} y={y - 14} fontFamily={fonts.mono} fontSize={18} fill={colors.inkSoft} opacity={content}>
          {tag}
        </text>
      ) : null}
      <g opacity={content}>{children}</g>
    </g>
  );
};
