import { interpolate, random } from "remotion";
import { kick } from "./beat";
import { fonts, night } from "./look";

// Utvalgte fraser som slås inn ord for ord på tidene fra TIMING, og pulserer på kicken.
// Én frase vises om gangen; den forrige flyr opp og forsvinner når neste begynner.

export type PhraseWord = { text: string; at: number; color?: string };
export type Phrase = { lines: PhraseWord[][]; size?: number };

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const first = (p: Phrase) => p.lines[0][0].at;

export const Phrases: React.FC<{ t: number; phrases: Phrase[]; x: number; y: number }> = ({ t, phrases, x, y }) => {
  const pulse = 1 + 0.06 * kick(t);
  return (
    <>
      {phrases.map((phrase, i) => {
        const start = first(phrase);
        const end = i + 1 < phrases.length ? first(phrases[i + 1]) : Infinity;
        if (t < start || t > end + 0.15) return null;
        const out = Number.isFinite(end) ? interpolate(t, [end, end + 0.12], [0, 1], clamp) : 0;
        const size = phrase.size ?? 104;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y - out * 80,
              opacity: 1 - out,
              fontFamily: fonts.display,
              fontSize: size,
              lineHeight: 1.02,
              color: night.text,
              textTransform: "uppercase",
              transform: `scale(${pulse})`,
              transformOrigin: "left top",
            }}
          >
            {phrase.lines.map((line, j) => (
              <div key={j} style={{ whiteSpace: "nowrap" }}>
                {line.map((w, k) => {
                  if (t < w.at) return null;
                  // Ordet smeller inn: stort og skjevt → på plass på fem frames.
                  const s = interpolate(t, [w.at, w.at + 0.16], [1.7, 1], clamp);
                  const tilt = (random(`${i}-${j}-${k}`) - 0.5) * 6;
                  return (
                    <span
                      key={k}
                      style={{
                        display: "inline-block",
                        marginRight: size * 0.22,
                        color: w.color ?? night.text,
                        transform: `scale(${s}) rotate(${tilt * (s - 0.6)}deg)`,
                        transformOrigin: "left bottom",
                        textShadow: `0 0 ${size * 0.25}px ${w.color ?? night.glow}66, 0 6px 0 ${night.black}`,
                      }}
                    >
                      {w.text}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
};
