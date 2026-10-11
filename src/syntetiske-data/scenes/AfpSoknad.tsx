import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Annotation } from "../../components/Annotation";
import { Box } from "../../components/Box";
import { Connector } from "../../components/Connector";
import { Database } from "../../components/Database";
import { Gear } from "../../components/Gear";
import { Header } from "../../components/Header";
import type { Hold } from "../../components/Holds";
import { Packet } from "../../components/Packet";
import { Sparkles } from "../../components/Sparkles";
import { Step } from "../../components/Step";
import { Wipe } from "../../components/Wipe";
import { ramp } from "../../style/anim";
import { theme } from "../../style/theme";
import { ENGINE, GOLD_SPARKLES, REGISTER_LEVEL, REGISTER, REGISTER_RIGHT, req, res, SOURCE_Y, SRC } from "../layout";

export const AFP_FRAMES = 902;

// Tidslinje for scenen (lokale frames). Rekkefølgen følger den faktiske søknadsbehandlingen.
const T = {
  boks: 10,
  kilder: 30,
  linjer: 55,
  nyeSoknader: 110, // 1 Nav: nye søknader?
  kort: 165,
  person: 205, // 2 Folkeregisteret: oppdaterte personopplysninger
  offentligAfp: 270, // 3 Nav: offentlig AFP?
  arbeid: 335, // 4 Nav: arbeidsforhold
  fase1: 400, // 5 Fase 1: offentlig AFP? medlemsbedrift? (spør registeret)
  inntekt: 510, // 6 Skatteetaten: inntekter
  enPerson: 515,
  historikk: 575, // 7 Nav: arbeidsforhold for hele ansienniteten + ytelser
  fase2: 640, // 8 Fase 2: vilkårsprøving
  stempel: 735,
  vedtak: 770, // 9 vedtak til Nav
  notatNav: 815,
  ryddOpp: 875, // etter sluttpausen: arket viskes ut, bare «gullet» blir stående
};

// Pauser: når søkeren er presentert, før vedtaket sendes, og på sluttbildet.
export const AFP_HOLDS: Hold[] = [
  { at: 105, frames: 8 * 30 }, // kildene er tegnet opp, før søknaden hentes fra Nav
  { at: 200, frames: 5 * 30 },
  { at: 508, frames: 4 * 30 }, // fase 1 er krysset av («→ videre til fase 2»), før inntektene hentes
  { at: 765, frames: 3 * 30 }, // «INNVILGET», før vedtaket sendes til Nav
  { at: 870, frames: 75 }, // sluttbildet, før arket viskes ut
];

const SOURCES = [
  { name: "Nav", cy: SOURCE_Y.nav, start: T.kilder },
  { name: "Skatteetaten", cy: SOURCE_Y.skatteetaten, start: T.kilder + 10 },
  { name: "Folkeregisteret", cy: SOURCE_Y.folkeregisteret, start: T.kilder + 20 },
];

// Gremlin spør sitt eget register (øverst), svaret kommer tilbake (nederst).
const ASK_REGISTER = { from: { x: ENGINE.x, y: 560 }, to: { x: REGISTER_RIGHT, y: 560 } };
const REGISTER_ANSWER = { from: { x: REGISTER_RIGHT, y: 600 }, to: { x: ENGINE.x, y: 600 } };

// Sjekklistene i Gremlin-boksen. `at` er når punktet hakes av.
const FASE1 = [
  { label: "Ikke offentlig AFP", at: T.fase1 + 15 },
  { label: "Ansatt i medlemsbedrift", at: T.fase1 + 80 },
];
const FASE2 = [
  { label: "Ansiennitet", at: T.fase2 + 20 },
  { label: "Inntekt", at: T.fase2 + 45 },
  { label: "Ytelser", at: T.fase2 + 70 },
];

