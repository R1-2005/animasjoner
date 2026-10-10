import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Annotation } from "../../components/Annotation";
import { Box } from "../../components/Box";
import { Connector } from "../../components/Connector";
import { Database } from "../../components/Database";
import { Gear } from "../../components/Gear";
import { Header } from "../../components/Header";
import { type Hold, useLiveTime } from "../../components/Holds";
import { Sparkles } from "../../components/Sparkles";
import { Stream } from "../../components/Stream";
import { Wipe } from "../../components/Wipe";
import { ramp, typewriter } from "../../style/anim";
import { theme } from "../../style/theme";
import { ENGINE, ENGINE_RIGHT, GOLD_SPARKLES, REGISTER, REGISTER_LEVEL, REGISTER_RIGHT, req, res, SOURCE_Y, SRC } from "../layout";

export const BYTTET_FRAMES = 552;

// Tidslinje for scenen (lokale frames).
const T = {
  boks: 10,
  kilder: 25,
  linjer: 45,
  sperret: 70, // linjene til de ekte kildene er sperret
  rens: 110, // personopplysninger løftes ut av «gullet»
  stryk: 160,
  bort: 195,
  bedrifter: 215,
  plopp: 255, // kablene trekkes ut
  inn: 300, // den syntetiske databasen glir inn
  kobleTil: 345,
  flyt: 380,
  nyeData: 400,
  notat: 430,
  lurt: 478, // etter pausen: Gremlin godkjenner dataene som ekte
  ryddOpp: 525,
};

// Pauser: etter rensingen av «gullet», når flyten er i gang igjen, og på sluttbildet.
export const BYTTET_HOLDS: Hold[] = [
  { at: 250, frames: 5 * 30 },
  { at: 470, frames: 5 * 30 },
  { at: 520, frames: 11 * 30 }, // selve essensen: presentatøren trenger tid her
];

const SOURCES = [
  { name: "Nav", cy: SOURCE_Y.nav },
  { name: "Skatteetaten", cy: SOURCE_Y.skatteetaten },
  { name: "Folkeregisteret", cy: SOURCE_Y.folkeregisteret },
];
const REG_LINE = { from: { x: REGISTER_RIGHT, y: 575 }, to: { x: ENGINE.x, y: 575 } };

// Det som fjernes fra det syntetiske registeret: alt som handler om personer.
const REMOVED = ["Kontaktpersoner", "Daglig leder", "Enkeltpersonforetak"];

const CONTAINER = { x: 1410, y: 225, w: 430, h: 500 };

