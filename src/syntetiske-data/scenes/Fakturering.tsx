import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Annotation } from "../../components/Annotation";
import { Box } from "../../components/Box";
import { Connector } from "../../components/Connector";
import { Database } from "../../components/Database";
import { Document } from "../../components/Document";
import { Gear } from "../../components/Gear";
import { Header } from "../../components/Header";
import type { Hold } from "../../components/Holds";
import { Packet } from "../../components/Packet";
import { Sparkles } from "../../components/Sparkles";
import { Step } from "../../components/Step";
import { Stream } from "../../components/Stream";
import { Wipe } from "../../components/Wipe";
import { ramp, typewriter } from "../../style/anim";
import { theme } from "../../style/theme";
import { ENGINE, GOLD_SPARKLES, REGISTER_LEVEL, formatNumber, REGISTER, REGISTER_RIGHT, req, res, SOURCE_Y, SRC } from "../layout";

export const FAKTURERING_FRAMES = 842;

// Tidslinje for scenen (lokale frames).
const T = {
  boks: 10,
  kilder: 30,
  linjer: 55,
  // Flyten: stegene introduseres etter tur, deretter går alt samtidig til flytSlutt (~15 s).
  steg1: 110,
  steg2: 150,
  steg3: 200,
  notatVolum: 230,
  steg4: 260,
  steg5: 300,
  steg6: 330,
  flytSlutt: 710, // ~20 s flyt, så publikum rekker å ta inn prosessen
  notatBetaling: 735,
  ryddOpp: 815, // etter sluttpausen: arket viskes ut, bare «gullet» blir stående
};

// Nedtrapping i samme rekkefølge som oppstarten: registeret slutter å pumpe først,
// så stopper arbeidsforholdene, og til slutt Skatteetaten og Folkeregisteret.
const STOPP = {
  register: T.flytSlutt - 120,
  nav: T.flytSlutt - 65,
  skatteetaten: T.flytSlutt - 10,
  folkeregisteret: T.flytSlutt,
};

// Fakturabunken: antall dokumenter når flyten er ferdig.
const PILE = 14;

// Pauser: når alle aktørene er tegnet, og på sluttbildet.
export const FAKTURERING_HOLDS: Hold[] = [
  { at: 105, frames: 8 * 30 }, // elementene er tegnet opp, før flyten starter
  { at: 800, frames: 8 * 30 }, // sluttbildet
];

const SOURCES = [
  { name: "Nav", cy: SOURCE_Y.nav, start: T.kilder },
  { name: "Skatteetaten", cy: SOURCE_Y.skatteetaten, start: T.kilder + 10 },
  { name: "Folkeregisteret", cy: SOURCE_Y.folkeregisteret, start: T.kilder + 20 },
];

const REG_LINE = { from: { x: REGISTER_RIGHT, y: 575 }, to: { x: ENGINE.x, y: 575 } };

