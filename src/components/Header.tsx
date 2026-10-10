import { useCurrentFrame } from "remotion";
import { ramp } from "../style/anim";
import { theme } from "../style/theme";

type Props = {
  title: string;
  subtitle?: string;
  start?: number;
  // Frame der overskriften toner ut (valgfritt).
  end?: number;
};

// Sceneoverskrift oppe til venstre, samme plassering i alle scener.
export const Header: React.FC<Props> = ({ title, subtitle, start = 0, end }) => {
  const frame = useCurrentFrame();
  const t = ramp(frame, start, 20) * (end === undefined ? 1 : 1 - ramp(frame, end, 15));
  const { colors, fonts } = theme;
  return (
    <g opacity={t} transform={`translate(0 ${(1 - t) * 16})`}>
      <text x={120} y={135} fontFamily={fonts.sans} fontSize={60} fontWeight={800} fill={colors.ink}>
        {title}
      </text>
      {subtitle ? (
        <text x={122} y={182} fontFamily={fonts.mono} fontSize={24} fill={colors.inkSoft}>
          {subtitle}
        </text>
      ) : null}
    </g>
  );
};
