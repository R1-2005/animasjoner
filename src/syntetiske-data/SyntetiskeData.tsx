import { Audio } from "@remotion/media";
import { Series, useCurrentFrame, staticFile } from "remotion";
import { Gremlin, type GremlinKey } from "../components/Gremlin";
import { type Hold, holdFrames, wallFrame, WithHolds } from "../components/Holds";
import { Paper } from "../components/Paper";
import { AFP_FRAMES, AFP_HOLDS, AfpSoknad } from "./scenes/AfpSoknad";
import { FAKTURERING_FRAMES, FAKTURERING_HOLDS, Fakturering } from "./scenes/Fakturering";
import { FUNDAMENTET_FRAMES, FUNDAMENTET_HOLDS, Fundamentet } from "./scenes/Fundamentet";
import { Kapittel, KAPITTEL_FRAMES } from "./scenes/Kapittel";
import { Problemet, PROBLEMET_FRAMES, PROBLEMET_HOLDS } from "./scenes/Problemet";
import { Byttet, BYTTET_FRAMES, BYTTET_HOLDS } from "./scenes/Byttet";
import { Livslop, LIVSLOP_FRAMES, LIVSLOP_HOLDS } from "./scenes/Livslop";
import { Oppsummering, OPPSUMMERING_FRAMES, OPPSUMMERING_HOLDS } from "./scenes/Oppsummering";
import { TITTEL_FRAMES, TITTEL_HOLDS, Tittel } from "./scenes/Tittel";

const KapittelFundamentet = () => (
  <Kapittel n={1} title="Fundamentet" subtitle="Tilslutningsregisteret — vårt eget register over bedriftene i AFP-ordningen" register={false} />
);
const KapittelFakturering = () => <Kapittel n={2} title="Fakturering" subtitle="Hvert kvartal: fra register til faktura" />;
const KapittelAfp = () => <Kapittel n={3} title="Søknadsbehandling" subtitle="Én person søker avtalefestet pensjon" />;
const KapittelProblemet = () => <Kapittel n={4} title="Problemet" subtitle="Alle disse dataene handler om ekte mennesker" />;
const KapittelOppsummering = () => <Kapittel n={7} title="Oppsummering" subtitle="Dette har vi oppnådd med syntetiske data" synthetic />;
const KapittelByttet = () => <Kapittel n={5} title="Erstatningen" subtitle="Samme Gremlin. Nye kilder." />;
const KapittelLivslop = () => <Kapittel n={6} title="Et levende testmiljø" subtitle="Fra tom database til syntetisk hverdag" />;

