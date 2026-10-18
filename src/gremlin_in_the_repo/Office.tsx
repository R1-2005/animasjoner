import { AbsoluteFill, random } from "remotion";
import { fonts, night } from "./look";

// Scenen: mørkt kontorlandskap om natta. Utvikleren sitter med ryggen til oss foran en stor
// skjerm; bak til venstre et serverskap og tomme pulter der Gremlin lusker som en skygge.
// Lagene tegnes i rekkefølge (vegg → skap → pult bak → Gremlin → små skjermer → pultfront →
// stoler → hovedskjerm → pult → utvikler), så Gremlin skjules av det som står foran ham.

// Hovedskjermen. Innholdet (HTML) legges i SCREEN-rektangelet.
export const MONITOR = { x: 600, y: 130, w: 1150, h: 644, bezel: 16 };
export const SCREEN = {
  x: MONITOR.x + MONITOR.bezel,
  y: MONITOR.y + MONITOR.bezel,
  w: MONITOR.w - 2 * MONITOR.bezel,
  h: MONITOR.h - 2 * MONITOR.bezel,
};
export const SCREEN_CENTER = { x: SCREEN.x + SCREEN.w / 2, y: SCREEN.y + SCREEN.h / 2 };

// Bakgrunnen til venstre: et serverskap («skyen») og en rad tomme pulter med tomme stoler.
// Gremlin lusker mellom skapet og pultene, så pultfronten og skjermene skjuler kroppen hans.
export const RACK = { x: 40, y: 380, w: 130, h: 340 };
const BACK_DESK = { x: 190, w: 390, top: 575, front: 590, bottom: 720 };
export const BACK_MONITORS = [
  { x: 220, y: 485, w: 140, h: 86, color: night.glow },
  { x: 420, y: 485, w: 140, h: 86, color: night.merge },
];

const Svg: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill>
    <svg width={1920} height={1080} viewBox="0 0 1920 1080">
      {children}
    </svg>
  </AbsoluteFill>
);

// Bakvegg, vindu med persienner og skjermlys på veggen.
export const Room: React.FC<{ glow: number }> = ({ glow }) => (
  <Svg>
    <defs>
      <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={night.room} />
        <stop offset="0.6" stopColor={night.wall} />
        <stop offset="1" stopColor={night.room} />
      </linearGradient>
      <radialGradient id="spill" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor={night.glow} stopOpacity={0.22 * glow} />
        <stop offset="0.5" stopColor={night.glow} stopOpacity={0.07 * glow} />
        <stop offset="1" stopColor={night.glow} stopOpacity={0} />
      </radialGradient>
      <linearGradient id="moon" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={night.moon} stopOpacity={0.28} />
        <stop offset="1" stopColor={night.moon} stopOpacity={0.06} />
      </linearGradient>
    </defs>
    <rect width={1920} height={1080} fill="url(#wall)" />
    {/* Vindu i høyre kant, persienner som slipper inn måneskinn. */}
    <rect x={1790} y={70} width={300} height={380} fill="url(#moon)" />
    {Array.from({ length: 14 }, (_, i) => (
      <rect key={i} x={1790} y={70 + i * 27 + 14} width={300} height={13} fill={night.room} opacity={0.85} />
    ))}
    <rect x={1790} y={70} width={300} height={380} fill="none" stroke={night.black} strokeWidth={10} />
    <ellipse cx={SCREEN_CENTER.x} cy={SCREEN_CENTER.y} rx={900} ry={520} fill="url(#spill)" />
  </Svg>
);

// Serverskapet: lysdioder som blinker rolig grønt, eller rødt og hektisk når Gremlin har vært der.
export const Rack: React.FC<{ t: number; chaos: number }> = ({ t, chaos }) => {
  const rate = chaos > 0 ? 14 : 3;
  const tick = Math.floor(t * rate);
  return (
    <Svg>
      <rect x={RACK.x} y={RACK.y} width={RACK.w} height={RACK.h} rx={4} fill={night.black} />
      <rect x={RACK.x} y={RACK.y} width={RACK.w} height={RACK.h} rx={4} fill="none" stroke={night.dim} strokeOpacity={0.4} strokeWidth={2} />
      {Array.from({ length: Math.floor((RACK.h - 20) / 34) }, (_, row) => (
        <g key={row}>
          <rect x={RACK.x + 10} y={RACK.y + 16 + row * 34} width={RACK.w - 20} height={26} rx={2} fill="#0E1522" />
          {[0, 1, 2, 3].map((col) => {
            const on = random(`led-${row}-${col}-${tick}`) > (chaos > 0 ? 0.35 : 0.55);
            const red = chaos > 0 && random(`red-${row}-${col}-${tick}`) < chaos;
            return (
              <circle
                key={col}
                cx={RACK.x + 24 + col * 13}
                cy={RACK.y + 29 + row * 34}
                r={3.5}
                fill={red ? night.bug : night.ok}
                opacity={on ? 1 : 0.15}
              />
            );
          })}
        </g>
      ))}
    </Svg>
  );
};

