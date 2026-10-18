import { Audio } from "@remotion/media";
import { AbsoluteFill, Easing, interpolate, staticFile } from "remotion";
import { beatPos, kick, snare, SongOffset, useSongTime, word } from "./beat";
import { Boom, boomShake } from "./Boom";
import { Arms, GremlinFigure, mixArms, POSES } from "./GremlinFigure";
import {
  BackDeskFront,
  BACK_MONITORS,
  BackDeskTop,
  BackMonitors,
  DESK_TOP,
  Dev,
  EmptyChairs,
  MainDesk,
  MonitorFrame,
  Rack,
  Room,
  SCREEN_CENTER,
  Vignette,
} from "./Office";
import { Phrase, Phrases } from "./Phrases";
import { App, Desktop, DevOpsGraph, PowerShell, Taskbar, Toast, VisualStudio } from "./Screen";
import { night } from "./look";
import { TIMING } from "./timing";

// Stiltest: starten av refrenget (C1.1–C1.4) i det foreslåtte uttrykket, for å bli enige om
// stilen før hele videoen bygges. Klippet går i låttid fra FROM til TO.
const FROM = 44.0;
const TO = 57.6;
export const STYLE_TEST_FRAMES = Math.round((TO - FROM) * 30);

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Tidene, hentet fra TIMING.md (C1.1–C1.4).
const T = {
  gremlin: word("C1.1", 2),
  repo: word("C1.1", 5),
  chaos: word("C1.1", 6),
  debug: word("C1.2", 2),
  merges: [word("C1.3", 0), word("C1.3", 1), word("C1.3", 2)],
  explodes: word("C1.3", 6),
  boom: word("C1.3", 7),
  push: word("C1.4", 7),
};

// Etter smellet: hodet i pulten på de to neste slagene, så rett i terminalen. Testene feiler,
// og utvikleren tvinger det gjennom likevel (--force --no-verify).
const firstBang = Math.ceil(beatPos(T.boom + 0.15));
const BANGS = [0, 1].map((i) => TIMING.firstDownbeat + (firstBang + i) * TIMING.beat);
const TERM = BANGS[1] + 0.3;
const FORCE = TERM + 0.9;

// Dårlig kode, med vilje. Det øverste står allerede; resten skrives i høyt tempo.
const WRITTEN = [
  "using Gremlin.Core;",
  "",
  "// TODO: fiks før prod (skrevet 2019)",
  "public class Kalkulator",
  "{",
  "    public decimal Beregn(Virksomhet v)",
  "    {",
  "        try",
  "        {",
];
const TYPED = [
  "            var folk = _repo.HentAnsatte(v);",
  "            if (folk.Count == 0) return 0;",
  "            if (folk.Count == 0) return 0; // i tilfelle",
  "            Thread.Sleep(5000); // fikser race condition",
  "            return folk.Sum(p => p.Lønn * 0.042m);",
  "        }",
  "        catch (Exception)",
  "        {",
  "            // det går sikkert bra",
  "        }",
  "        return 42; // fallback",
  "    }",
];

// Varslene som rampestrekene til Gremlin utløser på skjermen til utvikleren.
const ALERT = { at: T.chaos + 0.15, until: T.chaos + 2.0 };
const TEAMS = { at: T.chaos + 1.8, until: T.merges[0] - 0.6 };

// Gremlin jobber i bakgrunnen, utenfor oppmerksomheten til utvikleren: han løper inn bare når
// han har et rampestrek å gjøre, og løper ut igjen etterpå. Når noe går galt, stikker han bare
// hodet inn fra kanten av bildet, ler og forsvinner.
const G = {
  enter: [T.gremlin - 0.1, T.gremlin + 0.4] as const, // løper inn fra venstre til serverskapet
  reach: T.gremlin + 0.6, // stikker armen inn i skapet …
  yank: T.chaos, // … og river ut noe på «chaos»: skapet blinker rødt
  scurry: [T.chaos + 0.3, T.chaos + 0.9] as const, // pilar bort til en tom skjerm
  tamper: T.chaos + 1.6, // klorer på skjermen til den glitcher
  exit: [T.merges[0] - 0.6, T.merges[0] - 0.1] as const, // løper ut bak den store skjermen
  approved: FORCE + 1.1, // «Gremlin approved this push.»
};
// Gremlin er en skygge i bakgrunnen: litt gjennomsiktig, så han ikke stjeler fokus fra skjermen.
const GREMLIN_DIM = 0.7;
const AT_RACK = 255;
const AT_MONITOR = BACK_MONITORS[1].x + BACK_MONITORS[1].w / 2;
const OFF_LEFT = -200;
const BEHIND_SCREEN = 820;

// Hodet som stikkes inn fra kanten når noe går galt.
const POP_INS = [
  { at: T.boom, side: -1, y: 470, laugh: 1.6 },
  { at: G.approved, side: 1, y: 560, laugh: 0.5 },
] as const;

