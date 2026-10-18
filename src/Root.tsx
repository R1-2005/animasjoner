import { Composition } from "remotion";
import { GREMLIN_IN_THE_REPO_FRAMES, GremlinInTheRepo } from "./gremlin_in_the_repo/GremlinInTheRepo";
import { STYLE_TEST_FRAMES, StyleTest } from "./gremlin_in_the_repo/StyleTest";
import { SYNTETISKE_DATA_FRAMES, SyntetiskeData } from "./syntetiske-data/SyntetiskeData";
import { TEKNOLOGITIMEN_FRAMES, Teknologitimen } from "./teknologitimen/Teknologitimen";
import { TestAnimasjon, testAnimasjonSchema } from "./TestAnimasjon";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="TestAnimasjon"
        component={TestAnimasjon}
        durationInFrames={480}
        fps={30}
        width={1920}
        height={1080}
        schema={testAnimasjonSchema}
        defaultProps={{
          title: "Hva skjer egentlig når du trykker «Lagre»?",
          punchline: "Tid brukt: 0,2 sekunder. Tid brukt på å forklare det: 45 minutter.",
        }}
      />
      <Composition
        id="SyntetiskeData"
        component={SyntetiskeData}
        durationInFrames={SYNTETISKE_DATA_FRAMES}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Teknologitimen"
        component={Teknologitimen}
        durationInFrames={TEKNOLOGITIMEN_FRAMES}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="GremlinInTheRepo"
        component={GremlinInTheRepo}
        durationInFrames={GREMLIN_IN_THE_REPO_FRAMES}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="GremlinInTheRepoStiltest"
        component={StyleTest}
        durationInFrames={STYLE_TEST_FRAMES}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
