import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from "remotion";
import { Annotation } from "../../components/Annotation";
import { Box } from "../../components/Box";
import { Connector } from "../../components/Connector";
import { Database } from "../../components/Database";
import { Header } from "../../components/Header";
import type { Hold } from "../../components/Holds";
import { Path } from "../../components/Path";
import { ramp } from "../../style/anim";
import { theme } from "../../style/theme";
import { formatNumber, REGISTER } from "../layout";

export const FUNDAMENTET_FRAMES = 575;

// Tidslinje for scenen (lokale frames).
const T = {
  kilde: 15,
  kildePil: 45,
  foretak: 55,
  fgLinjer: 95,
  fg: 110,
  virkLinjer: 150,
  virk: 165,
  notatFaktura: 215,
  notatBedrift: 262,
  ryddUt: 345,
  zoom: 355,
  skog: 370,
  teller: 375,
  utsnitt: 420,
  samle: 445,
  register: 457,
  poeng: 490,
};

// Pauser for foredragsholderen: på det ferdige treet, og på skogen med telleren.
export const FUNDAMENTET_HOLDS: Hold[] = [
  { at: 340, frames: 20 * 30 },
  { at: 440, frames: 5 * 30 },
];

// --- Trestruktur: Foretak → fakturagrupper → virksomheter -----------------------------

// Alle trær tegnes i samme koordinater; det store treet og de små i "skogen" deler oppsett.
const TREE = { cx: 1060, cy: 550, slot: 280, foretakY: 300, fgY: 520, virkY: 720 };

type Layout = {
  virk: number[]; // x-midtpunkt per virksomhet
  fg: { x: number; virk: number[] }[];
};

const layout = (fgs: number[]): Layout => {
  const n = fgs.reduce((a, b) => a + b, 0);
  const xs = Array.from({ length: n }, (_, i) => TREE.cx + (i - (n - 1) / 2) * TREE.slot);
  let i = 0;
  const fg = fgs.map((count) => {
    const virk = xs.slice(i, i + count);
    i += count;
    return { x: (virk[0] + virk[virk.length - 1]) / 2, virk };
  });
  return { virk: xs, fg };
};

// Linje fra en forelder ned til barna, med knekk (som i et organisasjonskart).
const branch = (fromX: number, fromY: number, toXs: number[], toY: number) => {
  const mid = (fromY + toY) / 2;
  return toXs.map((x) => `M ${fromX} ${fromY} V ${mid} H ${x} V ${toY}`).join(" ");
};

// Forenklet tre (bare rammer og linjer), brukt i skogen.
const MiniTree: React.FC<{ fgs: number[] }> = ({ fgs }) => {
  const { colors } = theme;
  const l = layout(fgs);
  const box = (x: number, y: number, w: number, h: number, key: string) => (
    <rect key={key} x={x - w / 2} y={y} width={w} height={h} fill={colors.paper} stroke={colors.ink} strokeWidth={1.5}
      vectorEffect="non-scaling-stroke" />
  );
  const lines = [
    branch(TREE.cx, TREE.foretakY + 100, l.fg.map((f) => f.x), TREE.fgY),
    ...l.fg.map((f) => branch(f.x, TREE.fgY + 90, f.virk, TREE.virkY)),
  ].join(" ");
  return (
    <g>
      <path d={lines} fill="none" stroke={colors.inkSoft} strokeWidth={1} vectorEffect="non-scaling-stroke" />
      {box(TREE.cx, TREE.foretakY, 380, 100, "f")}
      {l.fg.map((f, i) => box(f.x, TREE.fgY, 320, 90, `g${i}`))}
      {l.virk.map((x, i) => box(x, TREE.virkY, 240, 80, `v${i}`))}
    </g>
  );
};

// --- Skogen: mange bedrifter i et rutenett ---------------------------------------------

const GRID = { cols: 11, rows: 9, x0: 260, y0: 270, dx: 140, dy: 70, scale: 0.085 };
const MAIN_CELL = { col: 5, row: 4 };
const cellCenter = (col: number, row: number) => ({ x: GRID.x0 + col * GRID.dx, y: GRID.y0 + row * GRID.dy });

