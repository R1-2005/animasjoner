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
export const TeamsMeeting: React.FC<{ t: number; at: number; velocity: number }> = ({ t, at, velocity }) => {
  const caption = "…så hvis vi ser på velocity-en vår denne sprinten…";
  const shown = Math.floor(interpolate(t, [at + 0.3, velocity + 0.2], [0, caption.length], clamp));
  return (
    <Window app="teams" title="Daglig standup | Microsoft Teams">
      <div style={{ position: "absolute", inset: 0, background: "#1F1F1F", padding: 18, fontFamily: ui }}>
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
              <div style={{ position: "absolute", left: 12, bottom: 8, fontSize: 18, color: win.text }}>{p.name}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, padding: "12px 18px", background: "#141414", borderRadius: 8, fontSize: 26, color: win.text, height: 70 }}>
          <span style={{ color: "#B4A0FF", fontWeight: 700 }}>Scrum Master: </span>
          {caption.slice(0, shown)}
        </div>
      </div>
    </Window>
  );
};

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