export const BackDeskTop: React.FC = () => (
  <Svg>
    <rect x={BACK_DESK.x} y={BACK_DESK.top} width={BACK_DESK.w} height={BACK_DESK.front - BACK_DESK.top} fill={night.wallLit} />
  </Svg>
);

// De små skjermene på pultene bak. glitch (0..1) per skjerm: rødt bildestøy.
export const BackMonitors: React.FC<{ t: number; glitch: number[]; glitchColor?: string[] }> = ({
  t,
  glitch,
  glitchColor = [],
}) => (
  <Svg>
    {BACK_MONITORS.map((m, i) => {
      const g = glitch[i] ?? 0;
      const tick = Math.floor(t * 20);
      return (
        <g key={i}>
          <rect x={m.x} y={m.y} width={m.w} height={m.h} rx={6} fill={night.black} />
          <rect x={m.x + 7} y={m.y + 7} width={m.w - 14} height={m.h - 14} fill={m.color} opacity={0.16 + 0.04 * Math.sin(t * 7 + i)} />
          {g > 0 &&
            Array.from({ length: 7 }, (_, k) => (
              <rect
                key={k}
                x={m.x + 7 + random(`gx${i}-${k}-${tick}`) * 40}
                y={m.y + 7 + k * 11}
                width={(m.w - 14) * (0.4 + random(`gw${i}-${k}-${tick}`) * 0.6)}
                height={6 + random(`gh${i}-${k}-${tick}`) * 6}
                fill={random(`gc${i}-${k}-${tick}`) > 0.3 ? (glitchColor[i] ?? night.bug) : night.text}
                opacity={g * 0.85}
              />
            ))}
          <rect x={m.x + m.w / 2 - 7} y={m.y + m.h} width={14} height={6} fill={night.black} />
        </g>
      );
    })}
  </Svg>
);

// Fronten av pultraden bak (skjuler beina til Gremlin) og gulvet.
export const BackDeskFront: React.FC = () => (
  <Svg>
    <rect
      x={BACK_DESK.x}
      y={BACK_DESK.front}
      width={BACK_DESK.w}
      height={BACK_DESK.bottom - BACK_DESK.front}
      fill={night.desk}
    />
    <rect x={BACK_DESK.x} y={BACK_DESK.front} width={BACK_DESK.w} height={3} fill={night.dim} opacity={0.5} />
    <rect x={0} y={BACK_DESK.bottom} width={1920} height={1080 - BACK_DESK.bottom} fill={night.room} />
  </Svg>
);

// Tomme kontorstoler foran pultene bak. spin (radianer) dreier en stol, som om noen nettopp gikk forbi.
export const EmptyChairs: React.FC<{ spin: number[] }> = ({ spin }) => (
  <Svg>
    {[290, 490].map((x, i) => {
      const turn = Math.cos(spin[i] ?? 0);
      return (
        <g key={x}>
          <rect x={x - 6} y={690} width={12} height={70} fill={night.black} />
          <path d={`M ${x - 55} 775 L ${x + 55} 775`} stroke={night.black} strokeWidth={10} strokeLinecap="round" />
          <g transform={`translate(${x} 0) scale(${0.25 + 0.75 * Math.abs(turn)} 1)`}>
            <rect x={-48} y={600} width={96} height={100} rx={18} fill={night.black} />
            <rect x={-48} y={600} width={96} height={100} rx={18} fill="none" stroke={night.dim} strokeOpacity={0.35} strokeWidth={2} />
          </g>
        </g>
      );
    })}
  </Svg>
);