const FOREST = Array.from({ length: GRID.cols * GRID.rows }, (_, i) => {
  const col = i % GRID.cols;
  const row = Math.floor(i / GRID.cols);
  // Tilfeldig, men alltid lik, struktur: 1-3 fakturagrupper med 1-2 virksomheter hver.
  const nFg = 1 + Math.floor(random(`fg-${i}`) * 3);
  const fgs = Array.from({ length: nFg }, (_, j) => 1 + Math.floor(random(`v-${i}-${j}`) * 2));
  // Maks fem virksomheter, ellers blir treet bredere enn ruten.
  while (fgs.reduce((a, b) => a + b, 0) > 5) fgs.pop();
  const dist = Math.hypot(col - MAIN_CELL.col, row - MAIN_CELL.row);
  return { col, row, fgs, dist, isMain: col === MAIN_CELL.col && row === MAIN_CELL.row };
});



export const Fundamentet: React.FC = () => {
  const frame = useCurrentFrame();
  const { colors, fonts, stroke } = theme;
  const main = layout([2, 2]);

  // Det store treet krymper inn i sin rute i skogen.
  const zoom = ramp(frame, T.zoom, 45, Easing.inOut(Easing.cubic));
  const target = cellCenter(MAIN_CELL.col, MAIN_CELL.row);
  const k = interpolate(zoom, [0, 1], [1, GRID.scale]);
  const tx = interpolate(zoom, [0, 1], [TREE.cx, target.x]);
  const ty = interpolate(zoom, [0, 1], [TREE.cy, target.y]);
  const mainOpacity = 1 - ramp(frame, T.zoom + 30, 15);
  const tidy = 1 - ramp(frame, T.ryddUt, 15);

  const count = interpolate(frame, [T.teller, T.teller + 60], [0, 17000], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const counterOpacity = ramp(frame, T.teller, 15) * (1 - ramp(frame, T.samle, 15));

  const label = (x: number, y: number, text: string, size = 28, weight = 600) => (
    <text x={x} y={y} textAnchor="middle" fontFamily={fonts.sans} fontSize={size} fontWeight={weight} fill={colors.ink}>
      {text}
    </text>
  );

  return (
    <AbsoluteFill>
      <svg width="100%" height="100%" viewBox="0 0 1920 1080">
        <Header title="Fundamentet" subtitle="Tilslutningsregisteret — vårt eget register over bedriftene i AFP-ordningen" end={FUNDAMENTET_FRAMES - 15} />

        {/* Kilde: Enhetsregisteret */}
        <g opacity={tidy}>
          <Box x={120} y={300} w={300} h={100} start={T.kilde} tag="[KILDE]">
            {label(270, 360, "Enhetsregisteret", 28)}
          </Box>
          <Connector from={{ x: 420, y: 350 }} to={{ x: 868, y: 350 }} start={T.kildePil} />
          <text x={120} y={440} fontFamily={fonts.mono} fontSize={20} fill={colors.inkSoft} opacity={ramp(frame, T.kildePil + 10, 15)}>
            Foretak og virksomheter
          </text>
          <text x={120} y={466} fontFamily={fonts.mono} fontSize={20} fill={colors.inkSoft} opacity={ramp(frame, T.kildePil + 10, 15)}>
            er offentlige opplysninger
          </text>
        </g>

        {/* Det store treet: én bedrift */}
        <g opacity={mainOpacity} transform={`translate(${tx} ${ty}) scale(${k}) translate(${-TREE.cx} ${-TREE.cy})`}>
          <Path d={branch(TREE.cx, TREE.foretakY + 100, main.fg.map((f) => f.x), TREE.fgY)} start={T.fgLinjer} color={colors.inkSoft} width={stroke.thin * 1.5} />
          {main.fg.map((f) => (
            <Path key={f.x} d={branch(f.x, TREE.fgY + 90, f.virk, TREE.virkY)} start={T.virkLinjer} color={colors.inkSoft} width={stroke.thin * 1.5} />
          ))}
          <Box x={TREE.cx - 190} y={TREE.foretakY} w={380} h={100} start={T.foretak} tag="FORETAK">
            {label(TREE.cx, TREE.foretakY + 60, "Eksempelbedriften AS", 30, 700)}
          </Box>
          {main.fg.map((f, i) => (
            <Box key={f.x} x={f.x - 160} y={TREE.fgY} w={320} h={90} start={T.fg + i * 8} tag="FAKTURAGRUPPE">
              {label(f.x, TREE.fgY + 55, ["FG Vest", "FG Øst"][i])}
            </Box>
          ))}
          {main.virk.map((x, i) => (
            <Box key={x} x={x - 120} y={TREE.virkY} w={240} h={80} start={T.virk + i * 7} tag="VIRKSOMHET">
              {label(x, TREE.virkY + 50, ["Bergen", "Voss", "Oslo", "Drammen"][i], 26, 400)}
            </Box>
          ))}
        </g>

        <g opacity={tidy}>
          <Annotation target={{ x: main.fg[0].x - 160, y: TREE.fgY + 45 }} at={{ x: 120, y: 640 }} start={T.notatFaktura}
            text="Får én faktura hvert kvartal." />
          <Annotation target={{ x: main.virk[3], y: TREE.virkY + 80 }} at={{ x: 540, y: 885 }} start={T.notatBedrift}
            text="Internt kalt «en bedrift». Upresist, men praktisk." color={colors.accent} />
        </g>

        {/* Skogen: tusenvis av bedrifter, som samles i registeret */}
        {FOREST.map((tree) => {
          const appear = ramp(frame, T.skog + tree.dist * 4, 12);
          if (appear <= 0 || (tree.isMain && frame < T.zoom + 30)) {
            return null;
          }
          const c = cellCenter(tree.col, tree.row);
          const gather = ramp(frame, T.samle + tree.dist * 2, 25, Easing.in(Easing.cubic));
          const x = interpolate(gather, [0, 1], [c.x, REGISTER.cx]);
          const y = interpolate(gather, [0, 1], [c.y, REGISTER.top + REGISTER.h / 2]);
          const s = GRID.scale * (tree.isMain ? 1 : appear) * (1 - gather);
          const opacity = (tree.isMain ? ramp(frame, T.zoom + 30, 15) : appear) * (1 - gather);
          return (
            <g key={`${tree.col}-${tree.row}`} opacity={opacity}
              transform={`translate(${x} ${y}) scale(${s}) translate(${-TREE.cx} ${-TREE.cy})`}>
              <MiniTree fgs={tree.isMain ? [2, 2] : tree.fgs} />
            </g>
          );
        })}

        <g opacity={counterOpacity}>
          <text x={120} y={960} fontFamily={fonts.sans} fontSize={44} fontWeight={800} fill={colors.ink}>
            ≈ {formatNumber(count)} virksomheter
          </text>
          <text x={122} y={1005} fontFamily={fonts.mono} fontSize={22} fill={colors.inkSoft} opacity={ramp(frame, T.utsnitt, 15)}>
            Utsnitt. Resten fikk ikke plass på arket.
          </text>
        </g>

        {/* Registeret: kilden til alt videre */}
        <Database cx={REGISTER.cx} top={REGISTER.top} w={REGISTER.w} h={REGISTER.h} start={T.register} level={0.6} />
        <text x={REGISTER.cx} y={REGISTER.top + REGISTER.h + 90} textAnchor="middle" fontFamily={fonts.sans} fontSize={32}
          fontWeight={700} fill={colors.ink} opacity={ramp(frame, T.register + 15, 15)}>
          Tilslutningsregisteret
        </text>
        <g opacity={ramp(frame, T.poeng, 20) * (1 - ramp(frame, FUNDAMENTET_FRAMES - 15, 15))} transform={`translate(${(1 - ramp(frame, T.poeng, 20)) * 20} 0)`}>
          <text x={640} y={560} fontFamily={fonts.sans} fontSize={56} fontWeight={800} fill={colors.ink}>
            Vårt eget register.
          </text>
          <text x={640} y={630} fontFamily={fonts.sans} fontSize={44} fontWeight={400} fill={colors.inkSoft}>
            Kilden til alt som skjer videre.
          </text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};
