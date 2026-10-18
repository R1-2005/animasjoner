import { AbsoluteFill, Easing, interpolate } from "remotion";
import { ErrorDialogs, ShipDeploy, StackTrace } from "../Apps";
import { beatPos, kick, word } from "../beat";
import { Boom, boomShake } from "../Boom";
import { Arms, GremlinFigure, mixArms, POSES } from "../GremlinFigure";
import { BACK_MONITORS, DESK_TOP, SCREEN_CENTER } from "../Office";
import { Phrase, Phrases } from "../Phrases";
import { App, DevOpsGraph, PowerShell, Taskbar, Toast, VisualStudio } from "../Screen";
import { GREMLIN_DIM, Stage } from "../Stage";
import { fonts, night } from "../look";
import { TIMING } from "../timing";

// Refreng 1 (C1.1–C1.8, til V2 begynner). Utvikleren starter i flyt: «Ikke forstyrr» er på, ingen
// varsler, han nikker i takt og koser seg med ulogisk kode, mens Gremlin roter i bakgrunnen.
// Så merge-scenen fra stiltesten (merge ×3 → BOOM → hodet i pulten → testene feiler → --force).
// Gremlin ødelegger flyten (varselskred), feilmeldingene blir et komishow som utvikleren banner av,
// stack trace overalt (med hodet i pulten), og releasen seiler til prod som et containerskip som synker i stillheten (D6).

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const L = word;

export const CHORUS1_START = L("C1.1", 0);
export const CHORUS1_END = L("V2.1", 0);

const T = {
  gremlin: L("C1.1", 2),
  repo: L("C1.1", 5),
  chaos: L("C1.1", 6),
  debug: L("C1.2", 2),
  merges: [L("C1.3", 0), L("C1.3", 1), L("C1.3", 2)],
  explodes: L("C1.3", 6),
  boom: L("C1.3", 7),
  push: L("C1.4", 7),
  gremlin2: L("C1.5", 0),
  repo2: L("C1.5", 3),
  messin: L("C1.5", 4),
  flow: L("C1.5", 7),
  every: L("C1.6", 0),
  comedy: L("C1.6", 5),
  ha: L("C1.6", 7),
  click: L("C1.7", 0),
  clack: L("C1.7", 1),
  stack: L("C1.7", 2),
  everywhere: L("C1.7", 4),
  ship: L("C1.8", 0),
  letsGo: L("C1.8", 10),
  // D6: trommene stopper (platestopp) rett etter «let's go!».
  silence: TIMING.drops.find(([a]) => a > L("C1.8", 10))?.[0] ?? L("C1.8", 11) + 0.2,
};

// Merge-scenen: hodet i pulten på de to slagene etter smellet, så rett i terminalen.
const firstBang = Math.ceil(beatPos(T.boom + 0.15));
const BANGS = [0, 1].map((i) => TIMING.firstDownbeat + (firstBang + i) * TIMING.beat);
const TERM = BANGS[1] + 0.3;
// Hodet i pulten igjen, på to slag et par sekunder ut i stack tracen.
const firstTraceBang = Math.ceil(beatPos(T.click + 1.8));
const TRACE_BANGS = [0, 1].map((i) => TIMING.firstDownbeat + (firstTraceBang + i) * TIMING.beat);
const FORCE = TERM + 0.9;
const APPROVED = FORCE + 1.1;

// Ulogisk kode, skrevet med glede.
const WRITTEN = ["public static class Logikk", "{"];
const TYPED = [
  "    bool ErSant(bool b) => b == true ? true : false;",
  "    int Pluss(int a, int b) => a - (-b);",
  "    void Sjekk(object x)",
  "    {",
  "        if (x != null && x == null) KjørLikevel();",
  "        while (false) { Fiks(); }",
  "        // gjør ingenting, men ikke slett",
  "        var tid = DateTime.Now.AddDays(-1); // i går",
  "        return; return;",
  "    }",
];

