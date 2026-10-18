import { interpolate, random } from "remotion";
import { theme } from "../style/theme";
import { fonts, night } from "./look";
import { SCREEN } from "./Office";
import { TASKBAR, Window } from "./Screen";

// Flere vinduer til skjermen: Jira, Teams, nettleseren, pull requests, Oppgavebehandling.
// Alle tar låttid t og tidspunktene de skal reagere på, og fyller et maksimert Windows-vindu.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const { win } = night;
const ui = theme.fonts.sans;
const W = SCREEN.w;
const H = SCREEN.h - TASKBAR - 40;

const Pill: React.FC<{ text: string; bg: string; color?: string; size?: number; strike?: boolean }> = ({
  text,
  bg,
  color = "#FFFFFF",
  size = 18,
  strike = false,
}) => (
  <span
    style={{
      display: "inline-block",
      padding: "4px 12px",
      borderRadius: 6,
      background: bg,
      color,
      fontFamily: ui,
      fontWeight: 700,
      fontSize: size,
      textDecoration: strike ? "line-through" : "none",
      textDecorationThickness: 3,
    }}
  >
    {text}
  </span>
);

const Stamp: React.FC<{ t: number; at: number; text: string; x: number; y: number; size?: number }> = ({
  t,
  at,
  text,
  x,
  y,
  size = 130,
}) => {
  if (t < at) return null;
  const s = interpolate(t, [at, at + 0.12], [2.2, 1], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${s}) rotate(-12deg)`,
        padding: "4px 26px",
        border: `8px solid ${night.bug}`,
        borderRadius: 14,
        color: night.bug,
        fontFamily: fonts.display,
        fontSize: size,
        lineHeight: 1.05,
        opacity: interpolate(t, [at, at + 0.06], [0, 0.95], clamp),
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
};

// Jira-saken som skulle være «enkel»: story points klatrer Fibonacci, statusen hopper fram og
// tilbake, deloppgavene hoper seg opp, logget tid løper, og så stemplet «7 UKER».
const FIB = ["1", "2", "3", "5", "8", "13", "21", "40", "?"];
const STATUS = [
  { text: "TO DO", bg: "#42526E" },
  { text: "IN PROGRESS", bg: "#0052CC" },
  { text: "IN REVIEW", bg: "#6554C0" },
  { text: "IN PROGRESS", bg: "#0052CC" },
  { text: "BLOCKED", bg: "#DE350B" },
];
const SUBTASKS = [
  "Avklare krav",
  "Avklare krav på nytt",
  "Møte om møtet",
  "Oppdatere én avhengighet",
  "Refaktorere alt",
  "Workshop: hva er en knapp?",
  "Rulle tilbake",
];
const logged = (hours: number) =>
  hours < 8 ? `${Math.round(hours)}t` : hours < 40 ? `${Math.floor(hours / 8)}d` : `${Math.floor(hours / 40)}u ${Math.floor((hours % 40) / 8)}d`;

export const JiraTicket: React.FC<{ t: number; at: number; weeks: number }> = ({ t, at, weeks }) => {
  const p = Math.max(0, t - at);
  const done = t >= weeks;
  const points = FIB[Math.min(FIB.length - 1, Math.floor(p / 0.2))];
  const status = STATUS[Math.floor(p / 0.38) % STATUS.length];
  const hours = done ? 7 * 40 + 16 : Math.min(7 * 40, Math.pow(2, p * 3.6));
  const subtasks = SUBTASKS.slice(0, Math.min(SUBTASKS.length, Math.floor(p / 0.25)));
  return (
    <Window app="jira" title="GRM-1337 — Jira">
      <div style={{ position: "absolute", inset: 0, background: "#1D2125", fontFamily: ui, color: "#C7D1DB", padding: "22px 34px" }}>
        <div style={{ fontSize: 19, color: "#8C9BAB" }}>Prosjekter / Gremlin / GRM-1337</div>
        <div style={{ fontSize: 40, fontWeight: 800, color: "#E6EDF3", margin: "8px 0 18px" }}>Endre teksten på én knapp</div>
        <div style={{ display: "flex", gap: 40 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 21, fontWeight: 700, marginBottom: 10 }}>Deloppgaver ({subtasks.length})</div>
            {subtasks.map((s, i) => (
              <div key={s} style={{ fontSize: 23, padding: "6px 12px", marginBottom: 6, background: "#22272B", borderRadius: 6, display: "flex", gap: 12 }}>
                <span style={{ color: "#4BCE97" }}>☐</span>
                <span style={{ color: "#8C9BAB" }}>GRM-{1338 + i}</span>
                {s}
              </div>
            ))}
          </div>
          <div style={{ width: 380, fontSize: 22, display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <Pill text={status.text} bg={status.bg} size={22} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              Story points
              <span style={{ fontSize: 46, fontWeight: 800, color: points === "?" ? night.bug : "#E6EDF3" }}>{points}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              Estimat <span style={{ color: "#E6EDF3" }}>1t</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              Logget tid <span style={{ color: done ? night.bug : "#E6EDF3", fontWeight: 700 }}>{logged(hours)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              Etiketter <Pill text="enkel" bg="#1F845A" strike={done} />
            </div>
          </div>
        </div>
        <Stamp t={t} at={weeks} text="7 UKER" x={W * 0.42} y={H * 0.55} />
      </div>
    </Window>
  );
};

// Teams-møtet «Daglig standup»: alle har kamera av, egen flis sier pysjamas, tekstingen snakker velocity.
const PEOPLE = [
  { name: "Ledelsen", initials: "LE", color: "#C4314B" },
  { name: "Scrum Master", initials: "SM", color: "#8764B8", speaking: true },
  { name: "Kari", initials: "KN", color: "#0F6CBD" },
  { name: "Ola", initials: "ON", color: "#107C10" },
  { name: "Per", initials: "PH", color: "#CA5010" },
  { name: "Deg · kamera av · pysjamas", initials: "DU", color: "#5C5C5C" },
];
// frozen: tidspunktet bildet fryser (tilkoblingen er ustabil); selfCam: egen flis har kamera på
// (et frosset, pikselert ansikt midt i en grimase).
export const TeamsMeeting: React.FC<{
  t: number;
  at: number;
  velocity: number;
  title?: string;
  speaker?: string;
  caption?: string;
  frozen?: number;
  selfCam?: boolean;
}> = ({
  t: now,
  at,
  velocity,
  title = "Daglig standup",
  speaker = "Scrum Master",
  caption = "…så hvis vi ser på velocity-en vår denne sprinten…",
  frozen,
  selfCam = false,
}) => {
  const isFrozen = frozen !== undefined && now >= frozen;
  const t = isFrozen ? frozen : now;
  const shown = Math.floor(interpolate(t, [at + 0.3, velocity + 0.2], [0, caption.length], clamp));
  return (
    <Window app="teams" title={`${title} | Microsoft Teams`}>
      <div style={{ position: "absolute", inset: 0, background: "#1F1F1F", padding: 18, fontFamily: ui, filter: isFrozen ? "grayscale(0.7)" : "none" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, height: H - 110 }}>
          {PEOPLE.map((p) => (
            <div
              key={p.name}
              style={{
                background: "#2B2B2B",
                borderRadius: 8,
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                outline: p.speaking ? `3px solid #7F85F5` : "none",
                outlineOffset: -3,
              }}
            >
              {selfCam && p.initials === "DU" ? (
                <FrozenFace />
              ) : (
              <div
                style={{
                  width: 86,
                  height: 86,
                  borderRadius: "50%",
                  background: p.color,
                  color: "#FFFFFF",
                  fontSize: 32,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: p.speaking ? `scale(${1 + 0.06 * Math.abs(Math.sin(t * 12))})` : "none",
                }}
              >
                {p.initials}
              </div>
              )}
              <div style={{ position: "absolute", left: 12, bottom: 8, fontSize: 18, color: win.text }}>
                {selfCam && p.initials === "DU" ? "Deg · kamera på" : p.name}
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, padding: "12px 18px", background: "#141414", borderRadius: 8, fontSize: 26, color: win.text, height: 70 }}>
          <span style={{ color: "#B4A0FF", fontWeight: 700 }}>{speaker}: </span>
          {caption.slice(0, shown)}
        </div>
        {isFrozen && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 18,
              transform: "translateX(-50%)",
              padding: "10px 22px",
              background: "#3B2A00",
              border: "2px solid #E8A33D",
              borderRadius: 8,
              color: "#FFD27A",
              fontSize: 24,
              fontWeight: 700,
              display: "flex",
              gap: 14,
              alignItems: "center",
            }}
          >
            <span style={{ display: "inline-block", transform: `rotate(${now * 400}deg)` }}>◌</span>
            Tilkoblingen din er ustabil
          </div>
        )}
      </div>
    </Window>
  );
};

