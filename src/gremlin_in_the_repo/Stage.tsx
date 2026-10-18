import { AbsoluteFill } from "remotion";
import { kick, snare } from "./beat";
import { GremlinFigure } from "./GremlinFigure";
import {
  BackDeskFront,
  BackDeskTop,
  BackMonitors,
  DESK_TOP,
  Dev,
  EmptyChairs,
  MainDesk,
  Mug,
  MonitorFrame,
  Rack,
  Room,
  SCREEN_CENTER,
  Vignette,
} from "./Office";
import { Desktop } from "./Screen";
import { night } from "./look";

// Scenen fra stiltesten som en gjenbrukbar komponent: kontoret om natta med skjermen, utvikleren
// og Gremlin i bakgrunnen. Hver del av låten bestemmer hva som skjer via props; scenen selv
// sørger for lagrekkefølgen og at alt nikker i takt (kick/skarptromme).

// Gremlin er en skygge i bakgrunnen: litt gjennomsiktig, så han ikke stjeler fokus fra skjermen.
export const GREMLIN_DIM = 0.7;

export type DevMood = { bob?: number; sway?: number; slump?: number; vein?: number; grawlix?: number };

type Props = {
  t: number;
  // Innholdet på skrivebordet: vinduer, oppgavelinje og varsler.
  desktop: React.ReactNode;
  dev?: DevMood;
  gremlin?: React.ComponentProps<typeof GremlinFigure> | null;
  // Gremlin som lener seg inn fra kanten (tegnes bak skjermen og pulten).
  popIns?: React.ReactNode;
  rackChaos?: number;
  backGlitch?: number[];
  backGlitchColor?: string[];
  mug?: Mug;
  // 0..1: rødt blinklys over hele rommet (sirene).
  siren?: number;
  chairSpin?: number[];
  shake?: { x: number; y: number };
  // Fraser, smell o.l. som ligger oppå scenen, men under vignetten.
  overlay?: React.ReactNode;
};

export const Stage: React.FC<Props> = ({
  t,
  desktop,
  dev = {},
  gremlin = null,
  popIns,
  rackChaos = 0,
  backGlitch = [0, 0],
  backGlitchColor,
  mug,
  siren = 0,
  chairSpin = [0, 0],
  shake = { x: 0, y: 0 },
  overlay,
}) => {
  const k = kick(t);
  return (
    <AbsoluteFill style={{ background: night.room, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${shake.x}px, ${shake.y}px) scale(${1 + 0.008 * k})` }}>
        <Room glow={1 + 0.25 * snare(t)} />
        <Rack t={t} chaos={rackChaos} />
        {gremlin && <GremlinFigure opacity={GREMLIN_DIM} {...gremlin} />}
        <BackDeskTop />
        <BackMonitors t={t} glitch={backGlitch} glitchColor={backGlitchColor} />
        <BackDeskFront />
        <EmptyChairs spin={chairSpin} />
        {popIns}
        <MonitorFrame />
        <Desktop>{desktop}</Desktop>
        <MainDesk steam={t} mug={mug} />
        <Dev id="dev" cx={SCREEN_CENTER.x + 80} top={DESK_TOP - 95} {...dev} bob={k * 6 + (dev.bob ?? 0)} />
      </AbsoluteFill>
      {siren > 0 && (
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse at 20% 30%, rgba(255,40,60,${0.55 * siren}) 0%, rgba(255,40,60,${0.18 * siren}) 55%, transparent 90%)`,
            mixBlendMode: "screen",
          }}
        />
      )}
      {overlay}
      <Vignette />
    </AbsoluteFill>
  );
};
