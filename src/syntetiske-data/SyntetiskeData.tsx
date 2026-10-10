import { Series, useCurrentFrame } from "remotion";
import { Gremlin, type GremlinKey } from "../components/Gremlin";
import { holdFrames, wallFrame, WithHolds } from "../components/Holds";
import { Paper } from "../components/Paper";
import { FUNDAMENTET_FRAMES, FUNDAMENTET_HOLDS, Fundamentet } from "./scenes/Fundamentet";
import { TITTEL_FRAMES, TITTEL_HOLDS, Tittel } from "./scenes/Tittel";

// Scenene i rekkefølge. Lengde og pauser bestemmes av hver scene selv.
const SCENES = [
  { id: "0 · Tittel", frames: TITTEL_FRAMES, holds: TITTEL_HOLDS, Component: Tittel },
  { id: "1 · Fundamentet", frames: FUNDAMENTET_FRAMES, holds: FUNDAMENTET_HOLDS, Component: Fundamentet },
];

const length = (s: (typeof SCENES)[number]) => s.frames + holdFrames(s.holds);

// Startframe for hver scene i den ferdige filmen (inkludert pauser).
const START = SCENES.reduce<number[]>((acc, s, i) => [...acc, i === 0 ? 0 : acc[i - 1] + length(SCENES[i - 1])], []);

// Frame `local` i scene `i`, oversatt til filmens tid.
const at = (i: number, local: number) => START[i] + wallFrame(SCENES[i].holds, local);

export const SYNTETISKE_DATA_FRAMES = SCENES.reduce((sum, s) => sum + length(s), 0);

const GREMLIN: GremlinKey[] = [
  { at: 0, expression: "nøytral" },
  { at: at(1, 60), expression: "spørrende", transition: "blink" },
  { at: at(1, 385), expression: "overrasket", transition: "shake" },
  { at: at(1, 495), expression: "glad", transition: "pop" },
];

export const SyntetiskeData: React.FC = () => {
  const frame = useCurrentFrame();
  const current = [...SCENES].reverse().find((_, i) => START[SCENES.length - 1 - i] <= frame) ?? SCENES[0];

  return (
    <Paper
      titleBlock={[
        { label: "TEGNING", value: "Syntetiske data" },
        { label: "SCENE", value: current.id },
        { label: "REV", value: "A" },
      ]}
    >
      <Series>
        {SCENES.map((scene) => (
          <Series.Sequence key={scene.id} durationInFrames={length(scene)}>
            <WithHolds holds={scene.holds}>
              <scene.Component />
            </WithHolds>
          </Series.Sequence>
        ))}
      </Series>
      <Gremlin x={1730} y={140} width={240} start={20} keys={GREMLIN} />
    </Paper>
  );
};
