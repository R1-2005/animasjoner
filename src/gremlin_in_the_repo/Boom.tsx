import { AbsoluteFill, interpolate, random } from "remotion";
import { fonts, night } from "./look";

// «Boom!»: hvitt blink, tegneserie-eksplosjon og kodetegn som spruter ut fra et punkt.
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const GLYPHS = ["{", "}", ";", "<", "/>", "(", ")", "=>", "$", "#", "[]", "!=", "&&", "??"];
const LIFE = 1.4;

// Kameraristing etter smellet; legges på hele scenen.
export const boomShake = (t: number, at: number) => {
  const k = interpolate(t, [at, at + 0.6], [1, 0], clamp);
  if (k <= 0 || t < at) return { x: 0, y: 0 };
  return { x: (random(`sx${Math.floor(t * 30)}`) - 0.5) * 36 * k, y: (random(`sy${Math.floor(t * 30)}`) - 0.5) * 28 * k };
};

export const Boom: React.FC<{ t: number; at: number; x: number; y: number }> = ({ t, at, x, y }) => {
  const dt = t - at;
  if (dt < 0 || dt > LIFE + 0.2) return null;
  const flash = interpolate(dt, [0, 0.25], [0.9, 0], clamp);
  const burst = interpolate(dt, [0, 0.12, 0.9, 1.1], [0.2, 1, 1, 0], clamp);
  const star = (r1: number, r2: number, n: number, seed: string) =>
    Array.from({ length: n * 2 }, (_, i) => {
      const a = (Math.PI * i) / n;
      const r = (i % 2 ? r2 : r1) * (0.85 + random(`${seed}${i}`) * 0.3);
      return `${Math.cos(a) * r},${Math.sin(a) * r}`;
    }).join(" ");
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} style={{ position: "absolute" }}>
        <g transform={`translate(${x} ${y}) scale(${burst}) rotate(${dt * 20})`}>
          <polygon points={star(380, 190, 14, "a")} fill={night.boom} />
          <polygon points={star(270, 150, 11, "b")} fill="#FFE27A" />
        </g>
        {GLYPHS.flatMap((g, i) =>
          [0, 1].map((rep) => {
            const seed = `${i}-${rep}`;
            const angle = random(`a${seed}`) * Math.PI * 2;
            const speed = 500 + random(`v${seed}`) * 700;
            const px = x + Math.cos(angle) * speed * dt;
            const py = y + Math.sin(angle) * speed * dt + 600 * dt * dt;
            return (
              <text
                key={seed}
                x={px}
                y={py}
                fill={[night.glow, night.eyes, night.merge, night.text][(i + rep) % 4]}
                fontFamily={fonts.mono}
                fontWeight={700}
                fontSize={40 + random(`s${seed}`) * 30}
                opacity={interpolate(dt, [0, LIFE], [1, 0], clamp)}
                transform={`rotate(${dt * 300 * (random(`r${seed}`) - 0.5)} ${px} ${py})`}
              >
                {g}
              </text>
            );
          }),
        )}
      </svg>
      {burst > 0 && (
        <div
          style={{
            position: "absolute",
            left: x - 400,
            top: y - 130,
            width: 800,
            textAlign: "center",
            fontFamily: fonts.display,
            fontSize: 230,
            lineHeight: 1,
            color: night.black,
            WebkitTextStroke: `6px ${night.text}`,
            transform: `scale(${burst}) rotate(-8deg)`,
          }}
        >
          BOOM!
        </div>
      )}
      <AbsoluteFill style={{ background: "#FFFFFF", opacity: flash }} />
    </AbsoluteFill>
  );
};
