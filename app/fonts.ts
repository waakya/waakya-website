// The three Waakya families, self-hosted at build time by next/font (no runtime
// Google request). Baloo 2 is display-only; Inter and Noto Sans Devanagari do
// all the working UI. Design Direction §4.
import { Inter, Baloo_2, Caveat, Noto_Sans_Devanagari } from "next/font/google";

export const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const baloo = Baloo_2({
  subsets: ["latin", "devanagari"],
  // Display type appears on few screens; it swaps in on demand instead of
  // being preloaded on every route (~150 KB on pages that never use it).
  preload: false,
  weight: ["600", "800"],
  variable: "--font-baloo",
  display: "swap",
});

// Devanagari is only needed in Hindi. Not preloading it keeps English pages
// ~120 KB lighter; unicode-range still fetches it the moment Hindi appears.
export const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  preload: false,
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-devanagari",
  display: "swap",
});

// The handwriting for the website's few annotations. Loaded on demand only.
export const hand = Caveat({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-hand",
  display: "swap",
  preload: false,
});

export const fontVariables = `${inter.variable} ${baloo.variable} ${notoDevanagari.variable} ${hand.variable}`;