// Rammen rundt hovedskjermen og foten. Skjerminnholdet tegnes som HTML oppå (se SCREEN).
export const MonitorFrame: React.FC = () => (
  <Svg>
    <rect x={MONITOR.x + MONITOR.w / 2 - 22} y={MONITOR.y + MONITOR.h} width={44} height={80} fill={night.black} />
    <ellipse cx={MONITOR.x + MONITOR.w / 2} cy={MONITOR.y + MONITOR.h + 82} rx={130} ry={14} fill={night.black} />
    <rect x={MONITOR.x} y={MONITOR.y} width={MONITOR.w} height={MONITOR.h} rx={14} fill={night.black} />
    <rect x={MONITOR.x} y={MONITOR.y} width={MONITOR.w} height={MONITOR.h} rx={14} fill="none" stroke={night.glow} strokeOpacity={0.25} strokeWidth={2} />
  </Svg>
);

// Pulten foran utvikleren: venstre kant og høyden på bordplata.
const DESK_X = 540;
export const DESK_TOP = MONITOR.y + MONITOR.h + 90;

// Pulten foran utvikleren, med en kaffekopp som får skjermlys på siden.
// Koppen kan veltes: claw (0..1) er en Gremlin-klo som stikker inn fra høyre kant, tip (0..1)
// velter koppen mot venstre, spill (0..1) er kaffepytten som brer seg på pulten.
export type Mug = { claw?: number; tip?: number; spill?: number };
const MUG = { x: 1790, w: 56, h: 66 };

export const MainDesk: React.FC<{ steam: number; mug?: Mug }> = ({ steam, mug = {} }) => {
  const { claw = 0, tip = 0, spill = 0 } = mug;
  const handX = 1940 - 95 * claw;
  const handY = DESK_TOP - 34;
  return (
    <Svg>
      <defs>
        <linearGradient id="desk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={night.wallLit} />
          <stop offset="0.15" stopColor={night.desk} />
        </linearGradient>
      </defs>
      <path d={`M ${DESK_X} ${DESK_TOP} L 1920 ${DESK_TOP} L 1920 1080 L ${DESK_X} 1080 Z`} fill="url(#desk)" />
      <rect x={DESK_X} y={DESK_TOP} width={1920 - DESK_X} height={2} fill={night.glow} opacity={0.35} />
      {spill > 0 && (
        <g>
          <ellipse cx={MUG.x - 40 - 60 * spill} cy={DESK_TOP + 8} rx={160 * spill} ry={18 * spill} fill="#7A4A26" />
          <ellipse cx={MUG.x - 40 - 60 * spill} cy={DESK_TOP + 8} rx={160 * spill} ry={18 * spill} fill="none" stroke="#A86B3C" strokeWidth={2} />
          <ellipse cx={MUG.x - 80 - 60 * spill} cy={DESK_TOP + 3} rx={70 * spill} ry={4 * spill} fill={night.glow} opacity={0.45} />
        </g>
      )}
      <g transform={`translate(${MUG.x} ${DESK_TOP - MUG.h + 6}) rotate(${-92 * tip} 0 ${MUG.h})`}>
        <rect x={0} y={0} width={MUG.w} height={MUG.h} rx={8} fill={night.black} />
        <path d="M 56 16 q 26 0 26 20 q 0 20 -26 20" fill="none" stroke={night.black} strokeWidth={9} />
        <rect x={0} y={0} width={4} height={MUG.h} fill={night.glow} opacity={0.5} />
        {tip === 0 &&
          [0, 1].map((i) => (
            <path
              key={i}
              d={`M ${18 + i * 18} -8 q -8 -14 0 -28 q 8 -14 0 -28`}
              fill="none"
              stroke={night.dim}
              strokeWidth={4}
              strokeLinecap="round"
              opacity={0.35 + 0.25 * Math.sin(steam * 3 + i * 2)}
              transform={`translate(${Math.sin(steam * 2 + i) * 4} 0)`}
            />
          ))}
      </g>
      {claw > 0 && (
        <g fill="none" strokeLinecap="round" opacity={0.85}>
          <path d={`M 1990 ${handY + 30} Q ${handX + 60} ${handY + 10} ${handX} ${handY}`} stroke="#2A3754" strokeWidth={30} />
          <path d={`M 1990 ${handY + 30} Q ${handX + 60} ${handY + 10} ${handX} ${handY}`} stroke={night.black} strokeWidth={24} />
          {[-30, 0, 30].map((a) => {
            const r = ((180 + a) * Math.PI) / 180;
            return <path key={a} d={`M ${handX} ${handY} l ${Math.cos(r) * 24} ${Math.sin(r) * 24}`} stroke={night.black} strokeWidth={8} />;
          })}
        </g>
      )}
    </Svg>
  );
};

