import { random } from "remotion";
import { night } from "./look";

// Røyk og flammer som legges oppå scenen (skjermkoordinater).

export type Point = { x: number; y: number };

// Røyk som stiger fra punktene etter `from`.
export const Smoke: React.FC<{ t: number; from: number; sources: Point[]; height?: number }> = ({ t, from, sources, height = 220 }) => {
  if (t < from) return null;
  const amount = Math.min(1, (t - from) / 0.6);
  return (
    <>
      {sources.flatMap((s, i) =>
        [0, 1, 2].map((k) => {
          const a = ((t - from) * 0.7 + k / 3 + random(`sm${i}`) * 0.5) % 1;
          const size = 60 + a * 200;
          return (
            <div
              key={`${i}-${k}`}
              style={{
                position: "absolute",
                left: s.x - size / 2 + Math.sin(a * 5 + i) * 30,
                top: s.y - a * height - size / 2,
                width: size,
                height: size,
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(120,128,145,0.55), rgba(120,128,145,0) 70%)",
                opacity: amount * (1 - a),
              }}
            />
          );
        }),
      )}
    </>
  );
};

// Flammetunger langs en linje (fra x til x + w, med foten på y), som flakker.
export const Fire: React.FC<{ t: number; from: number; x: number; y: number; w: number; size?: number }> = ({ t, from, x, y, w, size = 1 }) => {
  if (t < from) return null;
  const grow = Math.min(1, (t - from) / 0.4);
  const n = Math.max(3, Math.round(w / 34));
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x - 60,
          top: y - 160 * size,
          width: w + 120,
          height: 220 * size,
          borderRadius: "50%",
          background: `radial-gradient(ellipse at 50% 70%, ${night.boom}88, transparent 70%)`,
          opacity: grow * (0.7 + 0.3 * Math.sin(t * 17)),
        }}
      />
      {Array.from({ length: n }, (_, i) => {
        const flick = 0.75 + 0.25 * Math.sin(t * (13 + i * 3) + i * 1.7);
        const h = (60 + random(`fh${i}`) * 70) * size * flick * grow;
        const fw = (30 + random(`fw${i}`) * 18) * size;
        return (
          <div key={i}>
            <div
              style={{
                position: "absolute",
                left: x + (i / (n - 1)) * w - fw / 2,
                top: y - h,
                width: fw,
                height: h,
                borderRadius: "50% 50% 45% 45% / 70% 70% 30% 30%",
                background: `linear-gradient(${night.boom}, ${night.bug})`,
                opacity: 0.9,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: x + (i / (n - 1)) * w - fw / 4,
                top: y - h * 0.55,
                width: fw / 2,
                height: h * 0.55,
                borderRadius: "50% 50% 45% 45% / 70% 70% 30% 30%",
                background: "#FFE27A",
              }}
            />
          </div>
        );
      })}
    </>
  );
};
