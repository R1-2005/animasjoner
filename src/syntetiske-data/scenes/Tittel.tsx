import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ramp } from "../../style/anim";
import type { Hold } from "../../components/Holds";
import { theme } from "../../style/theme";

export const TITTEL_FRAMES = 120;

// Tittelen blir stående mens foredragsholderen introduserer temaet.
// Totalt 16 s: 120 frames animasjon + 12 s pause (lengden passer til voiceoveren).
export const TITTEL_HOLDS: Hold[] = [{ at: 95, frames: 12 * 30 }];

export const Tittel: React.FC = () => {
  const frame = useCurrentFrame();
  const { colors, fonts } = theme;
  const t = ramp(frame, 5, 25) * (1 - ramp(frame, TITTEL_FRAMES - 18, 18));
  const sub = ramp(frame, 25, 20) * (1 - ramp(frame, TITTEL_FRAMES - 18, 18));
  const line = ramp(frame, 15, 30);

  return (
    <AbsoluteFill>
      <svg width="100%" height="100%" viewBox="0 0 1920 1080">
        <text x={960} y={400} textAnchor="middle" fontFamily={fonts.mono} fontSize={24} fill={colors.inkSoft} opacity={sub}>
          FIG. 0 — INNLEDNING
        </text>
        <text x={960} y={520} textAnchor="middle" fontFamily={fonts.sans} fontSize={110} fontWeight={800} fill={colors.ink}
          opacity={t} transform={`translate(0 ${(1 - t) * 20})`}>
          Syntetiske data i Gremlin
        </text>
        <line x1={960 - 520 * line} x2={960 + 520 * line} y1={565} y2={565} stroke={colors.accent} strokeWidth={4}
          opacity={1 - ramp(frame, TITTEL_FRAMES - 18, 18)} />
        <text x={960} y={630} textAnchor="middle" fontFamily={fonts.mono} fontSize={30} fill={colors.inkSoft} opacity={sub}>
          Hvordan vi utvikler, tester og lærer opp — uten ekte personopplysninger
        </text>
      </svg>
    </AbsoluteFill>
  );
};
