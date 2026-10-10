import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ramp } from "../style/anim";
import { theme } from "../style/theme";

type Props = {
  // Tittelfeltet nede til høyre, som på en teknisk tegning.
  titleBlock?: { label: string; value: string }[];
  children?: React.ReactNode;
};

// Lys bakgrunn med rutenett og valgfritt tittelfelt.
export const Paper: React.FC<Props> = ({ titleBlock, children }) => {
  const frame = useCurrentFrame();
  const gridOpacity = ramp(frame, 0, 20);
  const blockOpacity = ramp(frame, 10, 20);
  const { colors, fonts, stroke } = theme;

  return (
    <AbsoluteFill style={{ backgroundColor: colors.paper }}>
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{ opacity: gridOpacity }}>
        <defs>
          <pattern id="grid-minor" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke={colors.gridMinor} strokeWidth={1} />
          </pattern>
          <pattern id="grid-major" width="120" height="120" patternUnits="userSpaceOnUse">
            <rect width="120" height="120" fill="url(#grid-minor)" />
            <path d="M 120 0 L 0 0 0 120" fill="none" stroke={colors.gridMajor} strokeWidth={1.5} />
          </pattern>
        </defs>
        <rect width="1920" height="1080" fill="url(#grid-major)" />
        <rect x="40" y="40" width="1840" height="1000" fill="none" stroke={colors.ink} strokeWidth={stroke.normal} />
      </svg>
      {titleBlock ? (
        <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{ position: "absolute", opacity: blockOpacity }}>
          {titleBlock.map((row, i) => {
            const y = 1040 - (titleBlock.length - i) * 36;
            return (
              <g key={row.label}>
                <rect x={1440} y={y} width={440} height={36} fill={colors.paper} stroke={colors.ink} strokeWidth={stroke.thin} />
                <line x1={1580} y1={y} x2={1580} y2={y + 36} stroke={colors.ink} strokeWidth={stroke.thin} />
                <text x={1452} y={y + 24} fontFamily={fonts.mono} fontSize={15} fill={colors.inkSoft}>
                  {row.label}
                </text>
                <text x={1592} y={y + 24} fontFamily={fonts.mono} fontSize={17} fontWeight={600} fill={colors.ink}>
                  {row.value}
                </text>
              </g>
            );
          })}
        </svg>
      ) : null}
      {children}
    </AbsoluteFill>
  );
};
