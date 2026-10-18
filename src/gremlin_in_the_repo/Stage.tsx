import { AbsoluteFill, interpolate } from "remotion";
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
  Mob,
  Mug,
  MonitorFrame,
  Rack,
  Room,
  SCREEN,
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

export type DevMood = { bob?: number; sway?: number; slump?: number; vein?: number; grawlix?: number; hands?: number; pray?: number };

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
  // 0..1: dagslys i vinduet; 0..1: lagkameratene reiser seg bak pultene.
  day?: number;
  mob?: number;
  // Tegnes oppå rommet, men under skjermen og utvikleren (f.eks. ild i serverskapet).
  background?: React.ReactNode;
  // Tegnes foran utvikleren (f.eks. et stearinlys på pulten).
  foreground?: React.ReactNode;
  // 0 = strømbrudd: alt unntatt skjermen er av og rommet er nesten mørkt.
  power?: number;
  // 0..1: skjermen slås av som en gammel CRT (bildet klemmes til en strek, så en prikk, så mørkt).
  crt?: number;
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
  day = 0,
  mob = 0,
  background,
  foreground,
  power = 1,
  crt = 0,
  chairSpin = [0, 0],
  shake = { x: 0, y: 0 },
  overlay,
}) => {
  const k = kick(t);
  const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
  const blackout = power < 1;
  const screenLight = interpolate(crt, [0, 0.35, 1], [1, 0.25, 0], clamp);
  const squeezeY = interpolate(crt, [0, 0.3], [1, 0.012], clamp);
  const squeezeX = interpolate(crt, [0.3, 0.55], [1, 0.015], clamp);
  const dot = interpolate(crt, [0.55, 1], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ background: night.room, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${shake.x}px, ${shake.y}px) scale(${1 + 0.008 * k})` }}>
        <Room glow={(1 + 0.25 * snare(t)) * screenLight} day={day} />
        <Rack t={t} chaos={rackChaos} off={blackout} />
        <Mob t={t} rise={mob} />
        {gremlin && <GremlinFigure opacity={GREMLIN_DIM} {...gremlin} />}
        <BackDeskTop />
        <BackMonitors t={t} glitch={backGlitch} glitchColor={backGlitchColor} off={blackout} />
        <BackDeskFront />
        <EmptyChairs spin={chairSpin} />
        {background}
        {popIns}
        {blackout && <AbsoluteFill style={{ background: `rgba(0, 0, 0, ${0.6 * (1 - power)})` }} />}
        <MonitorFrame />
        {crt < 0.3 ? (
          <AbsoluteFill
            style={{
              transform: `scaleY(${squeezeY})`,
              transformOrigin: `${SCREEN_CENTER.x}px ${SCREEN_CENTER.y}px`,
              filter: crt > 0 ? `brightness(${1 + 6 * crt})` : undefined,
            }}
          >
            <Desktop>{desktop}</Desktop>
          </AbsoluteFill>
        ) : (
          dot > 0 && (
            <div
              style={{
                position: "absolute",
                left: SCREEN_CENTER.x - (SCREEN.w / 2) * squeezeX,
                top: SCREEN_CENTER.y - 4,
                width: SCREEN.w * squeezeX,
                height: 8,
                borderRadius: 4,
                background: "#FFFFFF",
                boxShadow: `0 0 ${30 * dot}px ${12 * dot}px ${night.glow}`,
                opacity: dot,
              }}
            />
          )
        )}
        <MainDesk steam={t} mug={mug} />
        <Dev id="dev" cx={SCREEN_CENTER.x + 80} top={DESK_TOP - 95} {...dev} bob={k * 6 + (dev.bob ?? 0)} />
        {foreground}
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
