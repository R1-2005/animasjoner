import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Annotation } from "../../components/Annotation";
import { Box } from "../../components/Box";
import { Connector } from "../../components/Connector";
import { Database } from "../../components/Database";
import { Gear } from "../../components/Gear";
import { Header } from "../../components/Header";
import { type Hold, useLiveTime } from "../../components/Holds";
import { Path } from "../../components/Path";
import { Sparkles } from "../../components/Sparkles";
import { Stream } from "../../components/Stream";
import { Wipe } from "../../components/Wipe";
import { ramp, typewriter } from "../../style/anim";
import { theme } from "../../style/theme";
import { ENGINE, GOLD_SPARKLES, REGISTER, REGISTER_LEVEL, REGISTER_RIGHT, req, res, SOURCE_Y, SRC } from "../layout";

export const PROBLEMET_FRAMES = 592;

// Tidslinje for scenen (lokale frames).
const T = {
  boks: 10,
  kilder: 25,
  linjer: 45,
  flyt: 70, // dataene flyter som i produksjon
  fokus: 130, // én pakke fra Nav fanges opp
  kort: 150, // ... og blåses opp til et personkort
  stempel: 235,
  tilbake: 275,
  mennesker: 310, // alle prikkene blir til mennesker
  miljoer: 370, // utvikling, test, opplæring
  piler: 400,
  sperre: 420,
  kryss: 440,
  notat: 455,
  konklusjon: 500,
  ryddOpp: 565,
};

// Pauser: på personkortet, på «hver prikk er et menneske», og på sluttbildet.
export const PROBLEMET_HOLDS: Hold[] = [
  { at: 270, frames: 2 * 30 }, // personkortet med «PERSONOPPLYSNINGER»-stempelet
  { at: 362, frames: 3 * 30 }, // «Hver prikk er et ekte menneske»
  { at: 560, frames: 4 * 30 }, // sluttbildet
];

const SOURCES = [
  { name: "Nav", cy: SOURCE_Y.nav },
  { name: "Skatteetaten", cy: SOURCE_Y.skatteetaten },
  { name: "Folkeregisteret", cy: SOURCE_Y.folkeregisteret },
];
const REG_LINE = { from: { x: REGISTER_RIGHT, y: 575 }, to: { x: ENGINE.x, y: 575 } };
const FLOW_END = T.ryddOpp;

// Personkortet: starter som én prikk på Nav-linjen og blåses opp midt i bildet.
const DOT = { x: 1300, y: SOURCE_Y.nav + 20 };
const CARD = { w: 640, h: 370, cx: 960, cy: 485 };
const CARD_ROWS = [
  { label: "Fødselsnummer", value: "120368 •••••" },
  { label: "Adresse", value: "Eksempelgata 5, Oslo" },
  { label: "Lønn", value: "612 000 kr" },
  { label: "Sykepenger", value: "14 dager i 2024" },
];

// Miljøene som trenger data, men ikke får bruke ekte personopplysninger.
const ENVS = ["Utvikling", "Test", "Opplæring"];
const ENV_X = [720, 960, 1200];
const ENV = { y: 820, w: 220, h: 80 };
const BARRIER_Y = 772;

