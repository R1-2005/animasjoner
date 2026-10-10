import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import { Annotation } from "./components/Annotation";
import { Box } from "./components/Box";
import { Connector } from "./components/Connector";
import { Cursor } from "./components/Cursor";
import { Database } from "./components/Database";
import { Gear } from "./components/Gear";
import { Gremlin, type GremlinKey } from "./components/Gremlin";
import { Packet } from "./components/Packet";
import { Paper } from "./components/Paper";
import { ramp } from "./style/anim";
import { theme } from "./style/theme";

export const testAnimasjonSchema = z.object({
  title: z.string(),
  punchline: z.string(),
});

type Props = z.infer<typeof testAnimasjonSchema>;

// Tidslinje (frames ved 30 fps). Samlet her så det er lett å justere tempoet.
const T = {
  title: 10,
  browser: 30,
  api: 45,
  db: 60,
  lines: 90,
  cursorMove: 110,
  click: 150,
  request: 158,
  thinking: 198,
  insert: 262,
  saved: 300,
  dbReply: 322,
  apiReply: 347,
  done: 377,
  punchline: 392,
};

// Gremlinens reaksjoner, med en egen overgang for hvert skifte.
const GREMLIN: GremlinKey[] = [
  { at: 0, expression: "nøytral" },
  { at: T.request, expression: "spørrende", transition: "blink" },
  { at: T.thinking + 38, expression: "oppgitt", transition: "blink" },
  { at: T.saved, expression: "overrasket", transition: "shake" },
  { at: T.done, expression: "triumferende", transition: "pop" },
  // Poenget: 45 minutter med forklaring tar på.
  { at: T.punchline + 25, expression: "trøtt", transition: "blink" },
];

