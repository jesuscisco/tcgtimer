import {
  Audiowide,
  Bebas_Neue,
  Black_Ops_One,
  Chakra_Petch,
  Inter,
  Montserrat,
  Orbitron,
  Oswald,
  Play,
  Racing_Sans_One,
  Rajdhani,
  Russo_One,
  Space_Grotesk,
  Teko,
} from "next/font/google";

export interface FontCatalogEntry {
  key: string;
  label: string;
  category: "gaming" | "digital" | "futuristic" | "modern" | "minimal" | "classic";
  variable: string;
}

export const FONT_KEYS = [
  "orbitron",
  "racesans",
  "russowon",
  "bebas-neue",
  "audiowide",
  "blackops",
  "teko",
  "rajdhani",
  "chakra",
  "play",
  "oswald",
  "montserrat",
  "space-grotesk",
  "inter",
] as const;

type FontKey = (typeof FONT_KEYS)[number];

const orbitron = Orbitron({ subsets: ["latin"], variable: "--font-orbitron" });
const racesans = Racing_Sans_One({ weight: "400", subsets: ["latin"], variable: "--font-racesans" });
const russowon = Russo_One({ weight: "400", subsets: ["latin"], variable: "--font-russowon" });
const bebasNeue = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-bebas-neue" });
const audiowide = Audiowide({ weight: "400", subsets: ["latin"], variable: "--font-audiowide" });
const blackops = Black_Ops_One({ weight: "400", subsets: ["latin"], variable: "--font-blackops" });
const teko = Teko({ subsets: ["latin"], variable: "--font-teko" });
const rajdhani = Rajdhani({ weight: ["400", "500", "600", "700"], subsets: ["latin"], variable: "--font-rajdhani" });
const chakra = Chakra_Petch({ weight: ["400", "500", "600", "700"], subsets: ["latin"], variable: "--font-chakra" });
const play = Play({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-play" });
const oswald = Oswald({ subsets: ["latin"], variable: "--font-oswald" });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

/** All next/font instances preloaded globally so any profile font is instantly available. */
export const FONT_INSTANCES = {
  orbitron,
  racesans,
  russowon,
  "bebas-neue": bebasNeue,
  audiowide,
  blackops,
  teko,
  rajdhani,
  chakra,
  play,
  oswald,
  montserrat,
  "space-grotesk": spaceGrotesk,
  inter,
} as const;

export const getFontInstance = (key: string) =>
  FONT_INSTANCES[(key as FontKey) in FONT_INSTANCES ? (key as FontKey) : "orbitron"];

export const FONT_VARIABLES = Object.values(FONT_INSTANCES)
  .map((f) => f.variable)
  .join(" ");

export const FONT_CATALOG: FontCatalogEntry[] = [
  { key: "orbitron", label: "Orbitron", category: "futuristic", variable: "--font-orbitron" },
  { key: "racesans", label: "Racing Sans One", category: "gaming", variable: "--font-racesans" },
  { key: "russowon", label: "Russo One", category: "modern", variable: "--font-russowon" },
  { key: "bebas-neue", label: "Bebas Neue", category: "classic", variable: "--font-bebas-neue" },
  { key: "audiowide", label: "Audiowide", category: "futuristic", variable: "--font-audiowide" },
  { key: "blackops", label: "Black Ops One", category: "gaming", variable: "--font-blackops" },
  { key: "teko", label: "Teko", category: "gaming", variable: "--font-teko" },
  { key: "rajdhani", label: "Rajdhani", category: "digital", variable: "--font-rajdhani" },
  { key: "chakra", label: "Chakra Petch", category: "digital", variable: "--font-chakra" },
  { key: "play", label: "Play", category: "digital", variable: "--font-play" },
  { key: "oswald", label: "Oswald", category: "modern", variable: "--font-oswald" },
  { key: "montserrat", label: "Montserrat", category: "modern", variable: "--font-montserrat" },
  { key: "space-grotesk", label: "Space Grotesk", category: "minimal", variable: "--font-space-grotesk" },
  { key: "inter", label: "Inter", category: "minimal", variable: "--font-inter" },
];

export function fontStackCss(key: string): string {
  const entry = FONT_CATALOG.find((f) => f.key === key);
  return `${entry?.variable ?? "--font-orbitron"}, var(--font-inter), sans-serif`;
}