import { Audio } from "@remotion/media";
import { AbsoluteFill, staticFile } from "remotion";
import { useSongTime } from "./beat";
import { fonts, night } from "./look";
import { Taskbar, VisualStudio } from "./Screen";
import { CHORUS1_END, Chorus1 } from "./sections/Chorus1";
import { INTRO_END, Intro } from "./sections/Intro";
import { VERSE1_END, Verse1 } from "./sections/Verse1";
import { Stage } from "./Stage";
import { TIMING } from "./timing";

// Musikkvideoen til «Gremlin in the Repo». Alt regnes i låttid, så seksjonene kan bruke tidene i
// TIMING.md direkte. Seksjonene bygges én om gangen; resten av låten er en skisse med teksten.

// Lengden på låten (Suno-eksporten er 3:18.31).
export const SONG_SECONDS = 198.31;
export const GREMLIN_IN_THE_REPO_FRAMES = Math.ceil(SONG_SECONDS * 30);

const LINES = TIMING.sections.flatMap((s) => s.lines);

// Plassholder for seksjoner som ikke er laget ennå: kontoret med koding, og linja som synges.
const Sketch: React.FC<{ t: number }> = ({ t }) => {
  const line = [...LINES].reverse().find((l) => l.s <= t);
  return (
    <AbsoluteFill>
      <Stage
        t={t}
        desktop={
          <>
            <VisualStudio t={t} from={INTRO_END} written={[]} typed={Array.from({ length: 60 }, (_, i) => `// ${i + 1}: ikke laget ennå`)} />
            <Taskbar active="vs" badges={{ outlook: "42", teams: "3", jira: "7" }} />
          </>
        }
        dev={{ sway: Math.sin(t * 9) * 2.5 }}
      />
      {line && (
        <div style={{ position: "absolute", left: 60, bottom: 40, fontFamily: fonts.mono, fontSize: 30, color: night.dim }}>
          SKISSE · {line.ref} · {line.text}
        </div>
      )}
    </AbsoluteFill>
  );
};

const Video: React.FC = () => {
  const t = useSongTime();
  if (t < INTRO_END) return <Intro t={t} />;
  if (t < VERSE1_END) return <Verse1 t={t} />;
  if (t < CHORUS1_END) return <Chorus1 t={t} />;
  return <Sketch t={t} />;
};

export const GremlinInTheRepo: React.FC = () => (
  <>
    <Audio src={staticFile(TIMING.audio)} />
    <Video />
  </>
);