// Utvikler sett bakfra: hettegenser og hodetelefoner, med skjermlys i kanten.
// Følelser vises tegneserieaktig: sway (hodet vipper litt mens han koder), vein (rødt sinne-merke),
// grawlix (bannesky «#@$%!») og slump (0..1: hodet i en bue ned i pulten mens kroppen står stille).
export const Dev: React.FC<{
  cx: number;
  top: number;
  id: string;
  scale?: number;
  bob?: number;
  sway?: number;
  slump?: number;
  vein?: number;
  grawlix?: number;
}> = ({ cx, top, id, scale = 1, bob = 0, sway = 0, slump = 0, vein = 0, grawlix = 0 }) => {
  const hood = "M -118 190 C -132 95 -96 0 0 0 C 96 0 132 95 118 190 Z";
  const body = "M -310 1200 L -310 500 C -310 330 -250 250 -120 205 L 120 205 C 250 250 310 330 310 500 L 310 1200 Z";
  const band = "M -122 120 C -122 20 -60 -14 0 -14 C 60 -14 122 20 122 120";
  // Sett bakfra går hodet i en bue framover og ned: det synker, blir litt mindre (lenger unna)
  // og forsvinner bak skuldrene, som derfor tegnes oppå hodet.
  const arc = Math.sin((slump * Math.PI) / 2);
  const headY = bob + arc * 105;
  const headScale = 1 - arc * 0.22;
  const corner = "M 9 -28 Q 9 -9 28 -9";
  return (
    <Svg>
      <defs>
        <linearGradient id={`rim-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={night.glow} stopOpacity={0.9} />
          <stop offset="0.35" stopColor={night.glow} stopOpacity={0.15} />
          <stop offset="0.6" stopColor={night.glow} stopOpacity={0} />
        </linearGradient>
        <filter id={`soft-${id}`}>
          <feGaussianBlur stdDeviation={3} />
        </filter>
      </defs>
      <g transform={`translate(${cx} ${top}) scale(${scale})`}>
        <g transform={`translate(0 ${headY}) rotate(${sway} 0 190) translate(0 190) scale(${headScale}) translate(0 -190)`}>
          <path d={hood} fill={night.black} />
          <path d={hood} fill="none" stroke={`url(#rim-${id})`} strokeWidth={5} filter={`url(#soft-${id})`} />
          <path d={band} fill="none" stroke="#1A2133" strokeWidth={16} strokeLinecap="round" />
          <path d={band} fill="none" stroke={night.glow} strokeOpacity={0.35} strokeWidth={3} />
          <rect x={-146} y={92} width={40} height={84} rx={14} fill="#1A2133" />
          <rect x={106} y={92} width={40} height={84} rx={14} fill="#1A2133" />
          {vein > 0 && (
            <g transform={`translate(95 10) scale(${vein})`}>
              {[0, 90, 180, 270].map((r) => (
                <path key={r} d={corner} transform={`rotate(${r})`} fill="none" stroke={night.bug} strokeWidth={9} strokeLinecap="round" />
              ))}
            </g>
          )}
        </g>
        <path d={body} fill={night.black} />
        <path d={body} fill="none" stroke={`url(#rim-${id})`} strokeWidth={4} filter={`url(#soft-${id})`} />
        {grawlix > 0 && (
          <g transform={`translate(-330 75) scale(${grawlix * 0.85}) rotate(${Math.sin(grawlix * 30) * 3})`}>
            <path
              d="M -150 0 Q -165 -60 -100 -70 Q -80 -115 -20 -95 Q 30 -125 80 -90 Q 145 -95 150 -40 Q 185 10 130 40 Q 110 85 40 70 Q -10 100 -60 70 Q -140 80 -150 0 Z"
              fill={night.text}
              stroke={night.black}
              strokeWidth={6}
            />
            <text x={0} y={8} textAnchor="middle" fontFamily={fonts.display} fontSize={70} fill={night.bug} stroke={night.black} strokeWidth={2}>
              #@$%&!
            </text>
          </g>
        )}
      </g>
    </Svg>
  );
};

export const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{ background: "radial-gradient(ellipse at 55% 45%, transparent 45%, rgba(0,0,0,0.75) 100%)" }}
  />
);
