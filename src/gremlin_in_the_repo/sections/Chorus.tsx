import { AbsoluteFill, Easing, interpolate } from "remotion";
import { ErrorDialogs, ShipDeploy, StackTrace } from "../Apps";
import { beatPos, kick, word } from "../beat";
import { Boom, boomShake } from "../Boom";
import { City, cityView, TARGET } from "../City";
import { Fire, Smoke } from "../Effects";
import { ShadowGremlin } from "../ShadowGremlin";
import { Arms, GremlinFigure, mixArms, POSES } from "../GremlinFigure";
import { BACK_MONITORS, DESK_TOP, RACK, SCREEN_CENTER } from "../Office";
import { Phrase, Phrases } from "../Phrases";
import { App, DevOpsGraph, PowerShell, Taskbar, Toast, VisualStudio } from "../Screen";
import { GREMLIN_DIM, Stage } from "../Stage";
import { fonts, night } from "../look";
import { TIMING } from "../timing";

// Refrenget (C1, C2 …) bygges fra samme oppskrift, med tidene fra sitt eget refreng i TIMING.md:
// utvikleren starter i flyt («Ikke forstyrr», noter, ulogisk kode) mens Gremlin roter i bakgrunnen;
// merge ×3 → BOOM → hodet i pulten → testene feiler → --force; Gremlin ødelegger flyten
// (varselskred), feilmeldingene blir et komishow han banner av, CLICK/CLACK og stack trace med
// hodet i pulten, og releasen seiler til prod som et containerskip som synker.
// Variantene bestemmer hva som eksploderer (skjermen eller serverne), koden og varslene.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

type Notification = { app: App; from: string; title: string; body: string };
type Variant = {
  // Hvor smellet skjer: på skjermen (C1), i serverskapet som så brenner (C2), eller i hele
  // kvartalet (C3): kameraet zoomer ut til byen, strømmen går, og vi dykker inn igjen til stearinlys.
  boom: "screen" | "rack" | "blackout";
  // Ordet i C*.8 som får skipet til å tute (standard: ad-libben, ord 10).
  hornWord?: number;
  end: number;
  file: string;
  written: string[];
  typed: string[];
  // Svaret fra remote etter --force (før «Gremlin approved this push.»).
  pushReply: { text: string; color?: string }[];
  flood: Notification[];
  frozenBadges: Partial<Record<App, string>>;
};

