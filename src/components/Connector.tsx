import { evolvePath } from "@remotion/paths";
import { useCurrentFrame } from "remotion";
import { ramp } from "../style/anim";
import { theme } from "../style/theme";

type Point = { x: number; y: number };

type Props = {
  from: Point;
  to: Point;
  start: number;
  duration?: number;
};

// En rett linje med pilspiss som tegnes fra `from` til `to`.
export const Connector: React.FC<Props> = ({ from, to, start, duration = 25 }) => {
  const frame = useCurrentFrame();
  const draw = ramp(frame, start, duration);
  const d = `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
  const { strokeDasharray, strokeDashoffset } = evolvePath(draw, d);
  const angle = (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
  const { colors, stroke } = theme;

  return (
    <g>
      <path d={d} stroke={colors.inkSoft} strokeWidth={stroke.thin * 1.5} fill="none"
        strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} />
      <path d="M -14 -7 L 0 0 L -14 7" fill="none" stroke={colors.inkSoft} strokeWidth={stroke.thin * 1.5}
        transform={`translate(${to.x} ${to.y}) rotate(${angle})`} opacity={draw >= 1 ? 1 : 0} />
    </g>
  );
};
