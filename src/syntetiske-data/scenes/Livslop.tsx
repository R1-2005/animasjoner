import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Annotation } from "../../components/Annotation";
import { Box } from "../../components/Box";
import { Connector } from "../../components/Connector";
import { Database } from "../../components/Database";
import { Document } from "../../components/Document";
import { Gear } from "../../components/Gear";
import { Header } from "../../components/Header";
import { type Hold, useLiveTime } from "../../components/Holds";
import { Sparkles } from "../../components/Sparkles";
import { Stream } from "../../components/Stream";
import { Wipe } from "../../components/Wipe";
import { ramp } from "../../style/anim";
import { theme } from "../../style/theme";
import { ENGINE, GOLD_SPARKLES, REGISTER, REGISTER_LEVEL, REGISTER_RIGHT, formatNumber, req, res, SOURCE_Y, SRC } from "../layout";

export const LIVSLOP_FRAMES = 730;

// Tidslinje for scenen (lokale frames).
const T = {
  boks: 10,
  kilder: 30,
  linjer: 60,
  kilderTekst: 70, // «Tre kilder. Alle etterlignet.»
  arkiv: 130, // Gremlins eget arkiv tegnes, tomt
  dag1: 145, // «Dag 1: Helt tomt.»
  sim: 210, // livsløpssimuleringen kobles på
  tidsrom: 250, // tidsforløpet starter: dagene går, livene leves, arkivet fylles
  vokser: 620, // «Dataene vokser mens vi jobber.»
  notat: 645,
  ryddOpp: 700,
};

// Pauser: på de tre kildene, på det tomme arkivet, og på sluttbildet (tidsforløpet fortsetter).
export const LIVSLOP_HOLDS: Hold[] = [
  { at: 120, frames: 5 * 30 },
  { at: 200, frames: 4 * 30 },
  { at: 680, frames: 10 * 30 },
];

const SOURCES = [
  { name: "Nav", cy: SOURCE_Y.nav },
  { name: "Skatteetaten", cy: SOURCE_Y.skatteetaten },
  { name: "Folkeregisteret", cy: SOURCE_Y.folkeregisteret },
];
const REG_LINE = { from: { x: REGISTER_RIGHT, y: 575 }, to: { x: ENGINE.x, y: 575 } };
const CONTAINER = { x: 1410, y: 225, w: 430, h: 500 };
const SIM = { x: 1440, y: 790, w: 360, h: 110 };
const ARKIV = { x: 580, y: 750, w: 780, h: 258 };

// Hendelsene livsløpssimuleringen lager, per kilde. Spilles av etter tur.
const EVENTS = [
  ["Ny i arbeidslivet", "Søker AFP", "Bytter jobb", "Sykepenger", "Søker AFP"],
  ["Lønnsøkning", "Feriepenger", "Ny inntekt"],
  ["Flytting", "Navneendring", "† Død", "Kjønnsskifte", "Nytt fødselsnummer"],
];
const EVENT_EVERY = 20; // frames mellom hver hendelse (rundt kildene)
const EVENT_LIFE = 44;

// Arkivbunkene: hvor mange dager det tar før det kommer et nytt ark i bunken.
const PILES = [
  { title: "AFP-SAK", label: "AFP-saker", days: 70, accent: theme.colors.synthetic },
  { title: "FAKTURA", label: "Fakturaer", days: 91, accent: theme.colors.accent },
  { title: "BREV", label: "Brev", days: 55, accent: theme.colors.inkSoft },
];
const PILE_MAX = 10;

// Simulert dag: tiden går sakte først, så stadig fortere. Fortsetter gjennom sluttpausen.
const simDay = (sim: number) => {
  let day = 1;
  for (let s = 0; s < sim; s++) {
    day += 0.2 + 2.3 * Easing.inOut(Easing.quad)(Math.min(1, s / 240));
  }
  return day;
};

