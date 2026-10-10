import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";

export const testAnimasjonSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  accent: z.string(),
});

type Props = z.infer<typeof testAnimasjonSchema>;

export const TestAnimasjon: React.FC<Props> = ({ title, subtitle, accent }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Circle pops in, then title letters spring in one by one, then subtitle fades up.
  const circleScale = spring({ frame, fps, config: { damping: 12 } });
  const subtitleOpacity = interpolate(frame, [45, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subtitleY = interpolate(frame, [45, 70], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 20, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0b1020",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Inter, Helvetica, Arial, sans-serif",
        opacity: fadeOut,
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accent}55 0%, transparent 70%)`,
          transform: `scale(${circleScale}) rotate(${frame * 0.5}deg)`,
        }}
      />
      <div style={{ display: "flex", zIndex: 1 }}>
        {title.split("").map((char, i) => {
          const s = spring({ frame: frame - 10 - i * 3, fps, config: { damping: 10 } });
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                fontSize: 180,
                fontWeight: 800,
                color: "white",
                transform: `translateY(${(1 - s) * 120}px)`,
                opacity: s,
                whiteSpace: "pre",
              }}
            >
              {char}
            </span>
          );
        })}
      </div>
      <div
        style={{
          zIndex: 1,
          marginTop: 260,
          position: "absolute",
          fontSize: 56,
          color: accent,
          opacity: subtitleOpacity,
          transform: `translateY(${subtitleY}px)`,
        }}
      >
        {subtitle}
      </div>
    </AbsoluteFill>
  );
};