// Varselskredet når Gremlin ødelegger flyten.
const FLOOD: { app: App; from: string; title: string; body: string }[] = [
  { app: "teams", from: "Microsoft Teams", title: "Per", body: "Bare ett spørsmål til…" },
  { app: "outlook", from: "Outlook", title: "Ledelsen", body: "Status på lanseringen?" },
  { app: "slack", from: "Slack · #lansering", title: "Ledelsen", body: "Er det deployet nå?" },
  { app: "jira", from: "Jira", title: "GRM-1337", body: "Du er nevnt i 14 kommentarer" },
];
const FLOOD_AT = T.messin + 0.05;
const ERRORS_AT = Array.from({ length: 7 }, (_, i) => T.every + 0.06 + i * 0.4);

const w = (text: string, at: number, color?: string) => ({ text, at, color });
const PHRASES: Phrase[] = [
  { lines: [[w("Gremlin", T.gremlin, night.eyes)], [w("in", L("C1.1", 3)), w("the", L("C1.1", 4)), w("repo", T.repo)]] },
  { lines: [[w("Chaos", T.chaos, night.boom)], [w("in", L("C1.1", 7)), w("the", L("C1.1", 8)), w("cloud", L("C1.1", 9))]] },
  { lines: [[w("Debuggin’", T.debug)], [w("out", L("C1.2", 3)), w("loud", L("C1.2", 4), night.glow)]] },
  { size: 86, lines: T.merges.map((at) => [w("Merge", at, night.merge)]) },
  { lines: [[w("Push", T.push, night.ok)], [w("that", T.push + 0.25), w("code", T.push + 0.5)]], until: T.gremlin2 - 0.1 },
  { size: 90, lines: [[w("Messin’", T.messin, night.eyes)], [w("with", L("C1.5", 5)), w("the", L("C1.5", 6)), w("flow", T.flow)]] },
  { size: 90, lines: [[w("Every", T.every), w("lil’", L("C1.6", 1))], [w("error", L("C1.6", 2), night.bug)]], until: T.comedy - 0.05 },
  { lines: [[w("Comedy", T.comedy, night.boom)], [w("show", L("C1.6", 6))]], until: T.ha - 0.05 },
  { size: 150, lines: [[w("Ha!", T.ha, night.boom)]], until: T.click - 0.1 },
  { lines: [[w("Stack", T.stack, night.bug)], [w("trace", L("C1.7", 3))]], until: T.everywhere - 0.05 },
  { size: 90, lines: [[w("Everywhere", T.everywhere)], [w("we", L("C1.7", 5)), w("go", L("C1.7", 6), night.bug)]], until: T.ship - 0.2 },
];

// Gremlin: rampestrek ved skapet og en tom skjerm (som i stiltesten), ut bak skjermen før
// mergingen; inn igjen og river i skapet på «messin' with the flow».
const G = {
  enter: [T.gremlin - 0.1, T.gremlin + 0.4],
  reach: T.gremlin + 0.6,
  yank: T.chaos,
  scurry: [T.chaos + 0.3, T.chaos + 0.9],
  tamper: T.chaos + 1.6,
  exit: [T.merges[0] - 0.6, T.merges[0] - 0.1],
  enter2: [T.gremlin2 - 0.4, T.gremlin2],
  reach2: T.repo2,
  yank2: T.messin,
  exit2: [T.flow - 0.2, T.flow + 0.2],
} as const;
const AT_RACK = 255;
const AT_MONITOR = BACK_MONITORS[1].x + BACK_MONITORS[1].w / 2;
const OFF_LEFT = -200;
const BEHIND_SCREEN = 820;

const POP_INS = [
  { at: T.boom, side: -1, y: 470, laugh: 1.6 },
  { at: APPROVED, side: 1, y: 560, laugh: 0.5 },
  { at: T.ha - 0.15, side: 1, y: 560, laugh: 0.9 },
] as const;