// Et frosset, pikselert ansikt midt i en grimase (egen kamerafis i Teams).
const FrozenFace: React.FC = () => (
  <svg width={170} height={150} viewBox="0 0 17 15" shapeRendering="crispEdges">
    {Array.from({ length: 15 }, (_, y) =>
      Array.from({ length: 17 }, (_, x) => {
        const dx = (x - 8) / 6;
        const dy = (y - 7) / 6.5;
        const face = dx * dx + dy * dy < 1;
        const hood = !face && dx * dx + dy * dy < 1.7;
        const shade = 0.85 + 0.15 * random(`face${x}-${y}`);
        const c = face ? `rgb(${Math.round(214 * shade)},${Math.round(170 * shade)},${Math.round(140 * shade)})` : hood ? "#1A1F2A" : "#3A3F4A";
        return <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={c} />;
      }),
    )}
    <rect x={5} y={5} width={2} height={2} fill="#1A1A1A" />
    <rect x={10} y={6} width={2} height={1} fill="#1A1A1A" />
    <rect x={5} y={10} width={7} height={1} fill="#7A2A2A" />
    <rect x={6} y={11} width={1} height={1} fill="#FFFFFF" />
    <rect x={8} y={11} width={1} height={1} fill="#FFFFFF" />
    <rect x={10} y={11} width={1} height={1} fill="#FFFFFF" />
  </svg>
);

// Nettleseren med fanene som formerer seg; den aktive er Stack Overflow om vim.
const TAB_TITLES = ["Stack Overflow", "MDN", "Jira", "Hvordan sentrere en div", "regex101", "Confluence", "NuGet", "Azure Portal"];
export const Browser: React.FC<{ t: number; at: number }> = ({ t, at }) => {
  const n = Math.round(6 * Math.pow(25, interpolate(t, [at, at + 1.9], [0, 1], clamp)));
  const tabW = Math.max(9, (W - 160) / n);
  return (
    <Window app="edge" title={`Hvordan avslutter jeg vim? — Stack Overflow — ${n} faner`}>
      <div style={{ position: "absolute", inset: 0, background: "#202124", fontFamily: ui }}>
        <div style={{ height: 46, display: "flex", alignItems: "flex-end", padding: "0 8px", gap: 1, overflow: "hidden", background: "#121212" }}>
          {Array.from({ length: n }, (_, i) => (
            <div
              key={i}
              style={{
                width: tabW,
                height: 36,
                flexShrink: 0,
                background: i === 0 ? "#2B2B2B" : "#1A1A1A",
                borderRadius: "6px 6px 0 0",
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "0 6px",
                overflow: "hidden",
                whiteSpace: "nowrap",
                fontSize: 15,
                color: win.dim,
              }}
            >
              <div style={{ width: 12, height: 12, borderRadius: 3, flexShrink: 0, background: ["#F48024", "#0F6CBD", "#2684FF", "#4CC2FF"][i % 4] }} />
              {tabW > 70 && TAB_TITLES[i % TAB_TITLES.length]}
            </div>
          ))}
          <div style={{ marginLeft: "auto", padding: "0 10px 8px", color: win.text, fontWeight: 700, fontSize: 18 }}>{n}</div>
        </div>
        <div style={{ padding: "26px 40px", color: "#E8EAED" }}>
          <div style={{ fontSize: 36, fontWeight: 700 }}>Hvordan avslutter jeg vim?</div>
          <div style={{ fontSize: 18, color: win.dim, margin: "6px 0 22px" }}>Spurt for 13 år siden · Sett 3,1 mill. ganger</div>
          <div style={{ display: "flex", gap: 26, alignItems: "flex-start" }}>
            <div style={{ fontSize: 34, fontWeight: 800, textAlign: "center", color: night.ok }}>
              4812
              <div style={{ fontSize: 16, color: win.dim }}>stemmer</div>
            </div>
            <div style={{ fontSize: 25, lineHeight: 1.5 }}>
              Trykk <code style={{ fontFamily: fonts.mono, background: "#3A3A3A", padding: "2px 8px" }}>Esc</code>, skriv{" "}
              <code style={{ fontFamily: fonts.mono, background: "#3A3A3A", padding: "2px 8px" }}>:q!</code> og trykk Enter.
              <br />
              <span style={{ color: win.dim }}>Hvis det ikke virker: kjøp ny PC.</span>
            </div>
          </div>
        </div>
      </div>
    </Window>
  );
};

