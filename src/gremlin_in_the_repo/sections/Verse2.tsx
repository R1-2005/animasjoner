import { AbsoluteFill, interpolate } from "remotion";
import { ChatThread, DeployStack, DocScroll, Ouija, RefactorView, SqlEditor, TeamsMeeting, TestExplorer, TvDrama } from "../Apps";
import { beatPos, kick, word } from "../beat";
import { Smoke } from "../Effects";
import { Arms, GremlinFigure, mixArms, POSES } from "../GremlinFigure";
import { BACK_MONITORS, DESK_TOP, MONITOR, RACK, SCREEN_CENTER } from "../Office";
import { Phrase, Phrases } from "../Phrases";
import { App, PowerShell, Taskbar, Toast, VisualStudio } from "../Screen";
import { GREMLIN_DIM, Stage } from "../Stage";
import { fonts, night } from "../look";

// Vers 2 (V2.1–V2.17). Først kvalitetstid: «Ikke forstyrr», trylleformler i koden, refaktorering
// der kiropraktoren knekker linjene på plass, og en docstring lengre enn retroen. Så kaoset:
// Teams fryser midt i en grimase, ledelsen pivoterer, SQL-spørringen svarer «Prepare to die»,
// databasedrama som TV-serie, rollback med hendene i været, bønn til skjemaet på et ouija-brett,
// flaky tester, «jeg så det i staging!» i trommestoppet (D8), én knapp som setter hele stacken
// i brann, og Gremlin som ler og hoster i røyken.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const L = word;

export const VERSE2_START = L("V2.1", 0);
export const VERSE2_END = L("C2.1", 0);

const T = {
  narration: L("V2.1", 5),
  type: L("V2.2", 0),
  refactor: L("V2.3", 0),
  raptor: L("V2.3", 1),
  chiro: L("V2.3", 3),
  doc: L("V2.4", 0),
  retro: L("V2.4", 5),
  zoom: L("V2.5", 0),
  froze: L("V2.5", 1),
  grimace: L("V2.5", 5),
  boss: L("V2.6", 0),
  pivot: L("V2.6", 6),
  sql: L("V2.7", 0),
  anime: L("V2.7", 4),
  hit: L("V2.8", 0),
  prepare: L("V2.8", 6),
  to: L("V2.8", 7),
  die: L("V2.8", 8),
  got: L("V2.9", 0),
  invalid: L("V2.10", 0),
  ambiguous: L("V2.10", 2),
  database: L("V2.11", 0),
  rollback: L("V2.12", 0),
  fall: L("V2.12", 1),
  hands: L("V2.12", 3),
  pray: L("V2.13", 0),
  weeboard: L("V2.13", 7),
  unit: L("V2.14", 0),
  stake: L("V2.14", 3),
  saw: L("V2.15", 0),
  nah: L("V2.15", 5),
  click: L("V2.16", 0),
  button: L("V2.16", 2),
  smokin: L("V2.16", 5),
  gremlin: L("V2.17", 0),
  laughin: L("V2.17", 4),
  chokin: L("V2.17", 6),
};

