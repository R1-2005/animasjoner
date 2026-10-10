import { evolvePath } from "@remotion/paths";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { ramp } from "../style/anim";
import { theme } from "../style/theme";

type Props = {
  cx: number;
  cy: number;
  r: number;
  start: number;
  // "back" tegnes bak objektet (sirkelen), "front" foran (lysglimt, stråler, gnister).
  layer: "back" | "front";
};

// Alkymistisk forvandling: en transmutasjonssirkel tegnes, spinner opp og gløder,
// og ender i et lysglimt med stråler og gnister.
export const TRANSMUTATION_FLASH = 38; // frames etter start til glimtet
const circlePath = (cx: number, cy: number, r: number) => `M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy}`;
const star = (r: number) => `M 0 ${-r} Q 0 0 ${r} 0 Q 0 0 0 ${r} Q 0 0 ${-r} 0 Q 0 0 0 ${-r} Z`;

export const Transmutation: React.FC<Props> = ({ cx, cy, r, start, layer }) => {
  const frame = useCurrentFrame();
  const { colors } = theme;
  const t = frame - start;
  if (t < 0) {
    return null;
  }

  if (layer === "back") {
    const draw = ramp(frame, start, 26);
    const glow = ramp(frame, start + 18, 18);
    const fade = 1 - ramp(frame, start + TRANSMUTATION_FLASH + 2, 16);
    if (fade <= 0) {
      return null;
    }
    // Spinner sakte, så stadig raskere frem mot glimtet.
    const spin = interpolate(t, [0, TRANSMUTATION_FLASH], [0, 220], { extrapolateRight: "extend", easing: Easing.in(Easing.quad) });
    const r2 = r * 0.86;
    const tri = (offset: number) =>
      [0, 1, 2].map((k) => {
        const a = ((offset + k * 120 - 90) * Math.PI) / 180;
        return `${k === 0 ? "M" : "L"} ${cx + Math.cos(a) * r2} ${cy + Math.sin(a) * r2}`;
      }).join(" ") + " Z";
    const parts = [circlePath(cx, cy, r), circlePath(cx, cy, r2), tri(0), tri(60), circlePath(cx, cy, r * 0.32)];
    const markers = Array.from({ length: 6 }, (_, k) => {
      const a = ((k * 60 + 30 - 90) * Math.PI) / 180;
      const mr = (r + r2) / 2;
      return { x: cx + Math.cos(a) * mr, y: cy + Math.sin(a) * mr };
    });
    const layerOf = (color: string, opacity: number, width: number) => (
      <g opacity={opacity}>
        {parts.map((d, i) => {
          const { strokeDasharray, strokeDashoffset } = evolvePath(draw, d);
          return <path key={i} d={d} fill="none" stroke={color} strokeWidth={width} strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} />;
        })}
        {/* Alkymistenes tegn for gull: ☉ */}
        {markers.map((m, i) => (
          <g key={i} opacity={ramp(frame, start + 12 + i * 2, 8)}>
            <circle cx={m.x} cy={m.y} r={r * 0.055} fill={colors.paper} stroke={color} strokeWidth={width} />
            <circle cx={m.x} cy={m.y} r={r * 0.014} fill={color} />
          </g>
        ))}
      </g>
    );
    return (
      <g transform={`rotate(${spin} ${cx} ${cy})`} opacity={fade}>
        {layerOf(colors.ink, 1 - glow, 2)}
        {layerOf(colors.gold, glow, 3.5)}
      </g>
    );
  }

  // Foran: glimt, stråler og gnister.
  const f = (frame - start - TRANSMUTATION_FLASH) / 30;
  if (f < 0 || f > 1) {
    return null;
  }
  const flash = Math.sin(Math.PI * Math.min(1, f * 1.6));
  const id = `flash-${cx}-${cy}`;
  return (
    <g>
      <defs>
        <radialGradient id={id}>
          <stop offset="0%" stopColor="white" stopOpacity={1} />
          <stop offset="40%" stopColor={colors.goldLight} stopOpacity={0.9} />
          <stop offset="100%" stopColor={colors.goldFill} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r * (0.4 + 1.1 * Math.min(1, f * 1.6))} fill={`url(#${id})`} opacity={flash} />
      {Array.from({ length: 12 }, (_, k) => {
        const a = ((k * 30 + 15) * Math.PI) / 180;
        const inner = r * (0.3 + f * 0.6);
        const outer = r * (0.5 + f * 1.1);
        return (
          <line key={k} x1={cx + Math.cos(a) * inner} y1={cy + Math.sin(a) * inner} x2={cx + Math.cos(a) * outer} y2={cy + Math.sin(a) * outer}
            stroke={colors.goldFill} strokeWidth={5} strokeLinecap="round" opacity={1 - f} />
        );
      })}
      {Array.from({ length: 14 }, (_, k) => {
        const a = ((k * (360 / 14) + 7) * Math.PI) / 180;
        const dist = r * (0.2 + 1.2 * Easing.out(Easing.cubic)(f)) * (k % 2 ? 0.8 : 1);
        return (
          <path key={k} d={star(12 + (k % 3) * 5)} transform={`translate(${cx + Math.cos(a) * dist} ${cy + Math.sin(a) * dist}) rotate(${f * 90})`}
            fill="white" stroke={colors.gold} strokeWidth={1.5} opacity={1 - f} />
        );
      })}
    </g>
  );
};
