import { AbsoluteFill, interpolate } from "remotion";
import { JiraList, JiraTicket, PullRequests, TaskManager, TeamsChat, TeamsMeeting, Browser } from "../Apps";
import { beatPos, word } from "../beat";
import { Arms, GremlinFigure, mixArms, POSES } from "../GremlinFigure";
import { BACK_MONITORS } from "../Office";
import { Phrase, Phrases } from "../Phrases";
import { App, PowerShell, Taskbar, Toast, VisualStudio } from "../Screen";
import { GREMLIN_DIM, Stage } from "../Stage";
import { night } from "../look";

// Vers 1 (V1.1–V1.12): kveldsjobb før lansering i morgen tidlig. Skjermen bytter app for hver linje,
// mens ledelsen og kolleger maser i varsler og tellerne på oppgavelinja kryper oppover.
// Gremlin er innom to ganger (en tom skjerm, serverskapet), velter kaffen med en klo fra kanten,
// og titter uskyldig inn på «Who touched prod?».

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const L = word;

export const VERSE1_START = L("V1.1", 0);
export const VERSE1_END = L("C1.1", 0);

const T = {
  slack: L("V1.1", 0),
  camera: L("V1.1", 4),
  hair: L("V1.1", 6),
  gremlin: L("V1.2", 0),
  keystroke: L("V1.2", 5),
  magic: L("V1.2", 6),
  coffee: L("V1.3", 0),
  trackpad: L("V1.3", 3),
  ticket: L("V1.4", 0),
  simple: L("V1.4", 2),
  weeks: L("V1.4", 5),
  battle: L("V1.4", 6),
  standup: L("V1.5", 0),
  velocity: L("V1.5", 4),
  tabs: L("V1.6", 0),
  prs: L("V1.7", 0),
  prsWord: L("V1.7", 1),
  open: L("V1.7", 2),
  scope: L("V1.7", 3),
  tasks: L("V1.8", 0),
  wifi: L("V1.9", 0),
  repo: L("V1.9", 2),
  story: L("V1.10", 0),
  stress: L("V1.10", 5),
  bug: L("V1.11", 0),
  blink: L("V1.11", 4),
  who: L("V1.12", 0),
  silent: L("V1.12", 5),
};

// Når utvikleren bytter fra VS til terminalen for å lage og pushe en ny branch.
const PUSH = { from: T.gremlin - 0.4, to: T.gremlin + 1.0 };

const w = (text: string, at: number, color?: string) => ({ text, at, color });
const PHRASES: Phrase[] = [
  { lines: [[w("Slack", T.slack, night.merge), w("ping", L("V1.1", 1))]], until: T.camera - 0.1 },
  { lines: [[w("Camera", T.camera), w("off", L("V1.1", 5))], [w("hair", T.hair), w("tragic", L("V1.1", 7), night.boom)]], until: T.gremlin - 0.1 },
  { lines: [[w("Keystroke", T.keystroke)], [w("magic", T.magic, night.eyes)]], until: T.coffee - 0.1 },
  { size: 76, lines: [[w("Coffee", T.coffee, night.boom)], [w("on", L("V1.3", 1)), w("the", L("V1.3", 2)), w("trackpad", T.trackpad)]], until: T.ticket - 0.1 },
  { lines: [[w("“Simple”", T.simple, night.ok)]], until: T.weeks - 0.05 },
  { lines: [[w("Seven-week", T.weeks, night.bug)], [w("battle", T.battle)]], until: T.standup - 0.1 },
  { lines: [[w("Velocity", T.velocity, night.glow)]], until: T.tabs - 0.1 },
  { lines: [[w("Tab", T.tabs), w("count", L("V1.6", 1))]], until: T.prs - 0.1 },
  { lines: [[w("Scope", T.scope, night.merge)], [w("creep", L("V1.7", 4))]], until: T.tasks - 0.1 },
  { lines: [[w("Task", T.tasks), w("list", L("V1.8", 1))], [w("scroll", L("V1.8", 2), night.glow)]], until: T.wifi - 0.1 },
  { lines: [[w("Wi-Fi", T.wifi), w("hiccup", L("V1.9", 1), night.bug)]], until: T.repo - 0.05 },
  { lines: [[w("Repo", T.repo), w("hiccup", L("V1.9", 3), night.bug)]], until: T.story - 0.1 },
  { lines: [[w("Stress", T.stress, night.bug)]], until: T.bug - 0.1 },
  { size: 84, lines: [[w("Bug", T.bug, night.bug)], [w("in", L("V1.11", 1)), w("the", L("V1.11", 2)), w("backlog", L("V1.11", 3))]], until: T.who - 0.1 },
  { lines: [[w("Who", T.who), w("touched", L("V1.12", 1))], [w("prod?", L("V1.12", 2), night.boom)]], until: VERSE1_END - 0.1 },
];