const w = (text: string, at: number, color?: string) => ({ text, at, color });
const PHRASES: Phrase[] = [
  { lines: [[w("Nasally", L("V2.1", 4), night.glow)], [w("narration", T.narration)]], until: T.type - 0.1 },
  { size: 80, lines: [[w("Dissertation", L("V2.2", 4))], [w("incantations", L("V2.2", 5), night.merge)]], until: T.refactor - 0.1 },
  { lines: [[w("Refactor", T.refactor)], [w("raptor", T.raptor, night.ok)]], until: L("V2.3", 2) - 0.05 },
  { size: 80, lines: [[w("Syntax", L("V2.3", 2))], [w("chiropractor", T.chiro, night.glow)]], until: T.doc - 0.1 },
  { lines: [[w("Docstring", T.doc, night.code.comment)]], until: T.zoom - 0.1 },
  { lines: [[w("Zoom", T.zoom), w("froze", T.froze, night.glow)]], until: T.grimace - 0.05 },
  { lines: [[w("Mid-grimace", T.grimace, night.boom)]], until: T.boss - 0.1 },
  { lines: [[w("Instant", L("V2.6", 4))], [w("image", L("V2.6", 5)), w("pivot", T.pivot, night.merge)]], until: T.sql - 0.1 },
  { lines: [[w("Anime", T.anime, "#FF9AD5"), w("eyes", L("V2.7", 5))]], until: T.hit - 0.1 },
  { lines: [[w("Prepare", T.prepare, night.bug)], [w("to", T.to), w("die", T.die, night.bug)]], until: T.invalid - 0.05 },
  { size: 84, lines: [[w("Invalid", T.invalid), w("column", L("V2.10", 1), night.bug)]], until: T.ambiguous - 0.05 },
  { size: 84, lines: [[w("Ambiguous", T.ambiguous)], [w("reference", L("V2.10", 3), night.bug)]], until: T.database - 0.1 },
  { lines: [[w("Database", T.database)], [w("drama", L("V2.11", 1), night.bug)]], until: T.rollback - 0.1 },
  { lines: [[w("Rollback", T.rollback, night.boom)]], until: T.hands - 0.05 },
  { size: 90, lines: [[w("Hands", T.hands), w("off", L("V2.12", 4))], [w("keyboard", L("V2.12", 5), night.glow)]], until: T.pray - 0.1 },
  { size: 90, lines: [[w("Prayin’", T.pray, "#E8D2A8")], [w("to", L("V2.13", 1)), w("the", L("V2.13", 2)), w("schema", L("V2.13", 3))]], until: T.unit - 0.1 },
  { lines: [[w("Flakin’", L("V2.14", 2), night.bug)]], until: L("V2.14", 4) - 0.05 },
  { lines: [[w("Shakin’", L("V2.14", 4), night.boom)]], until: T.saw - 0.1 },
  { lines: [[w("Staging!", L("V2.15", 4), night.ok)]], until: T.nah - 0.05 },
  { lines: [[w("Fakin’", L("V2.15", 7), night.bug)]], until: T.click - 0.1 },
  { lines: [[w("One", L("V2.16", 1)), w("button", T.button, night.glow)]], until: T.smokin - 0.05 },
  { lines: [[w("Smokin’", T.smokin, night.boom)]], until: T.gremlin - 0.1 },
  { size: 90, lines: [[w("Laughin’", T.laughin, night.eyes)], [w("and", L("V2.17", 5)), w("chokin’", T.chokin)]], until: VERSE2_END - 0.1 },
];

const WRITTEN = ["public static class Trylleformler", "{"];
const TYPED = [
  "    /// <summary>",
  "    /// Herved påkalles den hellige metoden,",
  "    /// som returnerer det den returnerer.",
  "    /// </summary>",
  "    public Resultat Påkall(Ritual r) => r.Utfør();",
];

const TOASTS: { at: number; until: number; app: App; from: string; title: string; body: string; slot?: number; shake?: boolean }[] = [
  { at: T.boss + 0.9, until: T.sql - 0.2, app: "outlook", from: "Outlook", title: "Ledelsen", body: "Kan du lage en slide på det?" },
  { at: T.invalid + 1.4, until: T.database - 0.1, app: "teams", from: "Microsoft Teams", title: "DBA", body: "Hvem kjørte noe mot prod?" },
  { at: T.stake, until: T.saw - 0.1, app: "outlook", from: "Outlook", title: "Interessent", body: "Er det trygt?", shake: true },
  { at: T.stake + 0.15, until: T.saw - 0.05, app: "teams", from: "Microsoft Teams", title: "Interessent", body: "Bør vi være bekymret?", slot: 1, shake: true },
  { at: T.stake + 0.3, until: T.saw, app: "slack", from: "Slack", title: "Interessent", body: "Jeg er bekymret.", slot: 2, shake: true },
];

