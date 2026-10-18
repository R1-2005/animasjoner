import { AbsoluteFill, interpolate, random } from "remotion";
import { BugJar, CalendarTimelapse, ChaosAndPeace, TeamScream } from "../Apps";
import { beatPos, kick, word } from "../beat";
import { Fire, Smoke } from "../Effects";
import { GremlinFigure, POSES } from "../GremlinFigure";
import { RACK } from "../Office";
import { Phrase, Phrases } from "../Phrases";
import { App, Taskbar, VisualStudio } from "../Screen";
import { GREMLIN_DIM, Stage } from "../Stage";
import { fonts, night } from "../look";

// Bridge (B.1–B.6): tidshopp. Kalenderen fylles (standup 11, burnout 12, deploy 21), månedene
// bladrer til juni mens vinduet blinker mellom dag og natt; tastatur-karate og koffein-konfetti;
// «Gremlin-teamet» skriker «SHIP IT!» på Teams; kaos i backloggen og fred i loggen; en bug temmes,
// den brennende serverskapet fra C2 får en gullramme, og den digitale mobben reiser seg.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const L = word;

export const BRIDGE_START = L("B.1", 0);
export const BRIDGE_END = L("C3.1", 0);

const T = {
  standup: L("B.1", 0),
  eleven: L("B.1", 2),
  burnout: L("B.1", 3),
  noon: L("B.1", 5),
  deploy: L("B.2", 0),
  evening: L("B.2", 3),
  fixin: L("B.2", 4),
  june: L("B.2", 6),
  keyboard: L("B.3", 0),
  karate: L("B.3", 1),
  caffeine: L("B.3", 2),
  confetti: L("B.3", 3),
  team: L("B.4", 0),
  ship: L("B.4", 3),
  shipIt: L("B.4", 8),
  chaos: L("B.5", 0),
  peace: L("B.5", 4),
  log: L("B.5", 7),
  bug: L("B.6", 2),
  flame: L("B.6", 3),
  mob: L("B.6", 5),
};

const w = (text: string, at: number, color?: string) => ({ text, at, color });
const PHRASES: Phrase[] = [
  { lines: [[w("Standup", T.standup)], [w("at", L("B.1", 1)), w("eleven", T.eleven, night.glow)]], until: T.burnout - 0.05 },
  { lines: [[w("Burnout", T.burnout, night.bug)], [w("at", L("B.1", 4)), w("noon", T.noon)]], until: T.deploy - 0.05 },
  { size: 90, lines: [[w("Deploy", T.deploy, night.ok)], [w("in", L("B.2", 1)), w("the", L("B.2", 2)), w("evenin’", T.evening)]], until: T.fixin - 0.05 },
  { lines: [[w("Fixin’", T.fixin)], [w("till", L("B.2", 5)), w("June", T.june, night.boom)]], until: T.keyboard - 0.05 },
  { lines: [[w("Keyboard", T.keyboard)], [w("karate", T.karate, night.boom)]], until: T.caffeine - 0.05 },
  { lines: [[w("Caffeine", T.caffeine, "#C8A878")], [w("confetti", T.confetti, night.merge)]], until: T.team - 0.05 },
  { lines: [[w("Gremlin", T.team, night.eyes)], [w("team", L("B.4", 1)), w("screamin’", L("B.4", 2))]], until: T.ship - 0.05 },
  { lines: [[w("Chaos", T.chaos, night.bug)], [w("in", L("B.5", 1)), w("the", L("B.5", 2)), w("backlog", L("B.5", 3))]], until: T.peace - 0.05 },
  { lines: [[w("Peace", T.peace, night.ok)], [w("in", L("B.5", 5)), w("the", L("B.5", 6)), w("log", T.log)]], until: L("B.6", 0) - 0.05 },
  { size: 90, lines: [[w("Bug-tamin’", T.bug, night.bug)], [w("flame-framin’", T.flame, night.boom)]], until: L("B.6", 4) - 0.05 },
  { lines: [[w("Digital", L("B.6", 4), night.glow)], [w("mob", T.mob, night.eyes)]], until: BRIDGE_END - 0.05 },
];

// Klokka og datoen løper i tidshoppet.
const pad = (n: number) => String(Math.floor(n)).padStart(2, "0");
const clockAt = (t: number) => {
  if (t < T.fixin) {
    const hours = interpolate(t, [T.standup, T.eleven, T.burnout, T.noon, T.deploy, T.evening], [10.9, 11, 11.9, 12, 20.9, 21], clamp);
    return { clock: `${pad(hours)}:${pad((hours % 1) * 60)}`, date: "18.10.2026" };
  }
  const month = Math.min(8, Math.floor(interpolate(t, [T.fixin, T.june], [0, 8], clamp)));
  const m = ((9 + month) % 12) + 1;
  const hours = (t * 37) % 24;
  return { clock: `${pad(hours)}:${pad((hours % 1) * 60)}`, date: `${pad(1 + ((t * 13) % 28))}.${pad(m)}.${m >= 10 ? 2026 : 2027}` };
};

