import { Series, useCurrentFrame } from "remotion";
import { Gremlin, type GremlinKey } from "../components/Gremlin";
import { type Hold, holdFrames, wallFrame, WithHolds } from "../components/Holds";
import { Paper } from "../components/Paper";
import { AFP_FRAMES, AFP_HOLDS, AfpSoknad } from "./scenes/AfpSoknad";
import { FAKTURERING_FRAMES, FAKTURERING_HOLDS, Fakturering } from "./scenes/Fakturering";
import { FUNDAMENTET_FRAMES, FUNDAMENTET_HOLDS, Fundamentet } from "./scenes/Fundamentet";
import { Kapittel, KAPITTEL_FRAMES } from "./scenes/Kapittel";
import { TITTEL_FRAMES, TITTEL_HOLDS, Tittel } from "./scenes/Tittel";

const KapittelFundamentet = () => (
  <Kapittel n={1} title="Fundamentet" subtitle="Tilslutningsregisteret — vårt eget register over bedriftene i AFP-ordningen" register={false} />
);
const KapittelFakturering = () => <Kapittel n={2} title="Fakturering" subtitle="Hvert kvartal: fra register til faktura" />;
const KapittelAfp = () => <Kapittel n={3} title="AFP-søknad" subtitle="Én person søker avtalefestet pensjon" />;

// Scenene i rekkefølge. Lengde og pauser bestemmes av hver scene selv.
// `id` vises i tittelfeltet; kapittelkortet hører til scenen det introduserer.
const SCENES = [
  { key: "tittel", id: "0 · Tittel", frames: TITTEL_FRAMES, holds: TITTEL_HOLDS, Component: Tittel },
  { key: "kap-fundamentet", id: "1 · Fundamentet", frames: KAPITTEL_FRAMES, holds: [] as Hold[], Component: KapittelFundamentet },
  { key: "fundamentet", id: "1 · Fundamentet", frames: FUNDAMENTET_FRAMES, holds: FUNDAMENTET_HOLDS, Component: Fundamentet },
  { key: "kap-fakturering", id: "2 · Fakturering", frames: KAPITTEL_FRAMES, holds: [] as Hold[], Component: KapittelFakturering },
  { key: "fakturering", id: "2 · Fakturering", frames: FAKTURERING_FRAMES, holds: FAKTURERING_HOLDS, Component: Fakturering },
  { key: "kap-afp", id: "3 · AFP-søknad", frames: KAPITTEL_FRAMES, holds: [] as Hold[], Component: KapittelAfp },
  { key: "afp", id: "3 · AFP-søknad", frames: AFP_FRAMES, holds: AFP_HOLDS, Component: AfpSoknad },
];

type SceneKey = (typeof SCENES)[number]["key"];

const length = (s: (typeof SCENES)[number]) => s.frames + holdFrames(s.holds);

// Startframe for hver scene i den ferdige filmen (inkludert pauser).
const START = SCENES.reduce<number[]>((acc, s, i) => [...acc, i === 0 ? 0 : acc[i - 1] + length(SCENES[i - 1])], []);

// Frame `local` i scenen `key`, oversatt til filmens tid.
const at = (key: SceneKey, local: number) => {
  const i = SCENES.findIndex((s) => s.key === key);
  return START[i] + wallFrame(SCENES[i].holds, local);
};

export const SYNTETISKE_DATA_FRAMES = SCENES.reduce((sum, s) => sum + length(s), 0);

const GREMLIN: GremlinKey[] = [
  { at: 0, expression: "nøytral" },
  { at: at("fundamentet", 60), expression: "spørrende", transition: "blink" },
  { at: at("fundamentet", 385), expression: "overrasket", transition: "shake" },
  { at: at("fundamentet", 495), expression: "glad", transition: "pop" },
  { at: at("fundamentet", 645), expression: "overrasket", transition: "shake" },
  { at: at("fundamentet", 682), expression: "triumferende", transition: "pop" },
  { at: at("fakturering", 0), expression: "nøytral", transition: "blink" },
  { at: at("fakturering", 175), expression: "overrasket", transition: "shake" },
  { at: at("fakturering", 265), expression: "spørrende", transition: "blink" },
  { at: at("fakturering", 345), expression: "triumferende", transition: "pop" },
  { at: at("fakturering", 742), expression: "oppgitt", transition: "blink" },
  { at: at("afp", 0), expression: "nøytral", transition: "blink" },
  { at: at("afp", 145), expression: "spørrende", transition: "blink" },
  { at: at("afp", 405), expression: "bekymret", transition: "blink" },
  { at: at("afp", 492), expression: "glad", transition: "pop" },
  { at: at("afp", 645), expression: "bekymret", transition: "blink" },
  { at: at("afp", 737), expression: "triumferende", transition: "pop" },
  { at: at("afp", 818), expression: "frustrert", transition: "blink" },
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
          <Series.Sequence key={scene.key} durationInFrames={length(scene)}>
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
