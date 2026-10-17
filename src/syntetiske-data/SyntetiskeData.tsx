import { Audio } from "@remotion/media";
import { Series, useCurrentFrame, staticFile } from "remotion";
import { type Hold, holdFrames, WithHolds } from "../components/Holds";
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
const KapittelByttet = () => <Kapittel n={5} title="Erstatningen" subtitle="Samme fagsystem. Nye kilder." />;
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

const length = (s: (typeof SCENES)[number]) => s.frames + holdFrames(s.holds);

// Startframe for hver scene i den ferdige filmen (inkludert pauser).
const START = SCENES.reduce<number[]>((acc, s, i) => [...acc, i === 0 ? 0 : acc[i - 1] + length(SCENES[i - 1])], []);

export const SYNTETISKE_DATA_FRAMES = SCENES.reduce((sum, s) => sum + length(s), 0);

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
      </Paper>
      <Audio
        src={staticFile(
          "Faktureringsprosessen_er_den_p_Suburb_Eleven_v4_01a14891-b121-7f18-af91-3b4d2715cf60.mp3"
        )}
        durationInFrames={1253.88}
        premountFor={30}
        from={2016}
      />
      <Audio
        src={staticFile(
          "La_oss_starte_med_hvordan_appl_Suburb_Eleven_v4_01a1488e-1ee4-7862-9e6e-d1c97adcbcbe.mp3"
        )}
        durationInFrames={1496.03}
        premountFor={30}
        from={437}
      />
      <Audio
        src={staticFile(
          "Hallo_I_denne_presentasjonen_s_Suburb_Eleven_v4_01a14890-ec9a-773e-b0d5-057179b218bb.mp3"
        )}
        durationInFrames={397.32}
        premountFor={30}
      />
      <Audio
        src={staticFile(
          "Søknadsbehandlingen_vår_er_den_Suburb_Eleven_v4_01a14895-677e-7f8c-89e4-25b58b3c5e54.mp3"
        )}
        durationInFrames={1570.48}
        premountFor={30}
        from={3320}
      />
      <Audio
        src={staticFile(
          "Som_vi_har_sett_er_løsningen_v_Suburb_Eleven_v4_01a14897-bffb-7aa7-b03e-7acc88e23d9e.mp3"
        )}
        durationInFrames={905.93}
        premountFor={30}
        from={4966}
      />
      <Audio
        src={staticFile(
          "Men_hvordan_går_vi_frem_for_å_Suburb_Eleven_v4_01a149dc-53cf-71e8-b3c0-f631cd6e07b7.mp3"
        )}
        durationInFrames={949.03}
        premountFor={30}
        from={5941}
      />
      <Audio
        src={staticFile(
          "Da_folkens_er_vi_ved_veis_ende_Suburb_Eleven_v4_01a149e6-c901-7a41-af90-66bb8661c2cb.mp3"
        )}
        durationInFrames={246.07}
        premountFor={30}
        from={10186}
      />
      <Audio
        src={staticFile(
          "Ja_på_overtid_ser_jeg_da_blir_Suburb_Eleven_v4_01a149e3-a0dd-71fb-be9a-0c3da39d9e18.mp3"
        )}
        durationInFrames={1206.07}
        premountFor={30}
        from={8930}
      />
      <Audio
        src={staticFile(
          "Det_virker_kanskje_rart_at_vi_Suburb_Eleven_v4_01a149e2-e98f-74b0-af56-85a14a2a0b88.mp3"
        )}
        durationInFrames={1827.53}
        premountFor={30}
        from={6987}
      />
    </>
  );
};