const gremlinAt = (t: number) => {
  const x = interpolate(
    t,
    [G.enter[0], G.enter[1], G.scurry[0], G.scurry[1], G.exit[0], G.exit[1], G.enter2[0], G.enter2[0] + 0.001, G.enter2[1], G.exit2[0], G.exit2[1]],
    [OFF_LEFT, AT_RACK, AT_RACK, AT_MONITOR, AT_MONITOR, BEHIND_SCREEN, BEHIND_SCREEN, OFF_LEFT, AT_RACK, AT_RACK, OFF_LEFT],
    clamp,
  );
  if (x <= OFF_LEFT || x >= BEHIND_SCREEN) return null;
  const running = [G.enter, G.scurry, G.exit, G.enter2, G.exit2].some((r) => t > r[0] && t < r[1]);
  const walk = t * 22;
  const peek = interpolate(t, [G.scurry[1], G.scurry[1] + 0.2, G.exit[0], G.exit[0] + 0.15], [0, 1, 1, 0], clamp);
  let arms: Arms = POSES.hang;
  const reachWindow = (reach: number, yank: number) =>
    t >= reach && t < yank
      ? mixArms(POSES.hang, POSES.reachLeft, interpolate(t, [reach, reach + 0.3], [0, 1], clamp))
      : t >= yank && t < yank + 0.4
        ? mixArms(POSES.reachLeft, POSES.hang, interpolate(t, [yank, yank + 0.15], [0, 1], clamp))
        : null;
  const reaching = reachWindow(G.reach, G.yank) ?? reachWindow(G.reach2, G.yank2);
  if (reaching) arms = reaching;
  else if (peek > 0) {
    const grip = mixArms(POSES.hang, POSES.grip, peek);
    const tap = t > G.tamper ? 10 * Math.sin(t * 30) : 0;
    arms = { l: [grip.l[0], grip.l[1] + tap], r: [grip.r[0], grip.r[1] - tap] };
  }
  return {
    x,
    y: 430 + 25 * peek - (running ? Math.abs(Math.sin(walk)) * 12 : 0),
    walk: running ? walk : 0,
    arms,
    eyes: 1,
    look: t < G.yank || (t > G.enter2[0] && t < G.yank2) ? -1 : t < G.scurry[1] ? 1 : t < G.exit[0] ? 0 : 1,
    grin: t > G.yank ? 1 : 0.3,
  };
};

const PopIn: React.FC<{ t: number; at: number; side: -1 | 1; y: number; laugh: number }> = ({ t, at, side, y, laugh }) => {
  const dt = t - at;
  if (dt < 0 || dt > laugh + 0.5) return null;
  const inside = interpolate(dt, [0, 0.15, laugh + 0.1, laugh + 0.35], [0, 1, 1, 0], clamp);
  const edge = side < 0 ? 0 : 1920;
  return (
    <GremlinFigure
      opacity={GREMLIN_DIM}
      x={edge - side * (-150 + 250 * inside)}
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

// Noter som stiger opp fra hodetelefonene mens han er i flyt.
const Notes: React.FC<{ t: number; amount: number }> = ({ t, amount }) => {
  if (amount <= 0) return null;
  const cx = SCREEN_CENTER.x + 80;
  return (
    <>
      {Array.from({ length: 6 }, (_, k) => {
        const phase = (t * 0.8 + k / 6) % 1;
        const side = k % 2 ? 1 : -1;
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: cx + side * (150 + phase * 40) + Math.sin(phase * 7) * 14,
              top: DESK_TOP - 20 - phase * 230,
              fontSize: 46,
              color: night.glow,
              opacity: amount * Math.sin(phase * Math.PI),
              textShadow: `0 0 14px ${night.glow}`,
            }}
          >
            {k % 3 ? "♪" : "♫"}
          </div>
        );
      })}
    </>
  );
};