// Scenene i rekkefølge. Lengde og pauser bestemmes av hver scene selv.
// `id` vises i tittelfeltet; kapittelkortet hører til scenen det introduserer.
const SCENES = [
  { key: "tittel", id: "0 · Tittel", frames: TITTEL_FRAMES, holds: TITTEL_HOLDS, Component: Tittel },
  { key: "kap-fundamentet", id: "1 · Fundamentet", frames: KAPITTEL_FRAMES, holds: [] as Hold[], Component: KapittelFundamentet },
  { key: "fundamentet", id: "1 · Fundamentet", frames: FUNDAMENTET_FRAMES, holds: FUNDAMENTET_HOLDS, Component: Fundamentet },
  { key: "kap-fakturering", id: "2 · Fakturering", frames: KAPITTEL_FRAMES, holds: [] as Hold[], Component: KapittelFakturering },
  { key: "fakturering", id: "2 · Fakturering", frames: FAKTURERING_FRAMES, holds: FAKTURERING_HOLDS, Component: Fakturering },
  { key: "kap-afp", id: "3 · Søknadsbehandling", frames: KAPITTEL_FRAMES, holds: [] as Hold[], Component: KapittelAfp },
  { key: "afp", id: "3 · Søknadsbehandling", frames: AFP_FRAMES, holds: AFP_HOLDS, Component: AfpSoknad },
  { key: "kap-problemet", id: "4 · Problemet", frames: KAPITTEL_FRAMES, holds: [] as Hold[], Component: KapittelProblemet },
  { key: "problemet", id: "4 · Problemet", frames: PROBLEMET_FRAMES, holds: PROBLEMET_HOLDS, Component: Problemet },
  { key: "kap-byttet", id: "5 · Erstatningen", frames: KAPITTEL_FRAMES, holds: [] as Hold[], Component: KapittelByttet },
  { key: "byttet", id: "5 · Erstatningen", frames: BYTTET_FRAMES, holds: BYTTET_HOLDS, Component: Byttet },
  { key: "kap-livslop", id: "6 · Et levende testmiljø", frames: KAPITTEL_FRAMES, holds: [] as Hold[], Component: KapittelLivslop },
  { key: "livslop", id: "6 · Et levende testmiljø", frames: LIVSLOP_FRAMES, holds: LIVSLOP_HOLDS, Component: Livslop },
  { key: "kap-oppsummering", id: "7 · Oppsummering", frames: KAPITTEL_FRAMES, holds: [] as Hold[], Component: KapittelOppsummering },
  { key: "oppsummering", id: "7 · Oppsummering", frames: OPPSUMMERING_FRAMES, holds: OPPSUMMERING_HOLDS, Component: Oppsummering },
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
  { at: at("fundamentet", 640), expression: "overrasket", transition: "shake" },
  { at: at("fundamentet", 750), expression: "glad", transition: "pop" },
  { at: at("fundamentet", 900), expression: "overrasket", transition: "shake" },
  { at: at("fundamentet", 937), expression: "triumferende", transition: "pop" },
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
  { at: at("problemet", 0), expression: "nøytral", transition: "blink" },
  { at: at("problemet", 135), expression: "spørrende", transition: "blink" },
  { at: at("problemet", 238), expression: "overrasket", transition: "shake" },
  { at: at("problemet", 315), expression: "bekymret", transition: "blink" },
  { at: at("problemet", 445), expression: "frustrert", transition: "shake" },
  { at: at("problemet", 505), expression: "spørrende", transition: "blink" },
  { at: at("byttet", 0), expression: "nøytral", transition: "blink" },
  { at: at("byttet", 115), expression: "bekymret", transition: "blink" },
  { at: at("byttet", 218), expression: "glad", transition: "pop" },
  { at: at("byttet", 258), expression: "overrasket", transition: "shake" },
  { at: at("byttet", 305), expression: "spørrende", transition: "blink" },
  { at: at("byttet", 385), expression: "triumferende", transition: "pop" },
  { at: at("livslop", 0), expression: "nøytral", transition: "blink" },
  { at: at("livslop", 150), expression: "spørrende", transition: "blink" },
  { at: at("livslop", 270), expression: "overrasket", transition: "shake" },
  { at: at("livslop", 420), expression: "glad", transition: "pop" },
  { at: at("livslop", 625), expression: "triumferende", transition: "pop" },
  { at: at("oppsummering", 0), expression: "nøytral", transition: "blink" },
  { at: at("oppsummering", 20), expression: "glad", transition: "pop" },
  { at: at("oppsummering", 185), expression: "overrasket", transition: "shake" },
  { at: at("oppsummering", 260), expression: "spørrende", transition: "blink" },
  { at: at("oppsummering", 320), expression: "triumferende", transition: "pop" },
];

export const SyntetiskeData: React.FC = () => {
  const frame = useCurrentFrame();
  const current = [...SCENES].reverse().find((_, i) => START[SCENES.length - 1 - i] <= frame) ?? SCENES[0];

  return (
    <>
      <Paper
        titleBlock={[
          { label: "TEGNING", value: "Syntetiske data" },
          { label: "SCENE", value: current.id },
          { label: "REV", value: "MED-LOS-ALAMOS-REV-45" },
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
      <Audio
        src={staticFile("scene_0.mp3")}
        durationInFrames={427.68}
        premountFor={30}
        from={41}
      />
      <Audio
        src={staticFile("scene_1.mp3")}
        durationInFrames={1522.08}
        premountFor={30}
        from={497}
      />
      <Audio
        src={staticFile("scene_2.mp3")}
        durationInFrames={1333.44}
        premountFor={30}
        from={2038}
      />
      <Audio
        src={staticFile("scene_3.mp3")}
        durationInFrames={1536.48}
        premountFor={30}
        from={3431}
      />
      <Audio
        src={staticFile("scene_4.mp3")}
        durationInFrames={1160.64}
        premountFor={30}
        from={5034}
      />
      <Audio
        src={staticFile("scene_5.mp3")}
        durationInFrames={1031.04}
        premountFor={30}
        from={6227}
      />
    </>
  );
};