const VARIANTS: Record<number, Variant> = {
  1: {
    boom: "screen",
    end: word("V2.1", 0),
    file: "Logikk.cs",
    written: ["public static class Logikk", "{"],
    typed: [
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
    ],
    pushReply: [
      { text: "To https://dev.azure.com/gremlin-team/_git/Gremlin" },
      { text: " + 3f2a9c1...b00m420 main -> main (forced update)", color: night.boom },
    ],
    flood: [
      { app: "teams", from: "Microsoft Teams", title: "Per", body: "Bare ett spørsmål til…" },
      { app: "outlook", from: "Outlook", title: "Ledelsen", body: "Status på lanseringen?" },
      { app: "slack", from: "Slack · #lansering", title: "Ledelsen", body: "Er det deployet nå?" },
      { app: "jira", from: "Jira", title: "GRM-1337", body: "Du er nevnt i 14 kommentarer" },
    ],
    frozenBadges: { outlook: "60", teams: "27", slack: "22", jira: "19" },
  },
  2: {
    boom: "rack",
    end: word("B.1", 0),
    file: "Logikk2.cs",
    written: ["public static class MerLogikk", "{"],
    typed: [
      "    bool ErFerdig() => !ErFerdig();",
      "    int Tilfeldig() => 4; // terningkast",
      '    string Tom() => "" + null + "";',
      "    void Vent() { while (true) { } } // pause",
      "    // TODO: forstå denne",
      "    var kopi = original; // backup",
      "    var kopi2 = kopi; // backup av backup",
    ],
    pushReply: [
      { text: "fatal: the remote end hung up unexpectedly", color: night.bug },
      { text: "remote: serverrommet brenner", color: night.boom },
    ],
    flood: [
      { app: "teams", from: "Microsoft Teams", title: "Per", body: "Lukter det brent hos dere?" },
      { app: "outlook", from: "Outlook", title: "Ledelsen", body: "Hvorfor er alt nede?" },
      { app: "slack", from: "Slack · #drift", title: "Drift", body: "Serverrommet brenner. Normalt?" },
      { app: "jira", from: "Jira", title: "GRM-1337", body: "Status endret til: I brann" },
    ],
    frozenBadges: { outlook: "99+", teams: "99+", slack: "79", jira: "53" },
  },
  3: {
    boom: "blackout",
    hornWord: 9,
    end: Infinity,
    file: "Logikk3.cs",
    written: ["public static class SisteLogikk", "{"],
    typed: [
      "    bool StrømErPå() => true; // antagelse",
      "    var lys = new Stearinlys(); // fallback",
      "    try { Alt(); } catch { Mer(); }",
      "    // TODO: betale strømregningen",
      "    void Lansering() => Lansering(); // rekursivt optimistisk",
    ],
    pushReply: [
      { text: "remote: kjører på nødstrøm", color: night.boom },
      { text: " + b00m420...d4rk000 main -> main (forced update)", color: night.boom },
    ],
    flood: [
      { app: "teams", from: "Microsoft Teams", title: "Per", body: "Er det strømbrudd hos dere også?" },
      { app: "outlook", from: "Outlook", title: "Ledelsen", body: "Kan du jobbe offline?" },
      { app: "slack", from: "Slack · #drift", title: "Drift", body: "Hele kvartalet er mørkt." },
      { app: "jira", from: "Jira", title: "GRM-1337", body: "Blokkert av: strøm" },
    ],
    frozenBadges: { outlook: "99+", teams: "99+", slack: "99+", jira: "64" },
  },
};
const FLOODED: Partial<Record<App, string>> = { outlook: "99+", teams: "99+", slack: "99+", jira: "64" };

const AT_RACK = 255;
const AT_MONITOR = BACK_MONITORS[1].x + BACK_MONITORS[1].w / 2;
const OFF_LEFT = -200;
const BEHIND_SCREEN = 820;
// Serverskapet eksploderer: smellet midt over skapet og pulten bak (så «BOOM!» er innenfor bildet).
const RACK_BOOM = { x: 360, y: 500 };

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

