import { Composition } from "remotion";
import { TestAnimasjon, testAnimasjonSchema } from "./TestAnimasjon";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="TestAnimasjon"
      component={TestAnimasjon}
      durationInFrames={150}
      fps={30}
      width={1920}
      height={1080}
      schema={testAnimasjonSchema}
      defaultProps={{
        title: "Animasjoner",
        subtitle: "Laget med Remotion",
        accent: "#4f8cff",
      }}
    />
  );
};