// Azure DevOps › Pull requests: fire PR-er dukker opp, og så kryper scopet: diffene vokser.
const PRS = [
  { title: "Liten fiks i knappetekst", branch: "feature/knappetekst", add: 12, del: 3 },
  { title: "Hotfix for hotfixen", branch: "hotfix/hotfix-2-final", add: 4, del: 1 },
  { title: "Oppdater én avhengighet", branch: "chore/en-avhengighet", add: 2, del: 2 },
  { title: "Rydd litt (+ litt til)", branch: "refactor/litt", add: 30, del: 8 },
];
const num = (n: number) => Math.round(n).toLocaleString("nb-NO");
export const PullRequests: React.FC<{ t: number; arrive: number[]; creep: number }> = ({ t, arrive, creep }) => {
  const grow = Math.pow(2, Math.max(0, t - creep) * 9);
  return (
    <Window app="devops" title="Pull requests — Repos — Azure DevOps">
      <div style={{ position: "absolute", inset: 0, background: "#1E1E1E", fontFamily: ui, padding: "20px 30px" }}>
        <div style={{ fontSize: 30, fontWeight: 800, color: win.text, marginBottom: 6 }}>Pull requests</div>
        <div style={{ fontSize: 19, color: win.dim, marginBottom: 16 }}>
          Aktive ({arrive.filter((a) => t >= a).length}) · Gremlin / Repos
        </div>
        {PRS.map((pr, i) => {
          if (t < arrive[i]) return null;
          const s = interpolate(t, [arrive[i], arrive[i] + 0.12], [0.6, 1], clamp);
          return (
            <div
              key={pr.title}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 18,
                padding: "14px 18px",
                marginBottom: 10,
                background: "#252526",
                borderLeft: `5px solid ${night.merge}`,
                borderRadius: 6,
                transform: `scale(${s})`,
                transformOrigin: "left center",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 26, color: win.text, fontWeight: 700 }}>{pr.title}</div>
                <div style={{ fontSize: 18, color: win.dim, fontFamily: fonts.mono }}>{pr.branch} → main</div>
              </div>
              <div style={{ fontFamily: fonts.mono, fontSize: 28, fontWeight: 700, textAlign: "right", minWidth: 290 }}>
                <span style={{ color: night.ok }}>+{num(pr.add * grow)}</span>{" "}
                <span style={{ color: night.bug }}>−{num(pr.del * grow)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Window>
  );
};

// Jira-liste: «Mine saker» som ruller i det uendelige, eller backloggen med en bug som blinker.
const SUMMARIES = [
  "Oppdatere README",
  "Fikse flaky test (igjen)",
  "Avklare krav med ledelsen",
  "Migrere til ny versjon av alt",
  "Skrive dokumentasjon (en gang)",
  "Undersøke hvorfor det funker",
  "Rydde i feature flags",
  "Svare på mail om forrige mail",
  "Estimere estimatene",
  "Oppgradere .NET",
  "Fjerne TODO-er",
  "Lage TODO-er",
];
const KINDS = [
  { label: "Story", color: "#4BCE97" },
  { label: "Task", color: "#579DFF" },
  { label: "Story", color: "#4BCE97" },
  { label: "Task", color: "#579DFF" },
];
const ROW = 50;
export const JiraList: React.FC<{ t: number; at: number; title: string; scroll?: boolean; bug?: number }> = ({
  t,
  at,
  title,
  scroll = false,
  bug,
}) => {
  const p = Math.max(0, t - at);
  const offset = scroll ? 120 * p * p + 60 * p : 0;
  const first = Math.floor(offset / ROW);
  const blink = bug !== undefined && t >= bug ? Math.abs(Math.sin((t - bug) * Math.PI * 2.4)) : 0;
  return (
    <Window app="jira" title={`${title} — Jira`}>
      <div style={{ position: "absolute", inset: 0, background: "#1D2125", fontFamily: ui, color: "#C7D1DB" }}>
        <div style={{ padding: "18px 30px 10px", fontSize: 30, fontWeight: 800, color: "#E6EDF3" }}>
          {title} <span style={{ fontSize: 20, color: "#8C9BAB", fontWeight: 400 }}>· {scroll ? `${137 + first} saker` : "214 saker"}</span>
        </div>
        <div style={{ position: "absolute", top: 70, left: 0, right: 0, bottom: 0, overflow: "hidden" }}>
          {Array.from({ length: 12 }, (_, k) => {
            const i = first + k;
            const isBug = bug !== undefined && i === 3;
            const kind = isBug ? { label: "Bug", color: night.bug } : KINDS[i % KINDS.length];
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  top: i * ROW - offset,
                  left: 20,
                  right: 20,
                  height: ROW - 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "0 14px",
                  borderRadius: 6,
                  background: isBug ? `rgba(255, 77, 109, ${0.15 + 0.6 * blink})` : "#22272B",
                  boxShadow: isBug ? `0 0 ${30 * blink}px ${night.bug}` : "none",
                  fontSize: 22,
                }}
              >
                <Pill text={kind.label} bg={kind.color} color="#1D2125" size={15} />
                <span style={{ color: "#8C9BAB", fontFamily: fonts.mono, fontSize: 19 }}>GRM-{isBug ? 666 : 1400 + ((i * 37) % 900)}</span>
                <span style={{ color: isBug ? "#FFFFFF" : "#C7D1DB", fontWeight: isBug ? 800 : 400 }}>
                  {isBug ? "Prod faller ned hver fredag kl. 16:59" : SUMMARIES[i % SUMMARIES.length]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Window>
  );
};

// Oppgavebehandling: story points 1, men stress.exe bruker alt.
const PROCS = [
  { name: "stress.exe", cpu: 99, color: night.bug },
  { name: "Teams.exe", cpu: 87 },
  { name: "Outlook.exe", cpu: 64 },
  { name: "Slack.exe", cpu: 58 },
  { name: "kaffe.exe", cpu: 0, note: "tom" },
  { name: "motivasjon.exe", cpu: 0, note: "svarer ikke" },
];
export const TaskManager: React.FC<{ t: number; at: number }> = ({ t, at }) => {
  const p = Math.max(0, t - at);
  const pts = Array.from({ length: 60 }, (_, i) => {
    const x = (i / 59) * 420;
    const k = Math.min(1, (p * 30 - (59 - i)) / 20);
    const v = Math.max(0.05, Math.min(1, k)) * (0.9 + 0.1 * random(`tm${i}`));
    return `${x},${150 - v * 140}`;
  });
  return (
    <Window app="taskmgr" title="Oppgavebehandling">
      <div style={{ position: "absolute", inset: 0, background: "#202020", fontFamily: ui, color: win.text, padding: "18px 28px", display: "flex", gap: 34 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", fontSize: 18, color: win.dim, padding: "0 10px 8px" }}>
            <span style={{ flex: 1 }}>Prosess</span>
            <span>CPU</span>
          </div>
          {PROCS.map((pr) => (
            <div
              key={pr.name}
              style={{
                display: "flex",
                padding: "10px 10px",
                fontSize: 25,
                borderTop: `1px solid ${win.border}`,
                background: pr.cpu > 90 ? "rgba(255,77,109,0.22)" : pr.cpu > 50 ? "rgba(255,176,32,0.12)" : "transparent",
              }}
            >
              <span style={{ flex: 1, fontFamily: fonts.mono, color: pr.color ?? win.text }}>{pr.name}</span>
              <span style={{ fontWeight: 700, color: pr.note ? win.dim : win.text }}>{pr.note ?? `${pr.cpu} %`}</span>
            </div>
          ))}
        </div>
        <div style={{ width: 440 }}>
          <div style={{ fontSize: 22, color: win.dim }}>Story points</div>
          <div style={{ fontSize: 60, fontWeight: 800, marginBottom: 10 }}>1</div>
          <div style={{ fontSize: 22, color: win.dim }}>Stress</div>
          <div style={{ fontSize: 60, fontWeight: 800, color: night.bug }}>{Math.min(100, Math.round(p * 120))} %</div>
          <svg width={420} height={150} style={{ marginTop: 10, border: `1px solid ${win.border}` }}>
            <polyline points={pts.join(" ")} fill="none" stroke={night.bug} strokeWidth={3} />
          </svg>
        </div>
      </div>
    </Window>
  );
};

// Teams-kanal: «Hvem rørte prod?» – folk begynner å skrive, slutter, og så: stillhet.
export const TeamsChat: React.FC<{ t: number; at: number; silent: number }> = ({ t, at, silent }) => {
  const typing = [
    { name: "Kari", from: at + 0.5, to: at + 1.1 },
    { name: "Ola", from: at + 0.8, to: at + 1.3 },
    { name: "Per", from: at + 1.0, to: at + 1.5 },
  ].filter((x) => t >= x.from && t < x.to);
  return (
    <Window app="teams" title="#prod-hendelser | Microsoft Teams">
      <div style={{ position: "absolute", inset: 0, background: "#1F1F1F", fontFamily: ui, padding: "24px 34px", color: win.text }}>
        <div style={{ fontSize: 22, color: win.dim, marginBottom: 20 }}># prod-hendelser · 214 medlemmer</div>
        {t >= at && (
          <div style={{ display: "flex", gap: 16, transform: `scale(${interpolate(t, [at, at + 0.1], [0.8, 1], clamp)})`, transformOrigin: "left top" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#C4314B", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 22 }}>
              LE
            </div>
            <div>
              <div style={{ fontSize: 19, color: win.dim }}>
                <b style={{ color: win.text }}>Ledelsen</b> 21:00
              </div>
              <div style={{ fontSize: 46, fontWeight: 800 }}>Hvem rørte prod?</div>
              <div style={{ fontSize: 18, color: win.dim, marginTop: 6 }}>Sett av 214</div>
            </div>
          </div>
        )}
        <div style={{ position: "absolute", left: 34, bottom: 24, fontSize: 22, color: win.dim, fontStyle: "italic" }}>
          {typing.length > 0 ? `${typing.map((x) => x.name).join(", ")} skriver…` : t >= silent ? "(ingen svar)" : ""}
        </div>
      </div>
    </Window>
  );
};

// Feilmeldinger i kaskade over hverandre, som et komishow. Hver dialog spretter inn på sitt tidspunkt.
const ERRORS = [
  { title: "Feil", text: "Det oppstod en feil under visning av feilmeldingen.", icon: "x" },
  { title: "Uventet feil", text: "Feilen var forventet.", icon: "x" },
  { title: "Gremlin.Core", text: "Operasjonen ble fullført uten suksess.", icon: "!" },
  { title: "Feil 0x00000042", text: "Alt er fint.", icon: "x" },
  { title: "Advarsel", text: "Er du sikker?", icon: "!", buttons: ["Ja", "Også ja"] },
  { title: "NullReferenceException", text: "Objektet finnes ikke. Det gjør heller ikke helgen.", icon: "x" },
  { title: "Visual Studio", text: "Visual Studio svarer ikke. Det gjør heller ikke teamet.", icon: "!" },
];
// Spredt utover skjermen (litt over hverandre), så flere av meldingene kan leses.
const DIALOG_AT = [
  [30, 24],
  [500, 70],
  [90, 200],
  [470, 250],
  [20, 340],
  [380, 150],
  [250, 320],
];
export const ErrorDialogs: React.FC<{ t: number; times: number[] }> = ({ t, times }) => (
  <>
    {ERRORS.map((e, i) => {
      const at = times[i];
      if (at === undefined || t < at) return null;
      const s = interpolate(t, [at, at + 0.1], [0.7, 1], clamp);
      return (
        <div
          key={e.title}
          style={{
            position: "absolute",
            left: DIALOG_AT[i][0],
            top: DIALOG_AT[i][1],
            width: 600,
            background: "#2B2B2B",
            border: `1px solid ${win.border}`,
            borderRadius: 8,
            boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
            fontFamily: ui,
            color: win.text,
            transform: `scale(${s})`,
            transformOrigin: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", height: 36, padding: "0 14px", fontSize: 17, color: win.dim }}>
            <span style={{ flex: 1 }}>{e.title}</span>✕
          </div>
          <div style={{ display: "flex", gap: 18, alignItems: "center", padding: "10px 22px 16px" }}>
            <div
              style={{
                width: 48,
                height: 48,
                flexShrink: 0,
                borderRadius: e.icon === "x" ? "50%" : 6,
                background: e.icon === "x" ? "#C42B1C" : "#E8A33D",
                color: "#FFFFFF",
                fontSize: 30,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {e.icon === "x" ? "✕" : "!"}
            </div>
            <div style={{ fontSize: 23 }}>{e.text}</div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "0 18px 16px" }}>
            {(e.buttons ?? ["OK"]).map((b) => (
              <div key={b} style={{ padding: "6px 26px", background: "#3A3A3A", border: `1px solid ${win.accent}`, borderRadius: 5, fontSize: 18 }}>
                {b}
              </div>
            ))}
          </div>
        </div>
      );
    })}
  </>
);

// Utdata-vinduet i Visual Studio med en stack trace som ruller fortere og fortere.
const TRACE = [
  { text: "Unhandled exception. System.NullReferenceException:", color: night.bug },
  { text: "  Object reference not set to an instance of an object." },
  { text: "   at Gremlin.Core.Kalkulator.Beregn(Virksomhet v) line 42" },
  { text: "   at Gremlin.Core.Lansering.Start() line 7" },
  { text: "   at Gremlin.Core.Program.<Main>$(String[] args)" },
  { text: "   at System.Fredag.Kveld.Deploy(Boolean force)" },
  { text: "   --- End of stack trace from previous location ---" },
];
export const StackTrace: React.FC<{ t: number; at: number }> = ({ t, at }) => {
  const p = Math.max(0, t - at);
  const offset = 300 * p * p + 120 * p;
  const row = 40;
  const first = Math.floor(offset / row);
  return (
    <Window app="vs" title="Utdata — Feilsøking — Microsoft Visual Studio">
      <div style={{ position: "absolute", inset: 0, background: "#1E1E1E", overflow: "hidden", fontFamily: fonts.mono, fontSize: 25 }}>
        {Array.from({ length: 16 }, (_, k) => {
          const i = first + k;
          const line = TRACE[i % TRACE.length];
          return (
            <div key={i} style={{ position: "absolute", top: 14 + i * row - offset, left: 24, whiteSpace: "pre", color: line.color ?? "#E8A0A0" }}>
              {line.text}
            </div>
          );
        })}
      </div>
    </Window>
  );
};

// Release til prod som et containerskip: det seiler inn til kaia «PROD», tuter på «let's go!»,
// og synker i stillheten etterpå. Statusen står på «Vellykket ✓» hele veien.
const CONTAINERS = [
  { label: "bugs", color: night.bug },
  { label: "hotfix", color: night.boom },
  { label: "TODO", color: night.merge },
  { label: "--force", color: night.glow },
  { label: "bin/obj", color: night.ok },
  { label: "v2.0", color: "#E8A33D" },
];
export const ShipDeploy: React.FC<{ t: number; depart: number; arrive: number; horn: number; sink: number }> = ({
  t,
  depart,
  arrive,
  horn,
  sink,
}) => {
  const p = interpolate(t, [depart, arrive], [0, 1], { ...clamp, easing: (x) => 1 - (1 - x) ** 2 });
  const sunk = interpolate(t, [sink, sink + 1.6], [0, 1], { ...clamp, easing: (x) => x * x });
  const sea = H - 150;
  const x = -480 + p * 960 - sunk * 40;
  const y = sea - 70 + Math.sin(t * 3) * 4 + sunk * 260;
  const tilt = Math.sin(t * 2.2) * 1.5 - sunk * 22;
  const puff = horn > 0 && t > horn ? t - horn : -1;
  const waves = (phase: number, yy: number, amp: number) => {
    let d = `M 0 ${yy}`;
    for (let xx = 0; xx <= W + 20; xx += 20) d += ` L ${xx} ${yy + Math.sin(xx / 60 + t * 2 + phase) * amp}`;
    return `${d} L ${W} ${H} L 0 ${H} Z`;
  };
  return (
    <Window app="devops" title="Release-1337 — Pipelines — Azure DevOps">
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(#0B1B30, #13304D)", overflow: "hidden", fontFamily: ui }}>
        <div style={{ position: "absolute", left: 24, top: 16, right: 24, display: "flex", alignItems: "center", gap: 18, color: win.text, fontSize: 22 }}>
          <b>Release-1337 → prod</b>
          <div style={{ flex: 1, height: 12, background: "#24384F", borderRadius: 6, overflow: "hidden" }}>
            <div style={{ width: `${p * 100}%`, height: "100%", background: night.ok }} />
          </div>
          {p >= 1 ? <Pill text="Vellykket ✓" bg="#1F845A" size={20} /> : <span style={{ color: win.dim }}>{Math.round(p * 100)} %</span>}
        </div>
        <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
          {/* Kaia med kran og skiltet PROD. */}
          <rect x={W - 150} y={sea - 40} width={150} height={190} fill="#1A2436" />
          <path d={`M ${W - 90} ${sea - 40} L ${W - 90} ${sea - 230} L ${W - 230} ${sea - 230}`} fill="none" stroke="#3A4A66" strokeWidth={10} />
          <line x1={W - 220} y1={sea - 230} x2={W - 220} y2={sea - 150} stroke="#3A4A66" strokeWidth={3} />
          <text x={W - 75} y={sea - 60} textAnchor="middle" fontFamily={fonts.display} fontSize={44} fill={night.ok}>
            PROD
          </text>
          <g transform={`translate(${x} ${y}) rotate(${tilt} 230 60)`}>
            {CONTAINERS.map((c, i) => {
              const col = i % 3;
              const row = Math.floor(i / 3);
              return (
                <g key={c.label} transform={`translate(${70 + col * 92} ${-50 - row * 46})`}>
                  <rect width={88} height={42} fill={c.color} stroke="#0B1220" strokeWidth={2} />
                  <text x={44} y={28} textAnchor="middle" fontFamily={fonts.mono} fontSize={15} fontWeight={700} fill="#0B1220">
                    {c.label}
                  </text>
                </g>
              );
            })}
            <rect x={350} y={-110} width={70} height={110} fill="#D8DEE9" />
            <rect x={362} y={-96} width={46} height={16} fill="#0B1B30" />
            <rect x={372} y={-150} width={26} height={40} fill={night.bug} />
            <path d="M 0 0 L 460 0 L 430 70 L 30 70 Z" fill="#2A2F3A" stroke="#11151C" strokeWidth={3} />
            <rect x={20} y={8} width={420} height={8} fill={night.bug} opacity={0.8} />
            {puff >= 0 &&
              [0, 1, 2].map((k) => {
                const a = puff - k * 0.12;
                if (a < 0 || a > 1.2) return null;
                return <circle key={k} cx={385 + a * 60} cy={-160 - a * 90} r={14 + a * 40} fill="#E8EEF8" opacity={0.8 * (1 - a / 1.2)} />;
              })}
          </g>
          {sunk > 0 &&
            Array.from({ length: 8 }, (_, k) => {
              const a = (t - sink - k * 0.15) % 1;
              if (t - sink < k * 0.15) return null;
              return <circle key={k} cx={x + 120 + k * 35} cy={sea - a * 60} r={4 + (k % 3) * 2} fill="none" stroke="#9FD8FF" strokeWidth={2} opacity={1 - a} />;
            })}
          <path d={waves(0, sea, 6)} fill="#0F4C75" opacity={0.85} />
          <path d={waves(2, sea + 20, 5)} fill="#0B3A5B" />
        </svg>
      </div>
    </Window>
  );
};

// Refaktorering: rotete, skjeve linjer, en Quick Actions-meny med «Raptor-modus», og så knekker
// kiropraktoren alt på plass på `snap`.
const MESSY = [
  "public class Kalkulator {",
  "  public decimal   Beregn(Virksomhet v){",
  "        var x=v.Folk;var y=x;var z=y;",
  "   if(z!=null){ if(z.Count>0){ if(true){",
  "            return z.Sum(p=>p.Lønn*0.042m);}}}",
  "      return 42;",
  "  }",
  "}",
];
const CLEAN = [
  "public class Kalkulator",
  "{",
  "    public decimal Beregn(Virksomhet v) =>",
  "        v.Folk?.Sum(p => p.Lønn * 0.042m) ?? 42;",
  "}",
];
export const RefactorView: React.FC<{ t: number; menu: number; snap: number }> = ({ t, menu, snap }) => {
  const done = t >= snap;
  const lines = done ? CLEAN : MESSY;
  const settle = interpolate(t, [snap, snap + 0.25], [1, 0], { ...clamp, easing: (x) => 1 - (1 - x) ** 3 });
  return (
    <Window app="vs" title="Kalkulator.cs — Gremlin.Core — Microsoft Visual Studio">
      <div style={{ position: "absolute", inset: 0, background: "#1E1E1E", fontFamily: fonts.mono, fontSize: 30, padding: "30px 0" }}>
        {lines.map((line, i) => {
          const wobble = done ? settle : 1;
          const dx = (random(`mx${i}`) - 0.5) * 80 * wobble;
          const rot = (random(`mr${i}`) - 0.5) * 6 * wobble;
          return (
            <div key={`${done}-${i}`} style={{ display: "flex", whiteSpace: "pre", height: 50, transform: `translateX(${dx}px) rotate(${rot}deg)` }}>
              <span style={{ width: 70, flexShrink: 0, textAlign: "right", paddingRight: 24, color: "#2B91AF" }}>{i + 1}</span>
              <span style={{ color: done ? night.code.plain : "#C8C8C8" }}>{line}</span>
            </div>
          );
        })}
        {t >= menu && !done && (
          <div style={{ position: "absolute", left: 420, top: 150, width: 380, background: "#2D2D30", border: `1px solid ${win.border}`, boxShadow: "0 10px 30px rgba(0,0,0,0.6)", fontFamily: ui, fontSize: 22 }}>
            <div style={{ padding: "10px 16px", display: "flex", gap: 12, alignItems: "center", color: "#FFD27A" }}>
              <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#FFD27A", display: "inline-block" }} /> Hurtighandlinger
            </div>
            {["Ekstraher metode", "Gi nytt navn", "Raptor-modus"].map((m, i) => (
              <div key={m} style={{ padding: "10px 16px 10px 50px", background: i === 2 ? "#094771" : "transparent", color: win.text, fontWeight: i === 2 ? 700 : 400 }}>
                {m}
              </div>
            ))}
          </div>
        )}
      </div>
    </Window>
  );
};

// En docstring som er lengre enn alt annet: linjenumrene løper mens Confluence-retroen ved siden av
// har tre tomme punkter.
const DOC = [
  "    /// <summary>",
  "    /// Beregner beregningen.",
  "    /// Se også: beregningen.",
  "    /// Merk: ikke endre noe her.",
  "    /// Historikk: se Git. Ikke se Git.",
  "    /// Forfatter: alle. Ansvarlig: ingen.",
];
export const DocScroll: React.FC<{ t: number; at: number; retro: number }> = ({ t, at, retro }) => {
  const p = Math.max(0, t - at);
  const first = Math.floor(p * p * 90 + p * 40);
  return (
    <Window app="vs" title="Kalkulator.cs — Gremlin.Core — Microsoft Visual Studio">
      <div style={{ position: "absolute", inset: 0, background: "#1E1E1E", fontFamily: fonts.mono, fontSize: 26, overflow: "hidden" }}>
        {Array.from({ length: 12 }, (_, k) => (
          <div key={k} style={{ display: "flex", whiteSpace: "pre", height: 42, paddingTop: 8 }}>
            <span style={{ width: 90, flexShrink: 0, textAlign: "right", paddingRight: 24, color: "#2B91AF" }}>{first + k + 1}</span>
            <span style={{ color: night.code.comment }}>{DOC[(first + k) % DOC.length]}</span>
          </div>
        ))}
        {t >= retro && (
          <div
            style={{
              position: "absolute",
              right: 30,
              top: 40,
              width: 330,
              background: "#FFFFFF",
              color: "#172B4D",
              borderRadius: 8,
              padding: "16px 20px",
              fontFamily: ui,
              boxShadow: "0 12px 30px rgba(0,0,0,0.5)",
              transform: `scale(${interpolate(t, [retro, retro + 0.12], [0.7, 1], clamp)})`,
            }}
          >
            <div style={{ fontSize: 15, color: "#5E6C84" }}>Confluence</div>
            <div style={{ fontSize: 26, fontWeight: 800, margin: "4px 0 10px" }}>Sprint-retro</div>
            {["Bra:", "Mindre bra:", "Tiltak:"].map((x) => (
              <div key={x} style={{ fontSize: 21, padding: "4px 0" }}>
                • {x} <span style={{ color: "#A5ADBA" }}>—</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Window>
  );
};

// Teams-kanal med en tråd av meldinger som dukker opp på hvert sitt tidspunkt.
export type ChatMessage = { at: number; who: string; initials: string; color: string; text: string };
export const ChatThread: React.FC<{ t: number; channel: string; messages: ChatMessage[]; pivot?: number }> = ({
  t,
  channel,
  messages,
  pivot,
}) => (
  <Window app="teams" title={`${channel} | Microsoft Teams`}>
    <div style={{ position: "absolute", inset: 0, background: "#1F1F1F", fontFamily: ui, padding: "22px 34px", color: win.text }}>
      <div style={{ fontSize: 22, color: win.dim, marginBottom: 20 }}>{channel}</div>
      {messages
        .filter((m) => t >= m.at)
        .map((m) => (
          <div key={m.at} style={{ display: "flex", gap: 16, marginBottom: 22, transform: `scale(${interpolate(t, [m.at, m.at + 0.1], [0.8, 1], clamp)})`, transformOrigin: "left top" }}>
            <div style={{ width: 56, height: 56, flexShrink: 0, borderRadius: "50%", background: m.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 22 }}>
              {m.initials}
            </div>
            <div>
              <div style={{ fontSize: 19, color: win.dim }}>
                <b style={{ color: win.text }}>{m.who}</b> 21:00
              </div>
              <div style={{ fontSize: 38, fontWeight: 700 }}>{m.text}</div>
            </div>
          </div>
        ))}
      {pivot !== undefined && t >= pivot - 0.6 && (
        <div
          style={{
            position: "absolute",
            right: 70,
            bottom: 40,
            width: 360,
            height: 210,
            background: "linear-gradient(135deg, #5B5FC7, #C239B3)",
            borderRadius: 10,
            boxShadow: "0 12px 30px rgba(0,0,0,0.5)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            transform: `rotate(${interpolate(t, [pivot, pivot + 0.25], [0, 90], { ...clamp, easing: (x) => 1 - (1 - x) ** 3 })}deg)`,
          }}
        >
          <div style={{ fontSize: 18, opacity: 0.8 }}>Ny visjon.pptx</div>
          <div style={{ fontSize: 40, fontWeight: 800 }}>STRATEGI 3.0</div>
          <div style={{ fontSize: 20 }}>Synergi · AI · Pivot</div>
        </div>
      )}
    </div>
  </Window>
);

// SQL-editor: en søt spørring med glitter, «Kjør», og resultatet «Prepare / to / die», eller feilmeldinger.
export const SqlEditor: React.FC<{
  t: number;
  at: number;
  sparkle: number;
  run: number;
  rows: number[];
  errors?: { at: number; text: string }[];
}> = ({ t, at, sparkle, run, rows, errors = [] }) => {
  const query = "SELECT TOP 3 Melding FROM Skjebne -- (◕‿◕)";
  const shown = Math.floor(interpolate(t, [at, at + query.length / 40], [0, query.length], clamp));
  const ran = t >= run;
  const words = ["Prepare", "to", "die"];
  const sparkles = t >= sparkle && t < run + 0.4;
  return (
    <Window app="devops" title="Spørring1.sql — SQL Server Management Studio">
      <div style={{ position: "absolute", inset: 0, background: "#1E1E1E", fontFamily: ui }}>
        <div style={{ height: 50, display: "flex", alignItems: "center", gap: 14, padding: "0 20px", background: "#2D2D30" }}>
          <div
            style={{
              padding: "6px 18px",
              borderRadius: 4,
              background: ran && t < run + 0.25 ? "#1F845A" : "#3A3A3A",
              color: night.ok,
              fontSize: 20,
              fontWeight: 700,
              transform: `scale(${ran && t < run + 0.15 ? 0.9 : 1})`,
            }}
          >
            ▶ Kjør
          </div>
          <span style={{ color: win.dim, fontSize: 18 }}>prod-gremlin-01 · Gremlin</span>
        </div>
        <div style={{ position: "relative", padding: "24px 28px", fontFamily: fonts.mono, fontSize: 30, height: 130 }}>
          <span style={{ color: night.code.keyword }}>{query.slice(0, Math.min(shown, 12))}</span>
          <span style={{ color: night.code.plain }}>{query.slice(12, Math.max(12, Math.min(shown, 32)))}</span>
          <span style={{ color: night.code.comment }}>{query.slice(32, Math.max(32, shown))}</span>
          {sparkles &&
            Array.from({ length: 9 }, (_, k) => {
              const a = (t * 2 + k / 9) % 1;
              return (
                <span
                  key={k}
                  style={{
                    position: "absolute",
                    left: 40 + random(`sp${k}`) * 900,
                    top: 4 + random(`sq${k}`) * 90,
                    fontSize: 22 + 20 * Math.sin(a * Math.PI),
                    color: ["#FFD27A", "#FF9AD5", "#9FE8FF"][k % 3],
                    opacity: Math.sin(a * Math.PI),
                  }}
                >
                  ✦
                </span>
              );
            })}
        </div>
        <div style={{ margin: "0 28px", borderTop: `1px solid ${win.border}`, paddingTop: 10, display: "flex", gap: 24, fontSize: 20, color: win.dim }}>
          <span style={{ color: errors.length === 0 ? win.text : win.dim, fontWeight: 700 }}>Resultater</span>
          <span style={{ color: errors.length > 0 ? win.text : win.dim, fontWeight: 700 }}>Meldinger</span>
        </div>
        {errors.length === 0 && ran && (
          <div style={{ margin: "12px 28px", fontFamily: fonts.mono, fontSize: 32 }}>
            <div style={{ display: "flex", color: win.dim, fontSize: 20, borderBottom: `1px solid ${win.border}`, paddingBottom: 6 }}>
              <span style={{ width: 60 }} />
              <span>Melding</span>
            </div>
            {words.map((wd, i) =>
              t >= rows[i] ? (
                <div key={wd} style={{ display: "flex", padding: "6px 0", borderBottom: `1px solid #2A2A2A` }}>
                  <span style={{ width: 60, color: win.dim, fontSize: 22 }}>{i + 1}</span>
                  <span style={{ color: night.bug, fontWeight: 700 }}>{wd}</span>
                </div>
              ) : null,
            )}
          </div>
        )}
        {errors.length > 0 && (
          <div style={{ margin: "16px 28px", fontFamily: fonts.mono, fontSize: 26, lineHeight: 1.6 }}>
            {errors
              .filter((e) => t >= e.at)
              .map((e) => (
                <div key={e.at} style={{ color: night.bug }}>
                  {e.text}
                </div>
              ))}
          </div>
        )}
      </div>
    </Window>
  );
};

// Databasedrama som prestisje-TV: en strømmeplakat for neste episode.
export const TvDrama: React.FC<{ t: number; at: number }> = ({ t, at }) => {
  const p = Math.max(0, t - at);
  return (
    <Window app="edge" title="DATABASEN — Strømming">
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 70% 40%, #3A1020, #080406 70%)", fontFamily: ui, color: "#FFFFFF", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: 40, top: 40, width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle, #C42B1C55, transparent 70%)", transform: `scale(${1 + p * 0.05})` }} />
        <svg width={420} height={300} style={{ position: "absolute", right: 70, top: 90, opacity: 0.85 }}>
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(${60 + i * 110} ${70 + (i % 2) * 70})`}>
              <ellipse cx={45} cy={0} rx={45} ry={14} fill="#5A1A24" />
              <rect x={0} y={0} width={90} height={80} fill="#3A0E16" />
              <ellipse cx={45} cy={80} rx={45} ry={14} fill="#3A0E16" />
              <ellipse cx={45} cy={0} rx={45} ry={14} fill="none" stroke="#FF5B5B" strokeWidth={2} />
            </g>
          ))}
          <path d="M 150 110 L 170 140 M 255 180 L 280 150" stroke="#FF5B5B" strokeWidth={3} strokeDasharray="6 6" />
        </svg>
        <div style={{ position: "absolute", left: 50, top: 60 }}>
          <div style={{ fontSize: 20, letterSpacing: 6, color: "#FF5B5B", fontWeight: 700 }}>EN GREMLIN-ORIGINAL</div>
          <div style={{ fontFamily: fonts.display, fontSize: 120, lineHeight: 1, marginTop: 10 }}>DATABASEN</div>
          <div style={{ fontSize: 26, color: "#D0C0C4", marginTop: 14 }}>Sesong 4 · Episode 13</div>
          <div style={{ fontSize: 40, fontWeight: 800, marginTop: 6 }}>«Fremmednøkkelen»</div>
          <div style={{ fontSize: 26, color: "#FFD27A", marginTop: 16 }}>★★★★★ · 16+ · Sterke scener med JOIN</div>
          <div style={{ display: "flex", gap: 14, marginTop: 30 }}>
            <div style={{ padding: "12px 30px", background: "#FFFFFF", color: "#000000", borderRadius: 6, fontSize: 24, fontWeight: 800 }}>▶ Spill av</div>
            <div style={{ padding: "12px 24px", background: "#FFFFFF33", borderRadius: 6, fontSize: 24 }}>Neste episode om {Math.max(1, 5 - Math.floor(p * 2))}</div>
          </div>
        </div>
      </div>
    </Window>
  );
};

// «Prayin' to the schema like a digital weeboard»: et ouija-brett der planchetten flytter seg selv.
const OUIJA_STOPS = [
  { x: 0.5, y: 0.62 },
  { x: 0.2, y: 0.42 },
  { x: 0.62, y: 0.38 },
  { x: 0.84, y: 0.2 },
];
export const Ouija: React.FC<{ t: number; at: number; answer: number }> = ({ t, at, answer }) => {
  const p = Math.max(0, t - at);
  const seg = Math.min(OUIJA_STOPS.length - 2, Math.floor(p / 0.55));
  const k = Math.min(1, (p - seg * 0.55) / 0.4);
  const a = OUIJA_STOPS[seg];
  const b = t >= answer ? OUIJA_STOPS[3] : OUIJA_STOPS[seg + 1];
  const x = (a.x + (b.x - a.x) * k) * W;
  const y = (a.y + (b.y - a.y) * k) * H;
  // To buer med bokstaver, som på et ekte ouija-brett.
  const rows = ["ABCDEFGHIJKLMN", "OPQRSTUVWXYZÆØÅ"].map((r) => r.split(""));
  return (
    <Window app="devops" title="Skjema.dbml — Databasediagram">
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse, #5A3A22, #2A1A10 80%)", fontFamily: fonts.display, color: "#E8D2A8", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 50, top: 24, fontSize: 64 }}>JA</div>
        <div style={{ position: "absolute", right: 50, top: 24, fontSize: 64, color: t >= answer ? night.bug : "#E8D2A8" }}>NEI</div>
        {rows.flatMap((row, r) =>
          row.map((l, i) => {
            const u = i / (row.length - 1);
            const x = W * (0.14 + 0.72 * u);
            const y = 150 + r * 105 - Math.sin(u * Math.PI) * 55;
            return (
              <div key={l} style={{ position: "absolute", left: x - 20, top: y, width: 40, textAlign: "center", fontSize: 50, transform: `rotate(${(u - 0.5) * 30}deg)` }}>
                {l}
              </div>
            );
          }),
        )}
        <div style={{ position: "absolute", left: 0, right: 0, top: 330, textAlign: "center", fontSize: 50, letterSpacing: 6 }}>SELECT · FROM · WHERE</div>
        <div
          style={{
            position: "absolute",
            left: x - 60,
            top: y - 70,
            width: 120,
            height: 140,
            background: "#F2E2C0",
            clipPath: "polygon(50% 0%, 100% 70%, 80% 100%, 20% 100%, 0% 70%)",
            boxShadow: "0 8px 20px rgba(0,0,0,0.5)",
          }}
        >
          <div style={{ position: "absolute", left: 35, top: 55, width: 50, height: 50, borderRadius: "50%", background: "#5A3A22", border: "6px solid #C8A878" }} />
        </div>
      </div>
    </Window>
  );
};

// Testutforsker med flaky tester som bytter mellom grønt og rødt på takten.
const TESTS = ["Beregn_GirRiktigSum", "Beregn_SkalIkkeReturnere42", "Lansering_StarterIkkeFredag", "Cache_TømmesToGanger", "Database_MigrererForsiktig", "Alt_Virker"];
export const TestExplorer: React.FC<{ t: number; beat: number }> = ({ t, beat }) => {
  const tick = Math.floor(beat * 2);
  const status = TESTS.map((n, i) => random(`flaky${i}-${tick}`) > 0.45);
  const passed = status.filter(Boolean).length;
  return (
    <Window app="vs" title="Testutforsker — Microsoft Visual Studio">
      <div style={{ position: "absolute", inset: 0, background: "#1E1E1E", fontFamily: ui, color: win.text, padding: "20px 30px" }}>
        <div style={{ display: "flex", gap: 30, fontSize: 24, marginBottom: 16 }}>
          <span style={{ color: night.ok, fontWeight: 700 }}>✔ {passed} bestått</span>
          <span style={{ color: night.bug, fontWeight: 700 }}>✖ {TESTS.length - passed} feilet</span>
          <span style={{ color: win.dim }}>Kjøring #{2000 + tick}</span>
        </div>
        {TESTS.map((n, i) => (
          <div key={n} style={{ display: "flex", gap: 16, alignItems: "center", padding: "10px 12px", fontSize: 25, borderTop: `1px solid ${win.border}`, fontFamily: fonts.mono }}>
            <span style={{ width: 30, color: status[i] ? night.ok : night.bug, fontWeight: 800 }}>{status[i] ? "✔" : "✖"}</span>
            {n}
          </div>
        ))}
      </div>
    </Window>
  );
};

// «Click one button»: Deploy-knappen klikkes, og hele stacken i arkitekturdiagrammet tar fyr.
const STACK = ["Frontend", "API", "Kø", "Cache", "Database"];
export const DeployStack: React.FC<{ t: number; click: number }> = ({ t, click }) => {
  const burning = (i: number) => interpolate(t, [click + 0.15 + i * 0.12, click + 0.35 + i * 0.12], [0, 1], clamp);
  const cursor = interpolate(t, [click - 0.6, click - 0.05], [0, 1], { ...clamp, easing: (x) => 1 - (1 - x) ** 2 });
  return (
    <Window app="devops" title="Release-1338 — Pipelines — Azure DevOps">
      <div style={{ position: "absolute", inset: 0, background: "#1E1E1E", fontFamily: ui, color: win.text }}>
        <div
          style={{
            position: "absolute",
            left: 40,
            top: 40,
            padding: "18px 44px",
            borderRadius: 8,
            background: t >= click && t < click + 0.15 ? "#005A9E" : "#0078D4",
            fontSize: 34,
            fontWeight: 800,
            transform: `scale(${t >= click && t < click + 0.12 ? 0.92 : 1})`,
          }}
        >
          ▲ Deploy til prod
        </div>
        <svg width={40} height={52} style={{ position: "absolute", left: 600 - 330 * cursor, top: 300 - 200 * cursor }}>
          <path d="M 2 2 L 2 42 L 13 32 L 21 50 L 28 47 L 20 29 L 35 29 Z" fill="#FFFFFF" stroke="#000000" strokeWidth={2} />
        </svg>
        <div style={{ position: "absolute", left: 40, right: 40, top: 160, display: "flex", gap: 18 }}>
          {STACK.map((s, i) => {
            const b = burning(i);
            return (
              <div
                key={s}
                style={{
                  flex: 1,
                  height: 260,
                  borderRadius: 10,
                  background: `rgba(${Math.round(40 + 160 * b)}, ${Math.round(48 - 10 * b)}, ${Math.round(60 - 30 * b)}, 1)`,
                  border: `3px solid ${b > 0.5 ? night.boom : win.border}`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  paddingBottom: 20,
                  fontSize: 26,
                  fontWeight: 700,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {b > 0 &&
                  Array.from({ length: 5 }, (_, k) => {
                    const a = (t * 1.8 + k / 5 + i * 0.13) % 1;
                    return (
                      <div
                        key={k}
                        style={{
                          position: "absolute",
                          left: `${15 + random(`fl${i}-${k}`) * 70}%`,
                          bottom: 60 + a * 160,
                          width: 34 - a * 20,
                          height: 50 - a * 30,
                          borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
                          background: k % 2 ? night.boom : night.bug,
                          opacity: b * (1 - a),
                          transform: "translateX(-50%)",
                        }}
                      />
                    );
                  })}
                {s}
              </div>
            );
          })}
        </div>
      </div>
    </Window>
  );
};

// Outlook-kalender i tidshopp: dagen fylles (Standup 11:00, Burnout 12:00, Deploy 21:00), så
// bladrer månedene forbi til juni, hver dag merket «Fiksing».
const MONTHS = ["Oktober", "November", "Desember", "Januar", "Februar", "Mars", "April", "Mai", "Juni"];
export const CalendarTimelapse: React.FC<{ t: number; events: { at: number; time: string; title: string; color: string }[]; flip: number; june: number }> = ({
  t,
  events,
  flip,
  june,
}) => {
  const flipping = t >= flip;
  const m = flipping ? Math.min(MONTHS.length - 1, Math.floor(interpolate(t, [flip, june], [0, MONTHS.length - 1], clamp))) : 0;
  return (
    <Window app="outlook" title="Kalender — Outlook">
      <div style={{ position: "absolute", inset: 0, background: "#1F1F1F", fontFamily: ui, color: win.text, padding: "20px 30px" }}>
        <div style={{ fontSize: 34, fontWeight: 800, marginBottom: 16 }}>
          {flipping ? `${MONTHS[m]} ${m >= 3 ? 2027 : 2026}` : "Fredag 18. oktober"}
        </div>
        {!flipping &&
          events
            .filter((e) => t >= e.at)
            .map((e) => (
              <div
                key={e.title}
                style={{
                  display: "flex",
                  gap: 24,
                  alignItems: "center",
                  marginBottom: 14,
                  padding: "16px 22px",
                  borderLeft: `8px solid ${e.color}`,
                  background: "#2B2B2B",
                  borderRadius: 6,
                  fontSize: 34,
                  transform: `scale(${interpolate(t, [e.at, e.at + 0.1], [0.8, 1], clamp)})`,
                  transformOrigin: "left center",
                }}
              >
                <span style={{ color: win.dim, width: 110 }}>{e.time}</span>
                <b style={{ color: e.color === night.bug ? night.bug : win.text }}>{e.title}</b>
              </div>
            ))}
        {flipping && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
            {Array.from({ length: 28 }, (_, d) => (
              <div key={d} style={{ height: 82, background: "#2B2B2B", borderRadius: 6, padding: 8, fontSize: 18, position: "relative" }}>
                <span style={{ color: win.dim }}>{d + 1}</span>
                <div style={{ position: "absolute", left: 8, right: 8, bottom: 8, padding: "3px 8px", borderRadius: 4, background: night.bug, fontSize: 16, fontWeight: 700 }}>Fiksing</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Window>
  );
};

// Teams-samtale med «Gremlin-teamet»: alle hetter skriker, tekstingen sier «SHIP IT WHEN IT'S READY!»,
// og på «(ship it!)» smeller et grønt stempel.
export const TeamScream: React.FC<{ t: number; at: number; caption: number; stamp: number }> = ({ t, at, caption, stamp }) => {
  const text = "SHIP IT WHEN IT'S READY!";
  const shown = Math.floor(interpolate(t, [caption, caption + 0.9], [0, text.length], clamp));
  return (
    <Window app="teams" title="Gremlin-teamet | Microsoft Teams">
      <div style={{ position: "absolute", inset: 0, background: "#1F1F1F", padding: 16, fontFamily: ui }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, height: H - 120 }}>
          {Array.from({ length: 8 }, (_, i) => {
            const yell = Math.abs(Math.sin((t - at) * 9 + i * 1.3));
            return (
              <div key={i} style={{ background: "#2B2B2B", borderRadius: 8, position: "relative", overflow: "hidden", outline: yell > 0.7 ? "3px solid #7F85F5" : "none", outlineOffset: -3 }}>
                <svg viewBox="-120 -20 240 230" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
                  <path d="M -110 230 C -110 150 -80 120 -50 110 L 50 110 C 80 120 110 150 110 230 Z" fill="#0A0E16" />
                  <path d="M -62 120 C -70 50 -50 0 0 0 C 50 0 70 50 62 120 Z" fill="#0A0E16" transform={`translate(0 ${-yell * 6})`} />
                  <ellipse cx={-18} cy={55 - yell * 6} rx={7} ry={4} fill={night.glow} />
                  <ellipse cx={18} cy={55 - yell * 6} rx={7} ry={4} fill={night.glow} />
                  <ellipse cx={0} cy={85 - yell * 6} rx={14} ry={4 + 14 * yell} fill="#2A0A0A" />
                </svg>
                <div style={{ position: "absolute", left: 10, bottom: 6, fontSize: 16, color: win.text }}>Gremlin {i + 1}</div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 12, padding: "12px 18px", background: "#141414", borderRadius: 8, fontSize: 34, fontWeight: 800, color: win.text, height: 74 }}>{text.slice(0, shown)}</div>
        <Stamp t={t} at={stamp} text="SHIP IT!" x={W * 0.5} y={H * 0.4} size={150} />
      </div>
    </Window>
  );
};

// Kaos i backloggen, fred i loggen: Jira-tavle som rister til venstre, rolig logg til høyre.
const LOG_LINES = ["INFO  Alt er rolig.", "INFO  Fortsatt rolig.", "INFO  Pust inn.", "INFO  Pust ut.", "DEBUG ☮"];
export const ChaosAndPeace: React.FC<{ t: number; at: number; peace: number }> = ({ t, at, peace }) => {
  const p = Math.max(0, t - at);
  return (
    <Window app="jira" title="Backlog — Jira  |  app.log — Notisblokk">
      <div style={{ position: "absolute", inset: 0, display: "flex", fontFamily: ui }}>
        <div style={{ flex: 1, background: "#1D2125", position: "relative", overflow: "hidden" }}>
          {["TO DO", "PÅGÅR", "FERDIG?"].map((col, c) => (
            <div key={col} style={{ position: "absolute", left: 16 + c * 175, top: 16, width: 160, color: "#8C9BAB", fontSize: 18, fontWeight: 700 }}>
              {col}
            </div>
          ))}
          {Array.from({ length: 12 }, (_, i) => {
            const c = i % 3;
            const fall = Math.max(0, p - 0.1 - i * 0.07);
            const x = 16 + c * 175 + Math.sin(t * 23 + i) * 10 + (random(`cx${i}`) - 0.5) * 120 * fall;
            const y = 50 + Math.floor(i / 3) * 80 + fall * fall * 420;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: x,
                  top: y,
                  width: 160,
                  height: 64,
                  background: "#22272B",
                  borderLeft: `5px solid ${[night.bug, "#579DFF", "#4BCE97"][i % 3]}`,
                  borderRadius: 6,
                  transform: `rotate(${Math.sin(t * 19 + i * 2) * 6 + fall * 90 * (random(`cr${i}`) - 0.5)}deg)`,
                  color: "#C7D1DB",
                  fontSize: 16,
                  padding: 8,
                }}
              >
                GRM-{1400 + i * 7}
              </div>
            );
          })}
        </div>
        <div style={{ flex: 1, background: "#0F1A14", padding: "24px 26px", fontFamily: fonts.mono, fontSize: 26, color: night.ok, lineHeight: 1.7, opacity: interpolate(t, [peace - 0.3, peace], [0.35, 1], clamp) }}>
          {LOG_LINES.filter((_, i) => t >= peace + i * 0.3).map((l) => (
            <div key={l}>{l}</div>
          ))}
        </div>
      </div>
    </Window>
  );
};

// «Bug-tamin'»: en bille løper rundt på skjermen, blir fanget av en håv og satt på glass.
export const BugJar: React.FC<{ t: number; at: number; caught: number }> = ({ t, at, caught }) => {
  const p = Math.max(0, t - at);
  const isCaught = t >= caught;
  const bx = isCaught ? W / 2 : W / 2 + Math.sin(p * 7) * 330;
  const by = isCaught ? H / 2 + 30 : H / 2 + Math.cos(p * 9) * 120;
  return (
    <Window app="jira" title="GRM-666 — Jira">
      <div style={{ position: "absolute", inset: 0, background: "#1D2125", fontFamily: ui, overflow: "hidden" }}>
        {isCaught && (
          <div style={{ position: "absolute", left: W / 2 - 150, top: H / 2 - 150, width: 300, height: 330, border: "6px solid #9FD8FF", borderTop: "none", borderRadius: "0 0 40px 40px", background: "rgba(159,216,255,0.12)" }}>
            <div style={{ position: "absolute", left: -20, right: -20, top: -30, height: 34, background: "#8A93A6", borderRadius: 6 }} />
          </div>
        )}
        <svg width={120} height={110} viewBox="-60 -55 120 110" style={{ position: "absolute", left: bx - 60, top: by - 55, transform: `rotate(${isCaught ? 0 : Math.sin(p * 9) * 40}deg)` }}>
          {[-1, 1].flatMap((s) =>
            [-25, 0, 25].map((dy) => <line key={`${s}${dy}`} x1={s * 20} y1={dy} x2={s * (48 + Math.sin(t * 30 + dy) * 4)} y2={dy + 10} stroke="#111" strokeWidth={6} strokeLinecap="round" />),
          )}
          <ellipse cx={0} cy={5} rx={32} ry={42} fill={night.bug} stroke="#111" strokeWidth={4} />
          <line x1={0} y1={-35} x2={0} y2={46} stroke="#111" strokeWidth={4} />
          <circle cx={0} cy={-40} r={18} fill="#111" />
          <circle cx={-12} cy={8} r={6} fill="#111" />
          <circle cx={12} cy={-8} r={6} fill="#111" />
        </svg>
        {isCaught && (
          <div style={{ position: "absolute", left: W / 2 - 160, top: H / 2 + 200, width: 320, textAlign: "center", padding: "8px 0", background: "#F2E2C0", color: "#3A2A10", fontWeight: 800, fontSize: 28, borderRadius: 6 }}>
            GRM-666 · temmet
          </div>
        )}
        {!isCaught && <div style={{ position: "absolute", left: 30, top: 24, fontSize: 30, fontWeight: 800, color: night.bug }}>GRM-666 er på frifot!</div>}
      </div>
    </Window>
  );
};
