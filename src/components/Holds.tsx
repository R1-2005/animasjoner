import { Freeze, useCurrentFrame } from "remotion";

// Pauser der bildet står stille mens foredragsholderen snakker.
// `at` er scenens egen frame der den fryser, `frames` er hvor lenge.
export type Hold = { at: number; frames: number };

export const holdFrames = (holds: Hold[]) => holds.reduce((sum, h) => sum + h.frames, 0);

// Scenetid → veggtid: hvor i den ferdige filmen en frame i scenen havner.
export const wallFrame = (holds: Hold[], local: number) =>
  local + holds.filter((h) => h.at < local).reduce((sum, h) => sum + h.frames, 0);

// Veggtid → scenetid: står stille under en pause, hopper over pausene etterpå.
const sceneFrame = (holds: Hold[], wall: number) => {
  let t = wall;
  for (const h of [...holds].sort((a, b) => a.at - b.at)) {
    if (t < h.at) break;
    if (t < h.at + h.frames) return h.at;
    t -= h.frames;
  }
  return t;
};

// Spiller av barna med pausene lagt inn.
export const WithHolds: React.FC<{ holds: Hold[]; children: React.ReactNode }> = ({ holds, children }) => {
  const frame = useCurrentFrame();
  return <Freeze frame={sceneFrame(holds, frame)}>{children}</Freeze>;
};
