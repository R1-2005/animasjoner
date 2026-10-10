import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

const inter = loadInter("normal", { weights: ["400", "600", "800"], subsets: ["latin"] });
const mono = loadMono("normal", { weights: ["400", "600"], subsets: ["latin"] });

// Husstilen: lys "teknisk tegning" med mørk blekk og to aksentfarger.
export const theme = {
  colors: {
    paper: "#F7F6F2",
    gridMinor: "#E7E5DD",
    gridMajor: "#D5D2C7",
    ink: "#1B2430",
    inkSoft: "#5B6573",
    accent: "#2F6BFF",
    highlight: "#FF6B35",
    success: "#1F9D6B",
    // Ekte mennesker / personopplysninger. Skal ikke forveksles med oransje (data i bevegelse).
    person: "#D62839",
    // Syntetiske mennesker / syntetiske data: ser ekte ut, men har aldri eksistert.
    synthetic: "#7A4FD0",
    // «Gullet»: Tilslutningsregisteret. Mørk gull til tekst/streker, varm gull til fyll.
    gold: "#B8860B",
    goldFill: "#E8B931",
    goldLight: "#F6DC85",
  },
  fonts: {
    sans: inter.fontFamily,
    mono: mono.fontFamily,
  },
  stroke: {
    thin: 1.5,
    normal: 3,
    bold: 5,
  },
} as const;
