import { interpolate } from "remotion";
import { theme } from "../style/theme";
import { fonts, night } from "./look";
import { SCREEN } from "./Office";

// Innholdet på hovedskjermen: et Windows 11-skrivebord med ett vindu om gangen (Visual Studio,
// Azure DevOps, PowerShell), oppgavelinje og varsler. Alt tar låttid t (sekunder).

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const { win, apps } = night;
const ui = theme.fonts.sans;

export type App = keyof typeof apps;

const TITLE = 40;
export const TASKBAR = 50;

export const Desktop: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      position: "absolute",
      left: SCREEN.x,
      top: SCREEN.y,
      width: SCREEN.w,
      height: SCREEN.h,
      background: "#0B1622",
      overflow: "hidden",
      borderRadius: 4,
    }}
  >
    {children}
  </div>
);

export const AppTile: React.FC<{ app: App; size: number }> = ({ app, size }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.22,
      background: apps[app].color,
      color: "#FFFFFF",
      fontFamily: ui,
      fontWeight: 800,
      fontSize: size * (apps[app].label.length > 1 ? 0.4 : 0.55),
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}
  >
    {apps[app].label}
  </div>
);

// Et maksimert vindu med Windows-tittellinje (— ☐ ✕ til høyre).
export const Window: React.FC<{ app: App; title: string; background?: string; children: React.ReactNode }> = ({
  app,
  title,
  background = win.window,
  children,
}) => (
  <div style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: TASKBAR, background, overflow: "hidden" }}>
    <div
      style={{
        height: TITLE,
        background: win.titleBar,
        display: "flex",
        alignItems: "center",
        gap: 12,
        paddingLeft: 14,
        fontFamily: ui,
        fontSize: 19,
        color: win.dim,
        borderBottom: `1px solid ${win.border}`,
      }}
    >
      <AppTile app={app} size={24} />
      <span style={{ flex: 1 }}>{title}</span>
      <svg width={150} height={TITLE} stroke={win.text} strokeWidth={1.5} fill="none">
        <line x1={20} y1={20} x2={32} y2={20} />
        <rect x={69} y={14} width={12} height={12} />
        <path d="M 119 14 L 131 26 M 131 14 L 119 26" />
      </svg>
    </div>
    <div style={{ position: "absolute", top: TITLE, left: 0, right: 0, bottom: 0, overflow: "hidden" }}>{children}</div>
  </div>
);

// Appene som er festet til oppgavelinja (resten vises bare som vinduer).
const PINNED: App[] = ["vs", "outlook", "teams", "slack", "jira", "confluence", "devops", "terminal"];