// Tannhjulenes vinkel: summen av hastigheten per frame, raskere når det jobbes.
const gearAngle = (frame: number) => {
  let angle = 0;
  for (let f = T.boks; f <= frame; f++) {
    const busy = interpolate(f, [T.steg2, T.steg2 + 20, T.flytSlutt - 20, T.flytSlutt + 10], [0, 0.4, 0.4, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const calc = interpolate(f, [T.steg4, T.steg4 + 15, T.flytSlutt - 20, T.flytSlutt + 10], [0, 0.8, 0.8, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    angle += 0.8 + busy * 5 + calc * 12;
  }
  return angle;
};

export const Fakturering: React.FC = () => {
  const frame = useCurrentFrame();
  const { colors, fonts, stroke } = theme;
  const angle = gearAngle(frame);

  // Tellerne går i samme tempo og stopper når strømmen deres stopper.
  const count = (start: number, end: number, to: number) =>
    interpolate(frame, [start, end], [0, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) });
  const virksomheter = count(T.steg1 + 40, STOPP.register, 17000);
  const persons = count(T.steg2 + 20, STOPP.nav, 1000000);
  const calc = ramp(frame, T.steg4 + 10, 40, (t) => t);
  // Bunken vokser jevnt mens flyten går.
  const docs = Math.floor(interpolate(frame, [T.steg6, T.flytSlutt], [1, PILE + 0.99], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const volumeNote = 1 - ramp(frame, T.flytSlutt - 30, 15);

  const counterRow = (y: number, label: string, value: string, start: number) => (
    <g opacity={ramp(frame, start, 15)}>
      <text x={120} y={y} fontFamily={fonts.mono} fontSize={20} fill={colors.inkSoft}>
        {label}
      </text>
      <text x={400} y={y + 2} fontFamily={fonts.sans} fontSize={34} fontWeight={800} fill={colors.ink}>
        {value}
      </text>
    </g>
  );

  return (
    <AbsoluteFill>
      <svg width="100%" height="100%" viewBox="0 0 1920 1080">
        

        {/* Registeret står igjen fra forrige scene */}
        <Database cx={REGISTER.cx} top={REGISTER.top} w={REGISTER.w} h={REGISTER.h} start={-30} level={REGISTER_LEVEL} gold={1} />
        <Sparkles points={GOLD_SPARKLES.slice(0, 3)} start={0} period={90} />
        <text x={REGISTER.cx} y={REGISTER.top + REGISTER.h + 90} textAnchor="middle" fontFamily={fonts.sans} fontSize={32}
          fontWeight={700} fill={colors.ink}>
          Tilslutningsregisteret
        </text>

        <Wipe start={T.ryddOpp} id="wipe-fakturering">
        <Header title="Fakturering" subtitle="Hvert kvartal: fra register til faktura" start={-20} />

        {/* Gremlin: selve faktureringen */}
        <Box x={ENGINE.x} y={ENGINE.y} w={ENGINE.w} h={ENGINE.h} start={T.boks} tag="[GREMLIN]">
          <text x={ENGINE.x + ENGINE.w / 2} y={ENGINE.y + 52} textAnchor="middle" fontFamily={fonts.sans} fontSize={30}
            fontWeight={700} fill={colors.ink}>
            Kvartalsfakturering
          </text>
          <Gear cx={910} cy={470} r={72} teeth={12} angle={angle} />
          <Gear cx={1005} cy={428} r={44} teeth={7} angle={-angle * (12 / 7) + 12} color={colors.gridMinor} />
          <text x={792} y={640} fontFamily={fonts.mono} fontSize={20} fill={colors.ink}>
            {typewriter("premie per virksomhet", calc)}
          </text>
          <text x={792} y={670} fontFamily={fonts.mono} fontSize={20} fill={colors.ink}>
            {typewriter("→ sum per fakturagruppe", ramp(frame, T.steg4 + 35, 30, (t) => t))}
          </text>
        </Box>

        {/* Eksterne kilder */}
        {SOURCES.map((s) => (
          <Box key={s.name} x={SRC.x} y={s.cy - SRC.h / 2} w={SRC.w} h={SRC.h} start={s.start} tag="[EKSTERN]">
            <text x={SRC.x + SRC.w / 2} y={s.cy + 10} textAnchor="middle" fontFamily={fonts.sans} fontSize={30} fontWeight={700}
              fill={colors.ink}>
              {s.name}
            </text>
          </Box>
        ))}

        {/* Linjer */}
        <Connector {...REG_LINE} start={T.linjer} />
        {SOURCES.map((s, i) => (
          <g key={s.name}>
            <Connector {...req(s.cy)} start={T.linjer + 6 + i * 6} />
            <Connector {...res(s.cy)} start={T.linjer + 9 + i * 6} />
          </g>
        ))}
        <Connector from={{ x: 960, y: ENGINE.y + ENGINE.h }} to={{ x: 960, y: 768 }} start={T.steg6} duration={12} />

        {/* Steg */}
        <Step n={1} x={540} y={548} label="virksomheter" start={T.steg1} activeUntil={T.steg2} />
        <Step n={2} x={1185} y={282} label="arbeidsforhold" start={T.steg2} activeUntil={T.steg4} />
        <Step n={3} x={1185} y={447} label="inntekter" start={T.steg3} activeUntil={T.steg4} />
        <Step n={4} x={807} y={603} label="beregn premie" start={T.steg4} activeUntil={T.steg5} />
        <Step n={5} x={1185} y={612} label="navn til vedlegg" start={T.steg5} activeUntil={T.steg6} />
        <Step n={6} x={590} y={742} label="faktura + vedlegg" start={T.steg6} />

        {/* Data på vei */}
        <Packet {...REG_LINE} start={T.steg1 + 5} duration={35} label="17 000 virksomheter" />
        <Stream {...REG_LINE} start={T.steg1 + 40} duration={STOPP.register - T.steg1 - 40} count={32} color={colors.highlight} />
        {SOURCES.map((src, i) => {
          const begin = [T.steg2, T.steg3, T.steg5][i];
          const length = [STOPP.nav, STOPP.skatteetaten, STOPP.folkeregisteret][i] - begin;
          return (
            <g key={src.name}>
              <Packet {...req(src.cy)} start={begin} duration={22} label="?" />
              <Stream {...req(src.cy)} start={begin + 22} duration={length - 40} count={Math.round(length / 10)} color={colors.highlight} />
              <Stream {...res(src.cy)} start={begin + 20} duration={length - 10} count={Math.round(length / 5)} />
            </g>
          );
        })}

        {/* Resultat: én faktura per fakturagruppe, med vedlegg */}
        {Array.from({ length: frame >= T.steg6 ? docs : 0 }, (_, i) => {
          // Nyeste dokument ligger øverst og glir på plass.
          const land = i === docs - 1 ? ramp(frame, T.steg6 + ((docs - 1) * (T.flytSlutt - T.steg6)) / PILE, 8) : 1;
          return (
            <g key={i} transform={`translate(${i * 3} ${-i * 4 - (1 - land) * 30})`} opacity={land}>
              <Document x={830} y={782} title="VEDLEGG" lines={5} accent={colors.inkSoft} muted={i < docs - 2} />
              <Document x={980} y={782} title="FAKTURA" muted={i < docs - 2} />
            </g>
          );
        })}

        {/* Påskrifter */}
        <g opacity={volumeNote}>
          <Annotation target={{ x: 618, y: 922 }} at={{ x: 690, y: 1000 }} start={T.notatVolum}
            text="Over 1 million personer. Alle må med." color={colors.accent} />
        </g>
        <Annotation target={{ x: 1090 + (PILE - 1) * 3, y: 800 }} at={{ x: 1210, y: 870 }} start={T.notatBetaling} text="Betales (som regel)." />

        {/* Tellere */}
        {counterRow(880, "VIRKSOMHETER", formatNumber(virksomheter), T.steg1 + 40)}
        {counterRow(930, "PERSONER", persons >= 1000000 ? "1 000 000+" : formatNumber(persons), T.steg2 + 20)}
        {counterRow(980, "FAKTURERT PER ÅR", "> 10 mrd kr", T.flytSlutt - 20)}
        <line x1={120} x2={700} y1={845} y2={845} stroke={colors.gridMajor} strokeWidth={stroke.thin} opacity={ramp(frame, T.steg1 + 25, 15)} />
        </Wipe>
      </svg>
    </AbsoluteFill>
  );
};
