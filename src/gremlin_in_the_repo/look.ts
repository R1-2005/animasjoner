import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

const anton = loadAnton("normal", { weights: ["400"], subsets: ["latin"] });
const mono = loadMono("normal", { weights: ["400", "700"], subsets: ["latin"] });

// Det visuelle uttrykket for musikkvideoen: mørkt kontorlandskap om natta, lyset kommer fra
// skjermene. Egen palett (ikke husstilen i theme.ts), som Teknologitimen har sin i sign.ts.
export const night = {
  // Rommet, fra mørkest til lysest.
  black: "#030407",
  room: "#070A10",
  wall: "#0D1320",
  wallLit: "#18233D",
  desk: "#0A0E16",
  // Skjermlys: kaldt cyan som faller på vegg, pult og hettegenser.
  glow: "#62E6FF",
  screen: "#0A1620",
  moon: "#8FA8D8",
  // Gremlin: syregrønne øyne og tenner i mørket.
  eyes: "#B6FF3B",
  teeth: "#F2FFE0",
  // Betydninger som går igjen gjennom sangen.
  merge: "#A371F7",
  bug: "#FF4D6D",
  boom: "#FFB020",
  ok: "#3DDC84",
  text: "#F4F1EA",
  dim: "#5B6B85",
  // Syntaksfarger som i Visual Studio (mørkt tema).
  code: {
    plain: "#DCDCDC",
    keyword: "#569CD6",
    control: "#D8A0DF",
    type: "#4EC9B0",
    fn: "#DCDCAA",
    string: "#D69D85",
    comment: "#57A64A",
    number: "#B5CEA8",
  },
  // Windows 11, mørkt tema.
  win: {
    titleBar: "#1F1F1F",
    window: "#1E1E1E",
    taskbar: "#1C1C1C",
    toast: "#2B2B2B",
    border: "#3A3A3A",
    text: "#E6E6E6",
    dim: "#9A9A9A",
    accent: "#4CC2FF",
    powershell: "#012456",
  },
  // Appene i oppgavelinja: fargede fliser med bokstaver (ikke ekte logoer).
  apps: {
    vs: { label: "VS", color: "#68217A" },
    outlook: { label: "O", color: "#0F6CBD" },
    teams: { label: "T", color: "#5B5FC7" },
    slack: { label: "S", color: "#4A154B" },
    jira: { label: "J", color: "#2684FF" },
    confluence: { label: "C", color: "#1868DB" },
    devops: { label: "DO", color: "#0078D4" },
    terminal: { label: ">_", color: "#2D2D2D" },
    edge: { label: "e", color: "#0C59A4" },
    taskmgr: { label: "≡", color: "#3A6E3A" },
  },
} as const;

export const fonts = {
  // Plakatskrift for fraser som slås inn i takt.
  display: anton.fontFamily,
  mono: mono.fontFamily,
} as const;