// Oppgavelinja: Start, appene, klokka. badges = tallet i det røde merket per app; offline = Wi-Fi nede;
// focus = «Ikke forstyrr» er på (måne ved klokka).
export const Taskbar: React.FC<{
  active: App;
  badges?: Partial<Record<App, string>>;
  offline?: boolean;
  focus?: boolean;
  clock?: string;
  date?: string;
}> = ({ active, badges = {}, offline = false, focus = false, clock = "21:00", date = "18.10.2026" }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: TASKBAR,
      background: win.taskbar,
      borderTop: `1px solid ${win.border}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 14,
    }}
  >
    <svg width={30} height={30}>
      {[0, 1].flatMap((i) => [0, 1].map((j) => <rect key={`${i}${j}`} x={i * 16} y={j * 16} width={14} height={14} fill={win.accent} />))}
    </svg>
    {PINNED.map((app) => (
      <div key={app} style={{ position: "relative", paddingBottom: 4 }}>
        <AppTile app={app} size={32} />
        {badges[app] && (
          <div
            style={{
              position: "absolute",
              right: -10,
              top: -8,
              minWidth: 22,
              height: 22,
              padding: "0 5px",
              borderRadius: 11,
              background: "#C42B1C",
              color: "#FFFFFF",
              fontFamily: ui,
              fontWeight: 700,
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {badges[app]}
          </div>
        )}
        <div
          style={{
            position: "absolute",
            bottom: -3,
            left: app === active ? 6 : 13,
            right: app === active ? 6 : 13,
            height: 3,
            borderRadius: 2,
            background: app === active ? win.accent : win.dim,
          }}
        />
      </div>
    ))}
    {focus && (
      <svg width={26} height={26} style={{ position: "absolute", right: 162 }}>
        <path d="M 17 3 A 10 10 0 1 0 23 17 A 8 8 0 0 1 17 3 Z" fill={win.accent} />
      </svg>
    )}
    <svg width={30} height={24} style={{ position: "absolute", right: 120 }} fill="none" strokeLinecap="round">
      {[18, 12, 6].map((r) => (
        <path key={r} d={`M ${15 - r} ${20 - r * 0.55} A ${r} ${r} 0 0 1 ${15 + r} ${20 - r * 0.55}`} stroke={offline ? win.dim : win.text} strokeWidth={2.4} />
      ))}
      <circle cx={15} cy={20} r={2} fill={offline ? win.dim : win.text} />
      {offline && <path d="M 19 11 L 29 21 M 29 11 L 19 21" stroke="#FF5B5B" strokeWidth={3.5} />}
    </svg>
    <div style={{ position: "absolute", right: 18, fontFamily: ui, fontSize: 16, color: win.text, textAlign: "right", lineHeight: 1.25 }}>
      {clock}
      <br />
      <span style={{ color: win.dim }}>{date}</span>
    </div>
  </div>
);

// Windows-varsel nederst til høyre: glir inn, blir stående, glir ut. slot stabler flere oppover.
export const Toast: React.FC<{ t: number; at: number; until: number; app: App; from: string; title: string; body: string; slot?: number }> = ({
  t,
  at,
  until,
  app,
  from,
  title,
  body,
  slot = 0,
}) => {
  if (t < at || t > until + 0.3) return null;
  const slide = interpolate(t, [at, at + 0.15, until, until + 0.25], [1, 0, 0, 1], clamp);
  return (
    <div
      style={{
        position: "absolute",
        right: 16,
        bottom: TASKBAR + 16 + slot * 132,
        width: 470,
        padding: "16px 18px",
        background: win.toast,
        border: `1px solid ${win.border}`,
        borderRadius: 10,
        boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
        transform: `translateX(${slide * 520}px)`,
        fontFamily: ui,
        color: win.text,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 16, color: win.dim, marginBottom: 8 }}>
        <AppTile app={app} size={22} />
        {from}
      </div>
      <div style={{ fontSize: 23, fontWeight: 700 }}>{title}</div>
      <div style={{ fontSize: 20, color: win.dim, marginTop: 4 }}>{body}</div>
    </div>
  );
};

// Syntaksfarging for C#, som Visual Studios mørke tema.
const KEYWORDS = /^(using|public|private|class|decimal|var|bool|string|int|new|static|void|namespace|true|false|null)$/;
const CONTROL = /^(if|else|return|try|catch|throw|while|for|foreach)$/;
const colorize = (line: string) => {
  const comment = line.indexOf("//");
  const code = comment >= 0 ? line.slice(0, comment) : line;
  const parts = code.split(/("[^"]*"?|\b[\wæøåÆØÅ.]+\b)/).filter(Boolean);
  const spans = parts.map((p, i) => {
    let color: string = night.code.plain;
    const next = parts[i + 1] ?? "";
    if (p.startsWith('"')) color = night.code.string;
    else if (CONTROL.test(p)) color = night.code.control;
    else if (KEYWORDS.test(p)) color = night.code.keyword;
    else if (/^\d/.test(p)) color = night.code.number;
    else if (/^\w/.test(p) && next.startsWith("(")) color = night.code.fn;
    else if (/^[A-ZÆØÅ]/.test(p)) color = night.code.type;
    return <span key={i} style={{ color }}>{p}</span>;
  });
  if (comment >= 0) spans.push(<span key="c" style={{ color: night.code.comment }}>{line.slice(comment)}</span>);
  return spans;
};

const LINE = 40;
const CPS = 62; // tegn per sekund: utvikleren skriver fort

// Visual Studio: koden skrives tegn for tegn på nederste linje, og alt skyves opp ved linjeskift.
// `written` står der allerede; `typed` skrives fra tidspunktet `from`.
export const VisualStudio: React.FC<{ t: number; from: number; written: string[]; typed: string[]; file?: string }> = ({
  t,
  from,
  written,
  typed,
  file = "Kalkulator.cs",
}) => {
  const lines = [...written, ...typed];
  // Starttiden flyttes bakover så de ferdigskrevne linjene allerede er skrevet ved `from`.
  const start = from - written.reduce((n, l) => n + l.length + 1, 0) / CPS;
  let rest = Math.max(0, t - start) * CPS;
  let current = 0;
  let before = 0;
  while (current < lines.length - 1 && rest >= lines[current].length + 1) {
    rest -= lines[current].length + 1;
    before += lines[current].length + 1;
    current++;
  }
  const shown = Math.min(Math.floor(rest), lines[current].length);
  // Linjeskiftet ruller jevnt opp på 0,08 s.
  const roll = interpolate(t - (start + before / CPS), [0, 0.08], [0, 1], clamp);
  const view = SCREEN.h - TASKBAR - TITLE - 30;
  const top = view - LINE - (current - 1 + roll) * LINE;
  const cursorOn = Math.floor(t * 3) % 2 === 0 || shown < lines[current].length;
  return (
    <Window app="vs" title={`${file} — Gremlin.Core — Microsoft Visual Studio`}>
      <div style={{ position: "absolute", inset: 0, fontFamily: fonts.mono, fontSize: 28, lineHeight: `${LINE}px` }}>
        <div style={{ position: "absolute", top, left: 0, right: 0 }}>
          {lines.slice(0, current + 1).map((line, i) => (
            <div key={i} style={{ display: "flex", whiteSpace: "pre", height: LINE }}>
              <span style={{ width: 70, flexShrink: 0, textAlign: "right", paddingRight: 24, color: "#2B91AF" }}>{i + 1}</span>
              <span>
                {colorize(i === current ? line.slice(0, shown) : line)}
                {i === current && cursorOn && (
                  <span style={{ display: "inline-block", width: 3, height: 32, marginBottom: -6, background: night.code.plain }} />
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Window>
  );
};

// Azure DevOps › Repos › Historikk: tre grener smelter inn i main, én per «merge».
// Ved «explodes» blir main rød og en «Build failed»-stripe dukker opp.
export const DevOpsGraph: React.FC<{ t: number; merges: number[]; explodes: number; names?: string[] }> = ({
  t,
  merges,
  explodes,
  names = ["feature/rask-fiks", "hotfix/hotfix-2-final", "yolo/fredag"],
}) => {
  const nav = 64;
  const W = SCREEN.w - nav;
  const H = SCREEN.h - TASKBAR - TITLE - 60;
  const mainY = H * 0.52;
  const branches = [
    { x: W * 0.3, y: H * 0.2, name: names[0] },
    { x: W * 0.53, y: H * 0.84, name: names[1] },
    { x: W * 0.76, y: H * 0.2, name: names[2] },
  ];
  const danger = t > explodes;
  const shake = danger ? Math.sin(t * 90) * 6 * interpolate(t, [explodes, explodes + 0.4], [0.3, 1], clamp) : 0;
  return (
    <Window app="devops" title="Historikk — Repos — Azure DevOps">
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: nav, background: "#1B1B1B", display: "flex", flexDirection: "column", alignItems: "center", gap: 18, paddingTop: 16 }}>
        {["#0078D4", "#009CCC", "#E05B3A", "#4BA0E0", "#8661C5", "#CB2E6D"].map((c, i) => (
          <div key={c} style={{ width: 30, height: 30, borderRadius: 6, background: c, opacity: i === 2 ? 1 : 0.55, outline: i === 2 ? `2px solid ${win.text}` : "none", outlineOffset: 3 }} />
        ))}
      </div>
      <div style={{ position: "absolute", left: nav, right: 0, top: 0, height: 60, display: "flex", alignItems: "center", padding: "0 22px", fontFamily: ui, fontSize: 21, color: win.dim, gap: 10 }}>
        gremlin-team / Gremlin / Repos / <span style={{ color: win.text, fontWeight: 700 }}>Historikk</span>
        {danger && (
          <span style={{ marginLeft: "auto", background: "#C42B1C", color: "#FFFFFF", fontWeight: 700, padding: "6px 14px", borderRadius: 6 }}>
            ✕ Build #1337 failed · main
          </span>
        )}
      </div>
      <svg
        width={W}
        height={H}
        style={{ position: "absolute", left: nav, top: 60, transform: `translate(${shake}px, ${shake * 0.5}px)` }}
      >
        <line x1={30} y1={mainY} x2={W - 30} y2={mainY} stroke={danger ? night.bug : night.ok} strokeWidth={9} />
        <text x={30} y={mainY + 52} fill={win.dim} fontSize={30} fontFamily={fonts.mono}>main</text>
        {branches.map((b, i) => {
          const at = merges[i];
          // Grenen tegnes inn i løpet av 0,4 s før ordet, og treffer main på ordet.
          const p = interpolate(t, [at - 0.4, at], [0, 1], clamp);
          const d = `M ${b.x - 170} ${b.y} L ${b.x - 80} ${b.y} C ${b.x - 25} ${b.y} ${b.x} ${mainY} ${b.x + 45} ${mainY}`;
          const hit = interpolate(t, [at, at + 0.25], [1.8, 1], clamp);
          const above = b.y < mainY;
          return (
            <g key={i}>
              <path d={d} fill="none" stroke={night.merge} strokeWidth={8} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
              <text
                x={above ? b.x - 170 : b.x - 182}
                y={above ? b.y - 20 : b.y + 9}
                textAnchor={above ? "start" : "end"}
                fill={night.merge}
                fontSize={28}
                fontFamily={fonts.mono}
                opacity={p}
              >
                {b.name}
              </text>
              {t >= at && (
                <circle cx={b.x + 45} cy={mainY} r={18 * hit} fill={danger ? night.bug : night.merge} stroke={night.text} strokeWidth={3} />
              )}
            </g>
          );
        })}
        {[70, 170].map((x) => (
          <circle key={x} cx={x} cy={mainY} r={15} fill={night.ok} />
        ))}
      </svg>
    </Window>
  );
};

// PowerShell (det klassiske blå vinduet): kommandoen skrives inn, svarene kommer linje for linje.
export const PowerShell: React.FC<{ t: number; lines: { at: number; text: string; type?: boolean; color?: string }[] }> = ({
  t,
  lines,
}) => {
  const prompt = "PS C:\\src> ";
  return (
    <Window app="terminal" title="Windows PowerShell" background={win.powershell}>
      <div style={{ padding: "22px 28px", fontFamily: fonts.mono, fontSize: 33, lineHeight: "52px", color: "#EEEDF0", whiteSpace: "pre" }}>
        {lines
          .filter((l) => t >= l.at)
          .map((l, i) => {
            const shown = l.type ? Math.floor(interpolate(t, [l.at, l.at + l.text.length / CPS], [0, l.text.length], clamp)) : l.text.length;
            return (
              <div key={i} style={{ color: l.color ?? "#EEEDF0" }}>
                {l.type && prompt}
                {l.text.slice(0, shown)}
              </div>
            );
          })}
        {(lines.length === 0 || t < lines[0].at) && <div>{prompt}</div>}
        <span style={{ background: "#EEEDF0", opacity: Math.floor(t * 2.5) % 2 ? 1 : 0 }}>&nbsp;</span>
      </div>
    </Window>
  );
};