// Gir rotasjonen i grader: summen av hastigheten for hver frame fram til nå.
// Da kan tannhjulene akselerere og bremse uten å hoppe.
const gearAngle = (frame: number) => {
  let angle = 0;
  for (let f = 0; f <= frame; f++) {
    const fast = interpolate(f, [T.thinking, T.thinking + 25, T.insert - 10, T.insert + 15], [0, 1, 1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    angle += f < T.api ? 0 : 0.8 + fast * 14;
  }
  return angle;
};

export const TestAnimasjon: React.FC<Props> = ({ title, punchline }) => {
  const frame = useCurrentFrame();
  const { colors, fonts, stroke } = theme;

  // Musepekeren glir inn mot knappen og klikker.
  const cursorT = ramp(frame, T.cursorMove, T.click - T.cursorMove - 5);
  const cursorX = interpolate(cursorT, [0, 1], [760, 332]);
  const cursorY = interpolate(cursorT, [0, 1], [960, 612]);
  const pressed = frame >= T.click && frame < T.click + 8;
  const cursorOpacity = interpolate(frame, [T.cursorMove, T.cursorMove + 10, T.request + 20, T.request + 35], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // API-boksen "rister" litt når den tenker hardt.
  const effort = interpolate(frame, [T.thinking + 20, T.thinking + 30, T.insert - 15, T.insert - 5], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const shakeX = Math.sin(frame * 2.1) * 3 * effort;
  const shakeY = Math.cos(frame * 2.7) * 2 * effort;

  const angle = gearAngle(frame);
  const dbLevel = interpolate(frame, [T.saved - 5, T.saved + 20], [0.2, 0.4], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(2)),
  });
  const rows = frame >= T.saved ? "1 042" : "1 041";
  const done = frame >= T.done;

  const titleT = ramp(frame, T.title, 25);

  return (
    <Paper
      titleBlock={[
        { label: "TEGNING", value: "Lagre-knappen" },
        { label: "MÅLESTOKK", value: "Omtrentlig" },
        { label: "REV", value: "A (første og beste)" },
      ]}
    >
      <AbsoluteFill>
        <svg width="100%" height="100%" viewBox="0 0 1920 1080">
          {/* Tittel */}
          <g opacity={titleT} transform={`translate(0 ${(1 - titleT) * 20})`}>
            <text x={120} y={170} fontFamily={fonts.sans} fontSize={64} fontWeight={800} fill={colors.ink}>
              {title}
            </text>
            <text x={122} y={220} fontFamily={fonts.mono} fontSize={24} fill={colors.inkSoft}>
              FIG. 1 — en forenklet, men ærlig fremstilling
            </text>
          </g>

          {/* [A] Nettleser */}
          <Box x={140} y={380} w={380} h={280} start={T.browser} tag="[A] KLIENT">
            <line x1={140} y1={420} x2={520} y2={420} stroke={colors.ink} strokeWidth={stroke.thin} />
            {[0, 1, 2].map((i) => (
              <circle key={i} cx={162 + i * 20} cy={400} r={6} fill="none" stroke={colors.ink} strokeWidth={stroke.thin} />
            ))}
            <text x={330} y={406} textAnchor="middle" fontFamily={fonts.mono} fontSize={18} fill={colors.inkSoft}>
              nettleser
            </text>
            {[460, 515].map((y) => (
              <rect key={y} x={180} y={y} width={300} height={34} rx={4} fill="none" stroke={colors.inkSoft} strokeWidth={stroke.thin} />
            ))}
            <g transform={`translate(0 ${pressed ? 3 : 0})`}>
              <rect x={250} y={585} width={160} height={50} rx={8}
                fill={done ? colors.success : pressed ? colors.ink : colors.accent} />
              <text x={330} y={618} textAnchor="middle" fontFamily={fonts.sans} fontSize={24} fontWeight={600} fill="white">
                {done ? "Lagret ✓" : "Lagre"}
              </text>
            </g>
          </Box>

          {/* [B] API med tannhjul */}
          <g transform={`translate(${shakeX} ${shakeY})`}>
            <Box x={770} y={380} w={380} h={280} start={T.api} tag="[B] SERVER">
              <text x={960} y={428} textAnchor="middle" fontFamily={fonts.mono} fontSize={24} fontWeight={600} fill={colors.ink}>
                API
              </text>
              <Gear cx={915} cy={550} r={72} teeth={12} angle={angle} />
              <Gear cx={1010} cy={508} r={44} teeth={7} angle={-angle * (12 / 7) + 12} color={colors.gridMinor} />
            </Box>
          </g>

          {/* [C] Database */}
          <text x={1430} y={366} fontFamily={fonts.mono} fontSize={18} fill={colors.inkSoft} opacity={ramp(frame, T.db + 20, 15)}>
            [C] DATABASE
          </text>
          <Database cx={1580} top={410} w={300} h={230} start={T.db} level={dbLevel}>
            <text x={1580} y={520} textAnchor="middle" fontFamily={fonts.mono} fontSize={22} fill={colors.ink}>
              rader:
            </text>
            <text x={1580} y={560} textAnchor="middle" fontFamily={fonts.mono} fontSize={34} fontWeight={600}
              fill={frame >= T.saved ? colors.highlight : colors.ink}>
              {rows}
            </text>
          </Database>

          {/* Linjer: forespørsel øverst (mot høyre), svar nederst (mot venstre) */}
          <Connector from={{ x: 520, y: 500 }} to={{ x: 770, y: 500 }} start={T.lines} />
          <Connector from={{ x: 1150, y: 500 }} to={{ x: 1430, y: 500 }} start={T.lines + 6} />
          <Connector from={{ x: 1430, y: 570 }} to={{ x: 1150, y: 570 }} start={T.lines + 12} />
          <Connector from={{ x: 770, y: 570 }} to={{ x: 520, y: 570 }} start={T.lines + 18} />

          {/* Data på vei */}
          <Packet from={{ x: 520, y: 500 }} to={{ x: 770, y: 500 }} start={T.request} duration={40} label="{ skjema }" />
          <Packet from={{ x: 1150, y: 500 }} to={{ x: 1430, y: 500 }} start={T.insert} duration={38} label="INSERT" />
          <Packet from={{ x: 1430, y: 570 }} to={{ x: 1150, y: 570 }} start={T.dbReply} duration={25} label="ok" color={colors.success} />
          <Packet from={{ x: 770, y: 570 }} to={{ x: 520, y: 570 }} start={T.apiReply} duration={30} label="200 OK" color={colors.success} />

          {/* Påskrifter */}
          <Annotation target={{ x: 1010, y: 470 }} at={{ x: 600, y: 315 }} start={T.thinking + 5}
            text="Validerer. Tenker. Later som det er travelt." />
          <Annotation target={{ x: 1640, y: 640 }} at={{ x: 1290, y: 780 }} start={T.saved + 5}
            text="Lagret. Trolig for alltid." color={colors.accent} />

          {/* Poenget */}
          <text x={140} y={880} fontFamily={fonts.sans} fontSize={40} fontWeight={600} fill={colors.ink}
            opacity={ramp(frame, T.punchline, 20)}>
            {punchline}
          </text>

          <g opacity={cursorOpacity}>
            <Cursor x={cursorX} y={cursorY} pressed={pressed} />
          </g>
        </svg>
      </AbsoluteFill>
      <Gremlin x={1730} y={140} width={240} start={20} keys={GREMLIN} />
    </Paper>
  );
};
