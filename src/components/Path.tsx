import { evolvePath } from "@remotion/paths";
import { useCurrentFrame } from "remotion";
import { ramp } from "../style/anim";
import { theme } from "../style/theme";

type Props = {
  d: string;
  start: number;
  duration?: number;
  color?: string;
  width?: number;
};

// En vilkårlig SVG-bane som tegnes opp fra start til slutt.
export const Path: React.FC<Props> = ({ d, start, duration = 20, color = theme.colors.ink, width = theme.stroke.normal }) => {
  const frame = useCurrentFrame();
  const progress = ramp(frame, start, duration);
  const { strokeDasharray, strokeDashoffset } = evolvePath(progress, d);
  if (progress <= 0) {
    return null;
  }
  return (
    <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinejoin="round" strokeLinecap="round"
      strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} />
  );
};
