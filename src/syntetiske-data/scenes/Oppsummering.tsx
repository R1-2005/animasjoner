import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Header } from "../../components/Header";
import type { Hold } from "../../components/Holds";
import { ramp } from "../../style/anim";
import { theme } from "../../style/theme";
import { SYNTHETIC_DB_LEFT, SyntheticDb } from "../SyntheticDb";

export const OPPSUMMERING_FRAMES = 425;

// Fem punkter, ett om gangen, med en kort pause (2 s) etter hvert.
const T = { punkt1: 15, punkt2: 90, punkt3: 165, punkt4: 240, punkt5: 315, stempel: 355 };

export const OPPSUMMERING_HOLDS: Hold[] = [
  { at: 80, frames: 4 * 30 }, // etter «Trygt miljø …»
  { at: 155, frames: 4 * 30 }, // etter «Reduserer konsekvensen …»
  { at: 230, frames: 5 * 30 }, // etter «Applikasjonene er identiske …»
  { at: 305, frames: 9 * 30 }, // etter «Simulerer edge-cases …»
  { at: 415, frames: 20 * 30 }, // sluttbildet, så filmen ikke slutter for brått
];

const X = 640;
const ROW_Y = [248, 389, 530, 671, 812];

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
  const stamp = spring({ frame: frame - T.stempel, fps, config: { damping: 9 } });

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
        {/* Den syntetiske databasen står igjen fra del 6 */}
        <SyntheticDb start={-60} {...SYNTHETIC_DB_LEFT} />

        <Header title="Oppsummering" subtitle="Dette har vi oppnådd med syntetiske data" start={-20} />

        {/* 1: tilbakeblikk på sperren i «Problemet» — nå er alle tre grønne */}
        {point(0, "Trygt miljø for utvikling, test og opplæring", T.punkt1, (
          <g>
            {chipRow(["Utvikling", "Test", "Opplæring"], ROW_Y[0] + 60, colors.success, T.punkt1 + 20, "✓")}
          </g>
        ))}

        {/* 2: lekker testmiljøet, lekker bare fiktive folk */}
        {point(1, "Reduserer konsekvensen ved et datainnbrudd", T.punkt2, (
          <g>
            {chipRow(["Datainnbrudd"], ROW_Y[1] + 60, colors.person, T.punkt2 + 20, "⚠")}
            <text x={X + 330} y={ROW_Y[1] + 67} fontFamily={fonts.mono} fontSize={24} fontWeight={600} fill={colors.highlight}
              opacity={ramp(frame, T.punkt2 + 40, 15)}>
              — tyvene får bare fiktive folk.
            </text>
          </g>
        ))}

        {/* 3: ekte og syntetisk ser likt ut for Gremlin */}
        {point(2, "Applikasjonene er identiske mot syntetiske og reelle data", T.punkt3, (
          <g opacity={ramp(frame, T.punkt3 + 20, 15)}>
            {[0, 1, 2].map((k) => <Person key={k} x={X + 100 + k * 38} y={ROW_Y[2] + 62} color={colors.person} />)}
            <text x={X + 100} y={ROW_Y[2] + 100} fontFamily={fonts.mono} fontSize={18} fill={colors.person}>ekte</text>
            <text x={X + 240} y={ROW_Y[2] + 76} fontFamily={fonts.sans} fontSize={48} fontWeight={800} fill={colors.ink}>=</text>
            {[0, 1, 2].map((k) => <Person key={k} x={X + 315 + k * 38} y={ROW_Y[2] + 62} color={colors.synthetic} />)}
            <text x={X + 315} y={ROW_Y[2] + 100} fontFamily={fonts.mono} fontSize={18} fill={colors.synthetic}>syntetisk</text>
            <text x={X + 470} y={ROW_Y[2] + 74} fontFamily={fonts.mono} fontSize={24} fontWeight={600} fill={colors.highlight}
              opacity={ramp(frame, T.punkt3 + 45, 15)}>
              — Gremlin merker ingen forskjell.
            </text>
          </g>
        ))}

        {/* 4: hendelser som er vanskelige å finne i ekte data */}
        {point(3, "Simulerer edge-cases og ekstreme hendelser", T.punkt4, (
          <g>
            {chipRow(["Død", "Fødselsnummerskifte", "Navneendring", "Flytting"], ROW_Y[3] + 60, colors.synthetic, T.punkt4 + 20)}
          </g>
        ))}

        {/* 5: kan kobles mot andre syntetiske miljøer */}
        {point(4, "Kan integreres mot andre syntetiske miljøer", T.punkt5, (
          <g>
            {chipRow(["Dolly", "Tenor"], ROW_Y[4] + 60, colors.accent, T.punkt5 + 20, "⇄")}
            <text x={X + 400} y={ROW_Y[4] + 67} fontFamily={fonts.mono} fontSize={21} fill={colors.inkSoft}
              opacity={ramp(frame, T.punkt5 + 35, 15)}>
              ende-til-ende-test på tvers av syntetiske miljøer
            </text>
          </g>
        ))}

        {/* Stempel nede til venstre, samtidig med siste poeng */}
        {frame >= T.stempel ? (
          <g transform={`translate(320 905) rotate(-4) scale(${0.4 + 0.6 * stamp})`} opacity={Math.min(1, stamp * 1.5)}>
            <rect x={-215} y={-48} width={430} height={96} rx={8} fill="white" fillOpacity={0.85} stroke={colors.success}
              strokeWidth={5} />
            <text textAnchor="middle" y={-4} fontFamily={fonts.mono} fontSize={30} fontWeight={700} fill={colors.success}>
              INGEN EKTE MENNESKER
            </text>
            <text textAnchor="middle" y={28} fontFamily={fonts.mono} fontSize={18} fontWeight={600} fill={colors.success}>
              ble brukt i denne presentasjonen
            </text>
          </g>
        ) : null}
      </svg>
    </AbsoluteFill>
  );
};