const gremlinAt = (t: number) => {
  const x = interpolate(
    t,
    [G.enter[0], G.enter[1], G.scurry[0], G.scurry[1], G.exit[0], G.exit[1]],
    [OFF_LEFT, AT_RACK, AT_RACK, AT_MONITOR, AT_MONITOR, BEHIND_SCREEN],
    clamp,
  );
  const running = [G.enter, G.scurry, G.exit].some((r) => t > r[0] && t < r[1]);
  const walk = t * 22;
  // Dukker ned bak skjermen han tukler med, så bare øynene og klørne stikker opp.
  const peek = interpolate(t, [G.scurry[1], G.scurry[1] + 0.2, G.exit[0], G.exit[0] + 0.15], [0, 1, 1, 0], clamp);
  const y = 430 + 25 * peek - (running ? Math.abs(Math.sin(walk)) * 12 : 0);

  let arms: Arms = POSES.hang;
  if (t >= G.reach && t < G.yank) arms = mixArms(POSES.hang, POSES.reachLeft, interpolate(t, [G.reach, G.reach + 0.3], [0, 1], clamp));
  else if (t >= G.yank && t < G.scurry[0]) arms = mixArms(POSES.reachLeft, POSES.hang, interpolate(t, [G.yank, G.yank + 0.15], [0, 1], clamp));
  else if (peek > 0) {
    // Klørne over skjermkanten, og «taster» annenhver.
    const grip = mixArms(POSES.hang, POSES.grip, peek);
    const tap = t > G.tamper ? 10 * Math.sin(t * 30) : 0;
    arms = { l: [grip.l[0], grip.l[1] + tap], r: [grip.r[0], grip.r[1] - tap] };
  }

  const blink = [47.9, 49.6].some((b) => t > b && t < b + 0.08) ? 0.1 : 1;
  return {
    x,
    y,
    walk: running ? walk : 0,
    arms,
    eyes: blink,
    look: t < G.yank ? -1 : t < G.scurry[1] ? 1 : t < G.exit[0] ? 0 : 1,
    grin: interpolate(t, [G.yank, G.yank + 0.2], [0, 1], clamp),
  };
};

// Gremlin lener seg inn fra kanten, på skrå, ler med hendene på magen og trekker seg ut igjen.
const PopIn: React.FC<{ t: number; at: number; side: -1 | 1; y: number; laugh: number }> = ({ t, at, side, y, laugh }) => {
  const dt = t - at;
  if (dt < 0 || dt > laugh + 0.5) return null;
  const inside = interpolate(dt, [0, 0.15, laugh + 0.1, laugh + 0.35], [0, 1, 1, 0], clamp);
  const edge = side < 0 ? 0 : 1920;
  const x = edge - side * (-150 + 250 * inside);
  return (
    <GremlinFigure
      opacity={GREMLIN_DIM}
      x={x}
      y={y + Math.abs(Math.sin(dt * 14)) * -8}
      width={260}
      arms={POSES.belly}
      grin={1}
      open={dt < laugh ? Math.abs(Math.sin(dt * 14)) : 0}
      look={-side}
      tilt={-side * 20 + Math.sin(dt * 22) * 6}
    />
  );
};

const w = (text: string, at: number, color?: string) => ({ text, at, color });
const PHRASES: Phrase[] = [
  { lines: [[w("Gremlin", T.gremlin, night.eyes)], [w("in", word("C1.1", 3)), w("the", word("C1.1", 4)), w("repo", T.repo)]] },
  { lines: [[w("Chaos", T.chaos, night.boom)], [w("in", word("C1.1", 7)), w("the", word("C1.1", 8)), w("cloud", word("C1.1", 9))]] },
  { lines: [[w("Debuggin’", T.debug)], [w("out", word("C1.2", 3)), w("loud", word("C1.2", 4), night.glow)]] },
  { size: 86, lines: T.merges.map((at) => [w("Merge", at, night.merge)]) },
  { lines: [[w("Push", T.push, night.ok)], [w("that", T.push + 0.25), w("code", T.push + 0.5)]] },
];

