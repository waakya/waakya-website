// The three Vaakya families, self-hosted at build time by next/font (no runtime
// Google request). Baloo 2 is display-only; Inter and Noto Sans Devanagari do
// all the working UI. Design Direction §4.
import { Inter, Baloo_2, Noto_Sans_Devanagari } from "next/font/google";

export const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const baloo = Baloo_2({
  subsets: ["latin", "devanagari"],
  weight: ["600", "800"],
  variable: "--font-baloo",
  display: "swap",
});

export const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-devanagari",
  display: "swap",
});

export const fontVariables = `${inter.variable} ${baloo.variable} ${notoDevanagari.variable}`;