const Screen: React.FC<{ t: number }> = ({ t }) => {
  if (t < T.refactor) return <VisualStudio t={t} from={VERSE2_START} written={WRITTEN} typed={TYPED} file="Trylleformler.cs" />;
  if (t < T.doc) return <RefactorView t={t} menu={T.raptor} snap={T.chiro} />;
  if (t < T.zoom) return <DocScroll t={t} at={T.doc} retro={T.retro} />;
  if (t < T.boss)
    return (
      <TeamsMeeting
        t={t}
        at={T.zoom - 0.3}
        velocity={T.froze + 0.4}
        title="Prosjektmøte"
        speaker="Deg"
        caption="…og da sa den andre utvikleren: «det funker på min ma—"
        frozen={T.froze + 0.1}
        selfCam
      />
    );
  if (t < T.sql)
    return (
      <ChatThread
        t={t}
        channel="#ledelsen"
        pivot={T.pivot}
        messages={[
          { at: T.boss + 0.15, who: "Ledelsen", initials: "LE", color: "#C4314B", text: "Haha! Godt poeng." },
          { at: L("V2.6", 3), who: "Ledelsen", initials: "LE", color: "#C4314B", text: "Da pivoterer vi alt." },
        ]}
      />
    );
  if (t < T.got) return <SqlEditor t={t} at={T.sql} sparkle={T.anime} run={T.hit + 0.05} rows={[T.prepare, T.to, T.die]} />;
  if (t < T.database)
    return (
      <SqlEditor
        t={t}
        at={T.sql}
        sparkle={1e9}
        run={T.hit + 0.05}
        rows={[0, 0, 0]}
        errors={[
          { at: T.invalid, text: "Msg 207, Nivå 16: Invalid column name 'Navn'." },
          { at: T.ambiguous, text: "Msg 209, Nivå 16: Ambiguous column name 'Id'." },
        ]}
      />
    );
  if (t < T.rollback) return <TvDrama t={t} at={T.database} />;
  if (t < T.pray)
    return (
      <PowerShell
        t={t}
        lines={[
          { at: T.rollback + 0.05, text: "git revert HEAD --no-edit", type: true },
          { at: T.rollback + 0.5, text: '[main 4b1d0e5] Revert "Fiks alt"' },
          { at: T.fall + 0.05, text: "git reset --hard HEAD~3", type: true },
          { at: T.fall + 0.5, text: "HEAD is now at a1b2c3d Fungerte på fredag", color: night.boom },
        ]}
      />
    );
  if (t < T.unit) return <Ouija t={t} at={T.pray} answer={T.weeboard} />;
  if (t < T.saw) return <TestExplorer t={t} beat={beatPos(t)} />;
  if (t < T.click)
    return (
      <ChatThread
        t={t}
        channel="#test"
        messages={[
          { at: T.saw, who: "Kari (Test)", initials: "KN", color: "#0F6CBD", text: "Jeg så det i staging!" },
          { at: T.nah, who: "Deg", initials: "DU", color: "#5C5C5C", text: "Nei, det er fake." },
        ]}
      />
    );
  return <DeployStack t={t} click={T.button} />;
};

const activeApp = (t: number): App =>
  t < T.zoom ? "vs" : t < T.sql ? "teams" : t < T.rollback ? (t < T.database ? "devops" : "edge") : t < T.pray ? "terminal" : t < T.unit ? "devops" : t < T.saw ? "vs" : t < T.click ? "teams" : "devops";

const badges = (t: number): Partial<Record<App, string>> => {
  const busy = Math.max(0, t - T.zoom);
  return { outlook: "99+", teams: "99+", slack: String(64 + Math.floor(busy / 2)), jira: String(41 + Math.floor(busy / 2.5)) };
};

