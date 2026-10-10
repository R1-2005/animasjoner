import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ramp } from "../style/anim";
import { theme } from "../style/theme";

// Gremlin-hodet: ett bitmap per uttrykk (public/Gremlin_<uttrykk>.png).
// Bildene er beskåret ulikt, så hvert uttrykk har en målt skala og forskyvning som legger
// ansiktet nøyaktig oppå "nøytral". Alt tegnes i nøytral-bildets koordinater (555×310).

export type Expression =
  | "nøytral"
  | "glad"
  | "overrasket"
  | "spørrende"
  | "bekymret"
  | "oppgitt"
  | "frustrert"
  | "top_irritert"
  | "triumferende"
  | "trøtt";

export type Transition = "crossfade" | "blink" | "pop" | "shake" | "flip" | "wipe";

const FRAME = { w: 555, h: 310 };

// neutral = s * bilde + (dx, dy). Målt ved å maksimere overlapp av ansiktet (ørene utelatt).
const IMAGES: Record<Expression, { w: number; h: number; s: number; dx: number; dy: number }> = {
  nøytral: { w: 555, h: 310, s: 1, dx: 0, dy: 0 },
  glad: { w: 546, h: 310, s: 0.985, dx: 8.3, dy: 0 },
  overrasket: { w: 536, h: 305, s: 0.985, dx: 16.6, dy: -1.7 },
  spørrende: { w: 541, h: 320, s: 0.97, dx: -13.4, dy: -21.7 },
  bekymret: { w: 537, h: 320, s: 0.915, dx: 31.6, dy: -8.4 },
  oppgitt: { w: 538, h: 320, s: 0.92, dx: 5, dy: -10 },
  frustrert: { w: 535, h: 310, s: 0.985, dx: 20, dy: 1.6 },
  top_irritert: { w: 550, h: 310, s: 0.985, dx: 10, dy: 0 },
  triumferende: { w: 538, h: 320, s: 0.92, dx: 41.6, dy: -8.4 },
  trøtt: { w: 543, h: 320, s: 0.915, dx: 55, dy: -11.7 },
};

export type GremlinKey = {
  at: number;
  expression: Expression;
  // Hvordan vi går inn i dette uttrykket. Standard: komponentens `transition`.
  transition?: Transition;
};

type Props = {
  // Midten av hodet og bredden, i skjermpiksler.
  x: number;
  y: number;
  width: number;
  start: number;
  keys: GremlinKey[];
  transition?: Transition;
  // Lengden på en overgang i frames.
  duration?: number;
};

const Face: React.FC<{ expression: Expression; style?: React.CSSProperties }> = ({ expression, style }) => {
  const im = IMAGES[expression];
  return (
    <div style={{ position: "absolute", inset: 0, ...style }}>
      <Img
        src={staticFile(`Gremlin_${expression}.png`)}
        style={{ position: "absolute", left: im.dx, top: im.dy, width: im.w * im.s, height: im.h * im.s }}
      />
    </div>
  );
};

export const Gremlin: React.FC<Props> = ({ x, y, width, start, keys, transition = "pop", duration = 14 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < start) {
    return null;
  }

  let i = 0;
  while (i + 1 < keys.length && keys[i + 1].at <= frame) i++;
  const to = keys[i].expression;
  const from = keys[Math.max(0, i - 1)].expression;
  const type = keys[i].transition ?? transition;
  const p = i === 0 ? 1 : ramp(frame, keys[i].at, duration, (t) => t);
  const swapped = p >= (type === "shake" ? 0.3 : 0.5);
  const shown = swapped ? to : from;

  // Ro-pust og inngang, felles for alle overganger.
  const local = frame - start;
  const enter = spring({ frame: local, fps, config: { damping: 10 } });
  const sway = Math.sin(local / 22) * 1.2;
  const breath = 1 + Math.sin(local / 15) * 0.01;

  let sx = 1;
  let sy = 1;
  let rot = 0;
  let content: React.ReactNode = <Face expression={shown} />;

  if (p < 1) {
    const bump = Math.sin(Math.PI * p);
    switch (type) {
      case "crossfade":
        content = (
          <>
            <Face expression={from} style={{ opacity: 1 - p }} />
            <Face expression={to} style={{ opacity: p }} />
          </>
        );
        break;
      case "blink":
        // Rask "klemming", byttet skjer midt i.
        sy = 1 - 0.2 * bump;
        sx = 1 + 0.06 * bump;
        break;
      case "pop":
        // Krymper, bytter og spretter ut forbi full størrelse.
        sx = sy = 1 - 0.14 * Math.sin(2 * Math.PI * p);
        break;
      case "shake":
        rot = 7 * Math.sin(6 * Math.PI * p) * (1 - p);
        sx = sy = 1 + 0.06 * bump;
        break;
      case "flip":
        sx = Math.max(0.02, Math.abs(Math.cos(Math.PI * p)));
        break;
      case "wipe": {
        // Skannelinje som "tegner om" ansiktet ovenfra og ned.
        const top = -30;
        const bottom = FRAME.h + 30;
        const lineY = interpolate(p, [0, 1], [top, bottom]);
        content = (
          <>
            <Face expression={from} style={{ clipPath: `inset(${lineY}px -200px -200px -200px)` }} />
            <Face expression={to} style={{ clipPath: `inset(-200px -200px ${FRAME.h - lineY}px -200px)` }} />
            <div style={{ position: "absolute", left: -20, right: -20, top: lineY, height: 6, background: theme.colors.accent, opacity: bump, borderRadius: 3 }} />
          </>
        );
        break;
      }
    }
  }

  const scale = width / FRAME.w;
  return (
    <div
      style={{
        position: "absolute",
        left: x - width / 2,
        top: y - (FRAME.h * scale) / 2,
        width: FRAME.w,
        height: FRAME.h,
        transformOrigin: "0 0",
        transform: `scale(${scale})`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          transformOrigin: "50% 60%",
          transform: `scale(${enter * breath}) rotate(${sway + rot}deg) scale(${sx}, ${sy})`,
        }}
      >
        {content}
      </div>
    </div>
  );
};
