import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import type { Moment, ScrewState, SignEvent, TileState } from "./events";
import { Correction, DRAW_END, ERASE_FRAMES } from "./Correction";
import { fall, gJoke, straighten } from "./events";
import { RescuerView } from "./Rescuers";
import type { Tile } from "./sign";
import { afp, FLOOR, SCREW_SIZE, TILES } from "./sign";

// Venteskjerm før «Teknologitimen»: skiltet fra Claude Design, der bokstavene løsner en etter en
// og blir reddet av stadig nye mekanismer. Rolig tempo og sømløs loop.

// Indekser i TILES: 0 T, 1 e, 2 k, 3 o, 4 l, 5 o, 6 g, 7 i | 8 t, 9 i, 10 m, 11 e, 12 n.
// g-spøken åpner, fordi den er ferdig før hånden tegner inn N-en etter 15 sekunder.
const SCRIPT: SignEvent[] = [
  gJoke(6, { x: 2150, y: 600 }, { x: 64, y: 40 }),
  fall({ tile: 0, rescuer: "arm", base: { x: -180, y: 1180 }, entry: { x: -700, y: 900 }, land: { dx: 150, rot: -6 } }),
  fall({ tile: 12, rescuer: "lift", entry: { x: 2250, y: FLOOR }, land: { dx: -30, rot: 5 } }),
  // Den nederste i-en henger bare i én skrue nederst, så den velter rundt og blir et «¡».
  straighten({
    tile: 9,
    lose: [],
    pivot: 0,
    rescuer: "hand",
    entry: { x: 1150, y: 1350 },
    hold: { x: 0, y: -96 },
    rest: 1,
    omega: 0.1,
    damping: 0.09,
  }),
  fall({ tile: 3, rescuer: "crane", land: { dx: 20, rot: 6 } }),
  straighten({
    tile: 5,
    lose: [1],
    pivot: 0,
    rescuer: "arm",
    base: { x: 2100, y: 1180 },
    entry: { x: 2650, y: 900 },
    hold: { x: 50, y: 60 },
  }),
  fall({ tile: 1, rescuer: "drone", entry: { x: 2250, y: 260 }, exit: { x: -350, y: 180 }, land: { dx: -20, rot: 7 } }),
  // Hånden kommer oppe fra venstre så ermet ikke dekker N-en.
  straighten({ tile: 2, lose: [1], pivot: 0, rescuer: "hand", entry: { x: 230, y: -320 }, hold: { x: 62, y: -70 } }),
  fall({ tile: 10, rescuer: "magnet", land: { dx: 0, rot: -4 } }),
  straighten({ tile: 8, lose: [0], pivot: 1, rescuer: "hand", entry: { x: -250, y: 800 }, hold: { x: -60, y: 50 } }),
  fall({ tile: 4, rescuer: "claw", land: { dx: -25, rot: 6 } }),
];

const FIRST = 75; // rolig start
const GAP = 120; // stille sekunder mellom hendelsene

const TIMELINE = (() => {
  let t = FIRST;
  return SCRIPT.map((e, i) => {
    // Ingen bokstaver faller mens N-en tegnes.
    const start = i === 0 ? t : Math.max(t, DRAW_END + GAP);
    t = start + e.duration + GAP;
    return { ...e, start };
  });
})();

const last = TIMELINE[TIMELINE.length - 1];
// Til slutt visker hånden ut N-en, og loopen starter på nytt i det den er borte.
const ERASE_AT = last.start + last.duration + 60;
export const TEKNOLOGITIMEN_FRAMES = ERASE_AT + ERASE_FRAMES;

const homeState = (tile: Tile): TileState => ({
  pose: tile.home,
  screws: tile.screws.map(() => ({ loose: false, spin: 0, scale: 1 })),
});

const screwFace: React.CSSProperties = {
  position: "absolute",
  width: SCREW_SIZE,
  height: SCREW_SIZE,
  borderRadius: "50%",
  background: `radial-gradient(circle at 35% 35%, ${afp.metalLight}, ${afp.metal} 70%, ${afp.metalDark})`,
  border: `1px solid ${afp.metalEdge}`,
  boxShadow: "0 2px 3px rgba(45,44,46,.35)",
  boxSizing: "border-box",
};

const Slot: React.FC<{ angle: number }> = ({ angle }) => (
  <div
    style={{
      position: "absolute",
      left: 4,
      top: 10.5,
      width: 16,
      height: 3,
      background: afp.slot,
      borderRadius: 2,
      transform: `rotate(${angle}deg)`,
    }}
  />
);

