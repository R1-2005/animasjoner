import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Database } from "../../components/Database";
import { Sparkles } from "../../components/Sparkles";
import { ramp } from "../../style/anim";
import { theme } from "../../style/theme";
import { GOLD_SPARKLES, REGISTER, REGISTER_LEVEL } from "../layout";

export const KAPITTEL_FRAMES = 100;

type Props = {
  n: number;
  title: string;
  subtitle: string;
  // Før «gullet» finnes (del 1) vises kortet uten registeret, med teksten helt til venstre.
  register?: boolean;
};

// Kapittelkort mellom scenene: «gullet» står igjen, kapittelet presenteres stort i midten,
// og tittelen glir så opp i overskriftsposisjonen (samme sted og størrelse som Header),
// slik at neste scene fortsetter sømløst.
const MOVE = 68;

export const Kapittel: React.FC<Props> = ({ n, title, subtitle, register = true }) => {
  const frame = useCurrentFrame();
  const { colors, fonts } = theme;
  const move = ramp(frame, MOVE, 28, Easing.inOut(Easing.cubic));
  const lerp = (a: number, b: number) => interpolate(move, [0, 1], [a, b]);

  const del = ramp(frame, 4, 14) * (1 - ramp(frame, MOVE - 4, 12));
  const titleIn = ramp(frame, 12, 20);
  const subIn = ramp(frame, 26, 18);
  const line = ramp(frame, 8, 26) * (1 - ramp(frame, MOVE - 4, 12));
  const x0 = register ? 640 : 120;

  return (
    <AbsoluteFill>
      <svg width="100%" height="100%" viewBox="0 0 1920 1080">
        {/* «Gullet» står fast mellom kapitlene */}
        {register ? (
          <>
            <Database cx={REGISTER.cx} top={REGISTER.top} w={REGISTER.w} h={REGISTER.h} start={-30} level={REGISTER_LEVEL} gold={1} />
            <Sparkles points={GOLD_SPARKLES.slice(0, 3)} start={0} period={90} />
            <text x={REGISTER.cx} y={REGISTER.top + REGISTER.h + 90} textAnchor="middle" fontFamily={fonts.sans} fontSize={32}
              fontWeight={700} fill={colors.ink}>
              Tilslutningsregisteret
            </text>
          </>
        ) : null}

        <text x={x0} y={445} fontFamily={fonts.mono} fontSize={28} fontWeight={600} fill={colors.accent} opacity={del}
          letterSpacing={4}>
          DEL {n}
        </text>
        <line x1={x0} x2={x0 + 600 * line} y1={470} y2={470} stroke={colors.accent} strokeWidth={4} />
        <text x={lerp(x0 + (1 - titleIn) * 30, 120)} y={lerp(570, 135)} fontFamily={fonts.sans} fontSize={lerp(120, 60)} fontWeight={800}
          fill={colors.ink} opacity={titleIn}>
          {title}
        </text>
        <text x={lerp(x0 + 4, 122)} y={lerp(635, 182)} fontFamily={fonts.mono} fontSize={lerp(32, 24)} fill={colors.inkSoft} opacity={subIn}>
          {subtitle}
        </text>
      </svg>
    </AbsoluteFill>
  );
};