const Scene: React.FC = () => {
  const t = useSongTime();
  const k = kick(t);
  const shake = boomShake(t, T.boom);

  const gremlin = gremlinAt(t);
  // En tom stol dreier seg sakte etter at Gremlin har løpt forbi.
  const spin = (from: number) => (t > from ? 2.6 * (1 - Math.exp(-(t - from) * 1.2)) : 0);

  // Utvikleren nikker på kicken og rykker til når det smeller.
  const jolt = interpolate(t, [T.boom, T.boom + 0.08, T.boom + 0.5], [0, -28, 0], clamp);

  // Utvikleren: vipper litt på hodet mens han koder, sinne-merke når alarmen går, bannesky når
  // Teams plinger, og hodet i pulten på slagene etter smellet.
  const coding = t < T.merges[0] - 0.5 || (t > TERM && t < TERM + 0.2) || (t > FORCE && t < FORCE + 0.7);
  const pop = (a: number, b: number) => interpolate(t, [a, a + 0.1, a + 0.18, b, b + 0.15], [0, 1.15, 1, 1, 0], clamp);
  const vein = Math.max(pop(ALERT.at + 0.2, ALERT.until), pop(TERM + 0.4, FORCE + 0.2)) * (1 + 0.12 * Math.sin(t * 25));
  const grawlix = pop(TEAMS.at + 0.3, TEAMS.until);
  // Ned i pulten med økende fart, kort stopp, så rolig opp igjen.
  const bang = (b: number) =>
    t < b
      ? interpolate(t, [b - 0.08, b], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) })
      : interpolate(t, [b + 0.05, b + 0.35], [1, 0], clamp);
  const slump = Math.max(0, ...BANGS.map(bang));
  const bonk = Math.max(0, ...BANGS.map((b) => interpolate(t, [b, b + 0.03, b + 0.25], [0, 1, 0], clamp)));

  const [screen, active]: [React.ReactNode, App] =
    t < T.merges[0] - 0.5
      ? [<VisualStudio key="vs" t={t} from={FROM} written={WRITTEN} typed={TYPED} />, "vs"]
      : t < T.boom
        ? [<DevOpsGraph key="do" t={t} merges={T.merges} explodes={T.explodes} />, "devops"]
        : [
            <PowerShell
              key="ps"
              t={t}
              lines={[
                { at: TERM, text: "dotnet test", type: true },
                { at: TERM + 0.35, text: "Failed!  - Failed: 3, Passed: 0, Skipped: 41", color: night.bug },
                { at: TERM + 0.5, text: "  X Beregn_SkalIkkeReturnere42", color: night.bug },
                { at: FORCE, text: "git push origin main --force --no-verify", type: true },
                { at: FORCE + 0.75, text: "To https://dev.azure.com/gremlin-team/_git/Gremlin" },
                { at: FORCE + 0.9, text: " + 3f2a9c1...b00m420 main -> main (forced update)", color: night.boom },
                { at: G.approved, text: "remote: Gremlin approved this push.", color: night.eyes },
              ]}
            />,
            "terminal",
          ];
  const teamsBadge = t < TEAMS.at ? "3" : t < T.explodes ? "4" : "99+";

  return (
    <AbsoluteFill style={{ background: night.room, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${shake.x}px, ${shake.y + bonk * 6}px) scale(${1 + 0.008 * k})` }}>
        <Room glow={1 + 0.25 * snare(t)} />
        <Rack t={t} chaos={interpolate(t, [G.yank, G.yank + 0.2], [0, 1], clamp)} />
        <GremlinFigure width={220} opacity={GREMLIN_DIM} {...gremlin} />
        <BackDeskTop />
        <BackMonitors t={t} glitch={[0, interpolate(t, [G.tamper, G.tamper + 0.2], [0, 1], clamp)]} />
        <BackDeskFront />
        <EmptyChairs spin={[spin(G.enter[0] + 0.3), spin(G.scurry[0] + 0.3)]} />
        {POP_INS.map((p) => (
          <PopIn key={p.at} t={t} {...p} />
        ))}
        <MonitorFrame />
        <Desktop>
          {screen}
          <Taskbar active={active} badges={{ outlook: "42", teams: teamsBadge, jira: "7" }} />
          <Toast t={t} {...ALERT} app="devops" from="Azure Monitor" title="Alert: prod-gremlin-01" body="CPU 100 % · minne 99 % · stemning 0 %" />
          <Toast t={t} {...TEAMS} app="teams" from="Microsoft Teams" title="Kari Nordmann" body="Har du 5 min? Bare en liten ting :)" />
        </Desktop>
        <MainDesk steam={t} />
        <Dev
          id="dev"
          cx={SCREEN_CENTER.x + 80}
          top={DESK_TOP - 95}
          bob={k * 6 + jolt}
          sway={coding ? Math.sin(t * 9) * 2.5 : 0}
          vein={vein}
          grawlix={grawlix}
          slump={slump}
        />
      </AbsoluteFill>
      <Phrases t={t} phrases={PHRASES} x={60} y={110} />
      <Boom t={t} at={T.boom} x={SCREEN_CENTER.x} y={SCREEN_CENTER.y} />
      <Vignette />
    </AbsoluteFill>
  );
};

export const StyleTest: React.FC = () => (
  <SongOffset.Provider value={FROM}>
    <Audio src={staticFile(TIMING.audio)} trimBefore={Math.round(FROM * 30)} />
    <Scene />
  </SongOffset.Provider>
);