// Kode som skrives i Visual Studio: først en ferdig fil, så en ny fil for lanseringen.
const FILE_A = {
  written: ["public class Kalkulator", "{", "    // TODO: fjern før prod (skrevet 2019)", "    public decimal Beregn(Virksomhet v) => 42;", ""],
  typed: [
    "    public bool ErKlarForLansering() => true; // tror jeg",
    "    public int AntallBugs => 0; // offisielt",
    "    // TODO: fjern før lansering",
  ],
};
const FILE_B = {
  written: ["namespace Gremlin.Core;", "", "public static class Lansering", "{"],
  typed: [
    "    public static void Start()",
    "    {",
    "        if (!Testene.ErGrønne) Testene.Ignorer();",
    "        Database.Migrer(force: true);",
    "        Cache.Tøm(); Cache.Tøm(); // for sikkerhets skyld",
    '        Varsle("Ledelsen", "Alt går bra");',
    "    }",
    "}",
  ],
};

// Maset: varsler som glir inn nede til høyre, og hvilken app som teller opp.
const TOASTS: { at: number; until: number; app: App; from: string; title: string; body: string }[] = [
  { at: T.slack, until: T.hair + 0.1, app: "slack", from: "Slack · #lansering", title: "Ledelsen", body: "Er vi klare for lansering i morgen tidlig?!?" },
  { at: T.hair + 0.4, until: T.gremlin + 0.9, app: "teams", from: "Microsoft Teams", title: "Per", body: "Bare ett kjapt spørsmål…" },
  { at: T.keystroke, until: T.coffee + 0.2, app: "outlook", from: "Outlook", title: "Kari", body: "Har du ett minutt å avse?" },
  { at: T.tabs + 0.2, until: T.prs - 0.2, app: "teams", from: "Microsoft Teams", title: "Ola", body: "Kan du ta en titt? Haster ikke. (Haster)" },
  { at: T.tasks + 0.1, until: T.wifi - 0.4, app: "outlook", from: "Outlook · Kalender", title: "Møte om møtene", body: "I morgen kl. 08:00 · Obligatorisk" },
  { at: T.story + 0.2, until: T.bug - 0.2, app: "slack", from: "Slack · #random", title: "@channel", body: "Kake på kjøkkenet! (den er borte)" },
  { at: T.blink - 0.3, until: T.who - 0.1, app: "slack", from: "Slack · #lansering", title: "Ledelsen", body: "Hva er det som blinker rødt? Er det bra?" },
];
const BASE: Partial<Record<App, number>> = { outlook: 42, teams: 3, slack: 1, jira: 7 };
const badges = (t: number) => {
  const out: Partial<Record<App, string>> = {};
  for (const [app, base] of Object.entries(BASE) as [App, number][]) {
    const pinged = TOASTS.filter((x) => x.app === app && t >= x.at).length;
    // Litt mas i bakgrunnen også: tellerne kryper oppover jevnt.
    const drift = Math.floor(Math.max(0, t - VERSE1_START) / (app === "teams" ? 1.7 : 2.6));
    const n = base + pinged * 3 + drift;
    out[app] = n > 99 ? "99+" : String(n);
  }
  return out;
};