// Gremlin: smyger inn og taster på en tom skjerm mens SQL-spørringen kjøres («prepare to die» er hans
// verk), og lener seg inn til slutt, ler og hoster i røyken.
const LAPTOP = { enter: [T.anime - 0.2, T.anime + 0.25], exit: [T.got - 0.1, T.got + 0.3] } as const;
const AT_SCREEN = BACK_MONITORS[1].x + BACK_MONITORS[1].w / 2;
const gremlinAt = (t: number) => {
  const x = interpolate(t, [LAPTOP.enter[0], LAPTOP.enter[1], LAPTOP.exit[0], LAPTOP.exit[1]], [-200, AT_SCREEN, AT_SCREEN, 820], clamp);
  if (x <= -200 || x >= 820) return null;
  const running = (t > LAPTOP.enter[0] && t < LAPTOP.enter[1]) || (t > LAPTOP.exit[0] && t < LAPTOP.exit[1]);
  const walk = t * 22;
  const peek = interpolate(t, [LAPTOP.enter[1], LAPTOP.enter[1] + 0.15, LAPTOP.exit[0], LAPTOP.exit[0] + 0.12], [0, 1, 1, 0], clamp);
  const grip = mixArms(POSES.hang, POSES.grip, peek);
  const tap = t > T.hit ? 10 * Math.sin(t * 34) : 0;
  const arms: Arms = { l: [grip.l[0], grip.l[1] + tap], r: [grip.r[0], grip.r[1] - tap] };
  return { x, y: 430 + 25 * peek - (running ? Math.abs(Math.sin(walk)) * 12 : 0), walk: running ? walk : 0, arms, eyes: 1, look: 0, grin: 1 };
};

const LaughAndChoke: React.FC<{ t: number }> = ({ t }) => {
  const at = T.gremlin + 0.9;
  const dt = t - at;
  if (dt < 0) return null;
  const inside = interpolate(t, [at, at + 0.15, VERSE2_END - 0.3, VERSE2_END], [0, 1, 1, 0], clamp);
  const choking = t > T.chokin;
  const cough = choking ? Math.abs(Math.sin((t - T.chokin) * 18)) : 0;
  return (
    <>
      <GremlinFigure
        opacity={GREMLIN_DIM}
        x={-150 + 250 * inside}
        y={470 - (choking ? 0 : Math.abs(Math.sin(dt * 14)) * 8) + cough * 10}
        width={260}
        arms={choking ? POSES.rub : POSES.belly}
        grin={choking ? 0.6 : 1}
        open={choking ? 0.3 + 0.4 * cough : Math.abs(Math.sin(dt * 14))}
        eyes={choking ? 0.5 : 1}
        look={1}
        tilt={20 + (choking ? cough * 12 : Math.sin(dt * 22) * 6)}
      />
      {choking &&
        [0, 1, 2].map((k) => {
          const a = ((t - T.chokin) * 1.6 + k / 3) % 1;
          return (
            <div
              key={k}
              style={{
                position: "absolute",
                left: -150 + 250 * inside + 70 + a * 90,
                top: 470 + 20 - a * 70,
                width: 30 + a * 50,
                height: 30 + a * 50,
                borderRadius: "50%",
                background: "#8A93A6",
                opacity: 0.5 * (1 - a),
              }}
            />
          );
        })}
    </>
  );
};

// Tegneserieord og glitter ved utvikleren.
const Comic: React.FC<{ t: number; at: number; text: string; x: number; y: number; size?: number; rot?: number }> = ({ t, at, text, x, y, size = 110, rot = -8 }) => {
  const dt = t - at;
  if (dt < 0 || dt > 0.5) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        fontFamily: fonts.display,
        fontSize: size,
        color: night.boom,
        WebkitTextStroke: `4px ${night.black}`,
        transform: `translate(-50%, -50%) scale(${interpolate(dt, [0, 0.08, 0.5], [1.7, 1, 0.9], clamp)}) rotate(${rot}deg)`,
        opacity: interpolate(dt, [0.35, 0.5], [1, 0], clamp),
      }}
    >
      {text}
    </div>
  );
};
const AnimeSparkles: React.FC<{ t: number; from: number; to: number }> = ({ t, from, to }) => {
  if (t < from || t > to) return null;
  const cx = SCREEN_CENTER.x + 80;
  return (
    <>
      {Array.from({ length: 8 }, (_, k) => {
        const ang = (k / 8) * Math.PI * 2 + t * 1.5;
        const a = Math.abs(Math.sin(t * 6 + k));
        return (
          <div key={k} style={{ position: "absolute", left: cx + Math.cos(ang) * 200 - 16, top: DESK_TOP - 10 + Math.sin(ang) * 90 - 20, fontSize: 30 + a * 24, color: ["#FFD27A", "#FF9AD5", "#9FE8FF"][k % 3], opacity: a }}>
            ✦
          </div>
        );
      })}
    </>
  );
};
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