// «CLICK! CLACK!» ved tastaturet.
const CLICKS = (() => {
  const out: { at: number; text: string; x: number; y: number; rot: number; size: number }[] = [
    { at: T.click, text: "CLICK!", x: 980, y: 900, rot: -12, size: 96 },
    { at: T.clack, text: "CLACK!", x: 1420, y: 880, rot: 10, size: 96 },
  ];
  for (let i = 0; i < 6; i++) {
    out.push({ at: T.clack + 0.25 + i * 0.22, text: i % 2 ? "clack" : "click", x: i % 2 ? 1450 : 990, y: 960 - (i % 3) * 40, rot: i % 2 ? 8 : -8, size: 56 });
  }
  return out;
})();
const Clicks: React.FC<{ t: number }> = ({ t }) => (
  <>
    {CLICKS.map((c) => {
      const dt = t - c.at;
      if (dt < 0 || dt > 0.45) return null;
      const s = interpolate(dt, [0, 0.08, 0.45], [1.6, 1, 0.9], clamp);
      return (
        <div
          key={c.at}
          style={{
            position: "absolute",
            left: c.x,
            top: c.y,
            fontFamily: fonts.display,
            fontSize: c.size,
            color: night.boom,
            WebkitTextStroke: `3px ${night.black}`,
            transform: `translate(-50%, -50%) scale(${s}) rotate(${c.rot}deg)`,
            opacity: interpolate(dt, [0.3, 0.45], [1, 0], clamp),
          }}
        >
          {c.text}
        </div>
      );
    })}
  </>
);

const Screen: React.FC<{ t: number }> = ({ t }) => {
  if (t < T.merges[0] - 0.5) return <VisualStudio t={t} from={CHORUS1_START} written={WRITTEN} typed={TYPED} file="Logikk.cs" />;
  if (t < T.boom) return <DevOpsGraph t={t} merges={T.merges} explodes={T.explodes} />;
  if (t < T.every)
    return (
      <PowerShell
        t={t}
        lines={[
          { at: TERM, text: "dotnet test", type: true },
          { at: TERM + 0.35, text: "Failed!  - Failed: 3, Passed: 0, Skipped: 41", color: night.bug },
          { at: TERM + 0.5, text: "  X Beregn_SkalIkkeReturnere42", color: night.bug },
          { at: FORCE, text: "git push origin main --force --no-verify", type: true },
          { at: FORCE + 0.75, text: "To https://dev.azure.com/gremlin-team/_git/Gremlin" },
          { at: FORCE + 0.9, text: " + 3f2a9c1...b00m420 main -> main (forced update)", color: night.boom },
          { at: APPROVED, text: "remote: Gremlin approved this push.", color: night.eyes },
        ]}
      />
    );
  if (t < T.click)
    return (
      <>
        <VisualStudio t={t} from={T.every} written={[...WRITTEN, ...TYPED]} typed={[""]} file="Logikk.cs" />
        <ErrorDialogs t={t} times={ERRORS_AT} />
      </>
    );
  if (t < T.ship) return <StackTrace t={t} at={T.click} />;
  return <ShipDeploy t={t} depart={T.ship} arrive={T.letsGo + 0.45} horn={T.letsGo} sink={T.silence + 0.15} />;
};

const activeApp = (t: number): App =>
  t < T.merges[0] - 0.5 ? "vs" : t < T.boom ? "devops" : t < T.every ? "terminal" : t < T.ship ? "vs" : "devops";

const FROZEN: Partial<Record<App, string>> = { outlook: "60", teams: "27", slack: "22", jira: "19" };
const FLOODED: Partial<Record<App, string>> = { outlook: "99+", teams: "99+", slack: "64", jira: "41" };