type Click = { at: number; text: string; x: number; y: number; rot: number; size: number };
const Clicks: React.FC<{ t: number; clicks: Click[] }> = ({ t, clicks }) => (
  <>
    {clicks.map((c) => {
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

const makeChorus = (n: number) => {
  const V = VARIANTS[n];
  const L = (line: number, i: number) => word(`C${n}.${line}`, i);
  const START = L(1, 0);
  const T = {
    gremlin: L(1, 2),
    repo: L(1, 5),
    chaos: L(1, 6),
    debug: L(2, 2),
    merges: [L(3, 0), L(3, 1), L(3, 2)],
    explodes: L(3, 6),
    boom: L(3, 7),
    push: L(4, 7),
    gremlin2: L(5, 0),
    repo2: L(5, 3),
    messin: L(5, 4),
    flow: L(5, 7),
    every: L(6, 0),
    comedy: L(6, 5),
    ha: L(6, 7),
    click: L(7, 0),
    clack: L(7, 1),
    stack: L(7, 2),
    everywhere: L(7, 4),
    ship: L(8, 0),
    // Ad-libben på slutten av C*.8 («let's go!» / «go!»): skipet tuter.
    horn: L(8, V.hornWord ?? 10),
    // Ad-libben helt på slutten av refrenget («Gremlin!» i C3): skjermen går av.
    last: L(8, 10),
  };
  // Synker i trommestoppet rett etter tutet hvis det er ett (C1: D6), ellers litt etter.
  const silence = TIMING.drops.find(([a]) => a > T.horn && a < T.horn + 1.5)?.[0] ?? T.horn + 0.6;

  // Merge-scenen: hodet i pulten på de to slagene etter smellet, så rett i terminalen.
  const blackout = V.boom === "blackout";
  // C3: zoom ut av vinduet etter tredje merge, smell og strømbrudd i byen, dykk inn igjen før C3.5.
  const OUT = [T.merges[2] + 0.3, T.explodes + 0.15] as const;
  const IN = [T.boom + 1.3, T.gremlin2 - 0.95] as const;
  const LAND = IN[1];
  const CRT_AT = T.last;
  const firstBang = Math.ceil(beatPos(T.boom + 0.15));
  // I C3 er utvikleren ute av bildet når det smeller, så ingen hode-i-pulten der.
  const BANGS = blackout ? [] : [0, 1].map((i) => TIMING.firstDownbeat + (firstBang + i) * TIMING.beat);
  const TERM = blackout ? LAND + 0.25 : BANGS[1] + 0.3;
  const FORCE = TERM + 0.9;
  const APPROVED = FORCE + 1.1;
  // Hodet i pulten igjen, på to slag et par sekunder ut i stack tracen.
  const firstTraceBang = Math.ceil(beatPos(T.click + 1.8));
  const TRACE_BANGS = [0, 1].map((i) => TIMING.firstDownbeat + (firstTraceBang + i) * TIMING.beat);

  const FLOOD_AT = T.messin + 0.05;
  const ERRORS_AT = Array.from({ length: 7 }, (_, i) => T.every + 0.06 + i * 0.4);

  const w = (text: string, at: number, color?: string) => ({ text, at, color });
  const PHRASES: Phrase[] = [
    { lines: [[w("Gremlin", T.gremlin, night.eyes)], [w("in", L(1, 3)), w("the", L(1, 4)), w("repo", T.repo)]] },
    { lines: [[w("Chaos", T.chaos, night.boom)], [w("in", L(1, 7)), w("the", L(1, 8)), w("cloud", L(1, 9))]] },
    { lines: [[w("Debuggin’", T.debug)], [w("out", L(2, 3)), w("loud", L(2, 4), night.glow)]] },
    { size: 86, lines: T.merges.map((at) => [w("Merge", at, night.merge)]) },
    { lines: [[w("Push", T.push, night.ok)], [w("that", T.push + 0.25), w("code", T.push + 0.5)]], until: T.gremlin2 - 0.1 },
    { size: 90, lines: [[w("Messin’", T.messin, night.eyes)], [w("with", L(5, 5)), w("the", L(5, 6)), w("flow", T.flow)]] },
    { size: 90, lines: [[w("Every", T.every), w("lil’", L(6, 1))], [w("error", L(6, 2), night.bug)]], until: T.comedy - 0.05 },
    { lines: [[w("Comedy", T.comedy, night.boom)], [w("show", L(6, 6))]], until: T.ha - 0.05 },
    { size: 150, lines: [[w("Ha!", T.ha, night.boom)]], until: T.click - 0.1 },
    { lines: [[w("Stack", T.stack, night.bug)], [w("trace", L(7, 3))]], until: T.everywhere - 0.05 },
    { size: 90, lines: [[w("Everywhere", T.everywhere)], [w("we", L(7, 5)), w("go", L(7, 6), night.bug)]], until: T.ship - 0.2 },
  ];

  // Gremlin: rampestrek ved skapet og en tom skjerm, ut bak skjermen før mergingen; inn igjen og
  // river i skapet på «messin' with the flow».
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

  // Ler av smellet: fra venstre når skjermen smeller, fra høyre når serverskapet (til venstre) gjør det.
  const POP_INS = [
    ...(blackout ? [] : [{ at: T.boom, side: V.boom === "rack" ? 1 : -1, y: V.boom === "rack" ? 560 : 470, laugh: 1.6 } as const]),
    { at: APPROVED, side: 1, y: 560, laugh: 0.5 } as const,
    { at: T.ha - 0.15, side: 1, y: 560, laugh: 0.9 } as const,
  ];

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

  // «CLICK! CLACK!» ved tastaturet.
  const CLICKS: Click[] = [
    { at: T.click, text: "CLICK!", x: 980, y: 900, rot: -12, size: 96 },
    { at: T.clack, text: "CLACK!", x: 1420, y: 880, rot: 10, size: 96 },
    ...Array.from({ length: 6 }, (_, i) => ({
      at: T.clack + 0.25 + i * 0.22,
      text: i % 2 ? "clack" : "click",
      x: i % 2 ? 1450 : 990,
      y: 960 - (i % 3) * 40,
      rot: i % 2 ? 8 : -8,
      size: 56,
    })),
  ];

  const Screen: React.FC<{ t: number }> = ({ t }) => {
    if (t < T.merges[0] - 0.5) return <VisualStudio t={t} from={START} written={V.written} typed={V.typed} file={V.file} />;
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
            ...V.pushReply.map((r, i) => ({ at: FORCE + 0.75 + i * 0.15, ...r })),
            { at: APPROVED, text: "remote: Gremlin approved this push.", color: night.eyes },
          ]}
        />
      );
    if (t < T.click)
      return (
        <>
          <VisualStudio t={t} from={T.every} written={[...V.written, ...V.typed]} typed={[""]} file={V.file} />
          <ErrorDialogs t={t} times={ERRORS_AT} />
        </>
      );
    if (t < T.ship) return <StackTrace t={t} at={T.click} />;
    return <ShipDeploy t={t} depart={T.ship} arrive={T.horn + 0.45} horn={T.horn} sink={silence + 0.15} />;
  };

  const activeApp = (t: number): App =>
    t < T.merges[0] - 0.5 ? "vs" : t < T.boom ? "devops" : t < T.every ? "terminal" : t < T.ship ? "vs" : "devops";

  // C3: fra kontoret ut til byen, smell og strømbrudd, og inn igjen til et vindu med stearinlys.
  const CityTransit: React.FC<{ t: number }> = ({ t }) => {
    const p = t < T.boom ? 1 - interpolate(t, OUT, [0, 1], clamp) : interpolate(t, IN, [0, 1], clamp);
    const cam = cityView(p);
    const shake = boomShake(t, T.boom);
    const towerX = 960 + (TARGET.x - cam.focus.x) * cam.zoom;
    const towerY = 540 + (TARGET.y - cam.focus.y) * cam.zoom + 40;
    const leaving = interpolate(t, [OUT[0], OUT[0] + 0.35], [0.9, 0], clamp);
    const arriving = interpolate(t, [IN[1] - 0.3, IN[1]], [0, 0.85], clamp);
    return (
      <AbsoluteFill>
        <AbsoluteFill style={{ transform: `translate(${shake.x}px, ${shake.y}px)` }}>
          <City
            t={t}
            {...cam}
            sign={t < T.boom ? 1 : 0}
            topFloor={t < T.boom ? 1 : 0}
            eyes={interpolate(t, [T.boom + 0.35, T.boom + 0.5], [0, 1], clamp)}
            dark={interpolate(t, [T.boom, T.boom + 0.45], [0.02, 1], clamp) * (t >= T.boom ? 1 : 0)}
            candle={interpolate(t, [T.boom + 0.8, T.boom + 1.0], [0, 1], clamp)}
          />
        </AbsoluteFill>
        <AbsoluteFill style={{ background: night.glow, opacity: leaving }} />
        <AbsoluteFill style={{ background: "#FFB347", opacity: arriving }} />
        <Phrases t={t} phrases={PHRASES} x={60} y={110} />
        <Boom t={t} at={T.boom} x={towerX} y={towerY} />
      </AbsoluteFill>
    );
  };

  const Chorus: React.FC<{ t: number }> = ({ t }) => {
    if (blackout && t >= OUT[0] + 0.15 && t < LAND) return <CityTransit t={t} />;
    const k = kick(t);
    const rackBoom = V.boom === "rack";
    const boomAt = rackBoom ? RACK_BOOM : { x: SCREEN_CENTER.x, y: SCREEN_CENTER.y };
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
    const burning = rackBoom && t > T.boom;
    // C3 etter strømbruddet: mørkt, stearinlys på pulten, og til slutt går skjermen av som en CRT.
    const dark = blackout && t >= LAND;
    const crt = dark ? interpolate(t, [CRT_AT, CRT_AT + 0.9], [0, 1], clamp) : 0;
    const candleOut = interpolate(t, [CRT_AT + 0.5, CRT_AT + 0.7], [0, 1], clamp);
    const leaving = blackout && t < LAND ? interpolate(t, [OUT[0], OUT[0] + 0.15], [1, 1.35], { ...clamp, easing: Easing.in(Easing.quad) }) : 1;
    const settle = dark ? interpolate(t, [LAND, LAND + 0.6], [1.3, 1], { ...clamp, easing: (x) => 1 - (1 - x) ** 3 }) : 1;
    const warm = dark ? interpolate(t, [LAND, LAND + 0.3], [0.85, 0], clamp) : 0;

    return (
      <AbsoluteFill style={{ transform: `scale(${leaving * settle})`, transformOrigin: "62% 42%" }}>
        <Stage
          t={t}
          power={dark ? 0 : 1}
          crt={crt}
          foreground={dark ? <Candle t={t} out={candleOut} /> : null}
          shake={{ x: shake.x, y: shake.y + bonk * 6 }}
          desktop={
            <>
              <Screen t={t} />
              <Taskbar active={activeApp(t)} badges={t < FLOOD_AT ? V.frozenBadges : FLOODED} focus={t < FLOOD_AT} />
              {V.flood.map((f, i) => (
                <Toast key={f.body} t={t} at={FLOOD_AT + i * 0.12} until={T.every + 0.1 + i * 0.05} slot={i} {...f} />
              ))}
            </>
          }
          dev={{ bob: jolt + (flow ? k * 8 : 0), sway, vein, grawlix, slump }}
          gremlin={gremlin ? { width: 220, ...gremlin } : null}
          rackChaos={
            burning
              ? 1
              : Math.max(
                  interpolate(t, [G.yank, G.yank + 0.2, T.merges[0], T.merges[0] + 0.3], [0, 1, 1, 0], clamp),
                  interpolate(t, [G.yank2, G.yank2 + 0.2, T.ship, T.ship + 0.3], [0, 1, 1, 0], clamp),
                )
          }
          backGlitch={[everywhere, Math.max(everywhere, interpolate(t, [G.tamper, G.tamper + 0.2, T.merges[0], T.merges[0] + 0.3], [0, 1, 1, 0], clamp))]}
          chairSpin={[spin(G.enter[0] + 0.3), spin(G.scurry[0] + 0.3)]}
          popIns={POP_INS.map((p) => (
            <PopIn key={p.at} t={t} {...p} />
          ))}
          overlay={
            <>
              {burning && (
                <>
                  <Smoke t={t} from={T.boom + 0.2} sources={[{ x: RACK.x + 30, y: RACK.y }, { x: RACK.x + RACK.w - 30, y: RACK.y }, { x: RACK.x + RACK.w / 2, y: RACK.y + 60 }]} height={320} />
                  <Fire t={t} from={T.boom + 0.05} x={RACK.x + 8} y={RACK.y + 12} w={RACK.w - 16} size={1.7} />
                </>
              )}
              <Notes t={t} amount={interpolate(t, [START, START + 0.4, T.merges[0] - 0.8, T.merges[0] - 0.4], [0, 1, 1, 0], clamp)} />
              <Clicks t={t} clicks={CLICKS} />
              <Phrases t={t} phrases={PHRASES} x={60} y={110} />
              {!blackout && <Boom t={t} at={T.boom} x={boomAt.x} y={boomAt.y} />}
              {blackout && t < LAND && <AbsoluteFill style={{ background: night.glow, opacity: interpolate(t, [OUT[0], OUT[0] + 0.15], [0, 0.9], clamp) }} />}
              {warm > 0 && <AbsoluteFill style={{ background: "#FFB347", opacity: warm }} />}
              {dark && <TheEnd t={t} at={CRT_AT} />}
            </>
          }
        />
      </AbsoluteFill>
    );
  };

  return { start: START, end: V.end, Chorus };
};

// Stearinlys på pulten: varmt, flakkende lys over et ellers mørkt rom; out (0..1) blåser det ut.
const Candle: React.FC<{ t: number; out: number }> = ({ t, out }) => {
  const x = 760;
  const flick = 0.85 + 0.1 * Math.sin(t * 23) + 0.05 * Math.sin(t * 61);
  const lit = 1 - out;
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: x - 520,
          top: DESK_TOP - 640,
          width: 1040,
          height: 1040,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,170,70,0.38), rgba(255,140,50,0.12) 40%, transparent 70%)",
          mixBlendMode: "screen",
          opacity: lit * flick,
        }}
      />
      <div style={{ position: "absolute", left: x - 34, top: DESK_TOP - 6, width: 68, height: 14, borderRadius: "50%", background: "#3A3326" }} />
      <div style={{ position: "absolute", left: x - 15, top: DESK_TOP - 82, width: 30, height: 80, borderRadius: 4, background: "linear-gradient(90deg, #F4ECD8, #C9BFA6)" }} />
      <div style={{ position: "absolute", left: x - 1.5, top: DESK_TOP - 94, width: 3, height: 13, background: "#2A2A2A" }} />
      {lit > 0 && (
        <div
          style={{
            position: "absolute",
            left: x - 11,
            top: DESK_TOP - 132,
            width: 22,
            height: 42,
            borderRadius: "50% 50% 45% 45% / 65% 65% 35% 35%",
            background: "linear-gradient(#FFF6C8, #FFB347 60%, #E2572B)",
            boxShadow: "0 0 30px 10px rgba(255,170,70,0.6)",
            transform: `scale(${flick * lit}) rotate(${Math.sin(t * 9) * 4}deg)`,
            transformOrigin: "50% 100%",
          }}
        />
      )}
      {out > 0 &&
        [0, 1, 2].map((k) => {
          const a = Math.min(1, out * 1.5 - k * 0.15);
          if (a <= 0) return null;
          return <div key={k} style={{ position: "absolute", left: x - 8 + Math.sin(a * 6 + k) * 14, top: DESK_TOP - 110 - a * 160, width: 16 + a * 30, height: 16 + a * 30, borderRadius: "50%", background: "rgba(150,150,160,0.5)", opacity: 1 - a }} />;
        })}
    </AbsoluteFill>
  );
};

// Slutten: alt går i svart, og to grønne øyne åpner seg i mørket, gliser og lukker seg igjen.
const TheEnd: React.FC<{ t: number; at: number }> = ({ t, at }) => {
  const black = interpolate(t, [at + 0.6, at + 1.0], [0, 1], clamp);
  if (black <= 0) return null;
  const open = interpolate(t, [at + 1.1, at + 1.3, at + 2.55, at + 2.7], [0, 1, 1, 0], clamp);
  const blink = t > at + 1.9 && t < at + 1.98 ? 0.1 : 1;
  return (
    <>
      <AbsoluteFill style={{ background: "#000000", opacity: black }} />
      {open > 0 && (
        <ShadowGremlin x={960} y={480} width={520} eyes={open * blink} grin={interpolate(t, [at + 1.5, at + 1.7], [0, 1], clamp) * open} look={0} />
      )}
    </>
  );
};

export const CHORUSES = { 1: makeChorus(1), 2: makeChorus(2), 3: makeChorus(3) };