export const Problemet: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { colors, fonts, stroke } = theme;
  const people = frame >= T.mennesker;
  // Dataflyten og tannhjulene går hele tiden, også mens bildet ellers står stille i pausene.
  const { live } = useLiveTime();

  // Kortet: ut fra prikken, og tilbake igjen.
  const grow = ramp(frame, T.kort, 25, Easing.out(Easing.cubic)) * (1 - ramp(frame, T.tilbake, 22, Easing.in(Easing.cubic)));
  const cardX = interpolate(grow, [0, 1], [DOT.x, CARD.cx]);
  const cardY = interpolate(grow, [0, 1], [DOT.y, CARD.cy]);
  const cardScale = interpolate(grow, [0, 1], [0.03, 1]);
  const ring = ramp(frame, T.fokus, 15) * (1 - ramp(frame, T.kort + 10, 10));
  const ringBack = ramp(frame, T.tilbake + 15, 8) * (1 - ramp(frame, T.mennesker, 12));
  const stamp = spring({ frame: frame - T.stempel, fps, config: { damping: 9 } });

  const caption = ramp(frame, T.mennesker + 5, 20) * (1 - ramp(frame, T.konklusjon - 15, 15));
  const conclusion = ramp(frame, T.konklusjon, 20);

  return (
    <AbsoluteFill>
      <svg width="100%" height="100%" viewBox="0 0 1920 1080">
        {/* «Gullet» står igjen */}
        <Database cx={REGISTER.cx} top={REGISTER.top} w={REGISTER.w} h={REGISTER.h} start={-30} level={REGISTER_LEVEL} gold={1} />
        <Sparkles points={GOLD_SPARKLES.slice(0, 3)} start={0} period={90} />
        <text x={REGISTER.cx} y={REGISTER.top + REGISTER.h + 90} textAnchor="middle" fontFamily={fonts.sans} fontSize={32}
          fontWeight={700} fill={colors.ink}>
          Tilslutningsregisteret
        </text>

        <Wipe start={T.ryddOpp} id="wipe-problemet">
          <Header title="Problemet" subtitle="Alle disse dataene handler om ekte mennesker" start={-20} />

          {/* Produksjonsbildet, slik vi kjenner det */}
          <Box x={ENGINE.x} y={ENGINE.y} w={ENGINE.w} h={ENGINE.h} start={T.boks} tag="[GREMLIN · PRODUKSJON]">
            <text x={ENGINE.x + ENGINE.w / 2} y={ENGINE.y + 52} textAnchor="middle" fontFamily={fonts.sans} fontSize={30}
              fontWeight={700} fill={colors.ink}>
              Gremlin
            </text>
            <Gear cx={910} cy={480} r={72} teeth={12} angle={live * 2} />
            <Gear cx={1005} cy={438} r={44} teeth={7} angle={-live * 2 * (12 / 7) + 12} color={colors.gridMinor} />
          </Box>
          {SOURCES.map((s, i) => (
            <g key={s.name}>
              <Box x={SRC.x} y={s.cy - SRC.h / 2} w={SRC.w} h={SRC.h} start={T.kilder + i * 8} tag="[EKSTERN]">
                <text x={SRC.x + SRC.w / 2} y={s.cy + 10} textAnchor="middle" fontFamily={fonts.sans} fontSize={30} fontWeight={700}
                  fill={colors.ink}>
                  {s.name}
                </text>
              </Box>
              <Connector {...req(s.cy)} start={T.linjer + i * 6} />
              <Connector {...res(s.cy)} start={T.linjer + 3 + i * 6} />
              <Stream {...req(s.cy)} start={T.flyt + i * 8} duration={FLOW_END - T.flyt} count={Math.round((FLOW_END - T.flyt) / 12)}
                color={colors.highlight} live />
              {/* Svarene: prikker, til vi forstår at hver prikk er et menneske */}
              <Stream {...res(s.cy)} start={T.flyt + 15 + i * 8} duration={FLOW_END - T.flyt} count={Math.round((FLOW_END - T.flyt) / 6)}
                color={people ? colors.person : colors.accent} shape={people ? "person" : "dot"} live />
            </g>
          ))}
          <Connector {...REG_LINE} start={T.linjer} />
          <Stream {...REG_LINE} start={T.flyt} duration={FLOW_END - T.flyt} count={Math.round((FLOW_END - T.flyt) / 12)} color={colors.highlight} live />

          {/* Forstørrelsesglass på én pakke */}
          {ring + ringBack > 0 ? (
            <g opacity={Math.max(ring, ringBack)}>
              <rect x={DOT.x - 7} y={DOT.y - 7} width={14} height={14} rx={2} fill={colors.accent} />
              <circle cx={DOT.x} cy={DOT.y} r={30} fill="none" stroke={colors.ink} strokeWidth={stroke.normal} />
              <line x1={DOT.x + 21} y1={DOT.y + 21} x2={DOT.x + 44} y2={DOT.y + 44} stroke={colors.ink} strokeWidth={6} strokeLinecap="round" />
            </g>
          ) : null}

          {/* Personkortet */}
          {grow > 0.01 ? (
            <g transform={`translate(${cardX} ${cardY}) scale(${cardScale}) translate(${-CARD.w / 2} ${-CARD.h / 2})`}>
              <rect x={10} y={10} width={CARD.w} height={CARD.h} rx={8} fill={colors.gridMajor} />
              <rect width={CARD.w} height={CARD.h} rx={8} fill="white" stroke={colors.ink} strokeWidth={stroke.normal} />
              <text x={30} y={42} fontFamily={fonts.mono} fontSize={18} fill={colors.inkSoft}>
                ÉN DATAPAKKE FRA NAV
              </text>
              <text x={30} y={95} fontFamily={fonts.sans} fontSize={42} fontWeight={800} fill={colors.ink}>
                Ola Nordmann, 57 år
              </text>
              {CARD_ROWS.map((row, i) => {
                const typed = ramp(frame, T.kort + 25 + i * 12, 14, (t) => t);
                return (
                  <g key={row.label}>
                    <text x={30} y={150 + i * 36} fontFamily={fonts.mono} fontSize={20} fill={colors.inkSoft} opacity={typed > 0 ? 1 : 0}>
                      {row.label}
                    </text>
                    <text x={250} y={150 + i * 36} fontFamily={fonts.mono} fontSize={22} fontWeight={600} fill={colors.ink}>
                      {typewriter(row.value, typed)}
                    </text>
                  </g>
                );
              })}
              {frame >= T.stempel ? (
                <g transform={`translate(330 318) rotate(-4) scale(${0.4 + 0.6 * stamp})`} opacity={Math.min(1, stamp * 1.5)}>
                  <rect x={-205} y={-30} width={410} height={58} rx={6} fill="white" fillOpacity={0.85} stroke={colors.person}
                    strokeWidth={5} />
                  <text textAnchor="middle" y={12} fontFamily={fonts.mono} fontSize={32} fontWeight={600} fill={colors.person}>
                    PERSONOPPLYSNINGER
                  </text>
                </g>
              ) : null}
            </g>
          ) : null}

          {/* Hver prikk er et menneske */}
          <g opacity={caption}>
            <text x={120} y={300} fontFamily={fonts.sans} fontSize={48} fontWeight={800} fill={colors.ink}>
              Hver prikk er
            </text>
            <text x={120} y={358} fontFamily={fonts.sans} fontSize={48} fontWeight={800} fill={colors.person}>
              et ekte menneske.
            </text>
            <text x={122} y={405} fontFamily={fonts.mono} fontSize={22} fill={colors.inkSoft}>
              Over 1 million av dem. Hvert kvartal.
            </text>
          </g>

          {/* Miljøene som ikke får bruke dataene */}
          {ENVS.map((name, i) => (
            <Box key={name} x={ENV_X[i] - ENV.w / 2} y={ENV.y} w={ENV.w} h={ENV.h} start={T.miljoer + i * 8} tag={i === 0 ? "[FORMÅL]" : undefined}>
              <text x={ENV_X[i]} y={ENV.y + 38} textAnchor="middle" fontFamily={fonts.sans} fontSize={26} fontWeight={700} fill={colors.ink}>
                {name}
              </text>
              <text x={ENV_X[i]} y={ENV.y + 64} textAnchor="middle" fontFamily={fonts.mono} fontSize={16} fill={colors.inkSoft}
                opacity={ramp(frame, T.kryss + 10, 12)}>
                ingen data
              </text>
            </Box>
          ))}
          {ENV_X.map((x) => (
            <Path key={x} d={`M 960 ${ENGINE.y + ENGINE.h} V 740 H ${x} V ${BARRIER_Y - 8}`} start={T.piler} duration={20}
              color={colors.highlight} width={3} />
          ))}
          <g opacity={ramp(frame, T.sperre, 12)}>
            <line x1={590} x2={1330} y1={BARRIER_Y} y2={BARRIER_Y} stroke={colors.highlight} strokeWidth={7} strokeDasharray="22 12" />
            {/* Hengelås */}
            <g transform={`translate(1360 ${BARRIER_Y})`}>
              <path d="M -10 -6 V -14 A 10 10 0 0 1 10 -14 V -6" fill="none" stroke={colors.highlight} strokeWidth={4} />
              <rect x={-15} y={-7} width={30} height={24} rx={4} fill={colors.highlight} />
            </g>
            <text x={1388} y={BARRIER_Y + 8} fontFamily={fonts.mono} fontSize={22} fontWeight={600} fill={colors.highlight}>
              PERSONVERN
            </text>
          </g>
          {ENV_X.map((x, i) => {
            const k = spring({ frame: frame - T.kryss - i * 5, fps, config: { damping: 10 } });
            return frame >= T.kryss + i * 5 ? (
              <g key={x} transform={`translate(${x} ${BARRIER_Y}) scale(${k})`}>
                <circle r={18} fill="white" stroke={colors.highlight} strokeWidth={4} />
                <path d="M -8 -8 L 8 8 M 8 -8 L -8 8" stroke={colors.highlight} strokeWidth={4} strokeLinecap="round" />
              </g>
            ) : null;
          })}
          <Annotation target={{ x: 1330, y: BARRIER_Y + 4 }} at={{ x: 1420, y: 880 }} start={T.notat} text="Ikke engang «bare litt»." />

          {/* Broen videre */}
          <g opacity={conclusion} transform={`translate(${(1 - conclusion) * 20} 0)`}>
            <text x={120} y={290} fontFamily={fonts.sans} fontSize={42} fontWeight={800} fill={colors.ink}>
              Vi trenger data som
            </text>
            <text x={120} y={342} fontFamily={fonts.sans} fontSize={42} fontWeight={800} fill={colors.ink}>
              oppfører seg som ekte —
            </text>
            <text x={120} y={394} fontFamily={fonts.sans} fontSize={42} fontWeight={800} fill={colors.accent}>
              uten å være ekte.
            </text>
          </g>
        </Wipe>
      </svg>
    </AbsoluteFill>
  );
};