export const Livslop: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { live, toWall } = useLiveTime();
  const { colors, fonts } = theme;

  // Tidsforløpet går i levende tid, så det fortsetter mens presentatøren snakker.
  const sim = Math.max(0, live - toWall(T.tidsrom));
  const running = live >= toWall(T.tidsrom);
  const day = simDay(sim);
  const quarter = Math.floor(day / 91);

  const caption1 = ramp(frame, T.kilderTekst, 20) * (1 - ramp(frame, T.dag1 - 15, 15));
  const caption2 = ramp(frame, T.dag1, 20) * (1 - ramp(frame, T.tidsrom - 10, 12));
  const counter = ramp(frame, T.tidsrom, 15);
  const caption4 = ramp(frame, T.vokser, 20);

  const chip = (cx: number, y: number, label: string, k: number, opacity: number) => {
    const w = label.length * 13 + 36;
    return (
      <g key={`${label}-${cx}-${y}`} opacity={opacity} transform={`translate(${cx} ${y}) scale(${k})`}>
        <rect x={-w / 2} y={-19} width={w} height={38} rx={19} fill={colors.synthetic} />
        <text x={0} y={7} textAnchor="middle" fontFamily={fonts.mono} fontSize={21} fontWeight={600} fill="white">
          {label}
        </text>
      </g>
    );
  };

  // Hendelsene som vises nå: én om gangen per kilde, på kildeboksens underkant.
  const events = [];
  if (running) {
    const newest = Math.floor(sim / EVENT_EVERY);
    for (let i = Math.max(0, newest - 3); i <= newest; i++) {
      const age = sim - i * EVENT_EVERY;
      if (age < 0 || age >= EVENT_LIFE) {
        continue;
      }
      const source = i % 3;
      const list = EVENTS[source];
      const label = list[Math.floor(i / 3) % list.length];
      const k = spring({ frame: age, fps, config: { damping: 10 } });
      const fade = 1 - interpolate(age, [EVENT_LIFE - 10, EVENT_LIFE], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      events.push(chip(SRC.x + SRC.w / 2, SOURCES[source].cy + SRC.h / 2 + 22, label, k, fade));
    }
  }

  return (
    <AbsoluteFill>
      <svg width="100%" height="100%" viewBox="0 0 1920 1080">
        {/* «Gullet» står igjen fra forrige scene */}
        <Database cx={REGISTER.cx} top={REGISTER.top} w={REGISTER.w} h={REGISTER.h} start={-30} level={REGISTER_LEVEL} gold={1} />
        <Sparkles points={GOLD_SPARKLES.slice(0, 3)} start={0} period={90} />
        <text x={REGISTER.cx} y={REGISTER.top + REGISTER.h + 90} textAnchor="middle" fontFamily={fonts.sans} fontSize={32}
          fontWeight={700} fill={colors.ink}>
          Tilslutningsregisteret
        </text>

        <Wipe start={T.ryddOpp} id="wipe-livslop">
          <Header title="Et levende testmiljø" subtitle="Fra tom database til syntetisk hverdag" start={-20} />

          <Box x={ENGINE.x} y={ENGINE.y} w={ENGINE.w} h={ENGINE.h} start={T.boks} tag="[GREMLIN · TESTMILJØ]">
            <text x={ENGINE.x + ENGINE.w / 2} y={ENGINE.y + 52} textAnchor="middle" fontFamily={fonts.sans} fontSize={30}
              fontWeight={700} fill={colors.ink}>
              Gremlin
            </text>
            <Gear cx={910} cy={480} r={72} teeth={12} angle={live * (running ? 2 : 0.5)} />
            <Gear cx={1005} cy={438} r={44} teeth={7} angle={-live * (running ? 2 : 0.5) * (12 / 7) + 12} color={colors.gridMinor} />
            <text x={792} y={650} fontFamily={fonts.mono} fontSize={22} fontWeight={600} fill={colors.success} opacity={quarter > 0 ? 1 : 0}>
              {`kvartal ${quarter} fakturert ✓`}
            </text>
          </Box>

          {/* Vår syntetiske database: etterligner de tre store kildene til personopplysninger */}
          <g opacity={ramp(frame, T.kilder, 15)}>
            <rect x={CONTAINER.x} y={CONTAINER.y} width={CONTAINER.w} height={CONTAINER.h} rx={16} fill={colors.paper}
              stroke={colors.synthetic} strokeWidth={3} strokeDasharray="12 7" />
            <text x={CONTAINER.x + 22} y={CONTAINER.y + 30} fontFamily={fonts.mono} fontSize={18} fontWeight={600} fill={colors.synthetic}>
              [SYNTETISK DATABASE]
            </text>
          </g>
          {SOURCES.map((s, i) => (
            <Box key={s.name} x={SRC.x} y={s.cy - SRC.h / 2} w={SRC.w} h={SRC.h} start={T.kilder + 5 + i * 8}>
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

          {/* Linjer og flyt */}
          <Connector {...REG_LINE} start={T.linjer} />
          {SOURCES.map((s, i) => (
            <g key={s.name}>
              <Connector {...req(s.cy)} start={T.linjer + 4 + i * 6} />
              <Connector {...res(s.cy)} start={T.linjer + 7 + i * 6} />
              <Stream {...req(s.cy)} start={T.tidsrom + i * 8} duration={T.ryddOpp - T.tidsrom} count={Math.round((T.ryddOpp - T.tidsrom) / 12)}
                color={colors.highlight} live />
              <Stream {...res(s.cy)} start={T.tidsrom + 12 + i * 8} duration={T.ryddOpp - T.tidsrom} count={Math.round((T.ryddOpp - T.tidsrom) / 6)}
                color={colors.synthetic} shape="person" live />
            </g>
          ))}
          <Stream {...REG_LINE} start={T.tidsrom} duration={T.ryddOpp - T.tidsrom} count={Math.round((T.ryddOpp - T.tidsrom) / 12)}
            color={colors.highlight} live />

          {/* Livsløpssimuleringen: endrer livene i den syntetiske databasen, hver natt */}
          <Box x={SIM.x} y={SIM.y} w={SIM.w} h={SIM.h} start={T.sim} tag="[LIVSLØPSSIMULERING]">
            <Gear cx={SIM.x + 58} cy={SIM.y + SIM.h / 2} r={32} teeth={8} angle={running ? live * 3 : 0} color={colors.synthetic} />
            <text x={SIM.x + 112} y={SIM.y + 50} fontFamily={fonts.sans} fontSize={30} fontWeight={700} fill={colors.ink}>
              Hver natt
            </text>
            <text x={SIM.x + 113} y={SIM.y + 82} fontFamily={fonts.mono} fontSize={18} fill={colors.synthetic}>
              folk lever livene sine
            </text>
          </Box>
          <Connector from={{ x: SIM.x + SIM.w / 2, y: SIM.y - 32 }} to={{ x: SIM.x + SIM.w / 2, y: CONTAINER.y + CONTAINER.h + 4 }}
            start={T.sim + 20} duration={10} />
          {events}

          {/* Gremlins eget arkiv: tomt på dag 1, fylles mens vi utvikler, tester og lærer opp */}
          <g opacity={ramp(frame, T.arkiv, 15)}>
            <rect x={ARKIV.x} y={ARKIV.y} width={ARKIV.w} height={ARKIV.h} rx={16} fill={colors.paper}
              stroke={colors.synthetic} strokeWidth={3} strokeDasharray="12 7" />
            <text x={ARKIV.x + 22} y={ARKIV.y + 32} fontFamily={fonts.mono} fontSize={18} fontWeight={600} fill={colors.synthetic}>
              [ARKIV · SYNTETISK]
            </text>
            {PILES.map((p, j) => {
              const cx = ARKIV.x + 150 + j * 240;
              return (
                <text key={p.label} x={cx} y={ARKIV.y + ARKIV.h - 20} textAnchor="middle" fontFamily={fonts.mono} fontSize={20}
                  fontWeight={600} fill={colors.ink}>
                  {p.label}
                </text>
              );
            })}
          </g>
          <Connector from={{ x: 960, y: ENGINE.y + ENGINE.h }} to={{ x: 960, y: ARKIV.y }} start={T.arkiv + 5} duration={10} />
          {PILES.map((p, j) => {
            const cx = ARKIV.x + 150 + j * 240;
            const exact = running ? (day - 1) / p.days : 0;
            const n = Math.min(PILE_MAX, Math.floor(exact));
            return (
              <g key={p.label}>
                {Array.from({ length: n }, (_, i) => {
                  // Nyeste ark glir på plass.
                  const top = i === n - 1 && n < PILE_MAX ? Math.min(1, (exact - n + 1) * 6) : 1;
                  return (
                    <g key={i} transform={`translate(${i * 3} ${-i * 4 - (1 - top) * 30})`} opacity={top}>
                      <Document x={cx - 55} y={ARKIV.y + 88} h={120} title={p.title} lines={3} accent={p.accent} muted={i < n - 2} />
                    </g>
                  );
                })}
                {n === 0 ? (
                  <text x={cx} y={ARKIV.y + 145} textAnchor="middle" fontFamily={fonts.mono} fontSize={20} fill={colors.inkSoft}
                    opacity={ramp(frame, T.arkiv + 10, 15)}>
                    (tomt)
                  </text>
                ) : null}
              </g>
            );
          })}

          {/* Tekster til venstre */}
          <g opacity={caption1}>
            <text x={120} y={300} fontFamily={fonts.sans} fontSize={46} fontWeight={800} fill={colors.ink}>
              Tre kilder.
            </text>
            <text x={120} y={356} fontFamily={fonts.sans} fontSize={46} fontWeight={800} fill={colors.synthetic}>
              Alle etterlignet.
            </text>
            <text x={122} y={402} fontFamily={fonts.mono} fontSize={20} fill={colors.inkSoft}>
              De store kildene til personopplysninger
            </text>
          </g>
          <g opacity={caption2}>
            <text x={120} y={300} fontFamily={fonts.sans} fontSize={46} fontWeight={800} fill={colors.ink}>
              Dag 1:
            </text>
            <text x={120} y={356} fontFamily={fonts.sans} fontSize={46} fontWeight={800} fill={colors.synthetic}>
              Helt tomt.
            </text>
            <text x={122} y={402} fontFamily={fonts.mono} fontSize={20} fill={colors.inkSoft}>
              Bare «gullet» — uten personopplysninger
            </text>
          </g>
          <g opacity={counter * (1 - caption4)}>
            <text x={122} y={262} fontFamily={fonts.mono} fontSize={20} fill={colors.inkSoft} letterSpacing={2}>
              SIMULERT TID
            </text>
            <text x={120} y={346} fontFamily={fonts.sans} fontSize={80} fontWeight={800} fill={colors.ink}>
              {`DAG ${formatNumber(day)}`}
            </text>
            <text x={122} y={398} fontFamily={fonts.mono} fontSize={20} fill={colors.inkSoft}>
              Folk dør, flytter, bytter jobb og søker AFP
            </text>
          </g>
          <g opacity={caption4}>
            <text x={120} y={300} fontFamily={fonts.sans} fontSize={46} fontWeight={800} fill={colors.ink}>
              Dataene vokser
            </text>
            <text x={120} y={356} fontFamily={fonts.sans} fontSize={46} fontWeight={800} fill={colors.synthetic}>
              mens vi jobber.
            </text>
            <text x={122} y={402} fontFamily={fonts.mono} fontSize={20} fill={colors.inkSoft}>
              {`Utvikling, test og opplæring · dag ${formatNumber(day)}`}
            </text>
          </g>
          <Annotation target={{ x: ARKIV.x + 128, y: ARKIV.y + 100 }} at={{ x: 110, y: 905 }} start={T.notat}
            text="Fiktive folk. Ekte saksbunker." color={colors.synthetic} instant />
        </Wipe>
      </svg>
    </AbsoluteFill>
  );
};
