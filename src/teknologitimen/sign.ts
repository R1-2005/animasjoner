import { loadFont as loadAbril } from "@remotion/google-fonts/AbrilFatface";
import { loadFont as loadArchivo } from "@remotion/google-fonts/ArchivoBlack";
import { loadFont as loadBree } from "@remotion/google-fonts/BreeSerif";
import { loadFont as loadCourier } from "@remotion/google-fonts/CourierPrime";
import { loadFont as loadPoppins } from "@remotion/google-fonts/Poppins";
import type { Pose, V } from "./physics";
import { rotV } from "./physics";

// Fellesordningen for AFP sin profil (fra designsystemet i Claude Design), ikke husstilen i theme.ts.
export const afp = {
  purple: "#563181",
  purple900: "#33194f",
  purple800: "#46286a",
  purple400: "#8a6ea8",
  purple200: "#c9b9d8",
  bgTop: "#eee8ed",
  bgBottom: "#e5dce3",
  white: "#ffffff",
  sand: "#f5f1ea",
  sage: "#e2e8e8",
  ink: "#2d2c2e",
  inkSoft: "#564b5b",
  hole: "#5a4f5e",
  metalLight: "#f4f4f2",
  metal: "#a9a9a6",
  metalDark: "#7a7a78",
  metalEdge: "#6b6b69",
  slot: "#4a4a48",
  coral: "#dd5c49",
  yellow: "#f7cc62",
  teal: "#005b5c",
  mint: "#a6d3ca",
};

const F = {
  pop: loadPoppins("normal", { weights: ["700", "800"], subsets: ["latin"] }).fontFamily,
  bree: loadBree("normal", { subsets: ["latin"] }).fontFamily,
  cour: loadCourier("normal", { weights: ["700"], subsets: ["latin"] }).fontFamily,
  arch: loadArchivo("normal", { subsets: ["latin"] }).fontFamily,
  abril: loadAbril("normal", { subsets: ["latin"] }).fontFamily,
};

// Gulvet skiltbokstavene lander på (underkant av flisen), og hvor løse skruer ender.
export const FLOOR = 1040;
export const SCREW_FLOOR = FLOOR - 12;
export const SCREW_SIZE = 26;

export type Tile = {
  ch: string;
  bg: string;
  fg: string;
  font: string;
  weight: number;
  size: number;
  w: number;
  h: number;
  glyphDy: number;
  // Hvileposisjonen fra designet (sentrum + rotasjon).
  home: Pose;
  // Skruene i flisens lokale koordinater (piksler fra sentrum) og vinkelen på sporet.
  screws: { at: V; slot: number }[];
};

type Row = [string, string, string, string, number, number, number, number, [number, number][], ("top" | "wide")?];

const { purple: P, white: W, sand: S, sage: G, ink: INK } = afp;

// Rett fra «Tekologitimen Intro.dc.html»: tegn, bakgrunn, farge, font, vekt, størrelse, rotasjon, dy, skruer i %.
const ROW1: Row[] = [
  ["T", P, W, F.arch, 400, 168, -3, 0, [[14, 10], [86, 90]]],
  ["e", W, P, F.bree, 400, 176, 2, 14, [[50, 9]]],
  ["k", S, P, F.cour, 700, 190, -1.5, -6, [[13, 11], [87, 11]]],
  ["o", G, P, F.pop, 800, 180, 4, 8, [[15, 88], [85, 12]]],
  ["l", P, W, F.abril, 400, 186, -2, -10, [[50, 8], [50, 92]]],
  ["o", W, P, F.cour, 700, 178, 1, 4, [[12, 12], [88, 88]]],
  ["g", S, P, F.pop, 700, 176, 19, 30, [[14, 10]], "top"],
  ["i", G, INK, F.bree, 400, 182, -4, -2, [[50, 10], [50, 90]]],
];
const ROW2: Row[] = [
  ["t", W, P, F.pop, 800, 176, 2.5, 6, [[14, 10], [86, 10]]],
  ["i", P, W, F.cour, 700, 186, -3, -8, [[50, 91]]],
  ["m", S, P, F.arch, 400, 150, 1, 10, [[12, 12], [88, 12], [50, 90]], "wide"],
  ["e", G, P, F.abril, 400, 180, -2, -4, [[14, 88], [86, 12]]],
  ["n", W, INK, F.bree, 400, 176, 3, 2, [[13, 11], [87, 89]]],
];

const SLOTS = [20, 75, -40, 110, 5, 60, -15];
const GAP = 22;
const H = 230;
// Flex-oppsettet i designet: to rader, sentrert, 56 px mellomrom og 40 px luft i bunnen.
const ROW_TOPS = [(1080 - 40 - (2 * H + 56)) / 2, (1080 - 40 - (2 * H + 56)) / 2 + H + 56];

let slotIndex = 0;
const build = (rows: Row[][]): Tile[] =>
  rows.flatMap((row, r) => {
    const widths = row.map((t) => (t[9] === "wide" ? 250 : 190));
    const total = widths.reduce((a, b) => a + b, 0) + GAP * (row.length - 1);
    let left = (1920 - total) / 2;
    return row.map(([ch, bg, fg, font, weight, size, rot, dy, screws, extra], i) => {
      const w = widths[i];
      const center = { x: left + w / 2, y: ROW_TOPS[r] + H / 2 };
      left += w + GAP;
      const local = screws.map(([x, y]) => ({ x: (x / 100 - 0.5) * w, y: (y / 100 - 0.5) * H }));
      // CSS: translateY(dy) rotate(rot) rundt transform-origin (sentrum, eller første skrue for «top»).
      const o = extra === "top" ? local[0] : { x: 0, y: 0 };
      const ro = rotV(o, rot);
      const home = { x: center.x + o.x - ro.x, y: center.y + o.y - ro.y + dy, rot };
      return {
        ch,
        bg,
        fg,
        font,
        weight,
        size,
        w,
        h: H,
        glyphDy: ch === "g" ? -40 : 0,
        home,
        screws: local.map((at) => ({ at, slot: SLOTS[slotIndex++ % SLOTS.length] })),
      };
    });
  });

export const TILES = build([ROW1, ROW2]);