const Screen: React.FC<{ t: number }> = ({ t }) => {
  if (t < PUSH.from) return <VisualStudio t={t} from={VERSE1_START} {...FILE_A} />;
  if (t < PUSH.to)
    return (
      <PowerShell
        t={t}
        lines={[
          { at: PUSH.from + 0.05, text: "git checkout -b feature/lansering-i-morgen", type: true },
          { at: PUSH.from + 0.75, text: "Switched to a new branch 'feature/lansering-i-morgen'" },
          { at: PUSH.from + 0.85, text: "git push -u origin HEAD", type: true },
          { at: PUSH.from + 1.25, text: " * [new branch]  HEAD -> feature/lansering-i-morgen", color: night.ok },
        ]}
      />
    );
  if (t < T.ticket) return <VisualStudio t={t} from={PUSH.to} {...FILE_B} file="Lansering.cs" />;
  if (t < T.standup) return <JiraTicket t={t} at={T.ticket} weeks={T.weeks} />;
  if (t < T.tabs) return <TeamsMeeting t={t} at={T.standup} velocity={T.velocity} />;
  if (t < T.prs) return <Browser t={t} at={T.tabs} />;
  if (t < T.tasks) return <PullRequests t={t} arrive={[T.prs, T.prs + 0.3, T.prsWord, T.open]} creep={T.scope} />;
  if (t < T.wifi) return <JiraList t={t} at={T.tasks} title="Mine saker" scroll />;
  if (t < T.story)
    return (
      <PowerShell
        t={t}
        lines={[
          { at: T.wifi + 0.05, text: "git pull", type: true },
          { at: T.wifi + 0.35, text: "fatal: unable to access remote", color: night.bug },
          { at: T.wifi + 0.45, text: "Could not resolve host: dev.azure.com", color: night.bug },
          { at: T.repo + 0.05, text: "git pull", type: true },
          { at: T.repo + 0.35, text: "fatal: unable to access remote", color: night.bug },
          { at: T.repo + 0.45, text: "Could not resolve host: dev.azure.com", color: night.bug },
        ]}
      />
    );
  if (t < T.bug) return <TaskManager t={t} at={T.story} />;
  if (t < T.who) return <JiraList t={t} at={T.bug} title="Backlog" bug={T.bug + 0.3} />;
  return <TeamsChat t={t} at={T.who} silent={T.silent} />;
};

const activeApp = (t: number): App =>
  t < PUSH.from ? "vs" : t < PUSH.to ? "terminal" : t < T.ticket ? "vs" : t < T.standup ? "jira" : t < T.tabs ? "teams" : t < T.prs ? "edge"
    : t < T.tasks ? "devops" : t < T.wifi ? "jira" : t < T.story ? "terminal" : t < T.bug ? "taskmgr" : t < T.who ? "jira" : "teams";

// Gremlin: to rampestreker i bakgrunnen (en tom skjerm på «Gremlin on the laptop», serverskapet
// på «Wi-Fi hiccup»), ellers borte.
const G = {
  laptop: { enter: [T.gremlin - 0.3, T.gremlin + 0.05], exit: [T.coffee - 0.4, T.coffee - 0.05] },
  rack: { enter: [T.wifi - 0.6, T.wifi - 0.15], yank: T.wifi, exit: [T.wifi + 0.6, T.wifi + 1.0] },
} as const;
const OFF_LEFT = -200;
const AT_LAPTOP = BACK_MONITORS[0].x + BACK_MONITORS[0].w / 2;
const AT_RACK = 255;

const gremlinAt = (t: number) => {
  const { laptop, rack } = G;
  const x = interpolate(
    t,
    [laptop.enter[0], laptop.enter[1], laptop.exit[0], laptop.exit[1], rack.enter[0], rack.enter[1], rack.exit[0], rack.exit[1]],
    [OFF_LEFT, AT_LAPTOP, AT_LAPTOP, OFF_LEFT, OFF_LEFT, AT_RACK, AT_RACK, OFF_LEFT],
    clamp,
  );
  if (x <= OFF_LEFT) return null;
  const runs = [laptop.enter, laptop.exit, rack.enter, rack.exit];
  const running = runs.some((r) => t > r[0] && t < r[1]);
  const walk = t * 22;
  const peek = interpolate(t, [laptop.enter[1], laptop.enter[1] + 0.15, laptop.exit[0], laptop.exit[0] + 0.12], [0, 1, 1, 0], clamp);
  let arms: Arms = POSES.hang;
  if (peek > 0) {
    const grip = mixArms(POSES.hang, POSES.grip, peek);
    const tap = 10 * Math.sin(t * 34);
    arms = { l: [grip.l[0], grip.l[1] + tap], r: [grip.r[0], grip.r[1] - tap] };
  } else if (t > rack.enter[1] && t < rack.yank) arms = POSES.reachLeft;
  else if (t >= rack.yank && t < rack.exit[0]) arms = mixArms(POSES.reachLeft, POSES.hang, interpolate(t, [rack.yank, rack.yank + 0.15], [0, 1], clamp));
  return {
    x,
    y: 430 + 25 * peek - (running ? Math.abs(Math.sin(walk)) * 12 : 0),
    walk: running ? walk : 0,
    arms,
    eyes: 1,
    look: peek > 0 ? 0 : t < rack.exit[0] && t > rack.enter[0] ? -1 : 1,
    grin: t > T.magic || t > rack.yank ? 1 : 0.5,
  };
};

