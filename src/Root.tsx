import { Composition } from "remotion";
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
    </>
  );
};
