// Felles plassering for prosessbildene (scene 1-3 og 6), så publikum kjenner igjen bildet:
// registeret til venstre, Gremlin i midten, eksterne kilder i en kolonne til høyre.

export const REGISTER = { cx: 330, top: 470, w: 320, h: 210 };
export const REGISTER_RIGHT = REGISTER.cx + REGISTER.w / 2;
// Fyllingsgrad for «gullet» når registeret er ferdig bygget.
export const REGISTER_LEVEL = 0.6;
// Glimt på gulloverflaten (fylt til REGISTER_LEVEL).
export const GOLD_SPARKLES = [
  { x: 240, y: 600, size: 26 },
  { x: 410, y: 572, size: 20 },
  { x: 315, y: 645, size: 28 },
  { x: 448, y: 655, size: 18 },
  { x: 205, y: 668, size: 18 },
];

export const ENGINE = { x: 760, y: 270, w: 400, h: 430 };
export const ENGINE_RIGHT = ENGINE.x + ENGINE.w;

export const SRC = { x: 1440, w: 360, h: 100 };
export const SOURCE_Y = { nav: 320, skatteetaten: 485, folkeregisteret: 650 };

// Forespørsel går på linjen over midten, svaret kommer tilbake på linjen under.
export const req = (cy: number) => ({ from: { x: ENGINE_RIGHT, y: cy - 15 }, to: { x: SRC.x, y: cy - 15 } });
export const res = (cy: number) => ({ from: { x: SRC.x, y: cy + 20 }, to: { x: ENGINE_RIGHT, y: cy + 20 } });

export const formatNumber = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