export const Chorus1: React.FC<{ t: number }> = ({ t }) => {
  const k = kick(t);
  const shake = boomShake(t, T.boom);
  const flow = t < T.merges[0] - 0.5;
  const jolt = interpolate(t, [T.boom, T.boom + 0.08, T.boom + 0.5], [0, -28, 0], clamp);
  const pop = (a: number, b: number) => interpolate(t, [a, a + 0.1, a + 0.18, b, b + 0.15], [0, 1.15, 1, 1, 0], clamp);
  const vein = Math.max(pop(TERM + 0.4, FORCE + 0.2), pop(ERRORS_AT[2], T.comedy)) * (1 + 0.12 * Math.sin(t * 25));
  const grawlix = Math.max(pop(FLOOD_AT + 0.4, T.every + 0.4), pop(T.comedy, T.click - 0.2));
  const bang = (b: number) =>
    t < b
      ? interpolate(t, [b - 0.08, b], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) })
      : interpolate(t, [b + 0.05, b + 0.35], [1, 0], clamp);
  const allBangs = [...BANGS, ...TRACE_BANGS];
  const slump = Math.max(0, ...allBangs.map(bang));
  const bonk = Math.max(0, ...allBangs.map((b) => interpolate(t, [b, b + 0.03, b + 0.25], [0, 1, 0], clamp)));
  const furious = t > T.click && t < T.ship && slump === 0;
  const coding = (t > TERM && t < TERM + 0.2) || (t > FORCE && t < FORCE + 0.7);
  const sway = flow ? Math.sin(t * 4.4) * 3 : furious ? Math.sin(t * 16) * 3.5 : coding ? Math.sin(t * 9) * 2.5 : 0;
  const spin = (from: number) => (t > from ? 2.6 * (1 - Math.exp(-(t - from) * 1.2)) : 0);
  const gremlin = gremlinAt(t);
  const everywhere = interpolate(t, [T.everywhere, T.everywhere + 0.15, T.ship, T.ship + 0.2], [0, 1, 1, 0], clamp);

  return (
    <AbsoluteFill>
      <Stage
        t={t}
        shake={{ x: shake.x, y: shake.y + bonk * 6 }}
        desktop={
          <>
            <Screen t={t} />
            <Taskbar active={activeApp(t)} badges={t < FLOOD_AT ? FROZEN : FLOODED} focus={t < FLOOD_AT} />
            {FLOOD.map((f, i) => (
              <Toast key={f.body} t={t} at={FLOOD_AT + i * 0.12} until={T.every + 0.1 + i * 0.05} slot={i} {...f} />
            ))}
          </>
        }
        dev={{ bob: jolt + (flow ? k * 8 : 0), sway, vein, grawlix, slump }}
        gremlin={gremlin ? { width: 220, ...gremlin } : null}
        rackChaos={Math.max(
          interpolate(t, [G.yank, G.yank + 0.2, T.merges[0], T.merges[0] + 0.3], [0, 1, 1, 0], clamp),
          interpolate(t, [G.yank2, G.yank2 + 0.2, T.ship, T.ship + 0.3], [0, 1, 1, 0], clamp),
        )}
        backGlitch={[everywhere, Math.max(everywhere, interpolate(t, [G.tamper, G.tamper + 0.2, T.merges[0], T.merges[0] + 0.3], [0, 1, 1, 0], clamp))]}
        chairSpin={[spin(G.enter[0] + 0.3), spin(G.scurry[0] + 0.3)]}
        popIns={POP_INS.map((p) => (
          <PopIn key={p.at} t={t} {...p} />
        ))}
        overlay={
          <>
            <Notes t={t} amount={interpolate(t, [CHORUS1_START, CHORUS1_START + 0.4, T.merges[0] - 0.8, T.merges[0] - 0.4], [0, 1, 1, 0], clamp)} />
            <Clicks t={t} />
            <Phrases t={t} phrases={PHRASES} x={60} y={110} />
            <Boom t={t} at={T.boom} x={SCREEN_CENTER.x} y={SCREEN_CENTER.y} />
          </>
        }
      />
    </AbsoluteFill>
  );
};
