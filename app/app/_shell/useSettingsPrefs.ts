"use client";

// the one place app appearance + chat behavior prefs live. persisted
// the same way as every other pref (useLocalJSON, versioned key, no
// mount-effect). everything maps to palette tokens via CSS custom
// properties so the sidebar mark and chat re-skin live, cohesively,
// without dynamic tailwind class names. defaults reproduce the current
// look exactly. nothing here overpromises: vocab is carried with every
// message, filter words are redacted client-side before send.

import type { CSSProperties } from "react";
import { useLocalJSON } from "./useLocalStore";

export type ToneKey =
  | "accent"
  | "sage"
  | "matcha"
  | "soft"
  | "ink"
  | "surface";

export const TONES: { key: ToneKey; label: string; varRef: string }[] = [
  { key: "accent", label: "forest", varRef: "var(--color-accent)" },
  { key: "sage", label: "sage", varRef: "var(--color-sage-deep)" },
  { key: "matcha", label: "matcha", varRef: "var(--color-matcha)" },
  { key: "soft", label: "soft", varRef: "var(--color-soft)" },
  { key: "ink", label: "ink", varRef: "var(--color-ink)" },
  { key: "surface", label: "surface", varRef: "var(--color-surface)" },
];

const toneVar = (k: ToneKey) =>
  TONES.find((t) => t.key === k)?.varRef ?? "var(--color-ink)";

export type SkinKey = "cream" | "sage" | "linen";

export const SKINS: { key: SkinKey; label: string; canvas: string }[] = [
  { key: "cream", label: "cream", canvas: "var(--color-bg)" },
  { key: "sage", label: "sage", canvas: "var(--color-surface)" },
  { key: "linen", label: "linen", canvas: "var(--color-footer-bg)" },
];

const skinCanvas = (k: SkinKey) =>
  SKINS.find((s) => s.key === k)?.canvas ?? "var(--color-bg)";

export type SettingsPrefs = {
  icon: ToneKey;
  skin: SkinKey;
  userBubble: ToneKey;
  vocab: string[];
  filters: string[];
};

export const DEFAULT_PREFS: SettingsPrefs = {
  icon: "sage",
  skin: "cream",
  userBubble: "surface",
  vocab: [],
  filters: [],
};

// text colors are not a choice. they are derived so they are always
// clear: bro speaks on the chat skin (always a light cream/sage
// surface) so bro's text is fixed ink; your text flips to cream on the
// darker bubble tones and stays ink on the light ones.
const BRO_TEXT = "var(--color-ink)";
const LIGHT_TEXT_BUBBLES: ToneKey[] = ["accent", "sage", "soft", "ink"];
const userTextFor = (bubble: ToneKey) =>
  LIGHT_TEXT_BUBBLES.includes(bubble)
    ? "var(--color-bg)"
    : "var(--color-ink)";

// a bubble tone that equals the active chat skin would make your
// bubble vanish into the canvas: that is the "same color twice" the
// settings ui forbids. exported so the picker can dim that swatch.
export function bubbleDisabledForSkin(
  tone: ToneKey,
  skin: SkinKey,
): boolean {
  return toneVar(tone) === skinCanvas(skin);
}

export function useSettingsPrefs() {
  return useLocalJSON<SettingsPrefs>("bro.prefs.settings.v1", DEFAULT_PREFS);
}

// the CSS custom properties the shell sets on the /app root. cascades
// to the sidebar bro mark (--bro-body-color) and chat (the rest).
export function cssVarsFor(p: SettingsPrefs): CSSProperties {
  const canvas = skinCanvas(p.skin);
  // safety for any legacy saved pref: if the bubble collides with the
  // skin, fall back to ink so it never disappears (the picker already
  // prevents new collisions via bubbleDisabledForSkin).
  const bubble: ToneKey =
    toneVar(p.userBubble) === canvas ? "ink" : p.userBubble;
  return {
    "--bro-body-color": toneVar(p.icon),
    "--chat-canvas": canvas,
    "--chat-user-bubble": toneVar(bubble),
    "--chat-user-text": userTextFor(bubble),
    "--chat-bro-text": BRO_TEXT,
  } as CSSProperties;
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// redact whole-word matches of any filter word, case-insensitive,
// preserving length so it reads as a real redaction. runs client-side
// before the message is appended or sent.
export function redactFilter(text: string, filters: string[]): string {
  const words = filters.map((w) => w.trim()).filter(Boolean);
  if (!words.length) return text;
  const re = new RegExp(
    `\\b(${words.map(escapeRe).join("|")})\\b`,
    "gi",
  );
  return text.replace(re, (m) => "•".repeat(Math.max(3, m.length)));
}