export const Byttet: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { live } = useLiveTime();
  const { colors, fonts } = theme;

  const unplug = ramp(frame, T.plopp, 30, Easing.in(Easing.cubic));
  const slideIn = ramp(frame, T.inn, 35, Easing.out(Easing.cubic));
  const blocked = ramp(frame, T.sperret, 12) * (1 - ramp(frame, T.plopp, 10));
  const caption1 = ramp(frame, T.bedrifter, 20) * (1 - ramp(frame, T.nyeData - 15, 15));
  const caption2 = ramp(frame, T.nyeData, 20);
  const busy = frame >= T.flyt ? 1 : 0;

  return (
    <AbsoluteFill>
      <svg width="100%" height="100%" viewBox="0 0 1920 1080">
        <defs>
          {/* Kablene til de ekte kildene: det som glir ut til høyre for Gremlin-boksen */}
          <clipPath id="byttet-cables">
            <rect x={ENGINE_RIGHT} y={0} width={1920 - ENGINE_RIGHT} height={1080} />
          </clipPath>
        </defs>

        {/* «Gullet» står igjen */}
        <Database cx={REGISTER.cx} top={REGISTER.top} w={REGISTER.w} h={REGISTER.h} start={-30} level={REGISTER_LEVEL} gold={1} />
        <Sparkles points={GOLD_SPARKLES.slice(0, 3)} start={0} period={90} />
        <text x={REGISTER.cx} y={REGISTER.top + REGISTER.h + 90} textAnchor="middle" fontFamily={fonts.sans} fontSize={32}
          fontWeight={700} fill={colors.ink}>
          Tilslutningsregisteret
        </text>

        <Wipe start={T.ryddOpp} id="wipe-byttet">
          <Header title="Erstatningen" subtitle="Samme Gremlin. Nye kilder." start={-20} />

          <Box x={ENGINE.x} y={ENGINE.y} w={ENGINE.w} h={ENGINE.h} start={T.boks} tag="[GREMLIN · TESTMILJØ]">
            <text x={ENGINE.x + ENGINE.w / 2} y={ENGINE.y + 52} textAnchor="middle" fontFamily={fonts.sans} fontSize={30}
              fontWeight={700} fill={colors.ink}>
              Gremlin
            </text>
            <Gear cx={910} cy={480} r={72} teeth={12} angle={live * (0.5 + busy * 1.5)} />
            <Gear cx={1005} cy={438} r={44} teeth={7} angle={-live * (0.5 + busy * 1.5) * (12 / 7) + 12} color={colors.gridMinor} />
            <text x={792} y={650} fontFamily={fonts.mono} fontSize={22} fontWeight={600} fill={colors.success}>
              {typewriter("dataene ser ekte ut ✓", ramp(frame, T.lurt, 25, (t) => t))}
            </text>
          </Box>

          {/* «Gullet» renses: personopplysningene løftes ut og strykes */}
          {REMOVED.map((label, i) => {
            const rise = ramp(frame, T.rens + i * 10, 28, Easing.out(Easing.cubic));
            const gone = ramp(frame, T.bort + i * 5, 18);
            const strike = ramp(frame, T.stryk + i * 8, 10);
            const x = interpolate(rise, [0, 1], [REGISTER.cx - 60, 130]);
            const y = interpolate(rise, [0, 1], [REGISTER.top + 60, 285 + i * 48]) - gone * 30;
            const w = label.length * 13 + 36;
            return rise > 0 ? (
              <g key={label} opacity={Math.min(1, rise * 2) * (1 - gone)}>
                <rect x={x} y={y - 26} width={w} height={38} rx={19} fill={colors.person} />
                <text x={x + 18} y={y} fontFamily={fonts.mono} fontSize={21} fontWeight={600} fill="white">
                  {label}
                </text>
                <line x1={x - 6} x2={x - 6 + (w + 12) * strike} y1={y - 7} y2={y - 7} stroke={colors.ink} strokeWidth={4} strokeLinecap="round" />
              </g>
            ) : null;
          })}
          <g opacity={caption1}>
            <text x={120} y={300} fontFamily={fonts.sans} fontSize={46} fontWeight={800} fill={colors.ink}>
              Bedriftene er ekte.
            </text>
            <text x={120} y={356} fontFamily={fonts.sans} fontSize={46} fontWeight={800} fill={colors.ink}>
              Personene er fjernet.
            </text>
            <text x={122} y={402} fontFamily={fonts.mono} fontSize={20} fill={colors.inkSoft}>
              Kontaktpersoner, daglig leder, enkeltpersonforetak
            </text>
          </g>

          {/* De ekte kildene: sperret, så trekkes kablene ut og kildene glir bort */}
          <g clipPath="url(#byttet-cables)">
            <g transform={`translate(${unplug * 600} 0)`} opacity={1 - unplug}>
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
                </g>
              ))}
            </g>
          </g>
          {SOURCES.map((s) => (
            <g key={s.name} opacity={blocked} transform={`translate(1300 ${s.cy + 2})`}>
              <circle r={17} fill="white" stroke={colors.highlight} strokeWidth={4} />
              <path d="M -7 -7 L 7 7 M 7 -7 L -7 7" stroke={colors.highlight} strokeWidth={4} strokeLinecap="round" />
            </g>
          ))}
          {SOURCES.map((s, i) => {
            const at = T.plopp + 4 + i * 7;
            const pop = spring({ frame: frame - at, fps, config: { damping: 8 } });
            return frame >= at ? (
              <text key={s.name} x={ENGINE_RIGHT + 18} y={s.cy + 8} fontFamily={fonts.mono} fontSize={24} fontStyle="italic"
                fontWeight={600} fill={colors.highlight} opacity={1 - ramp(frame, at + 25, 12)}
                transform={`translate(${ENGINE_RIGHT + 18} ${s.cy}) scale(${pop}) translate(${-(ENGINE_RIGHT + 18)} ${-s.cy})`}>
                plopp
              </text>
            ) : null;
          })}

          {/* Den syntetiske databasen glir inn, med Mock API-er på nøyaktig samme plass */}
          <g transform={`translate(${(1 - slideIn) * 560} 0)`} opacity={slideIn}>
            <rect x={CONTAINER.x} y={CONTAINER.y} width={CONTAINER.w} height={CONTAINER.h} rx={16} fill={colors.paper}
              stroke={colors.synthetic} strokeWidth={3} strokeDasharray="12 7" />
            <text x={CONTAINER.x + 22} y={CONTAINER.y + 30} fontFamily={fonts.mono} fontSize={18} fontWeight={600} fill={colors.synthetic}>
              [SYNTETISK DATABASE]
            </text>
            {SOURCES.map((s) => (
              <Box key={s.name} x={SRC.x} y={s.cy - SRC.h / 2} w={SRC.w} h={SRC.h} start={T.inn - 40}>
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
            <text x={CONTAINER.x} y={CONTAINER.y + CONTAINER.h + 36} fontFamily={fonts.mono} fontSize={18} fill={colors.synthetic}>
              Etterligner de ekte API-ene
            </text>
          </g>
          {SOURCES.map((s, i) => (
            <g key={s.name}>
              <Connector {...req(s.cy)} start={T.kobleTil + i * 6} />
              <Connector {...res(s.cy)} start={T.kobleTil + 3 + i * 6} />
              <Stream {...req(s.cy)} start={T.flyt + i * 8} duration={T.ryddOpp - T.flyt} count={Math.round((T.ryddOpp - T.flyt) / 12)}
                color={colors.highlight} live />
              <Stream {...res(s.cy)} start={T.flyt + 12 + i * 8} duration={T.ryddOpp - T.flyt} count={Math.round((T.ryddOpp - T.flyt) / 6)}
                color={colors.synthetic} shape="person" live />
            </g>
          ))}
          <Connector {...REG_LINE} start={T.linjer} />
          <Stream {...REG_LINE} start={T.flyt} duration={T.ryddOpp - T.flyt} count={Math.round((T.ryddOpp - T.flyt) / 12)}
            color={colors.highlight} live />

          <g opacity={caption2}>
            <text x={120} y={300} fontFamily={fonts.sans} fontSize={46} fontWeight={800} fill={colors.ink}>
              Samme grensesnitt.
            </text>
            <text x={120} y={356} fontFamily={fonts.sans} fontSize={46} fontWeight={800} fill={colors.synthetic}>
              Nye data.
            </text>
            <text x={122} y={402} fontFamily={fonts.mono} fontSize={20} fill={colors.inkSoft}>
              Menneskene i strømmen har aldri eksistert.
            </text>
          </g>
          <Annotation target={{ x: 1300, y: SOURCE_Y.folkeregisteret + 14 }} at={{ x: 1190, y: 860 }} start={T.notat}
            text="Klager aldri på datalekasjer." color={colors.synthetic} instant />
          <Annotation target={{ x: 800, y: 660 }} at={{ x: 140, y: 900 }} start={T.lurt + 12}
            text="Vi lurer Gremlin til å tro at dataene er ekte." instant />
        </Wipe>
      </svg>
    </AbsoluteFill>
  );
};
