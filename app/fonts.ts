// bro typography. display = Fraunces (soft optical serif, headlines +
// the wordmark + big numbers). body/UI/labels = Inter.
// both are variable fonts, self-hosted by next/font (no Google request
// from the browser). see BRO_PLAN.md §3.4.

import { Fraunces, Inter } from "next/font/google";

export const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  // soft serif, slightly relaxed. weight is a variable axis so we do
  // not pin it; we drive it per-element in CSS.
  style: ["normal", "italic"],
});

export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