const TileView: React.FC<{ tile: Tile; state: TileState }> = ({ tile, state }) => {
  const { pose } = state;
  return (
    <div
      style={{
        position: "absolute",
        left: pose.x - tile.w / 2,
        top: pose.y - tile.h / 2,
        width: tile.w,
        height: tile.h,
        transform: `rotate(${pose.rot}deg)`,
        background: tile.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 6px 0 rgba(45,44,46,.10), 0 10px 22px rgba(45,44,46,.16)",
      }}
    >
      <span
        style={{
          fontFamily: tile.font,
          fontWeight: tile.weight,
          fontSize: tile.size,
          lineHeight: 1,
          color: tile.fg,
          marginTop: tile.glyphDy,
        }}
      >
        {tile.ch}
      </span>
      {tile.screws.map((s, i) => {
        const st = state.screws[i];
        if (st.loose) return null;
        return (
          <div
            key={i}
            style={{
              ...screwFace,
              left: tile.w / 2 + s.at.x - SCREW_SIZE / 2,
              top: tile.h / 2 + s.at.y - SCREW_SIZE / 2,
              transform: `scale(${st.scale})`,
            }}
          >
            <Slot angle={s.slot + st.spin} />
          </div>
        );
      })}
    </div>
  );
};

const LooseScrew: React.FC<{ s: Extract<ScrewState, { loose: true }>; slot: number }> = ({ s, slot }) => (
  <div
    style={{
      ...screwFace,
      left: s.x - SCREW_SIZE / 2,
      top: s.y - SCREW_SIZE / 2,
      transform: `rotate(${s.rot}deg) scale(${s.scale})`,
    }}
  >
    <Slot angle={slot} />
  </div>
);

export const Teknologitimen: React.FC = () => {
  const frame = useCurrentFrame();
  const moments: Moment[] = TIMELINE.filter((e) => frame >= e.start && frame < e.start + e.duration).map((e) =>
    e.at(frame - e.start),
  );
  const states = TILES.map((tile, i) => moments.find((m) => m.tile === i)?.state ?? homeState(tile));
  const active = new Set(moments.map((m) => m.tile));
  // Flisen som er i bevegelse tegnes sist, så den ligger over naboene.
  const order = [...TILES.keys()].sort((a, b) => Number(active.has(a)) - Number(active.has(b)));
  // Tannhjulene går nøyaktig én runde per loop.
  const turn = (360 * frame) / TEKNOLOGITIMEN_FRAMES;

  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${afp.bgTop}, ${afp.bgBottom})`, overflow: "hidden" }}>
      <Img
        src={staticFile("teknologitimen/gear-purple.png")}
        style={{ position: "absolute", left: 1340, top: -160, width: 760, opacity: 0.06, transform: `rotate(${turn}deg)` }}
      />
      <Img
        src={staticFile("teknologitimen/gear-purple.png")}
        style={{ position: "absolute", left: -220, top: 719, width: 620, opacity: 0.05, transform: `rotate(${17 - turn}deg)` }}
      />
      <Img
        src={staticFile("teknologitimen/logo-horizontal.png")}
        style={{ position: "absolute", left: 80, top: 1080 - 64 - 52, height: 52 }}
      />
      {/* Hullet etter g-ens andre skrue, og skruen selv som ligger på gulvet. Fra designet. */}
      <div
        style={{
          position: "absolute",
          left: 1488,
          top: 282,
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: afp.hole,
          boxShadow: "inset 0 3px 4px rgba(0,0,0,.45)",
        }}
      />
      <div style={{ ...screwFace, left: 1470, top: FLOOR - 26, transform: "rotate(-30deg)" }}>
        <Slot angle={0} />
      </div>
      {order.map((i) => (
        <TileView key={i} tile={TILES[i]} state={states[i]} />
      ))}
      {states.flatMap((st, i) =>
        st.screws.map((s, k) => (s.loose ? <LooseScrew key={`${i}-${k}`} s={s} slot={TILES[i].screws[k].slot} /> : null)),
      )}
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <Correction frame={frame} eraseAt={ERASE_AT} />
        {moments.map((m) =>
          m.rescuer ? <RescuerView key={m.tile} r={m.rescuer} frame={frame} /> : null,
        )}
      </svg>
    </AbsoluteFill>
  );
};

// Startframen for hver hendelse, nyttig for å sjekke stillbilder.
export const TEKNOLOGITIMEN_EVENTS = TIMELINE.map((e) => ({ tile: e.tile, start: e.start, duration: e.duration }));
