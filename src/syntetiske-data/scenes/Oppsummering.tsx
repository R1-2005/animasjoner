import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Database } from "../../components/Database";
import { Header } from "../../components/Header";
import type { Hold } from "../../components/Holds";
import { Sparkles } from "../../components/Sparkles";
import { ramp } from "../../style/anim";
import { theme } from "../../style/theme";
import { GOLD_SPARKLES, REGISTER, REGISTER_LEVEL } from "../layout";

export const OPPSUMMERING_FRAMES = 350;

// Fire punkter, ett om gangen, med en kort pause (2 s) etter hvert.
const T = { punkt1: 15, punkt2: 90, punkt3: 165, punkt4: 240, slutt: 320 };

export const OPPSUMMERING_HOLDS: Hold[] = [
  { at: 80, frames: 2 * 30 },
  { at: 155, frames: 2 * 30 },
  { at: 230, frames: 2 * 30 },
  { at: 340, frames: 10 * 30 },
];

const X = 640;
const ROW_Y = [255, 430, 605, 780];

// Liten menneskefigur, samme form som i strømmene.
const Person: React.FC<{ x: number; y: number; color: string; s?: number }> = ({ x, y, color, s = 1.6 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} fill={color}>
    <circle cx={0} cy={-9} r={5} />
    <path d="M -8 9 Q -8 -2 0 -2 Q 8 -2 8 9 Z" />
  </g>
);

export const Oppsummering: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { colors, fonts } = theme;

  const chipWidth = (label: string, mark?: string) => label.length * 13 + (mark ? 64 : 40);
  // Legger brikkene etter hverandre med lik avstand.
  const chipRow = (labels: string[], y: number, color: string, start: number, mark?: string) => {
    let x = X + 75;
    return labels.map((label, i) => {
      const el = chip(x, y, label, color, start + i * 8, mark);
      x += chipWidth(label, mark) + 22;
      return el;
    });
  };
  const chip = (x: number, y: number, label: string, color: string, at: number, mark?: string) => {
    const k = spring({ frame: frame - at, fps, config: { damping: 11 } });
    const w = chipWidth(label, mark);
    return frame >= at ? (
      <g key={label} transform={`translate(${x} ${y}) scale(${k})`}>
        <rect x={0} y={-22} width={w} height={42} rx={21} fill="white" stroke={color} strokeWidth={3} />
        <text x={20} y={7} fontFamily={fonts.mono} fontSize={21} fontWeight={600} fill={colors.ink}>
          {label}
        </text>
        {mark ? (
          <text x={w - 34} y={8} fontFamily={fonts.sans} fontSize={24} fontWeight={800} fill={color}>
            {mark}
          </text>
        ) : null}
      </g>
    ) : null;
  };

  const point = (i: number, title: string, start: number, detail: React.ReactNode) => {
    const t = ramp(frame, start, 18);
    const y = ROW_Y[i];
    return (
      <g opacity={t} transform={`translate(${(1 - t) * 30} 0)`}>
        <circle cx={X + 26} cy={y - 14} r={26} fill={colors.success} />
        <path d={`M ${X + 14} ${y - 14} L ${X + 23} ${y - 4} L ${X + 39} ${y - 25}`} fill="none" stroke="white" strokeWidth={5}
          strokeLinecap="round" strokeLinejoin="round" />
        <text x={X + 75} y={y} fontFamily={fonts.sans} fontSize={36} fontWeight={800} fill={colors.ink}>
          {title}
        </text>
        {detail}
      </g>
    );
  };

  return (
    <AbsoluteFill>
      <svg width="100%" height="100%" viewBox="0 0 1920 1080">
        {/* «Gullet» står igjen */}
        <Database cx={REGISTER.cx} top={REGISTER.top} w={REGISTER.w} h={REGISTER.h} start={-30} level={REGISTER_LEVEL} gold={1} />
        <Sparkles points={GOLD_SPARKLES} start={0} period={60} />
        <text x={REGISTER.cx} y={REGISTER.top + REGISTER.h + 90} textAnchor="middle" fontFamily={fonts.sans} fontSize={32}
          fontWeight={700} fill={colors.ink}>
          Tilslutningsregisteret
        </text>

        <Header title="Oppsummering" subtitle="Dette har vi oppnådd med syntetiske data" start={-20} />

        {/* 1: tilbakeblikk på sperren i «Problemet» — nå er alle tre grønne */}
        {point(0, "Trygt miljø for utvikling, test og opplæring", T.punkt1, (
          <g>
            {chipRow(["Utvikling", "Test", "Opplæring"], ROW_Y[0] + 60, colors.success, T.punkt1 + 20, "✓")}
          </g>
        ))}

        {/* 2: ekte og syntetisk ser likt ut for Gremlin */}
        {point(1, "Applikasjonene er identiske mot syntetiske og reelle data", T.punkt2, (
          <g opacity={ramp(frame, T.punkt2 + 20, 15)}>
            {[0, 1, 2].map((k) => <Person key={k} x={X + 100 + k * 38} y={ROW_Y[1] + 62} color={colors.person} />)}
            <text x={X + 100} y={ROW_Y[1] + 112} fontFamily={fonts.mono} fontSize={18} fill={colors.person}>ekte</text>
            <text x={X + 240} y={ROW_Y[1] + 76} fontFamily={fonts.sans} fontSize={48} fontWeight={800} fill={colors.ink}>=</text>
            {[0, 1, 2].map((k) => <Person key={k} x={X + 315 + k * 38} y={ROW_Y[1] + 62} color={colors.synthetic} />)}
            <text x={X + 315} y={ROW_Y[1] + 112} fontFamily={fonts.mono} fontSize={18} fill={colors.synthetic}>syntetisk</text>
            <text x={X + 470} y={ROW_Y[1] + 74} fontFamily={fonts.mono} fontSize={24} fontWeight={600} fill={colors.highlight}
              opacity={ramp(frame, T.punkt2 + 45, 15)}>
              — Gremlin merker ingen forskjell.
            </text>
          </g>
        ))}

        {/* 3: hendelser som er vanskelige å finne i ekte data */}
        {point(2, "Simulerer edge-cases og ekstreme hendelser", T.punkt3, (
          <g>
            {chipRow(["Død", "Fødselsnummerskifte", "Navneendring", "Flytting"], ROW_Y[2] + 60, colors.synthetic, T.punkt3 + 20)}
          </g>
        ))}

        {/* 4: kan kobles mot andre syntetiske miljøer */}
        {point(3, "Kan integreres mot andre syntetiske miljøer", T.punkt4, (
          <g>
            {chipRow(["Dolly", "Tenor"], ROW_Y[3] + 60, colors.accent, T.punkt4 + 20, "⇄")}
            <text x={X + 400} y={ROW_Y[3] + 67} fontFamily={fonts.mono} fontSize={21} fill={colors.inkSoft}
              opacity={ramp(frame, T.punkt4 + 35, 15)}>
              ende-til-ende-test på tvers av syntetiske miljøer
            </text>
          </g>
        ))}

        <text x={X + 75} y={ROW_Y[3] + 160} fontFamily={fonts.mono} fontSize={20} fill={colors.inkSoft} opacity={ramp(frame, T.slutt, 20)}>
          Ingen ekte mennesker ble brukt i denne presentasjonen.
        </text>
      </svg>
    </AbsoluteFill>
  );
};