// «Who touched prod?»: Gremlin lener seg inn fra venstre og ser uskyldig bort … til han gliser.
const Innocent: React.FC<{ t: number }> = ({ t }) => {
  const at = T.who + 0.25;
  if (t < at) return null;
  const inside = interpolate(t, [at, at + 0.25, VERSE1_END - 0.25, VERSE1_END], [0, 1, 1, 0], clamp);
  const grin = interpolate(t, [T.silent - 0.4, T.silent - 0.25], [0, 1], clamp);
  return (
    <GremlinFigure
      opacity={GREMLIN_DIM}
      x={-150 + 260 * inside}
      y={470}
      width={260}
      arms={POSES.hang}
      eyes={grin > 0 ? 1 : 0.45}
      look={grin > 0 ? 1 : -1}
      grin={grin}
      tilt={20}
    />
  );
};

export const Verse1: React.FC<{ t: number }> = ({ t }) => {
  const pop = (a: number, b: number) => interpolate(t, [a, a + 0.1, a + 0.18, b, b + 0.15], [0, 1.15, 1, 1, 0], clamp);
  const typing = t < T.ticket || (t > T.wifi && t < T.repo + 0.5);
  const stressed = t > T.stress && t < T.bug;
  const sway = stressed ? Math.sin(t * 34) * 4 : typing ? Math.sin(t * 9) * 2.5 : 0;
  const vein = Math.max(pop(T.slack + 0.25, T.hair), pop(T.weeks + 0.05, T.standup - 0.1), pop(T.stress - 0.3, T.bug - 0.2));
  const grawlix = Math.max(pop(T.trackpad + 0.2, T.ticket - 0.2), pop(T.repo, T.story - 0.1));
  const spin = (from: number) => (t > from ? 2.6 * (1 - Math.exp(-(t - from) * 1.2)) : 0);
  // Sirenen blinker på slagene mens buggen blinker i backloggen.
  const sirenOn = t > T.bug + 0.3 && t < T.who;
  const siren = sirenOn ? Math.pow(Math.max(0, Math.cos(2 * Math.PI * beatPos(t))), 2) : 0;
  const gremlin = gremlinAt(t);

  return (
    <AbsoluteFill>
      <Stage
        t={t}
        desktop={
          <>
            <Screen t={t} />
            <Taskbar active={activeApp(t)} badges={badges(t)} offline={t > T.wifi && t < T.story} />
            {TOASTS.map((x) => (
              <Toast key={x.at} t={t} {...x} />
            ))}
          </>
        }
        dev={{ sway, vein: vein * (1 + 0.12 * Math.sin(t * 25)), grawlix }}
        gremlin={gremlin ? { width: 220, ...gremlin } : null}
        rackChaos={interpolate(t, [T.wifi, T.wifi + 0.15, T.story - 0.3, T.story], [0, 1, 1, 0], clamp)}
        backGlitch={[interpolate(t, [T.keystroke - 0.4, T.keystroke - 0.2, T.coffee, T.coffee + 0.3], [0, 1, 1, 0], clamp), 0]}
        backGlitchColor={[night.eyes]}
        chairSpin={[spin(G.laptop.enter[0] + 0.2), 0]}
        mug={{
          claw: interpolate(t, [T.trackpad - 0.5, T.trackpad - 0.1, T.trackpad + 0.1, T.trackpad + 0.45], [0, 1, 1, 0], clamp),
          tip: interpolate(t, [T.trackpad - 0.08, T.trackpad + 0.06], [0, 1], clamp),
          spill: interpolate(t, [T.trackpad, T.trackpad + 0.6], [0, 1], clamp),
        }}
        siren={siren}
        popIns={<Innocent t={t} />}
        overlay={<Phrases t={t} phrases={PHRASES} x={60} y={110} />}
      />
    </AbsoluteFill>
  );
};