const KARATE_TYPED = [
  "asdfjklø asdfjklø;;;;",
  "HAI(); YAA(); HAI(); YAA();",
  "if (if (if (if (true))))",
  "}}}}}}}}}}}}}}}}}}}}",
  "// karate-commit, ikke spør",
];

const Screen: React.FC<{ t: number }> = ({ t }) => {
  if (t < T.keyboard)
    return (
      <CalendarTimelapse
        t={t}
        flip={T.fixin}
        june={T.june}
        events={[
          { at: T.standup, time: "11:00", title: "Standup", color: "#579DFF" },
          { at: T.burnout, time: "12:00", title: "Burnout", color: night.bug },
          { at: T.deploy, time: "21:00", title: "Deploy", color: night.ok },
        ]}
      />
    );
  if (t < T.team) return <VisualStudio t={t} from={T.keyboard} written={["// Kampsport.cs"]} typed={KARATE_TYPED} file="Kampsport.cs" />;
  if (t < T.chaos) return <TeamScream t={t} at={T.team} caption={T.ship} stamp={T.shipIt} />;
  if (t < T.bug - 0.5) return <ChaosAndPeace t={t} at={T.chaos} peace={T.peace} />;
  return <BugJar t={t} at={T.bug - 0.5} caught={T.bug + 0.25} />;
};
const activeApp = (t: number): App => (t < T.keyboard ? "outlook" : t < T.team ? "vs" : t < T.chaos ? "teams" : "jira");

// «HAI!» og «YAA!» på slagene i tastatur-karateen.
const KarateWords: React.FC<{ t: number }> = ({ t }) => {
  if (t < T.keyboard || t > T.team) return null;
  const i = Math.floor(beatPos(t));
  const dt = (beatPos(t) - i) * 0.645;
  if (dt > 0.4) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: i % 2 ? 1460 : 1000,
        top: 900,
        fontFamily: fonts.display,
        fontSize: 110,
        color: night.boom,
        WebkitTextStroke: `4px ${night.black}`,
        transform: `translate(-50%, -50%) scale(${interpolate(dt, [0, 0.08], [1.6, 1], clamp)}) rotate(${i % 2 ? 10 : -10}deg)`,
        opacity: interpolate(dt, [0.25, 0.4], [1, 0], clamp),
      }}
    >
      {i % 2 ? "YAA!" : "HAI!"}
    </div>
  );
};

// Koffein-konfetti: kopper, bønner og papirbiter som regner ned over hele scenen.
const Confetti: React.FC<{ t: number; from: number; to: number }> = ({ t, from, to }) => {
  if (t < from || t > to + 1.5) return null;
  const fade = interpolate(t, [to, to + 1.5], [1, 0], clamp);
  return (
    <>
      {Array.from({ length: 46 }, (_, k) => {
        const start = from + random(`ct${k}`) * 0.8;
        const dt = t - start;
        if (dt < 0) return null;
        const x = random(`cx${k}`) * 1920 + Math.sin(dt * 3 + k) * 40;
        const y = -60 + dt * (380 + random(`cv${k}`) * 260);
        const kind = k % 4;
        const rot = dt * 300 * (random(`cr${k}`) - 0.5);
        const style = { position: "absolute" as const, left: x, top: y, transform: `rotate(${rot}deg)`, opacity: fade };
        if (kind === 0)
          return (
            <svg key={k} width={46} height={44} style={style}>
              <rect x={4} y={6} width={28} height={34} rx={5} fill="#F4F1EA" stroke="#0B1220" strokeWidth={3} />
              <path d="M 32 14 q 12 0 12 9 q 0 9 -12 9" fill="none" stroke="#0B1220" strokeWidth={3} />
              <rect x={7} y={9} width={22} height={7} fill="#6B3E1F" />
            </svg>
          );
        if (kind === 1) return <div key={k} style={{ ...style, width: 16, height: 22, borderRadius: "50%", background: "#5A3216", boxShadow: "inset -4px 0 0 #3A1E0A" }} />;
        return <div key={k} style={{ ...style, width: 18, height: 10, background: [night.merge, night.boom, night.ok, night.glow][k % 4] }} />;
      })}
    </>
  );
};