export const Verse2: React.FC<{ t: number }> = ({ t }) => {
  const k = kick(t);
  const quality = t < T.zoom;
  // Når bildet fryser (Teams) og i trommestoppet (D8) står utvikleren helt stille.
  const frozen = (t > T.froze + 0.1 && t < T.boss) || (t > T.saw + 0.3 && t < T.click);
  const pop = (a: number, b: number) => interpolate(t, [a, a + 0.1, a + 0.18, b, b + 0.15], [0, 1.15, 1, 1, 0], clamp);
  const fastTyping = t > T.type && t < T.refactor;
  const flaky = t > T.unit && t < T.saw;
  const sway = frozen ? 0 : quality ? (fastTyping ? Math.sin(t * 12) * 2.5 : Math.sin(t * 4.4) * 3) : flaky ? Math.sin(t * 30) * 2 : 0;
  const jolt = interpolate(t, [T.button + 0.3, T.button + 0.38, T.button + 0.8], [0, -26, 0], clamp);
  const bob = frozen ? -k * 6 : quality ? k * 8 : jolt;
  const vein = Math.max(pop(T.invalid + 0.1, T.database - 0.1), pop(T.stake, T.saw)) * (1 + 0.12 * Math.sin(t * 25));
  const grawlix = Math.max(pop(T.pivot, T.sql - 0.1), pop(T.smokin, T.gremlin + 0.6));
  const hands = interpolate(t, [T.hands - 0.1, T.hands + 0.15, T.unit - 0.3, T.unit], [0, 1, 1, 0], clamp);
  const pray = interpolate(t, [T.pray - 0.2, T.pray + 0.1], [0, 1], clamp);
  const gremlin = gremlinAt(t);

  return (
    <AbsoluteFill>
      <Stage
        t={t}
        desktop={
          <>
            <Screen t={t} />
            <Taskbar active={activeApp(t)} badges={badges(t)} focus={quality} />
            {TOASTS.map((x) => (
              <AbsoluteFill key={x.at} style={{ transform: x.shake && t > x.at ? `translate(${Math.sin(t * 60) * 6}px, ${Math.cos(t * 47) * 3}px)` : "none" }}>
                <Toast t={t} {...x} />
              </AbsoluteFill>
            ))}
          </>
        }
        dev={{ bob, sway, vein, grawlix, hands, pray }}
        gremlin={gremlin ? { width: 220, ...gremlin } : null}
        backGlitch={[0, interpolate(t, [T.hit, T.hit + 0.15, T.got, T.got + 0.3], [0, 1, 1, 0], clamp)]}
        rackChaos={interpolate(t, [T.button + 0.3, T.button + 0.5], [0, 1], clamp)}
        popIns={<LaughAndChoke t={t} />}
        overlay={
          <>
            <Notes t={t} amount={interpolate(t, [VERSE2_START, VERSE2_START + 0.4, T.zoom - 0.4, T.zoom], [0, 1, 1, 0], clamp)} />
            <AnimeSparkles t={t} from={T.anime} to={T.hit} />
            <Comic t={t} at={T.chiro} text="KNAKK!" x={SCREEN_CENTER.x} y={SCREEN_CENTER.y - 40} size={150} />
            <Smoke
              t={t}
              from={T.button + 0.35}
              sources={[
                ...Array.from({ length: 8 }, (_, i) => ({ x: MONITOR.x + 80 + i * 140, y: MONITOR.y + 10 })),
                { x: RACK.x + RACK.w / 2, y: RACK.y },
                { x: RACK.x + RACK.w / 2 + 30, y: RACK.y },
              ]}
            />
            <Phrases t={t} phrases={PHRASES} x={60} y={110} />
          </>
        }
      />
    </AbsoluteFill>
  );
};
