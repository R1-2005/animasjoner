import { useCurrentFrame } from "remotion";
import { Box } from "../components/Box";
import { ramp } from "../style/anim";
import { theme } from "../style/theme";
import { SOURCE_Y, SRC } from "./layout";

// Den lilla [SYNTETISK DATABASE] med de tre etterlignede kildene, slik den står i del 6.
// Tegnes på kildenes plass til høyre; dx/dy flytter hele boksen (f.eks. til venstre i oppsummeringen).
export const SYNTHETIC_DB = { x: 1410, y: 225, w: 430, h: 500 };
// Plassering til venstre, der «gullet» ellers står.
export const SYNTHETIC_DB_LEFT = { dx: 105 - SYNTHETIC_DB.x, dy: 65 };

export const SYNTHETIC_SOURCES = [
  { name: "Nav", cy: SOURCE_Y.nav },
  { name: "Skatteetaten", cy: SOURCE_Y.skatteetaten },
  { name: "Folkeregisteret", cy: SOURCE_Y.folkeregisteret },
];

type Props = { start: number; dx?: number; dy?: number };

export const SyntheticDb: React.FC<Props> = ({ start, dx = 0, dy = 0 }) => {
  const frame = useCurrentFrame();
  const { colors, fonts } = theme;
  const C = SYNTHETIC_DB;
  return (
    <g transform={`translate(${dx} ${dy})`}>
      <g opacity={ramp(frame, start, 15)}>
        <rect x={C.x} y={C.y} width={C.w} height={C.h} rx={16} fill={colors.paper}
          stroke={colors.synthetic} strokeWidth={3} strokeDasharray="12 7" />
        <text x={C.x + 22} y={C.y + 30} fontFamily={fonts.mono} fontSize={18} fontWeight={600} fill={colors.synthetic}>
          [SYNTETISK DATABASE]
        </text>
      </g>
      {SYNTHETIC_SOURCES.map((s, i) => (
        <Box key={s.name} x={SRC.x} y={s.cy - SRC.h / 2} w={SRC.w} h={SRC.h} start={start + 5 + i * 8}>
          <text x={SRC.x + SRC.w / 2} y={s.cy + 2} textAnchor="middle" fontFamily={fonts.sans} fontSize={30} fontWeight={700}
            fill={colors.ink}>
            {s.name}
          </text>
          <text x={SRC.x + SRC.w / 2} y={s.cy + 32} textAnchor="middle" fontFamily={fonts.mono} fontSize={17} fontWeight={600}
            fill={colors.synthetic}>
            mock API · syntetisk
          </text>
        </Box>
      ))}
    </g>
  );
};