// Gullramme rundt det brennende serverskapet: «Flammer» · olje på server (lappen inne i rammen).
const FlameFrame: React.FC<{ t: number; at: number }> = ({ t, at }) => {
  if (t < at) return null;
  const drop = interpolate(t, [at, at + 0.2], [-500, 0], { ...clamp, easing: (x) => 1 - (1 - x) ** 3 });
  const top = RACK.y - 170;
  return (
    <div
      style={{
        position: "absolute",
        left: RACK.x - 22,
        top: top + drop,
        width: RACK.w + 44,
        height: 330,
        border: "16px ridge #C9A23C",
        boxShadow: "0 0 30px #C9A23C55, inset 0 0 20px #00000088",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 6,
          right: 6,
          bottom: 8,
          padding: "4px 0",
          textAlign: "center",
          background: "#C9A23C",
          color: "#2A1E05",
          fontFamily: fonts.display,
          fontSize: 19,
          lineHeight: 1.1,
        }}
      >
        «Flammer»
        <br />
        olje på server
      </div>
    </div>
  );
};

export const Bridge: React.FC<{ t: number }> = ({ t }) => {
  const k = kick(t);
  const pop = (a: number, b: number) => interpolate(t, [a, a + 0.1, a + 0.18, b, b + 0.15], [0, 1.15, 1, 1, 0], clamp);
  // Burnout: hodet synker gradvis til «noon», og blir hengende litt utover deployen.
  const burnout = interpolate(t, [T.burnout, T.noon, T.deploy, T.evening], [0, 0.55, 0.55, 0], clamp);
  const flipping = t > T.fixin && t < T.keyboard;
  // Dag og natt blinker i vinduet mens månedene går.
  const day = Math.max(
    interpolate(t, [T.standup, T.eleven, T.noon, T.deploy, T.evening], [0, 1, 1, 0.6, 0], clamp),
    flipping ? Math.max(0, Math.sin(t * 22)) : 0,
  );
  const karate = t > T.keyboard && t < T.team;
  const chop = karate ? 0.25 + 0.4 * Math.abs(Math.sin(beatPos(t) * Math.PI)) : 0;
  const cheer = interpolate(t, [T.shipIt - 0.1, T.shipIt + 0.1, T.chaos - 0.2, T.chaos], [0, 1, 1, 0], clamp);
  const raise = Math.max(chop, cheer * (0.8 + 0.2 * Math.abs(Math.sin(t * 9))), interpolate(t, [T.mob - 0.2, T.mob], [0, 1], clamp));
  const zen = t > T.peace && t < T.bug - 0.5;
  const sway = karate ? Math.sin(t * 20) * 4 : flipping ? Math.sin(t * 14) * 3 : zen ? Math.sin(t * 2.2) * 2 : Math.sin(t * 9) * 1.5;
  const { clock, date } = clockAt(t);
  // Gremlin skriker med teamet fra høyre kant, og står med mobben til slutt.
  const yell = interpolate(t, [T.team - 0.1, T.team + 0.2, T.chaos - 0.3, T.chaos], [0, 1, 1, 0], clamp);

  return (
    <AbsoluteFill>
      <Stage
        t={t}
        day={day}
        mob={interpolate(t, [L("B.6", 4) - 0.3, T.mob], [0, 1], clamp)}
        rackChaos={1}
        background={
          <>
            <Smoke t={t} from={BRIDGE_START - 1} sources={[{ x: RACK.x + 30, y: RACK.y }, { x: RACK.x + RACK.w - 30, y: RACK.y }]} height={320} />
            <Fire t={t} from={BRIDGE_START - 1} x={RACK.x + 8} y={RACK.y + 12} w={RACK.w - 16} size={1.3} />
          </>
        }
        gremlin={
          t > T.mob - 0.3
            ? { x: 300, y: 430 - Math.abs(Math.sin(t * 4.8)) * 10, width: 220, arms: POSES.grip, eyes: 1, look: 1, grin: 1, open: 0.6 }
            : null
        }
        popIns={
          yell > 0 ? (
            <GremlinFigure opacity={GREMLIN_DIM} x={1920 + 150 - 250 * yell} y={560} width={260} arms={POSES.grip} grin={1} open={0.5 + 0.5 * Math.abs(Math.sin(t * 9))} look={-1} tilt={20} />
          ) : null
        }
        desktop={
          <>
            <Screen t={t} />
            <Taskbar active={activeApp(t)} badges={{ outlook: "99+", teams: "99+", slack: "99+", jira: "64" }} clock={clock} date={date} />
          </>
        }
        dev={{ bob: karate ? 0 : k * 6, sway, slump: burnout, hands: raise, grawlix: pop(T.burnout + 0.2, T.noon + 0.3) }}
        overlay={
          <>
            <FlameFrame t={t} at={T.flame} />
            <KarateWords t={t} />
            <Confetti t={t} from={T.caffeine} to={T.team} />
            <Phrases t={t} phrases={PHRASES} x={60} y={110} />
          </>
        }
      />
    </AbsoluteFill>
  );
};