const gearAngle = (frame: number) => {
  let angle = 0;
  for (let f = T.boks; f <= frame; f++) {
    const busy = (start: number, end: number) =>
      interpolate(f, [start, start + 10, end - 10, end], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    angle += 0.8 + busy(T.fase1, T.fase1 + 95) * 10 + busy(T.fase2, T.stempel) * 12;
  }
  return angle;
};

export const AfpSoknad: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { colors, fonts, stroke } = theme;
  const nav = SOURCE_Y.nav;
  const angle = gearAngle(frame);
  const stamp = spring({ frame: frame - T.stempel, fps, config: { damping: 9 } });

  const checklist = (title: string, note: string, items: { label: string; at: number }[], y0: number, start: number) => (
    <g opacity={ramp(frame, start, 12)}>
      <text x={792} y={y0} fontFamily={fonts.mono} fontSize={18} fontWeight={600} fill={colors.ink}>
        {title}
        <tspan fontWeight={400} fill={colors.inkSoft}>
          {note}
        </tspan>
      </text>
      {items.map((item, i) => {
        const y = y0 + 36 + i * 32;
        const ticked = frame >= item.at;
        return (
          <g key={item.label}>
            <rect x={800} y={y - 17} width={20} height={20} rx={3} fill="white" stroke={colors.ink} strokeWidth={2} />
            {ticked ? (
              <path d={`M 803 ${y - 7} L 809 ${y} L 822 ${y - 16}`} fill="none" stroke={colors.success} strokeWidth={4}
                strokeLinecap="round" strokeLinejoin="round" />
            ) : null}
            <text x={834} y={y} fontFamily={fonts.mono} fontSize={20} fill={ticked ? colors.ink : colors.inkSoft}>
              {item.label}
            </text>
          </g>
        );
      })}
    </g>
  );

  // Søkerkortet fylles ut etter hvert som opplysningene kommer inn.
  const cardRow = (y: number, text: string, at: number, color: string = colors.ink) => (
    <text x={145} y={y} fontFamily={fonts.mono} fontSize={19} fill={color} opacity={ramp(frame, at, 12)}>
      {text}
    </text>
  );

  return (
    <AbsoluteFill>
      <svg width="100%" height="100%" viewBox="0 0 1920 1080">
        <Wipe start={T.ryddOpp} id="wipe-afp-top">
        <Header title="Søknadsbehandling" subtitle="Én person søker avtalefestet pensjon" start={-20} />

        {/* Søkeren */}
        <Box x={120} y={240} w={540} h={170} start={T.kort} tag="[SØKER]">
          <text x={145} y={290} fontFamily={fonts.sans} fontSize={32} fontWeight={700} fill={colors.ink}>
            Kari Nordmann, 62 år
          </text>
        </Box>
        {cardRow(326, "Eksempelveien 1, Bergen", T.person + 50)}
        {cardRow(356, "Offentlig AFP: nei", T.offentligAfp + 50)}
        {cardRow(386, "Eksempelbedriften AS · Bergen", T.arbeid + 50)}

        </Wipe>

        {/* Registeret */}
        <Database cx={REGISTER.cx} top={REGISTER.top} w={REGISTER.w} h={REGISTER.h} start={-30} level={REGISTER_LEVEL} gold={1} />
        <Sparkles points={GOLD_SPARKLES.slice(0, 3)} start={0} period={90} />
        <text x={REGISTER.cx} y={REGISTER.top + REGISTER.h + 90} textAnchor="middle" fontFamily={fonts.sans} fontSize={32}
          fontWeight={700} fill={colors.ink}>
          Tilslutningsregisteret
        </text>
        <Wipe start={T.ryddOpp} id="wipe-afp">
        <text x={REGISTER.cx} y={REGISTER.top + REGISTER.h + 130} textAnchor="middle" fontFamily={fonts.mono} fontSize={20}
          fontWeight={600} fill={colors.success} opacity={ramp(frame, T.fase1 + 65, 15)}>
          Bergen → FG Vest → medlem ✓
        </text>

        {/* Gremlin: søknadsbehandlingen i to faser */}
        <Box x={ENGINE.x} y={ENGINE.y} w={ENGINE.w} h={ENGINE.h} start={T.boks} tag="[GREMLIN]">
          <text x={ENGINE.x + ENGINE.w / 2} y={ENGINE.y + 50} textAnchor="middle" fontFamily={fonts.sans} fontSize={29}
            fontWeight={700} fill={colors.ink}>
            AFP-søknadsbehandling
          </text>
          <Gear cx={1093} cy={497} r={28} teeth={10} angle={angle} />
          <Gear cx={1126} cy={469} r={17} teeth={6} angle={-angle * (10 / 6) + 15} color={colors.gridMinor} />
          {checklist("FASE 1", "  (ellers avslag)", FASE1, 380, T.fase1)}
          <text x={800} y={485} fontFamily={fonts.mono} fontSize={18} fontWeight={600} fill={colors.success}
            opacity={ramp(frame, T.fase1 + 95, 12)}>
            → videre til fase 2
          </text>
          {checklist("FASE 2", "  vilkårsprøving", FASE2, 530, T.fase2)}
          {frame >= T.stempel ? (
            <g transform={`translate(1040 638) rotate(-6) scale(${0.4 + 0.6 * stamp})`} opacity={Math.min(1, stamp * 1.5)}>
              <rect x={-100} y={-28} width={200} height={54} rx={6} fill={colors.paper} fillOpacity={0.85} stroke={colors.success}
                strokeWidth={4} />
              <text textAnchor="middle" y={11} fontFamily={fonts.mono} fontSize={30} fontWeight={600} fill={colors.success}>
                INNVILGET
              </text>
            </g>
          ) : null}
        </Box>

        {/* Eksterne kilder */}
        {SOURCES.map((s, i) => (
          <g key={s.name}>
            <Box x={SRC.x} y={s.cy - SRC.h / 2} w={SRC.w} h={SRC.h} start={s.start} tag="[EKSTERN]">
              <text x={SRC.x + SRC.w / 2} y={s.cy + 10} textAnchor="middle" fontFamily={fonts.sans} fontSize={30} fontWeight={700}
                fill={colors.ink}>
                {s.name}
              </text>
            </Box>
            <Connector {...req(s.cy)} start={T.linjer + 6 + i * 6} />
            <Connector {...res(s.cy)} start={T.linjer + 9 + i * 6} />
          </g>
        ))}
        <Connector {...ASK_REGISTER} start={T.linjer} />
        <Connector {...REGISTER_ANSWER} start={T.linjer + 4} />

        {/* Én søknad: enkeltpakker, ikke strømmer */}
        <Packet {...req(nav)} start={T.nyeSoknader} duration={25} label="nye søknader?" />
        <Packet {...res(nav)} start={T.nyeSoknader + 28} duration={30} label="AFP-søknad" color={colors.accent} />
        <Packet {...req(SOURCE_Y.folkeregisteret)} start={T.person} duration={25} label="person?" />
        <Packet {...res(SOURCE_Y.folkeregisteret)} start={T.person + 28} duration={25} label="navn, adresse" color={colors.accent} />
        <Packet {...req(nav)} start={T.offentligAfp} duration={25} label="offentlig AFP?" />
        <Packet {...res(nav)} start={T.offentligAfp + 28} duration={25} label="nei" color={colors.accent} />
        <Packet {...req(nav)} start={T.arbeid} duration={25} label="arbeidsforhold?" />
        <Packet {...res(nav)} start={T.arbeid + 28} duration={25} label="arbeidsforhold" color={colors.accent} />
        <Packet {...ASK_REGISTER} start={T.fase1 + 20} duration={25} label="medlem?" />
        <Packet {...REGISTER_ANSWER} start={T.fase1 + 48} duration={25} label="✓ ja" color={colors.success} />
        <Packet {...req(SOURCE_Y.skatteetaten)} start={T.inntekt} duration={25} label="inntekter?" />
        <Packet {...res(SOURCE_Y.skatteetaten)} start={T.inntekt + 28} duration={25} label="inntekter" color={colors.accent} />
        <Packet {...req(nav)} start={T.historikk} duration={25} label="historikk?" />
        <Packet {...res(nav)} start={T.historikk + 28} duration={30} label="historikk + ytelser" color={colors.accent} />
        <Packet {...req(nav)} start={T.vedtak} duration={40} label="VEDTAK" color={colors.success} />

        <g opacity={ramp(frame, T.enPerson, 20)}>
          <text x={1190} y={800} fontFamily={fonts.sans} fontSize={34} fontWeight={800} fill={colors.ink}>
            Én person.
          </text>
          <text x={1190} y={840} fontFamily={fonts.mono} fontSize={22} fill={colors.inkSoft}>
            Samme kilder som for en million.
          </text>
        </g>

        <Annotation target={{ x: 1470, y: SOURCE_Y.nav - 50 }} at={{ x: 880, y: 222 }} start={T.notatNav}
          text="Nav har siste ord. Som vanlig." />

        {/* Stegene, til å snakke ut fra */}
        <line x1={120} x2={760} y1={845} y2={845} stroke={colors.gridMajor} strokeWidth={stroke.thin} opacity={ramp(frame, T.nyeSoknader, 15)} />
        <Step n={1} x={135} y={875} label="nye søknader" start={T.nyeSoknader} activeUntil={T.person} />
        <Step n={2} x={135} y={907} label="personopplysninger" start={T.person} activeUntil={T.offentligAfp} />
        <Step n={3} x={135} y={939} label="offentlig AFP?" start={T.offentligAfp} activeUntil={T.arbeid} />
        <Step n={4} x={135} y={971} label="arbeidsforhold" start={T.arbeid} activeUntil={T.fase1} />
        <Step n={5} x={135} y={1003} label="fase 1" start={T.fase1} activeUntil={T.inntekt} />
        <Step n={6} x={460} y={875} label="inntekter" start={T.inntekt} activeUntil={T.historikk} />
        <Step n={7} x={460} y={907} label="ansiennitet + ytelser" start={T.historikk} activeUntil={T.fase2} />
        <Step n={8} x={460} y={939} label="fase 2: vilkårsprøving" start={T.fase2} activeUntil={T.vedtak} />
        <Step n={9} x={460} y={971} label="vedtak til Nav" start={T.vedtak} />
        </Wipe>
      </svg>
    </AbsoluteFill>
  );
};
