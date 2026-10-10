import { Easing } from "remotion";
import { useCurrentFrame } from "remotion";
import { ramp } from "../style/anim";
import { theme } from "../style/theme";

type Props = {
  start: number;
  duration?: number;
  id: string;
  children: React.ReactNode;
};

// Rydder arket: en skannelinje går fra høyre mot venstre og visker ut innholdet bak seg.
// Det som skal bli stående (f.eks. «gullet») tegnes utenfor <Wipe>.
export const Wipe: React.FC<Props> = ({ start, duration = 24, id, children }) => {
  const frame = useCurrentFrame();
  const t = ramp(frame, start, duration, Easing.inOut(Easing.cubic));
  const edge = 1920 * (1 - t);
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <rect x={0} y={0} width={edge} height={1080} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>{children}</g>
      {t > 0 && t < 1 ? <rect x={edge - 3} y={40} width={6} height={1000} rx={3} fill={theme.colors.accent} /> : null}
    </g>
  );
};
