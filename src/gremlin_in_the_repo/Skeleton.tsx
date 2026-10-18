import { Audio } from "@remotion/media";
import { AbsoluteFill, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../style/theme";
import { Line, TIMING } from "./timing";

import { SONG_SECONDS } from "./GremlinInTheRepo";

const LINES: { section: string; line: Line }[] = TIMING.sections.flatMap((section) =>
  section.lines.map((line) => ({ section: section.name, line })),
);

const { colors, fonts } = theme;

// Indeksen til det siste elementet som har startet ved tid t (-1 før det første).
const lastStarted = (starts: number[], t: number) => {
  let i = -1;
  while (i + 1 < starts.length && starts[i + 1] <= t) i++;
  return i;
};
const LINE_STARTS = LINES.map(({ line }) => line.s);
const SECTION_STARTS = TIMING.sections.map((s) => s.s);

// Karaoke-skjelett: viser timingen fra song_timing.py mot lyden, så synk kan sjekkes i Studio
// før selve animasjonen tegnes.
export const Skeleton: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const beatIndex = Math.floor((t - TIMING.firstDownbeat) / TIMING.beat);
  const beatPhase = (t - TIMING.firstDownbeat) / TIMING.beat - beatIndex;
  const bar = Math.floor(beatIndex / 4) + 1;
  const beatInBar = ((beatIndex % 4) + 4) % 4;
  const inSong = beatIndex >= 0 && beatIndex < TIMING.beats;

  const current = lastStarted(LINE_STARTS, t);
  const shown = current >= 0 && t < LINES[current].line.e + 1.5 ? LINES[current] : null;
  const next = LINES[current + 1];
  const section = TIMING.sections[lastStarted(SECTION_STARTS, t + 0.5)];
  const dropIndex = TIMING.drops.findIndex(([a, b]) => t >= a && t < b);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.paper,
        fontFamily: fonts.sans,
        color: colors.ink,
        translate: "-39.8px 0px"
      }}
    >
      <Audio src={staticFile(TIMING.audio)} />

      <div style={{ position: "absolute", left: 80, top: 60, fontSize: 64, fontWeight: 800 }}>
        {section && `${section.ref} · ${section.name}`}
      </div>
      <div style={{ position: "absolute", right: 80, top: 60, textAlign: "right", fontFamily: fonts.mono }}>
        <div style={{ fontSize: 40 }}>
          {`T${bar}.${beatInBar + 1}`}
        </div>
        <div style={{ fontSize: 26, color: colors.inkSoft }}>
          {TIMING.bpm} BPM · {t.toFixed(2)} s
        </div>
        <div style={{ display: "flex", gap: 18, justifyContent: "flex-end", marginTop: 18 }}>
          {[0, 1, 2, 3].map((b) => {
            const on = inSong && b === beatInBar;
            const pulse = on ? interpolate(beatPhase, [0, 0.5], [1, 0.25], { extrapolateRight: "clamp" }) : 0.12;
            return (
              <div
                key={b}
                style={{
                  width: b === 0 ? 40 : 30,
                  height: b === 0 ? 40 : 30,
                  borderRadius: "50%",
                  alignSelf: "center",
                  backgroundColor: b === 0 ? colors.highlight : colors.ink,
                  opacity: pulse,
                }}
              />
            );
          })}
        </div>
      </div>

      {dropIndex >= 0 && (
        <div
          style={{
            position: "absolute",
            left: 80,
            top: 160,
            padding: "6px 22px",
            border: `4px solid ${colors.person}`,
            color: colors.person,
            fontFamily: fonts.mono,
            fontSize: 34,
            fontWeight: 600,
          }}
        >
          D{dropIndex + 1} · trommene stopper
        </div>
      )}

      <div style={{ position: "absolute", left: 80, right: 80, top: 400 }}>
        {shown && (
          <div style={{ fontFamily: fonts.mono, fontSize: 34, color: colors.inkSoft, marginBottom: 12 }}>
            {shown.line.ref}
          </div>
        )}
        {shown && (
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.2 }}>
            {shown.line.words.map((w, i) => {
              const sung = t >= w.s;
              const active = t >= w.s && t < w.e;
              return (
                <span
                  key={i}
                  style={{
                    color: active
                      ? colors.highlight
                      : w.adlib
                        ? colors.accent
                        : sung
                          ? colors.ink
                          : colors.gridMajor,
                    fontStyle: w.adlib ? "italic" : "normal",
                    textDecoration: w.guessed ? "underline dotted" : "none",
                    textDecorationColor: colors.inkSoft,
                  }}
                >
                  {w.text}{" "}
                </span>
              );
            })}
          </div>
        )}
        {next && (
          <div style={{ marginTop: 40, fontSize: 44, color: colors.inkSoft }}>
            <span style={{ fontFamily: fonts.mono, fontSize: 30 }}>{next.line.ref}</span> {next.line.text}
          </div>
        )}
      </div>

      <div style={{ position: "absolute", left: 80, right: 80, bottom: 70, height: 60 }}>
        {TIMING.sections.map((s, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${(s.s / SONG_SECONDS) * 100}%`,
              width: `${((s.e - s.s) / SONG_SECONDS) * 100}%`,
              top: 0,
              height: 60,
              backgroundColor: s.name.startsWith("Chorus") ? colors.goldLight : colors.gridMinor,
              borderLeft: `3px solid ${colors.ink}`,
              fontSize: 22,
              padding: "4px 8px",
              overflow: "hidden",
              whiteSpace: "nowrap",
            }}
          >
            {s.ref}
          </div>
        ))}
        <div
          style={{
            position: "absolute",
            left: `${(t / SONG_SECONDS) * 100}%`,
            top: -12,
            width: 4,
            height: 84,
            backgroundColor: colors.highlight,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
